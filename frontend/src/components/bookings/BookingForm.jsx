import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import './BookingForm.css';

function BookingForm() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
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
  const [editingBooking, setEditingBooking] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'booking_date' || name === 'visit_date') {
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      
      if (bookingData.booking_date) {
        const bookingDate = new Date(bookingData.booking_date);
        formData.append('booking_date', bookingDate.toISOString());
      }
      
      if (bookingData.visit_date) {
        const visitDate = new Date(bookingData.visit_date);
        formData.append('visit_date', visitDate.toISOString());
      }
      
      formData.append('mobile', bookingData.mobile);
      formData.append('email', bookingData.email);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      if (editingBooking) {
        await api.updateBooking(editingBooking.id, formData);
        setSuccess(true);
        setEditingBooking(null);
      } else {
        await api.createBooking(formData);
        setSuccess(true);
      }

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

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  }, []);

  const handleEdit = useCallback((booking) => {
    if (!booking) return;
    
    const convertToLocalDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error('Date conversion error:', error);
        return '';
      }
    };
    
    setEditingBooking(booking);
    setBookingData({
      title: booking.title,
      description: booking.description,
      booking_date: convertToLocalDate(booking.booking_date),
      visit_date: convertToLocalDate(booking.visit_date),
      mobile: booking.mobile || '',
      email: booking.email || '',
    });
  }, []);

  useEffect(() => {
    if (editingBooking) {
      handleEdit(editingBooking);
    }
  }, [editingBooking, handleEdit]);

  return (
    <div className={`booking-form-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Booking created successfully!</p>}
      
      {loading ? (
        <div className="loading-spinner">Creating your booking...</div>
      ) : (
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={bookingData.title}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={bookingData.description}
              onChange={handleChange}
              rows="4"
              className="form-control"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="booking_date">Booking Date</label>
              <input
                type="datetime-local"
                id="booking_date"
                name="booking_date"
                value={bookingData.booking_date}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="visit_date">Visit Date (Optional)</label>
              <input
                type="datetime-local"
                id="visit_date"
                name="visit_date"
                value={bookingData.visit_date}
                onChange={handleChange}
                min={bookingData.booking_date}
                className="form-control"
              />
              <span className="field-hint">Schedule a visit after booking date</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={bookingData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                className="form-control"
              />
              <span className="field-hint">Format: 10-12 digits</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={bookingData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="attachment">Attachment</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="form-control"
              />
              <span className="selected-file">
                {attachment ? attachment.name : 'No file selected'}
              </span>
            </div>
            <span className="file-hint">
              Supported: PDF, DOC, DOCX, TXT, JPG, PNG (max 5MB)
            </span>
          </div>

          <div className="button-group">
            <button 
              type="button" 
              onClick={() => navigate('/bookings')}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BookingForm; 






