import React from 'react';

const ReputationSection = ({ reputation }) => {
  return (
    <div className="section">
      <h2>⭐ Reputation & Credit Tier</h2>
      {!reputation ? (
        <div className="empty-state"><p>No reputation data available.</p></div>
      ) : (
        <div className="list-item">
          <p><strong>User:</strong> #{reputation.reputation?.UserID ?? reputation.UserID}</p>
          <p><strong>Credit Score:</strong> {parseFloat(reputation.reputation?.CreditScore ?? reputation.CreditScore).toFixed(2)}</p>
          {reputation.tier ? (
            <div className="actions">
              <span className="status-badge status-active">
                Tier {reputation.tier.TierLevel} — Max Loan ৳{parseFloat(reputation.tier.MaxLoanLimit).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="actions">
              <span className="status-badge status-active">No tier assigned</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReputationSection;
