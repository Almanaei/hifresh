/**
 * Validates user registration input
 */
const validateUserRegistration = (req, res, next) => {
  const { username, password, email } = req.body;

  // Username validation
  if (!username || username.length < 3) {
    return res.status(400).json({
      message: 'Username must be at least 3 characters long'
    });
  }

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long'
    });
  }

  // Email validation (optional)
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  next();
};

/**
 * Validates booking creation input
 */
const validateBooking = (req, res, next) => {
  // For multipart/form-data, fields are in req.body
  const title = req.body.title;
  const booking_date = req.body.booking_date;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      message: 'Booking title is required'
    });
  }

  if (!booking_date || !Date.parse(booking_date)) {
    return res.status(400).json({
      message: 'Valid booking date is required'
    });
  }

  // Ensure booking date is in the future
  if (new Date(booking_date) < new Date()) {
    return res.status(400).json({
      message: 'Booking date must be in the future'
    });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateBooking
}; 