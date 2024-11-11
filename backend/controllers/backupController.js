const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gets list of available backups
 */
async function getBackups() {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    
    // Get all files in backup directory
    const files = await fs.readdir(backupDir);
    
    // Get file details
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.gz'))
        .map(async (file) => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            fileName: file,
            type: file.includes('weekly') ? 'weekly' : 'monthly',
            createdAt: stats.birthtime,
            size: stats.size
          };
        })
    );
    
    // Sort by creation date, newest first
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting backups:', error);
    throw error;
  }
}

/**
 * Creates a new backup
 */
async function createBackup(period) {
  if (!['weekly', 'monthly'].includes(period)) {
    throw new Error('Invalid backup period');
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    
    // Get data to backup
    const bookingsResult = await db.query('SELECT * FROM bookings');
    const usersResult = await db.query('SELECT * FROM users');
    
    const backupData = {
      timestamp,
      period,
      bookings: bookingsResult.rows,
      users: usersResult.rows
    };
    
    // Create backup file
    const fileName = `backup_${period}_${timestamp}.json.gz`;
    const filePath = path.join(backupDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));
    
    return {
      success: true,
      message: 'Backup created successfully',
      fileName,
      timestamp,
      type: period
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

module.exports = {
  getBackups,
  createBackup
}; 