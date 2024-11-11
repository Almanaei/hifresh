import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../common/Pagination';
import './BookingList.css';

function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  
  // Filtering and sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add these state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Add view toggle state
  const [viewMode, setViewMode] = useState('grid');

  // Add handlePageChange function
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Wrap fetchBookings in useCallback
  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.getBookings(currentPage);
      setBookings(response.bookings);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage]); // Add currentPage as dependency

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // Add fetchBookings as dependency

  const handleEdit = (booking) => {
    const localDate = new Date(booking.booking_date).toISOString().slice(0, 16);
    setEditingBooking({ ...booking, booking_date: localDate });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', editingBooking.title);
      formData.append('description', editingBooking.description || '');
      formData.append('booking_date', editingBooking.booking_date);
      formData.append('visit_date', editingBooking.visit_date || '');
      formData.append('status', editingBooking.status);
      formData.append('mobile', editingBooking.mobile || '');
      formData.append('email', editingBooking.email || '');
      
      // Append new attachment if exists
      if (editingBooking.newAttachment) {
        formData.append('attachment', editingBooking.newAttachment);
      }

      await api.updateBooking(editingBooking.id, formData);
      setEditingBooking(null);
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.deleteBooking(id);
        fetchBookings(); // Refresh the list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEditChange = (e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setError('File size must be less than 5MB');
          return;
        }
        setEditingBooking({
          ...editingBooking,
          newAttachment: file // Store the new file separately
        });
      }
    } else {
      const value = e.target.type === 'datetime-local' && e.target.value
        ? new Date(e.target.value).toISOString()
        : e.target.value;
      
      setEditingBooking({
        ...editingBooking,
        [e.target.name]: value,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter and sort functions
  const filterBookings = (bookings) => {
    return bookings
      .filter(booking => {
        const serialNumber = calculateSerialNumber(bookings.indexOf(booking)).toString();
        const matchesSearch = 
          booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          serialNumber.includes(searchTerm); // Add serial number to search
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.booking_date) - new Date(b.booking_date);
          case 'date-desc':
            return new Date(b.booking_date) - new Date(a.booking_date);
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
  };

  const handleView = (booking) => {
    setViewingBooking(booking);
  };

  const closeModal = () => {
    setViewingBooking(null);
  };

  // Add this function to calculate serial number
  const calculateSerialNumber = (index) => {
    if (pagination) {
      return ((pagination.currentPage - 1) * 10) + index + 1;
    }
    return index + 1;
  };

  // Add this state for attachment viewing
  const [viewingAttachment, setViewingAttachment] = useState(null);

  // Update the handleAttachmentClick function
  const handleAttachmentClick = (e, attachment) => {
    e.preventDefault();
    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${attachment.url}`;
    
    // PDF files - open in new tab
    if (fileExtension === 'pdf') {
      window.open(fullUrl, '_blank');
    }
    // Image files - show in modal
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      setViewingAttachment({
        ...attachment,
        url: fullUrl,
        type: 'image'
      });
    }
    // Other files - download
    else {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Add this function to close attachment viewer
  const closeAttachmentViewer = () => {
    setViewingAttachment(null);
  };

  const getTimeOfDay = (date) => {
    const hours = new Date(date).getHours();
    if (hours < 12) return 'morning';
    if (hours < 17) return 'afternoon';
    return 'evening';
  };

  const getPriority = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const diffDays = Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'high';
    if (diffDays <= 3) return 'medium';
    return 'low';
  };

  const renderBookingCard = (booking) => {
    const timeOfDay = getTimeOfDay(booking.booking_date);
    const priority = getPriority(booking);
    const isEditing = editingBooking?.id === booking.id;

    return (
      <div 
        className={`booking-card ${loading ? 'loading' : ''}`}
        data-time={timeOfDay}
        data-priority={priority}
        key={booking.id}
      >
        {isEditing ? (
          // Expanded Edit Form
          <div className="booking-edit-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={editingBooking.title}
                onChange={handleEditChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Booking Date</label>
              <input
                type="datetime-local"
                name="booking_date"
                value={editingBooking.booking_date}
                onChange={handleEditChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Visit Date (Optional)</label>
              <input
                type="datetime-local"
                name="visit_date"
                value={editingBooking.visit_date || ''}
                onChange={handleEditChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={editingBooking.status}
                onChange={handleEditChange}
                className="form-control"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mobile</label>
              <input
                type="tel"
                name="mobile"
                value={editingBooking.mobile || ''}
                onChange={handleEditChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editingBooking.email || ''}
                onChange={handleEditChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={editingBooking.description || ''}
                onChange={handleEditChange}
                className="form-control"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Attachment</label>
              {editingBooking.attachment_url && (
                <div className="current-attachment">
                  <span>Current: {editingBooking.attachment_name}</span>
                  <a 
                    href={editingBooking.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-link"
                  >
                    View
                  </a>
                </div>
              )}
              <input
                type="file"
                onChange={(e) => {
                  setEditingBooking({
                    ...editingBooking,
                    newAttachment: e.target.files[0]
                  });
                }}
                className="form-control"
              />
              <span className="file-hint">Max file size: 5MB</span>
            </div>

            <div className="button-group">
              <button 
                onClick={() => setEditingBooking(null)} 
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                className="save-button"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="booking-card-content">
            <div className="booking-card-header">
              <h3>{booking.title}</h3>
              <span className={`priority-badge priority-${priority}`}>
                {priority === 'high' && '🔥'}
                {priority === 'medium' && '⏰'}
                {priority === 'low' && '📅'}
              </span>
            </div>
            
            <div className="booking-card-body">
              <p className="description">{booking.description}</p>
              <div className="booking-meta">
                <span className="meta-item">
                  {timeOfDay === 'morning' && '🌅'}
                  {timeOfDay === 'afternoon' && '☀️'}
                  {timeOfDay === 'evening' && '🌙'}
                  {new Date(booking.booking_date).toLocaleString()}
                </span>
                <span className={`status status-${booking.status}`}>
                  {booking.status}
                </span>
              </div>
              
              {booking.attachment_url && (
                <div className="attachment-preview-wrapper">
                  <div 
                    className="attachment-preview"
                    onClick={(e) => handleAttachmentClick(e, {
                      url: booking.attachment_url,
                      name: booking.attachment_name
                    })}
                  >
                    <span className="attachment-icon">📎</span>
                    <span className="attachment-name">{booking.attachment_name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="booking-card-actions">
              <button 
                className="action-button view-button"
                onClick={() => handleView(booking)}
              >
                🔍 View
              </button>
              <button 
                className="action-button edit-button"
                onClick={() => handleEdit(booking)}
              >
                ✏️ Edit
              </button>
              <button 
                className="action-button delete-button"
                onClick={() => handleDelete(booking.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingBooking) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Edit Booking</h3>
            <button 
              className="close-button" 
              onClick={() => setEditingBooking(null)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleUpdate} className="modal-body">
            <div className="form-grid">
              {/* First Column */}
              <div className="form-column">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editingBooking.title}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  />
                </div>

                <div className="form-group">
                  <label>Booking Date</label>
                  <input
                    type="datetime-local"
                    name="booking_date"
                    value={editingBooking.booking_date}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  />
                </div>

                <div className="form-group">
                  <label>Visit Date (Optional)</label>
                  <input
                    type="datetime-local"
                    name="visit_date"
                    value={editingBooking.visit_date || ''}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editingBooking.status}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Second Column */}
              <div className="form-column">
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={editingBooking.mobile || ''}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingBooking.email || ''}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editingBooking.description || ''}
                    onChange={handleEditChange}
                    className="form-control dark-input"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Attachment</label>
                  {editingBooking.attachment_url && (
                    <div className="current-attachment">
                      <span>Current: {editingBooking.attachment_name}</span>
                      <a 
                        href={editingBooking.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-link"
                      >
                        View
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) => {
                      setEditingBooking({
                        ...editingBooking,
                        newAttachment: e.target.files[0]
                      });
                    }}
                    className="form-control dark-input"
                  />
                  <span className="file-hint">Max file size: 5MB</span>
                </div>
              </div>
            </div>
          </form>

          <div className="modal-footer">
            <button 
              onClick={() => setEditingBooking(null)}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              className="save-button"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add this state at the beginning of your component
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Add this effect to handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
      localStorage.setItem('darkMode', JSON.stringify(e.matches));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Add this function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const filteredBookings = filterBookings(bookings);

  return (
    <div className={`booking-list ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <h2>Your Bookings</h2>

      {/* Filter and Sort Controls */}
      <div className="booking-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>

          <div className="view-toggle">
            <button
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>

          <button 
            className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <p>No bookings found. Create your first booking!</p>
      ) : (
        <>
          <p className="booking-count">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </p>
          
          {viewMode === 'list' ? (
            <div className="bookings-list">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Attachment</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id}>
                      {editingBooking && editingBooking.id === booking.id ? (
                        <td colSpan="8">
                          <form onSubmit={handleUpdate} className="edit-form">
                            <div className="form-group">
                              <label>Title:</label>
                              <input
                                type="text"
                                name="title"
                                value={editingBooking.title}
                                onChange={handleEditChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Description:</label>
                              <textarea
                                name="description"
                                value={editingBooking.description || ''}
                                onChange={handleEditChange}
                                rows="4"
                              />
                            </div>
                            <div className="form-group">
                              <label>Date:</label>
                              <input
                                type="datetime-local"
                                name="booking_date"
                                value={editingBooking.booking_date}
                                onChange={handleEditChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Status:</label>
                              <select
                                name="status"
                                value={editingBooking.status}
                                onChange={handleEditChange}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Visit Date:</label>
                              <input
                                type="datetime-local"
                                name="visit_date"
                                value={editingBooking.visit_date ? new Date(editingBooking.visit_date).toISOString().slice(0, 16) : ''}
                                onChange={handleEditChange}
                                min={editingBooking.booking_date ? new Date(editingBooking.booking_date).toISOString().slice(0, 16) : ''}
                              />
                            </div>
                            <div className="form-group">
                              <label>Mobile:</label>
                              <input
                                type="tel"
                                name="mobile"
                                value={editingBooking.mobile || ''}
                                onChange={handleEditChange}
                                placeholder="Enter mobile number"
                              />
                            </div>
                            <div className="form-group">
                              <label>Email:</label>
                              <input
                                type="email"
                                name="email"
                                value={editingBooking.email || ''}
                                onChange={handleEditChange}
                                placeholder="Enter email address"
                              />
                            </div>
                            <div className="form-group">
                              <label>Attachment:</label>
                              <input
                                type="file"
                                name="attachment"
                                onChange={handleEditChange}
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                              />
                              {editingBooking.attachment_url && (
                                <div className="current-attachment">
                                  <p>Current: {editingBooking.attachment_name}</p>
                                  <button
                                    type="button"
                                    onClick={(e) => handleAttachmentClick(e, {
                                      url: editingBooking.attachment_url,
                                      name: editingBooking.attachment_name
                                    })}
                                    className="attachment-button"
                                  >
                                    View
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="button-group">
                              <button type="submit">Save</button>
                              <button 
                                type="button" 
                                onClick={() => setEditingBooking(null)}
                                className="cancel-button"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td>{calculateSerialNumber(index)}</td>
                          <td>{booking.title}</td>
                          <td>{booking.description || 'N/A'}</td>
                          <td>{formatDate(booking.booking_date)}</td>
                          <td>
                            <span className={`status status-${booking.status}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            {booking.attachment_url ? (
                              <button
                                onClick={(e) => handleAttachmentClick(e, {
                                  url: booking.attachment_url,
                                  name: booking.attachment_name
                                })}
                                className="attachment-button"
                              >
                                View
                              </button>
                            ) : (
                              'None'
                            )}
                          </td>
                          <td>{formatDate(booking.created_at)}</td>
                          <td className="action-buttons">
                            <button 
                              onClick={() => handleView(booking)}
                              className="view-button"
                              title="View Details"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleEdit(booking)}
                              className="edit-button"
                              title="Edit Booking"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(booking.id)}
                              className="delete-button"
                              title="Delete Booking"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map(booking => renderBookingCard(booking))}
            </div>
          )}
        </>
      )}

      {/* Modal for viewing booking details */}
      {viewingBooking && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Booking No:</label>
                <p className="serial-number">#{calculateSerialNumber(
                  bookings.findIndex(b => b.id === viewingBooking.id)
                )}</p>
              </div>
              <div className="detail-group">
                <label>Title:</label>
                <p>{viewingBooking.title}</p>
              </div>
              <div className="detail-group">
                <label>Description:</label>
                <p>{viewingBooking.description || 'No description provided'}</p>
              </div>
              <div className="detail-group">
                <label>Booking Date:</label>
                <p>{formatDate(viewingBooking.booking_date)}</p>
              </div>
              <div className="detail-group">
                <label>Status:</label>
                <p className={`status status-${viewingBooking.status}`}>
                  {viewingBooking.status}
                </p>
              </div>
              {viewingBooking.attachment_url && (
                <div className="detail-group">
                  <label>Attachment:</label>
                  <p>
                    <a 
                      href={viewingBooking.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {viewingBooking.attachment_name}
                    </a>
                  </p>
                </div>
              )}
              <div className="detail-group">
                <label>Created At:</label>
                <p>{formatDate(viewingBooking.created_at)}</p>
              </div>
              <div className="detail-group">
                <label>Last Updated:</label>
                <p>{formatDate(viewingBooking.updated_at)}</p>
              </div>
              {viewingBooking.visit_date && (
                <div className="detail-group">
                  <label>Visit Date:</label>
                  <p>{formatDate(viewingBooking.visit_date)}</p>
                </div>
              )}
              {viewingBooking.mobile && (
                <div className="detail-group">
                  <label>Mobile:</label>
                  <p>{viewingBooking.mobile}</p>
                </div>
              )}
              {viewingBooking.email && (
                <div className="detail-group">
                  <label>Email:</label>
                  <p>{viewingBooking.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add pagination component to the JSX */}
      {pagination && (
        <>
          <div className="pagination-info">
            Showing {bookings.length} of {pagination.totalItems} bookings
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <div className="report-details">
        <h4>Booking Details</h4>
        <table className="report-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking, index) => (
              <tr key={booking.id}>
                <td>{calculateSerialNumber(index)}</td>
                <td>{booking.title}</td>
                <td>{formatDate(booking.booking_date)}</td>
                <td>
                  <span className={`status status-${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
                <td>{formatDate(booking.created_at)}</td>
                <td>
                  {/* ... existing action buttons ... */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add this modal for viewing attachments (add it at the end of your component, before the final closing tag) */}
      {viewingAttachment && (
        <div className="modal-overlay" onClick={closeAttachmentViewer}>
          <div className="modal-content attachment-viewer" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Attachment: {viewingAttachment.name}</h2>
              <button className="close-button" onClick={closeAttachmentViewer}>&times;</button>
            </div>
            <div className="modal-body">
              {viewingAttachment.type === 'image' ? (
                <img 
                  src={viewingAttachment.url} 
                  alt={viewingAttachment.name}
                  className="attachment-preview"
                />
              ) : (
                <div className="attachment-actions">
                  <p>Downloading file...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add the modal render here */}
      {renderEditModal()}
    </div>
  );
}

export default BookingList; 