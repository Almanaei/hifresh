import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

function Home() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`home-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="hero-section">
        <h1>Welcome to Booking System</h1>
        <p>Manage your bookings efficiently and securely</p>
        <div className="cta-buttons">
          <Link to="/signup" className="cta-button primary">
            <span className="button-icon">🚀</span>
            Get Started
          </Link>
          <Link to="/login" className="cta-button secondary">
            <span className="button-icon">🔑</span>
            Login
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="feature-icon">📅</i>
            <h3>Easy Booking</h3>
            <p>Create and manage bookings with just a few clicks</p>
            <div className="feature-hover">
              <span className="hover-text">Simple and intuitive interface</span>
            </div>
          </div>

          <div className="feature-card">
            <i className="feature-icon">📎</i>
            <h3>File Attachments</h3>
            <p>Attach important documents to your bookings</p>
            <div className="feature-hover">
              <span className="hover-text">Support for multiple file types</span>
            </div>
          </div>

          <div className="feature-card">
            <i className="feature-icon">🔍</i>
            <h3>Search & Filter</h3>
            <p>Find your bookings quickly with advanced filtering</p>
            <div className="feature-hover">
              <span className="hover-text">Powerful search capabilities</span>
            </div>
          </div>

          <div className="feature-card">
            <i className="feature-icon">💾</i>
            <h3>Backup System</h3>
            <p>Keep your data safe with regular backups</p>
            <div className="feature-hover">
              <span className="hover-text">Automated backup solutions</span>
            </div>
          </div>

          <div className="feature-card">
            <i className="feature-icon">📊</i>
            <h3>Analytics</h3>
            <p>Track and analyze your booking patterns</p>
            <div className="feature-hover">
              <span className="hover-text">Detailed insights and reports</span>
            </div>
          </div>

          <div className="feature-card">
            <i className="feature-icon">🔐</i>
            <h3>Secure Access</h3>
            <p>Protected with modern security features</p>
            <div className="feature-hover">
              <span className="hover-text">Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 