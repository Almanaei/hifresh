const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generates a backup of the database
 * @param {string} period - 'weekly' or 'monthly'
 * @returns {Promise<string>} - Path to the backup file
 */
async function generateBackupData(period) {
  const currentDate = new Date();
  let query;

  if (period === 'weekly') {
    query = `
      SELECT b.*, u.username 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY b.created_at DESC
    `;
  } else if (period === 'monthly') {
    query = `
      SELECT b.*, u.username 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY b.created_at DESC
    `;
  }

  const result = await db.query(query);
  return result.rows;
}

/**
 * Creates a backup file
 */
async function createBackup(req, res) {
  const { period } = req.params;
  
  if (!['weekly', 'monthly'].includes(period)) {
    return res.status(400).json({ message: 'Invalid backup period' });
  }

  try {
    const backupData = await generateBackupData(period);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${period}-${timestamp}.json`;
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backups directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupPath = path.join(backupDir, fileName);
    await fs.writeFile(
      backupPath,
      JSON.stringify(backupData, null, 2)
    );

    // Generate backup summary
    const summary = {
      period,
      timestamp: new Date().toISOString(),
      totalRecords: backupData.length,
      fileName,
    };

    res.json({
      message: 'Backup created successfully',
      summary
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ message: 'Error creating backup' });
  }
}

/**
 * Gets list of available backups
 */
async function getBackups(req, res) {
  try {
    const backupDir = path.join(__dirname, '../backups');
    const files = await fs.readdir(backupDir);
    
    const backups = await Promise.all(
      files.map(async (file) => {
        const stats = await fs.stat(path.join(backupDir, file));
        return {
          fileName: file,
          createdAt: stats.birthtime,
          size: stats.size,
          type: file.includes('weekly') ? 'weekly' : 'monthly'
        };
      })
    );

    res.json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'Error fetching backups' });
  }
}

module.exports = {
  createBackup,
  getBackups
}; 