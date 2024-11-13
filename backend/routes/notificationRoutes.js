const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getNotifications, markAsRead, clearNotifications } = require('../controllers/notificationController');

router.get('/', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.post('/clear', verifyToken, clearNotifications);

module.exports = router; 