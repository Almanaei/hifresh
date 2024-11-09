const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { validateBooking } = require('../middleware/validationMiddleware');
const { createBooking, getUserBookings, updateBooking, deleteBooking } = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

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

// Create a new booking
router.post('/', verifyToken, upload, validateBooking, createBooking);

// Get all bookings for the authenticated user
router.get('/', verifyToken, getUserBookings);

// Update a booking - Fix the middleware order here
router.put('/:id', verifyToken, upload, validateBooking, updateBooking);

// Delete a booking
router.delete('/:id', verifyToken, deleteBooking);

// Add this route to get all bookings without pagination
router.get('/all', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, u.username 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

module.exports = router;






