const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

async function createBackup(type = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  
  try {
    // Create backups directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    let data = {};
    
    if (type === 'full' || type === 'users') {
      const usersResult = await db.query('SELECT * FROM users');
      data.users = usersResult.rows;
    }
    
    if (type === 'full' || type === 'bookings') {
      const bookingsResult = await db.query('SELECT * FROM bookings');
      data.bookings = bookingsResult.rows;
    }

    const backupPath = path.join(backupDir, `backup_${type}_${timestamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

    return {
      success: true,
      path: backupPath,
      timestamp,
      type
    };
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
}

async function restoreFromBackup(backupFile) {
  try {
    const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
    
    await db.query('BEGIN');

    if (backupData.users) {
      await db.query('DELETE FROM users');
      for (const user of backupData.users) {
        await db.query(
          `INSERT INTO users (id, username, email, password, role, status, last_active, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [user.id, user.username, user.email, user.password, user.role, user.status, 
           user.last_active, user.created_at, user.updated_at]
        );
      }
    }

    if (backupData.bookings) {
      await db.query('DELETE FROM bookings');
      for (const booking of backupData.bookings) {
        await db.query(
          `INSERT INTO bookings (id, user_id, title, description, booking_date, visit_date, 
                                mobile, email, status, attachment_url, attachment_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [booking.id, booking.user_id, booking.title, booking.description, booking.booking_date,
           booking.visit_date, booking.mobile, booking.email, booking.status, booking.attachment_url,
           booking.attachment_name, booking.created_at, booking.updated_at]
        );
      }
    }

    await db.query('COMMIT');
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Restore failed:', error);
    throw error;
  }
}

module.exports = {
  createBackup,
  restoreFromBackup
}; 