const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', verifyToken, getAnalytics);

module.exports = router; 