import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Booking System</h1>
        <p>Manage your bookings efficiently and securely</p>
        <div className="cta-buttons">
          <Link to="/signup" className="cta-button primary">Get Started</Link>
          <Link to="/login" className="cta-button secondary">Login</Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="feature-icon">📅</i>
            <h3>Easy Booking</h3>
            <p>Create and manage bookings with just a few clicks</p>
          </div>
          <div className="feature-card">
            <i className="feature-icon">📎</i>
            <h3>File Attachments</h3>
            <p>Attach important documents to your bookings</p>
          </div>
          <div className="feature-card">
            <i className="feature-icon">🔍</i>
            <h3>Search & Filter</h3>
            <p>Find your bookings quickly with advanced filtering</p>
          </div>
          <div className="feature-card">
            <i className="feature-icon">💾</i>
            <h3>Backup System</h3>
            <p>Keep your data safe with regular backups</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 