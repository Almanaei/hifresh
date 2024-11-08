import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../../services/api';



function SignupForm({ onLoginSuccess }) {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    username: '',

    email: '',

    password: '',

  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');



  const handleChange = (e) => {

    setFormData({ ...formData, [e.target.name]: e.target.value });

  };



  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);

    setError('');



    try {

      const response = await api.signup(formData);

      localStorage.setItem('token', response.token);

      onLoginSuccess();

      navigate('/bookings/new');

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="form-container">

      <h2>Sign Up</h2>

      {error && <p className="error-message">{error}</p>}

      {loading ? (

        <p>Loading...</p>

      ) : (

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="username">Username:</label>

            <input

              type="text"

              id="username"

              name="username"

              value={formData.username}

              onChange={handleChange}

              required

              minLength={3}

            />

          </div>

          <div className="form-group">

            <label htmlFor="email">Email:</label>

            <input

              type="email"

              id="email"

              name="email"

              value={formData.email}

              onChange={handleChange}

              required

              placeholder="example@email.com"

            />

          </div>

          <div className="form-group">

            <label htmlFor="password">Password:</label>

            <input

              type="password"

              id="password"

              name="password"

              value={formData.password}

              onChange={handleChange}

              required

              minLength={6}

            />

          </div>

          <button type="submit" disabled={loading}>

            Sign Up

          </button>

        </form>

      )}

    </div>

  );

}



export default SignupForm; 






