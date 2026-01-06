import React, { useState } from 'react';
import { accountsAPI } from '../api';

const AccountsSection = ({
  accounts,
  userId,
  selectedAccount,
  onAccountSelect,
  onAccountCreated,
  onAccountDeleted,
  loading,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    UserID: userId,
    AccountType: 'Savings',
    CurrentBalance: 0,
    DateOpened: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await accountsAPI.create(formData);
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          UserID: userId,
          AccountType: '',
          CurrentBalance: 0,
          DateOpened: new Date().toISOString().split('T')[0],
        });
        onAccountCreated();
      } else {
        setError(response.data.message || 'Failed to create account');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account? This will also delete all associated goals and transactions.')) {
      return;
    }

    try {
      const response = await accountsAPI.delete(accountId);
      if (response.data.success) {
        onAccountDeleted();
      } else {
        alert(response.data.message || 'Failed to delete account');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💰 Accounts</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Account Type *</label>
            <select
              value={formData.AccountType}
              onChange={(e) => setFormData({ ...formData, AccountType: e.target.value })}
              required
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
            </select>
          </div>
          <div className="form-group">
            <label>Initial Balance</label>
            <input
              type="number"
              step="0.01"
              value={formData.CurrentBalance}
              onChange={(e) => setFormData({ ...formData, CurrentBalance: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Date Opened</label>
            <input
              type="date"
              value={formData.DateOpened}
              onChange={(e) => setFormData({ ...formData, DateOpened: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
      )}

      {loading ? (
        <div className="empty-state">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts yet. Create your first account to get started!</p>
        </div>
      ) : (
        <div className="grid">
          {accounts.map((account) => (
            <div
              key={account.AccountID}
              className="list-item"
              style={{
                borderLeftColor: selectedAccount?.AccountID === account.AccountID ? '#667eea' : '#ddd',
                backgroundColor: selectedAccount?.AccountID === account.AccountID ? '#e8eaf6' : '#f8f9fa',
              }}
            >
              <h3>{account.AccountType}</h3>
              <p><strong>Balance:</strong> ৳{parseFloat(account.CurrentBalance).toFixed(2)}</p>
              <p><strong>Opened:</strong> {new Date(account.DateOpened).toLocaleDateString()}</p>
              <div className="actions">
                <button
                  className="btn btn-primary"
                  style={{ marginRight: '10px' }}
                  onClick={() => onAccountSelect(selectedAccount?.AccountID === account.AccountID ? null : account)}
                >
                  Manage {selectedAccount?.AccountID === account.AccountID ? '▲' : '▼'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(account.AccountID);
                  }}
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

export default AccountsSection;
