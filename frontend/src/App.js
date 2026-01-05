import React, { useState, useEffect } from 'react';
import AccountsSection from './components/AccountsSection';
import GoalsSection from './components/GoalsSection';
import TransactionsSection from './components/TransactionsSection';
import { accountsAPI, goalsAPI, transactionsAPI } from './api';
import './App.css';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Mock UserID (as per requirements)
  const MOCK_USER_ID = 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsRes, goalsRes, transactionsRes] = await Promise.all([
        accountsAPI.getAll(),
        goalsAPI.getAll(),
        transactionsAPI.getAll(),
      ]);

      if (accountsRes.data.success) {
        setAccounts(accountsRes.data.data);
      }
      if (goalsRes.data.success) {
        setGoals(goalsRes.data.data);
      }
      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data);
      }
    } catch (error) {
      showMessage('error', 'Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAccountCreated = () => {
    loadData();
    showMessage('success', 'Account created successfully!');
  };

  const handleAccountDeleted = () => {
    loadData();
    setSelectedAccount(null);
    showMessage('success', 'Account deleted successfully!');
  };

  const handleGoalCreated = () => {
    loadData();
    showMessage('success', 'Savings goal created successfully!');
  };

  const handleGoalDeleted = () => {
    loadData();
    showMessage('success', 'Goal deleted successfully!');
  };

  const handleTransactionCreated = () => {
    loadData();
    showMessage('success', 'Transaction recorded successfully!');
  };

  const handleTransactionDeleted = () => {
    loadData();
    showMessage('success', 'Transaction deleted successfully!');
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>🏦 Matir Bank</h1>
          <p>Visual Savings Ecosystem - Track your savings goals and transactions</p>
        </div>

        {message.text && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            {message.text}
          </div>
        )}

        <AccountsSection
          accounts={accounts}
          userId={MOCK_USER_ID}
          selectedAccount={selectedAccount}
          onAccountSelect={setSelectedAccount}
          onAccountCreated={handleAccountCreated}
          onAccountDeleted={handleAccountDeleted}
          loading={loading}
        />

        {selectedAccount && (
          <>
            <GoalsSection
              goals={goals.filter(g => g.AccountID === selectedAccount.AccountID)}
              accountId={selectedAccount.AccountID}
              onGoalCreated={handleGoalCreated}
              onGoalDeleted={handleGoalDeleted}
              loading={loading}
            />

            <TransactionsSection
              transactions={transactions.filter(t => t.AccountID === selectedAccount.AccountID)}
              accountId={selectedAccount.AccountID}
              accountBalance={selectedAccount.CurrentBalance}
              onTransactionCreated={handleTransactionCreated}
              onTransactionDeleted={handleTransactionDeleted}
              loading={loading}
            />
          </>
        )}

        {!selectedAccount && accounts.length > 0 && (
          <div className="section">
            <p style={{ textAlign: 'center', color: '#666' }}>
              👆 Select an account above to view goals and transactions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

