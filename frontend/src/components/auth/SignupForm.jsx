import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

function SignupForm({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', response.token);
      onLoginSuccess();
      navigate('/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-form ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>Create Account</h2>
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner">Creating your account...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              autoComplete="username"
            />
            <span className="field-hint">Minimum 3 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <span className="field-hint">Minimum 6 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            Create Account
          </button>
        </form>
      )}

      <div className="form-switch">
        Already have an account?
        <a href="/login" onClick={(e) => {
          e.preventDefault();
          navigate('/login');
        }}>
          Log in
        </a>
      </div>
    </div>
  );
}

export default SignupForm; 






