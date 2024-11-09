import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ isAuthenticated, onLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-icon">📅</span>
            <span className="logo-text">BookingSystem</span>
          </Link>
        </div>

        <button 
          className={`mobile-menu-button ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to="/bookings/new" 
                className={`nav-link ${isActive('/bookings/new') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">➕</span>
                New Booking
              </Link>
              <Link 
                to="/bookings" 
                className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">📋</span>
                My Bookings
              </Link>
              <Link 
                to="/certificates" 
                className={`nav-link ${isActive('/certificates') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">📜</span>
                Certificates
              </Link>
              <Link 
                to="/backups" 
                className={`nav-link ${isActive('/backups') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">💾</span>
                Backups
              </Link>
              <Link 
                to="/users" 
                className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">👥</span>
                Users
              </Link>
              <Link 
                to="/reports" 
                className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">📊</span>
                Reports
              </Link>
              <Link 
                to="/analytics" 
                className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">📈</span>
                Analytics
              </Link>
              <div className="nav-divider"></div>
              <button onClick={handleLogout} className="logout-button">
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="nav-link signup-button"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header; 