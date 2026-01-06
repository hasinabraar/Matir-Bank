import React, { useState } from 'react';
import { samityAPI } from '../api';

const SamitySection = ({ samityData, userId, userRole, onMessage }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState({ GroupName: '', LeaderID: userId });
  const [policyForm, setPolicyForm] = useState({ GroupID: '', MaxLoanAmount: '', InterestRate: '' });
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState('');

  const submitGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (editingGroupId) {
        res = await samityAPI.updateGroup({ ...groupForm, GroupID: editingGroupId });
      } else {
        res = await samityAPI.createGroup(groupForm);
      }
      
      if (res.data.success) {
        onMessage('success', editingGroupId ? 'Samity updated' : 'Samity created');
        setGroupForm({ GroupName: '', LeaderID: userId });
        setEditingGroupId(null);
        if (editingGroupId) window.location.reload();
      } else {
        setError(res.data.message || 'Failed to save samity');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save samity');
    }
  };

  const submitPolicy = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        GroupID: parseInt(policyForm.GroupID, 10),
        MaxLoanAmount: parseFloat(policyForm.MaxLoanAmount),
        InterestRate: parseFloat(policyForm.InterestRate),
      };
      const res = await samityAPI.setPolicy(payload);
      if (res.data.success) {
        onMessage('success', 'Policy set');
        setPolicyForm({ GroupID: '', MaxLoanAmount: '', InterestRate: '' });
      } else {
        setError(res.data.message || 'Failed to set policy');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set policy');
    }
  };

  const checkEligibility = async () => {
    setError('');
    try {
      const res = await samityAPI.checkEligibility({
        UserID: userId,
        RequestedAmount: 1000,
        RequestedRate: 10,
      });
      if (res.data.success) {
        setEligibility(res.data);
      } else {
        setError(res.data.message || 'Eligibility check failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Eligibility check failed');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      const res = await samityAPI.deleteGroup(groupId);
      if (res.data.success) {
        onMessage('success', 'Samity deleted');
        // Note: In a real app, we should trigger a reload here. 
        // For now, we assume parent will reload or we should reload page
        window.location.reload(); 
      } else {
        onMessage('error', res.data.message || 'Failed to delete samity');
      }
    } catch (err) {
      onMessage('error', err.response?.data?.message || 'Failed to delete samity');
    }
  };

  const startEditing = (group) => {
    setEditingGroupId(group.GroupID);
    setGroupForm({ GroupName: group.GroupName, LeaderID: group.LeaderID });
    setPolicyForm({
      GroupID: group.GroupID,
      MaxLoanAmount: group.MaxLoanAmount || '',
      InterestRate: group.InterestRate || ''
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>👥 Samity (Lending Circles)</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm);
          setEditingGroupId(null);
          setGroupForm({ GroupName: '', LeaderID: userId });
          setPolicyForm({ GroupID: '', MaxLoanAmount: '', InterestRate: '' });
        }}>
          {showForm ? 'Close' : '+ New Samity / Policy'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <h3 style={{ marginBottom: '15px' }}>{editingGroupId ? 'Edit Samity' : 'Create New Samity'}</h3>
          <form onSubmit={submitGroup}>
            <div className="form-group">
              <label>Samity Name *</label>
              <input
                type="text"
                value={groupForm.GroupName}
                onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">{editingGroupId ? 'Update Name/Leader' : 'Create Samity'}</button>
          </form>
          <hr style={{ margin: '20px 0' }} />
          <h3 style={{ marginBottom: '15px' }}>{editingGroupId ? 'Edit Policy' : 'Set Policy'}</h3>
          <form onSubmit={submitPolicy}>
            <div className="form-group">
              <label>Samity Group *</label>
              <select
                value={policyForm.GroupID}
                onChange={(e) => setPolicyForm({ ...policyForm, GroupID: e.target.value })}
                required
                disabled={!!editingGroupId}
              >
                <option value="">Select Group</option>
                {samityData.groups.map(g => (
                  <option key={g.GroupID} value={g.GroupID}>{g.GroupName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Max Loan Amount *</label>
              <input
                type="number"
                step="0.01"
                value={policyForm.MaxLoanAmount}
                onChange={(e) => setPolicyForm({ ...policyForm, MaxLoanAmount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                value={policyForm.InterestRate}
                onChange={(e) => setPolicyForm({ ...policyForm, InterestRate: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Set Policy</button>
          </form>
        </div>
      )}

      <div className="actions" style={{ marginBottom: '10px' }}>
        <button className="btn btn-secondary" onClick={checkEligibility}>Check Eligibility</button>
      </div>
      {eligibility && (
        <div className={eligibility.eligible ? 'success-message' : 'error-message'}>
          {eligibility.blocked ? '⛔ Group blocked due to default' : (eligibility.eligible ? '✅ Eligible under policy' : '❌ Not eligible')}
        </div>
      )}

      {samityData.groups.length === 0 ? (
        <div className="empty-state">
          <p>No Samity groups yet. Create one to start collective lending.</p>
        </div>
      ) : (
        <div className="grid">
          {samityData.groups.map(g => (
            <div key={g.GroupID} className="list-item">
              <h3>{g.GroupName}</h3>
              <p><strong>Leader:</strong> #{g.LeaderID}</p>
              <p><strong>Created:</strong> {new Date(g.CreationDate).toLocaleString()}</p>
              <p><strong>Max Loan:</strong> {g.MaxLoanAmount ? `$${g.MaxLoanAmount}` : 'Not Set'}</p>
              <p><strong>Interest Rate:</strong> {g.InterestRate ? `${g.InterestRate}%` : 'Not Set'}</p>
              {userRole === 'Admin' && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginRight: '10px' }}
                    onClick={() => startEditing(g)}
                  >
                    Edit (Admin)
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteGroup(g.GroupID)}
                  >
                    Delete (Admin)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SamitySection;
