import React, { useState } from 'react';
import { transactionsAPI } from '../api';

const TransactionsSection = ({
  transactions,
  accountId,
  accountBalance,
  onTransactionCreated,
  onTransactionDeleted,
  loading,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    AccountID: accountId,
    Amount: '',
    Type: 'Deposit',
    ReferenceID: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(formData.Amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      const response = await transactionsAPI.create(formData);
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          AccountID: accountId,
          Amount: '',
          Type: 'Deposit',
          ReferenceID: '',
        });
        onTransactionCreated();
      } else {
        setError(response.data.message || 'Failed to create transaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transaction');
    }
  };

  const handleDelete = async (transId) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This will reverse the balance update.')) {
      return;
    }

    try {
      const response = await transactionsAPI.delete(transId);
      if (response.data.success) {
        onTransactionDeleted();
      } else {
        alert(response.data.message || 'Failed to delete transaction');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>💸 Transactions</h2>
          <p style={{ marginTop: '5px', color: '#666', fontSize: '0.9em' }}>
            Current Balance: <strong style={{ color: '#667eea', fontSize: '1.2em' }}>৳{parseFloat(accountBalance || 0).toFixed(2)}</strong>
          </p>
        </div>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Deposit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Amount (৳) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.Amount}
              onChange={(e) => setFormData({ ...formData, Amount: parseFloat(e.target.value) || '' })}
              placeholder="Enter deposit amount"
              required
            />
          </div>
          <div className="form-group">
            <label>Transaction Type</label>
            <select
              value={formData.Type}
              onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
            >
              <option value="Deposit">Deposit</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reference ID (Optional)</label>
            <input
              type="text"
              value={formData.ReferenceID}
              onChange={(e) => setFormData({ ...formData, ReferenceID: e.target.value })}
              placeholder="e.g., MFS transaction ID"
            />
          </div>
          <button type="submit" className="btn btn-success">Record Transaction</button>
        </form>
      )}

      {loading ? (
        <div className="empty-state">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet. Make your first deposit to get started!</p>
        </div>
      ) : (
        <div>
          {transactions.map((transaction) => (
            <div key={transaction.TransID} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#27ae60', marginBottom: '5px' }}>
                    +৳{parseFloat(transaction.Amount).toFixed(2)} {transaction.Type}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9em' }}>
                    {new Date(transaction.Timestamp).toLocaleString()}
                  </p>
                  {transaction.ReferenceID && (
                    <p style={{ color: '#999', fontSize: '0.85em', marginTop: '5px' }}>
                      Ref: {transaction.ReferenceID}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(transaction.TransID)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;

