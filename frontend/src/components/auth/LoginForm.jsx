import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

function LoginForm({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(formData);
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
      <h2>Welcome Back</h2>
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner">Logging in...</div>
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
              autoComplete="username"
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
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            Log In
          </button>
        </form>
      )}

      <div className="form-switch">
        Don't have an account?
        <a href="/signup" onClick={(e) => {
          e.preventDefault();
          navigate('/signup');
        }}>
          Sign up
        </a>
      </div>
    </div>
  );
}

export default LoginForm; 