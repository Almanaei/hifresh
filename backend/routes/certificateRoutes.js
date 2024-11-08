const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { generateCertificate, getCertificates } = require('../controllers/certificateController');

// Add error handling middleware
const errorHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    console.error('Certificate route error:', error);
    res.status(500).json({ 
      message: 'Error processing certificate request',
      error: error.message 
    });
  }
};

// Generate certificate
router.post('/:bookingId', 
  verifyToken, 
  errorHandler(generateCertificate)
);

// Get all certificates
router.get('/', 
  verifyToken, 
  errorHandler(getCertificates)
);

// Add static file serving for certificates
router.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

module.exports = router; 