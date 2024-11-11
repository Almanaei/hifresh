const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', authenticate, getAnalytics);

module.exports = router; 