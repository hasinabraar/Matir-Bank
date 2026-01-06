import React, { useState } from 'react';
import { bulkAPI } from '../api';

const BulkProcurementSection = ({ suppliers, requests, userId, onMessage, reload }) => {
  const [showForm, setShowForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ Name: '', MinOrderQty: '', Category: '' });
  const [requestForm, setRequestForm] = useState({ SupplierID: '', UserID: userId, ReqQty: '', EstCost: '' });
  const [error, setError] = useState('');

  const submitSupplier = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { Name: supplierForm.Name, MinOrderQty: parseInt(supplierForm.MinOrderQty, 10), Category: supplierForm.Category };
      const res = await bulkAPI.createSupplier(payload);
      if (res.data.success) {
        onMessage('success', 'Supplier added');
        setSupplierForm({ Name: '', MinOrderQty: '', Category: '' });
        reload();
      } else {
        setError(res.data.message || 'Failed to add supplier');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add supplier');
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        SupplierID: parseInt(requestForm.SupplierID, 10),
        UserID: userId,
        ReqQty: parseInt(requestForm.ReqQty, 10),
        EstCost: parseFloat(requestForm.EstCost),
      };
      const res = await bulkAPI.createRequest(payload);
      if (res.data.success) {
        onMessage('success', 'Request submitted');
        setRequestForm({ SupplierID: '', UserID: userId, ReqQty: '', EstCost: '' });
        reload();
      } else {
        setError(res.data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const createMasterOrder = async (supplierId) => {
    setError('');
    try {
      const res = await bulkAPI.createMasterOrder({ SupplierID: supplierId, WholesalePrice: 0 });
      if (res.data.success && res.data.created) {
        onMessage('success', 'Master order created');
        reload();
      } else {
        onMessage('error', res.data.message || 'Threshold not met');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create master order');
    }
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📦 Bulk Procurement</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ Supplier / Request'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={submitSupplier}>
            <div className="form-group">
              <label>Supplier Name *</label>
              <input
                type="text"
                value={supplierForm.Name}
                onChange={(e) => setSupplierForm({ ...supplierForm, Name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Min Order Quantity *</label>
              <input
                type="number"
                value={supplierForm.MinOrderQty}
                onChange={(e) => setSupplierForm({ ...supplierForm, MinOrderQty: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                value={supplierForm.Category}
                onChange={(e) => setSupplierForm({ ...supplierForm, Category: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Supplier</button>
          </form>
          <hr style={{ margin: '20px 0' }} />
          <form onSubmit={submitRequest}>
            <div className="form-group">
              <label>Supplier *</label>
              <select
                value={requestForm.SupplierID}
                onChange={(e) => setRequestForm({ ...requestForm, SupplierID: e.target.value })}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.SupplierID} value={s.SupplierID}>{s.Name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Requested Quantity *</label>
              <input
                type="number"
                value={requestForm.ReqQty}
                onChange={(e) => setRequestForm({ ...requestForm, ReqQty: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Estimated Cost *</label>
              <input
                type="number"
                step="0.01"
                value={requestForm.EstCost}
                onChange={(e) => setRequestForm({ ...requestForm, EstCost: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </form>
        </div>
      )}

      <div>
        <h3>Suppliers</h3>
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers yet.</p>
          </div>
        ) : (
          <div className="grid">
            {suppliers.map(s => (
              <div key={s.SupplierID} className="list-item">
                <h3>{s.Name}</h3>
                <p><strong>Min Qty:</strong> {s.MinOrderQty}</p>
                <p><strong>Category:</strong> {s.Category}</p>
                <div className="actions">
                  <button className="btn btn-success" onClick={() => createMasterOrder(s.SupplierID)}>
                    Create Master Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Requests</h3>
        {requests.length === 0 ? (
          <div className="empty-state"><p>No requests yet.</p></div>
        ) : (
          <div className="grid">
            {requests.map(r => (
              <div key={r.ReqID} className="list-item">
                <h3>Req #{r.ReqID}</h3>
                <p><strong>Supplier:</strong> #{r.SupplierID}</p>
                <p><strong>User:</strong> #{r.UserID}</p>
                <p><strong>Qty:</strong> {r.ReqQty}</p>
                <p><strong>Est Cost:</strong> ৳{parseFloat(r.EstCost).toFixed(2)}</p>
                {r.MasterID && <span className="status-badge status-completed">ASSIGNED</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProcurementSection;
