import React, { useState } from 'react';
import { productsAPI, ordersAPI } from '../api';

const MarketplaceSection = ({ products, orders, userId, onMessage, reload }) => {
  const [showForm, setShowForm] = useState(false);
  const [prodForm, setProdForm] = useState({ SellerID: userId, Category: '', PricePerUnit: '', StockQty: 0 });
  const [orderForm, setOrderForm] = useState({ BuyerID: userId, Items: [] });
  const [error, setError] = useState('');

  const submitProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        SellerID: userId,
        Category: prodForm.Category,
        PricePerUnit: parseFloat(prodForm.PricePerUnit),
        StockQty: parseInt(prodForm.StockQty, 10) || 0,
      };
      const res = await productsAPI.create(payload);
      if (res.data.success) {
        onMessage('success', 'Product listed');
        setProdForm({ SellerID: userId, Category: '', PricePerUnit: '', StockQty: 0 });
        reload();
      } else {
        setError(res.data.message || 'Failed to list product');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list product');
    }
  };

  const addItemToOrder = (prod) => {
    const existing = orderForm.Items.find(i => i.ProdID === prod.ProdID);
    const nextItems = existing
      ? orderForm.Items.map(i => i.ProdID === prod.ProdID ? { ...i, Quantity: i.Quantity + 1 } : i)
      : [...orderForm.Items, { ProdID: prod.ProdID, Quantity: 1 }];
    setOrderForm({ ...orderForm, Items: nextItems });
  };

  const submitOrder = async () => {
    setError('');
    try {
      const res = await ordersAPI.create(orderForm);
      if (res.data.success) {
        onMessage('success', 'Order placed');
        setOrderForm({ BuyerID: userId, Items: [] });
        reload();
      } else {
        setError(res.data.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🛒 Marketplace</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ List Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitProduct} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              value={prodForm.Category}
              onChange={(e) => setProdForm({ ...prodForm, Category: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Price Per Unit *</label>
            <input
              type="number"
              step="0.01"
              value={prodForm.PricePerUnit}
              onChange={(e) => setProdForm({ ...prodForm, PricePerUnit: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              value={prodForm.StockQty}
              onChange={(e) => setProdForm({ ...prodForm, StockQty: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">List Product</button>
        </form>
      )}

      <div>
        <h3 style={{ marginBottom: '10px' }}>Available Products</h3>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products listed yet.</p>
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <div key={p.ProdID} className="list-item">
                <h3>{p.Category}</h3>
                <p><strong>Price:</strong> ৳{parseFloat(p.PricePerUnit).toFixed(2)}</p>
                <p><strong>Stock:</strong> {p.StockQty}</p>
                <div className="actions">
                  <button className="btn btn-success" onClick={() => addItemToOrder(p)}>Add to Order</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🧾 Current Order</h3>
        {orderForm.Items.length === 0 ? (
          <div className="empty-state"><p>Add products to create an order.</p></div>
        ) : (
          <div className="list-item">
            {orderForm.Items.map(i => {
              const prod = products.find(p => p.ProdID === i.ProdID);
              return (
                <p key={i.ProdID}>
                  {prod?.Category} × {i.Quantity}
                </p>
              );
            })}
            <div className="actions">
              <button className="btn btn-success" onClick={submitOrder}>Place Order</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>📜 Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="empty-state"><p>No orders placed yet.</p></div>
        ) : (
          <div className="grid">
            {orders.map(o => (
              <div key={o.OrderID} className="list-item">
                <h3>Order #{o.OrderID}</h3>
                <p><strong>Total:</strong> ৳{parseFloat(o.TotalAmount).toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(o.OrderDate).toLocaleString()}</p>
                <span className="status-badge status-active">{o.Status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceSection;
