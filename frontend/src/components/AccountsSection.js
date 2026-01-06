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
  userRole,
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

  const displayedAccounts = userRole === 'Admin' ? accounts : accounts.filter(a => a.UserID === userId);

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
      ) : displayedAccounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid">
          {displayedAccounts.map((account) => (
            <div
              key={account.AccountID}
              className={`card ${selectedAccount?.AccountID === account.AccountID ? 'selected' : ''}`}
              onClick={() => onAccountSelect(account)}
            >
              <h3>{account.AccountType} Account</h3>
              <p className="balance">৳{parseFloat(account.CurrentBalance).toFixed(2)}</p>
              <p className="meta">ID: {account.AccountID}</p>
              <p className="meta">Opened: {new Date(account.DateOpened).toLocaleDateString()}</p>
              {userRole === 'Admin' && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(account.AccountID);
                  }}
                >
                  Delete (Admin)
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountsSection;

