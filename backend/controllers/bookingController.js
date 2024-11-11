const db = require('../config/db');

/**
 * Creates a new booking
 */
async function createBooking(req, res) {
  const { title, description, booking_date, visit_date, mobile, email } = req.body;
  const userId = req.user.userId;

  try {
    // First verify that the user exists
    const userCheck = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format dates properly
    const formattedBookingDate = booking_date ? new Date(booking_date).toISOString() : null;
    const formattedVisitDate = visit_date ? new Date(visit_date).toISOString() : null;

    // Validate visit date is after booking date if both exist
    if (formattedBookingDate && formattedVisitDate) {
      if (new Date(formattedVisitDate) < new Date(formattedBookingDate)) {
        return res.status(400).json({ message: 'Visit date must be after booking date' });
      }
    }

    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
    const attachment_name = req.file ? req.file.originalname : null;

    const result = await db.query(
      `INSERT INTO bookings 
       (user_id, title, description, booking_date, visit_date, mobile, email, attachment_url, attachment_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        userId, 
        title, 
        description, 
        formattedBookingDate, 
        formattedVisitDate, 
        mobile || null, 
        email || null, 
        attachment_url, 
        attachment_name
      ]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
}

/**
 * Gets all bookings for a user
 */
async function getUserBookings(req, res) {
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM bookings WHERE user_id = $1',
      [userId]
    );
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated results with visit_date field included
    const result = await db.query(
      `SELECT id, title, description, booking_date, visit_date, mobile, email, 
              status, attachment_url, attachment_name, created_at, updated_at
       FROM bookings 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      bookings: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
}

/**
 * Updates a booking
 */
async function updateBooking(req, res) {
  const bookingId = req.params.id;
  const userId = req.user.userId;
  const { title, description, booking_date, visit_date, mobile, email, status } = req.body;

  try {
    // First verify that the booking exists and belongs to the user
    const bookingCheck = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Format dates with consistent timezone handling
    const formattedBookingDate = formatDateWithTimezone(booking_date);
    const formattedVisitDate = formatDateWithTimezone(visit_date);

    // Validate dates
    if (booking_date && !formattedBookingDate) {
      return res.status(400).json({ message: 'Invalid booking date format' });
    }

    if (visit_date && !formattedVisitDate) {
      return res.status(400).json({ message: 'Invalid visit date format' });
    }

    // Validate visit date is after booking date if both exist
    if (formattedBookingDate && formattedVisitDate) {
      if (formattedVisitDate < formattedBookingDate) {
        return res.status(400).json({ message: 'Visit date must be after booking date' });
      }
    }

    // Handle file attachment if present
    let attachment_url = bookingCheck.rows[0].attachment_url;
    let attachment_name = bookingCheck.rows[0].attachment_name;

    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
      attachment_name = req.file.originalname;
    }

    // Update the booking with proper date handling
    const result = await db.query(
      `UPDATE bookings 
       SET title = $1, 
           description = $2, 
           booking_date = $3, 
           visit_date = $4, 
           mobile = $5, 
           email = $6,
           status = $7,
           attachment_url = $8,
           attachment_name = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        title,
        description,
        formattedBookingDate ? formattedBookingDate.toISOString() : null,
        formattedVisitDate ? formattedVisitDate.toISOString() : null,
        mobile,
        email,
        status || bookingCheck.rows[0].status,
        attachment_url,
        attachment_name,
        bookingId,
        userId
      ]
    );

    res.json({
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
}

/**
 * Deletes a booking
 */
async function deleteBooking(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  }
}

// Update the formatDateWithTimezone function
const formatDateWithTimezone = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Return the date object instead of ISO string
    return date;
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  updateBooking,
  deleteBooking
}; 