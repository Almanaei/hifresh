import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/common/Header';
import { ThemeProvider } from './context/ThemeContext';
import './styles/theme.css';

// Update this import path
import Home from './pages/Home';

// Import your other components
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import BookingForm from './components/bookings/BookingForm';
import BookingList from './components/bookings/BookingList';
import CertificatePage from './components/certificates/CertificatePage';
import BackupPage from './components/backup/BackupPage';
import UserList from './components/users/UserList';
import ReportPage from './components/reports/ReportPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import TaskManager from './components/tasks/TaskManager';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                <LoginForm 
                  onLoginSuccess={() => {
                    setIsAuthenticated(true);
                    navigate('/bookings');
                  }} 
                />
              } 
            />
            <Route 
              path="/signup" 
              element={
                <SignupForm 
                  onLoginSuccess={() => {
                    setIsAuthenticated(true);
                    navigate('/bookings');
                  }} 
                />
              } 
            />
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
              path="/certificates"
              element={
                <PrivateRoute>
                  <CertificatePage />
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
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <AnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <TaskManager />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;