const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  try {
    const sql = await fs.readFile(
      path.join(__dirname, 'migrations', 'create_notifications_table.sql'),
      'utf8'
    );
    
    await db.query(sql);
    console.log('Notifications table created successfully');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  } finally {
    process.exit();
  }
}

runMigration(); 