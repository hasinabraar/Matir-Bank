import React, { useState } from 'react';
import { goalsAPI } from '../api';

const GoalsSection = ({
  goals,
  accountId,
  onGoalCreated,
  onGoalDeleted,
  loading,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    AccountID: accountId,
    TargetAmount: '',
    SavedAmount: 0,
    Deadline: '',
    Status: 'Active',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await goalsAPI.create(formData);
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          AccountID: accountId,
          TargetAmount: '',
          SavedAmount: 0,
          Deadline: '',
          Status: 'Active',
        });
        onGoalCreated();
      } else {
        setError(response.data.message || 'Failed to create goal');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal');
    }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const response = await goalsAPI.delete(goalId);
      if (response.data.success) {
        onGoalDeleted();
      } else {
        alert(response.data.message || 'Failed to delete goal');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const calculateProgress = (saved, target) => {
    if (!target || target === 0) return 0;
    const progress = (saved / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🎯 Savings Goals</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Goal Description / Target Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.TargetAmount}
              onChange={(e) => setFormData({ ...formData, TargetAmount: parseFloat(e.target.value) || '' })}
              placeholder="e.g., 50000 for a Cow"
              required
            />
          </div>
          <div className="form-group">
            <label>Initial Saved Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.SavedAmount}
              onChange={(e) => setFormData({ ...formData, SavedAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              value={formData.Deadline}
              onChange={(e) => setFormData({ ...formData, Deadline: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Goal</button>
        </form>
      )}

      {loading ? (
        <div className="empty-state">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <p>No savings goals yet. Create a goal to start tracking your progress!</p>
        </div>
      ) : (
        <div className="grid">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.SavedAmount, goal.TargetAmount);
            return (
              <div key={goal.GoalID} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>Goal #{goal.GoalID}</h3>
                  <span className={`status-badge status-${goal.Status.toLowerCase()}`}>
                    {goal.Status}
                  </span>
                </div>
                <p><strong>Target:</strong> ৳{parseFloat(goal.TargetAmount).toFixed(2)}</p>
                <p><strong>Saved:</strong> ৳{parseFloat(goal.SavedAmount).toFixed(2)}</p>
                {goal.Deadline && (
                  <p><strong>Deadline:</strong> {new Date(goal.Deadline).toLocaleDateString()}</p>
                )}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  >
                    {progress.toFixed(1)}%
                  </div>
                </div>
                <div className="progress-text">
                  ৳{parseFloat(goal.SavedAmount).toFixed(2)} / ৳{parseFloat(goal.TargetAmount).toFixed(2)}
                </div>
                <div className="actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(goal.GoalID)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsSection;

