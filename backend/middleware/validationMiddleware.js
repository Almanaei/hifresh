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

  // Email validation (now mandatory)
  if (!email) {
    return res.status(400).json({
      message: 'Email is required'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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
  const { title, booking_date, visit_date } = req.body;

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

  // Validate booking date is in the future
  if (new Date(booking_date) < new Date()) {
    return res.status(400).json({
      message: 'Booking date must be in the future'
    });
  }

  // Validate visit date if provided
  if (visit_date) {
    if (!Date.parse(visit_date)) {
      return res.status(400).json({
        message: 'Invalid visit date format'
      });
    }

    if (new Date(visit_date) < new Date(booking_date)) {
      return res.status(400).json({
        message: 'Visit date must be after booking date'
      });
    }
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateBooking
}; 