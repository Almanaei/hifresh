import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../common/Pagination';

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
      await api.updateBooking(editingBooking.id, editingBooking);
      setEditingBooking(null);
      fetchBookings(); // Refresh the list
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
    setEditingBooking({
      ...editingBooking,
      [e.target.name]: e.target.value,
    });
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

  // Add this function to handle attachment clicks
  const handleAttachmentClick = (e, attachment) => {
    e.preventDefault();
    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    const baseUrl = process.env.REACT_APP_API_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${attachment.url}`;
    
    // Image files - show in modal
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      setViewingAttachment({
        ...attachment,
        url: fullUrl,
        type: 'image'
      });
    } 
    // PDF files - open in new tab
    else if (fileExtension === 'pdf') {
      window.open(fullUrl, '_blank');
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

  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const filteredBookings = filterBookings(bookings);

  return (
    <div className="booking-list">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  {editingBooking && editingBooking.id === booking.id ? (
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
                  ) : (
                    <>
                      <h3>{booking.title}</h3>
                      <p className="description">{booking.description}</p>
                      <p className="date">
                        <strong>Date:</strong> {formatDate(booking.booking_date)}
                      </p>
                      <p className={`status status-${booking.status}`}>
                        <strong>Status:</strong> {booking.status}
                      </p>
                      {booking.attachment_url && (
                        <p className="attachment">
                          <strong>Attachment:</strong>{' '}
                          <a 
                            href={booking.attachment_url}
                            onClick={(e) => handleAttachmentClick(e, {
                              url: booking.attachment_url,
                              name: booking.attachment_name
                            })}
                            className="attachment-link"
                          >
                            {booking.attachment_name}
                          </a>
                        </p>
                      )}
                      <div className="button-group">
                        <button 
                          onClick={() => handleView(booking)}
                          className="view-button"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEdit(booking)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(booking.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
    </div>
  );
}

export default BookingList; 