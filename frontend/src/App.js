import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import SignupForm from './components/auth/SignupForm';
import LoginForm from './components/auth/LoginForm';
import BookingForm from './components/bookings/BookingForm';
import BookingList from './components/bookings/BookingList';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BackupPage from './components/backup/BackupPage';
import Home from './components/Home';
import UserList from './components/users/UserList';
import ReportPage from './components/reports/ReportPage';

function Navigation({ isLoggedIn, onLogout }) {
  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/">Booking System</Link>
      </div>
      <ul className="nav-links">
        {!isLoggedIn ? (
          <>
            <li><Link to="/signup">Sign Up</Link></li>
            <li><Link to="/login">Login</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/bookings/new">Create Booking</Link></li>
            <li><Link to="/bookings">View Bookings</Link></li>
            <li><Link to="/backups">Backups</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><button onClick={onLogout} className="logout-button">Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';  // Redirect to home page
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignupForm onLoginSuccess={() => setIsLoggedIn(true)} />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />} />
            <Route 
              path="/bookings/new" 
              element={
                <PrivateRoute>
                  <BookingForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <PrivateRoute>
                  <BookingList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/backups" 
              element={
                <PrivateRoute>
                  <BackupPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <PrivateRoute>
                  <UserList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <PrivateRoute>
                  <ReportPage />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
