import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import './CertificatePage.css';

function CertificatePage() {
  const { isDarkMode } = useTheme();
  const [certificates, setCertificates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certificatesResponse, bookingsResponse] = await Promise.all([
        api.getCertificates(),
        api.getAllBookings()
      ]);
      
      setCertificates(certificatesResponse.certificates || []);
      setBookings(bookingsResponse.bookings || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedBooking) {
      setError('Please select a booking');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await api.generateCertificate(selectedBooking);
      await fetchData();
      setSelectedBooking('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredCertificates = certificates.filter(cert => 
    cert.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.booking_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCertificate = (url) => {
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
    window.open(`${baseUrl}${url}`, '_blank');
  };

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <div className={`certificate-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>Certificate Management</h2>

      <div className="certificate-generator">
        <h3>Generate New Certificate</h3>
        <div className="form-group">
          <label htmlFor="booking">Select Booking:</label>
          <select
            id="booking"
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
            disabled={generating}
            className="booking-select"
          >
            <option value="">Select a booking...</option>
            {bookings
              .filter(booking => 
                !certificates.some(cert => cert.booking_id === booking.id) &&
                booking.status === 'confirmed'
              )
              .map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.title} - {formatDate(booking.booking_date)}
                </option>
              ))
            }
          </select>
          <small className="field-hint">Only confirmed bookings are available for certification</small>
        </div>
        <button 
          onClick={handleGenerateCertificate}
          disabled={generating || !selectedBooking}
          className="generate-button"
        >
          {generating ? (
            <span className="loading-text">
              <span className="loading-spinner"></span>
              Generating...
            </span>
          ) : (
            'Generate Certificate'
          )}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="certificates-list">
        <div className="list-header">
          <h3>Generated Certificates</h3>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading certificates...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="empty-state">
            <p>No certificates found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="certificates-table">
              <thead>
                <tr>
                  <th>Certificate Number</th>
                  <th>Booking</th>
                  <th>Client</th>
                  <th>Issued Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map(cert => (
                  <tr key={cert.id}>
                    <td>{cert.certificate_number}</td>
                    <td>{cert.booking_title}</td>
                    <td>{cert.username}</td>
                    <td>{formatDate(cert.issued_date)}</td>
                    <td>
                      <button 
                        onClick={() => handleViewCertificate(cert.pdf_url)}
                        className="view-button"
                      >
                        <span className="button-icon">📄</span>
                        View Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificatePage; 