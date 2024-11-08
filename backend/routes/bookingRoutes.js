const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { validateBooking } = require('../middleware/validationMiddleware');
const { createBooking, getUserBookings, updateBooking, deleteBooking } = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Invalid file type!');
    }
  }
}).single('attachment');

// Create a new booking - handle file upload before validation
router.post('/', verifyToken, upload, validateBooking, createBooking);

// Get all bookings for the authenticated user
router.get('/', verifyToken, getUserBookings);

// Update a booking
router.put('/:id', verifyToken, validateBooking, updateBooking);

// Delete a booking
router.delete('/:id', verifyToken, deleteBooking);

module.exports = router; 






