const db = require('../config/db');

/**
 * Creates a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createBooking(req, res) {
  const { title, description, booking_date } = req.body;
  const userId = req.user.userId;

  try {
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
    const attachment_name = req.file ? req.file.originalname : null;

    const result = await db.query(
      `INSERT INTO bookings 
       (user_id, title, description, booking_date, attachment_url, attachment_name) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, title, description, booking_date, status, attachment_url, attachment_name`,
      [userId, title, description, booking_date, attachment_url, attachment_name]
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserBookings(req, res) {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT id, title, description, booking_date, status, attachment_url, attachment_name 
       FROM bookings 
       WHERE user_id = $1 
       ORDER BY booking_date DESC`,
      [userId]
    );

    res.json({
      bookings: result.rows
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
  const { title, description, booking_date, status } = req.body;
  const userId = req.user.userId;

  try {
    // First check if the booking belongs to the user
    const booking = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const result = await db.query(
      `UPDATE bookings 
       SET title = $1, description = $2, booking_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING id, title, description, booking_date, status`,
      [title, description, booking_date, status, id, userId]
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