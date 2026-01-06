import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🏦 Matir Bank</Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <NavLink to="/accounts" className={({ isActive }) => isActive ? 'active' : ''}>Accounts</NavLink>
            <NavLink to="/samity" className={({ isActive }) => isActive ? 'active' : ''}>Samity</NavLink>
            <NavLink to="/marketplace" className={({ isActive }) => isActive ? 'active' : ''}>Marketplace</NavLink>
            <NavLink to="/bulk" className={({ isActive }) => isActive ? 'active' : ''}>Bulk Procurement</NavLink>
            <NavLink to="/reputation" className={({ isActive }) => isActive ? 'active' : ''}>Reputation</NavLink>
            <div className="navbar-user">
              <span>Welcome, {user.FullName}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link register-btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
