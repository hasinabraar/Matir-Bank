import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to Matir Bank</h1>
          <p>Your Visual Savings Ecosystem for a Better Future</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </header>
      
      <section className="features">
        <div className="feature-card">
          <h3>🏦 Visual Accounts</h3>
          <p>Track your savings goals with intuitive visual indicators.</p>
        </div>
        <div className="feature-card">
          <h3>👥 Digital Samity</h3>
          <p>Form lending circles and manage group savings easily.</p>
        </div>
        <div className="feature-card">
          <h3>🛒 Marketplace</h3>
          <p>Direct-to-market linkage for buying and selling products.</p>
        </div>
        <div className="feature-card">
          <h3>📦 Bulk Procurement</h3>
          <p>Join forces with others to buy in bulk and save more.</p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
