import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import AccountsSection from './components/AccountsSection';
import GoalsSection from './components/GoalsSection';
import TransactionsSection from './components/TransactionsSection';
import SamitySection from './components/SamitySection';
import MarketplaceSection from './components/MarketplaceSection';
import BulkProcurementSection from './components/BulkProcurementSection';
import ReputationSection from './components/ReputationSection';
import UsersSection from './components/UsersSection';
import { accountsAPI, goalsAPI, transactionsAPI, samityAPI, productsAPI, ordersAPI, bulkAPI, reputationAPI } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [samityData, setSamityData] = useState({ groups: [], members: [], policies: [] });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadData(parsedUser.UserID || parsedUser.userId);
    }
  }, []);

  const loadData = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [
        accountsRes,
        goalsRes,
        transactionsRes,
        groupsRes,
        membersRes,
        policiesRes,
        productsRes,
        ordersRes,
        suppliersRes,
        requestsRes,
        reputationRes
      ] = await Promise.all([
        accountsAPI.getAll(),
        goalsAPI.getAll(),
        transactionsAPI.getAll(),
        samityAPI.listGroups(),
        samityAPI.listMembers(),
        samityAPI.setPolicy({ GroupID: 0, MaxLoanAmount: 0, RequestedRate: 0 }).catch(() => ({ data: { success: true, data: [] } })),
        productsAPI.getAll(),
        ordersAPI.getAll(),
        bulkAPI.listSuppliers(),
        bulkAPI.listRequests(),
        reputationAPI.getForUser(userId),
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
      if (groupsRes.data.success) {
        setSamityData(prev => ({ ...prev, groups: groupsRes.data.data }));
      }
      if (membersRes.data.success) {
        setSamityData(prev => ({ ...prev, members: membersRes.data.data }));
      }
      if (policiesRes.data?.success) {
        setSamityData(prev => ({ ...prev, policies: policiesRes.data.data || [] }));
      }
      if (productsRes.data.success) {
        setProducts(productsRes.data.data);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      if (suppliersRes.data.success) {
        setSuppliers(suppliersRes.data.data);
      }
      if (requestsRes.data.success) {
        setRequests(requestsRes.data.data);
      }
      if (reputationRes.data.success) {
        setReputation(reputationRes.data.data);
      }
    } catch (error) {
      showMessage('error', 'Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    loadData(userData.UserID || userData.userId);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAccounts([]);
    setSelectedAccount(null);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAccountCreated = () => {
    loadData(user.UserID || user.userId);
    showMessage('success', 'Account created successfully!');
  };

  const handleAccountDeleted = () => {
    loadData(user.UserID || user.userId);
    setSelectedAccount(null);
    showMessage('success', 'Account deleted successfully!');
  };

  const handleGoalCreated = () => {
    loadData(user.UserID || user.userId);
    showMessage('success', 'Savings goal created successfully!');
  };

  const handleGoalDeleted = () => {
    loadData(user.UserID || user.userId);
    showMessage('success', 'Goal deleted successfully!');
  };

  const handleTransactionCreated = () => {
    loadData(user.UserID || user.userId);
    showMessage('success', 'Transaction recorded successfully!');
  };

  const handleTransactionDeleted = () => {
    loadData(user.UserID || user.userId);
    showMessage('success', 'Transaction deleted successfully!');
  };

  const userId = user ? (user.UserID || user.userId) : null;
  const userRole = user ? user.Role : null;

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        
        <div className="container">
          {message.text && (
            <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
              {message.text}
            </div>
          )}

          <Routes>
            <Route path="/" element={user ? <Navigate to="/accounts" /> : <LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/accounts" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/accounts" /> : <Register onLogin={handleLogin} />} />
            
            <Route path="/accounts" element={user ? (
              <>
                <AccountsSection
                  accounts={accounts}
                  userId={userId}
                  userRole={userRole}
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
              </>
            ) : <Navigate to="/login" />} />

            <Route path="/samity" element={user ? (
              <SamitySection
                samityData={samityData}
                userId={userId}
                userRole={userRole}
                onMessage={showMessage}
              />
            ) : <Navigate to="/login" />} />

            <Route path="/marketplace" element={user ? (
              <MarketplaceSection
                products={products}
                orders={orders}
                userId={userId}
                userRole={userRole}
                onMessage={showMessage}
                reload={() => loadData(userId)}
              />
            ) : <Navigate to="/login" />} />

            <Route path="/bulk" element={user ? (
              <BulkProcurementSection
                suppliers={suppliers}
                requests={requests}
                userId={userId}
                onMessage={showMessage}
                reload={() => loadData(userId)}
              />
            ) : <Navigate to="/login" />} />

            <Route path="/reputation" element={user ? (
              <ReputationSection reputation={reputation} />
            ) : <Navigate to="/login" />} />

            <Route path="/users" element={user && user.Role === 'Admin' ? (
              <UsersSection onMessage={showMessage} />
            ) : <Navigate to="/accounts" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
