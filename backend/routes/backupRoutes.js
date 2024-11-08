const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { createBackup, getBackups } = require('../controllers/backupController');

// Create a backup
router.post('/:period', verifyToken, createBackup);

// Get list of backups
router.get('/', verifyToken, getBackups);

module.exports = router; 