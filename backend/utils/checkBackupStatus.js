const fs = require('fs').promises;
const path = require('path');

async function checkBackupStatus() {
  const backupDir = path.join(__dirname, '../backups');
  
  try {
    // Get all files in backup directory
    const files = await fs.readdir(backupDir);
    
    // Filter backup files and sort by date
    const backups = files
      .filter(file => file.match(/^(db|json)_backup_\d{8}_\d{6}/))
      .sort()
      .reverse();

    // Get latest backup info
    const latestBackup = backups[0];
    if (!latestBackup) {
      return {
        status: 'WARNING',
        message: 'No backups found'
      };
    }

    // Check backup age
    const backupDate = latestBackup.match(/\d{8}_\d{6}/)[0];
    const backupTimestamp = new Date(
      backupDate.replace(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/, 
      '$1-$2-$3T$4:$5:$6')
    );
    
    const now = new Date();
    const hoursSinceBackup = (now - backupTimestamp) / (1000 * 60 * 60);

    // Check backup status
    if (hoursSinceBackup > 24) {
      return {
        status: 'ERROR',
        message: `Latest backup is ${Math.floor(hoursSinceBackup)} hours old`,
        lastBackup: backupTimestamp,
        backupFile: latestBackup
      };
    }

    return {
      status: 'OK',
      message: 'Backup is up to date',
      lastBackup: backupTimestamp,
      backupFile: latestBackup
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: `Error checking backup status: ${error.message}`
    };
  }
}

module.exports = checkBackupStatus; 