import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../../services/api';

import './BookingForm.css';



function BookingForm() {

  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({

    title: '',

    description: '',

    booking_date: '',

    visit_date: '',

    mobile: '',

    email: '',

  });

  const [attachment, setAttachment] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);



  const handleChange = (e) => {

    setBookingData({ ...bookingData, [e.target.name]: e.target.value });

  };



  const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (file) {

      if (file.size > 5 * 1024 * 1024) {

        setError('File size must be less than 5MB');

        return;

      }

      setAttachment(file);

      setError('');

    }

  };



  const validateForm = () => {

    const mobileRegex = /^[0-9]{10,12}$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (bookingData.mobile && !mobileRegex.test(bookingData.mobile)) {

      setError('Please enter a valid mobile number (10-12 digits)');

      return false;

    }



    if (bookingData.email && !emailRegex.test(bookingData.email)) {

      setError('Please enter a valid email address');

      return false;

    }



    if (bookingData.visit_date && bookingData.booking_date) {

      if (new Date(bookingData.visit_date) < new Date(bookingData.booking_date)) {

        setError('Visit date must be after booking date');

        return false;

      }

    }



    return true;

  };



  const handleSubmit = async (event) => {

    event.preventDefault();

    if (!validateForm()) return;



    setLoading(true);

    setError('');

    setSuccess(false);



    try {

      const formData = new FormData();

      formData.append('title', bookingData.title);

      formData.append('description', bookingData.description);

      formData.append('booking_date', bookingData.booking_date);

      formData.append('visit_date', bookingData.visit_date);

      formData.append('mobile', bookingData.mobile);

      formData.append('email', bookingData.email);

      if (attachment) {

        formData.append('attachment', attachment);

      }



      await api.createBooking(formData);

      setSuccess(true);

      setBookingData({

        title: '',

        description: '',

        booking_date: '',

        visit_date: '',

        mobile: '',

        email: '',

      });

      setAttachment(null);

      const fileInput = document.getElementById('attachment');

      if (fileInput) fileInput.value = '';

    } catch (err) {

      setError(err.message);

      if (err.message === 'Please log in to create a booking') {

        navigate('/login');

      }

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="booking-form">

      <h2>Create New Booking</h2>

      {error && <p className="error-message">{error}</p>}

      {success && <p className="success-message">Booking created successfully!</p>}

      

      {loading ? (

        <p>Loading...</p>

      ) : (

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="title">Title:</label>

            <input

              type="text"

              id="title"

              name="title"

              value={bookingData.title}

              onChange={handleChange}

              required

            />

          </div>



          <div className="form-group">

            <label htmlFor="description">Description:</label>

            <textarea

              id="description"

              name="description"

              value={bookingData.description}

              onChange={handleChange}

              rows="4"

            />

          </div>



          <div className="form-group">

            <label htmlFor="booking_date">Booking Date:</label>

            <input

              type="datetime-local"

              id="booking_date"

              name="booking_date"

              value={bookingData.booking_date}

              onChange={handleChange}

              required

            />

          </div>



          <div className="form-group">

            <label htmlFor="visit_date">Visit Date:</label>

            <input

              type="datetime-local"

              id="visit_date"

              name="visit_date"

              value={bookingData.visit_date}

              onChange={handleChange}

              min={bookingData.booking_date}

            />

            <small className="field-hint">Optional: Schedule a visit date after the booking date</small>

          </div>



          <div className="form-group">

            <label htmlFor="mobile">Mobile Number:</label>

            <input

              type="tel"

              id="mobile"

              name="mobile"

              value={bookingData.mobile}

              onChange={handleChange}

              placeholder="Enter mobile number"

            />

            <small className="field-hint">Format: 10-12 digits (e.g., 1234567890)</small>

          </div>



          <div className="form-group">

            <label htmlFor="email">Email:</label>

            <input

              type="email"

              id="email"

              name="email"

              value={bookingData.email}

              onChange={handleChange}

              placeholder="Enter email address"

            />

          </div>



          <div className="form-group">

            <label htmlFor="attachment">Attachment:</label>

            <input

              type="file"

              id="attachment"

              name="attachment"

              onChange={handleFileChange}

              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"

            />

            <small className="file-hint">

              Supported files: PDF, DOC, DOCX, TXT, JPG, PNG (max 5MB)

            </small>

          </div>



          <button type="submit" disabled={loading}>

            Create Booking

          </button>

        </form>

      )}

    </div>

  );

}



export default BookingForm; 






