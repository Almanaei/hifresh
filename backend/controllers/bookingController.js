const db = require('../config/db');

/**
 * Creates a new booking
 */
async function createBooking(req, res) {
  const { title, description, booking_date, visit_date, mobile, email } = req.body;
  const userId = req.user.userId;

  try {
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
    const attachment_name = req.file ? req.file.originalname : null;

    const result = await db.query(
      `INSERT INTO bookings 
       (user_id, title, description, booking_date, visit_date, mobile, email, attachment_url, attachment_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, title, description, booking_date, visit_date, mobile, email, status, attachment_url, attachment_name`,
      [userId, title, description, booking_date, visit_date || null, mobile || null, email || null, attachment_url, attachment_name]
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
  const { id } = req.params;
  const { title, description, booking_date, visit_date, status, mobile, email } = req.body;
  const userId = req.user.userId;

  try {
    const booking = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Handle new attachment if uploaded
    let attachment_url = booking.rows[0].attachment_url;
    let attachment_name = booking.rows[0].attachment_name;

    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
      attachment_name = req.file.originalname;
    }

    const result = await db.query(
      `UPDATE bookings 
       SET title = $1, 
           description = $2, 
           booking_date = $3, 
           visit_date = $4, 
           status = $5,
           mobile = $6,
           email = $7,
           attachment_url = $8,
           attachment_name = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING id, title, description, booking_date, visit_date, mobile, email, status, attachment_url, attachment_name`,
      [title, description, booking_date, visit_date || null, status, mobile || null, email || null, 
       attachment_url, attachment_name, id, userId]
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

module.exports = {
  createBooking,
  getUserBookings,
  updateBooking,
  deleteBooking
}; 