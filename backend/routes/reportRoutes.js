const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { generateReport } = require('../controllers/reportController');

router.get('/:period', verifyToken, generateReport);

module.exports = router; 