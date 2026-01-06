import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api';

const UsersSection = ({ onMessage }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      onMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const res = await usersAPI.delete(id);
      if (res.data.success) {
        onMessage('success', 'User deleted');
        loadUsers();
      } else {
        onMessage('error', res.data.message || 'Failed to delete user');
      }
    } catch (err) {
      onMessage('error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="section">
      <h2>👥 User Management</h2>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.UserID}>
                <td>{u.UserID}</td>
                <td>{u.Username}</td>
                <td>{u.FullName}</td>
                <td>
                  <span className={`badge ${u.Role === 'Admin' ? 'badge-primary' : 'badge-secondary'}`}>
                    {u.Role || 'User'}
                  </span>
                </td>
                <td>{u.Email}</td>
                <td>{new Date(u.CreatedAt).toLocaleDateString()}</td>
                <td>
                  {u.Role !== 'Admin' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteUser(u.UserID)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersSection;
