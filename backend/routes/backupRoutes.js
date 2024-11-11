const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { createBackup, getBackups } = require('../controllers/backupController');
const checkBackupStatus = require('../utils/checkBackupStatus');
const path = require('path');
const fs = require('fs');

// Get all backups
router.get('/', verifyToken, async (req, res) => {
  try {
    const backups = await getBackups();
    res.json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'Error fetching backups' });
  }
});

// Create a new backup
router.post('/:period', verifyToken, async (req, res) => {
  try {
    const { period } = req.params;
    const result = await createBackup(period);
    res.json(result);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Error creating backup' });
  }
});

// Get backup status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const status = await checkBackupStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to check backup status'
    });
  }
});

// Add download route
router.get('/download/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../backups');
    const filePath = path.join(backupDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    // Security check: Ensure the file is within the backups directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(backupDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ message: 'Error downloading backup' });
  }
});

module.exports = router; 