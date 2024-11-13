import React from 'react';
import QuickActions from '../components/home/QuickActions';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

function Home() {
  const { isDarkMode } = useTheme();
  const isLoggedIn = localStorage.getItem('token');

  return (
    <div className={`home-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="welcome-section">
        <h1>Welcome to Booking System</h1>
        <p>Manage your bookings efficiently and securely</p>
        {!isLoggedIn && (
          <div className="action-buttons">
            <button className="get-started">🚀 Get Started</button>
            <button className="login">🔑 Login</button>
          </div>
        )}
      </div>
      
      <QuickActions />
      
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

          <div className="feature-card">
            <i className="feature-icon">📊</i>
            <h3>Analytics</h3>
            <p>Track and analyze your booking patterns</p>
          </div>

          <div className="feature-card">
            <i className="feature-icon">🔒</i>
            <h3>Secure Access</h3>
            <p>Protected with modern security features</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 