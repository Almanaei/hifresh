require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const http = require('http');
const NotificationServer = require('./websocket/notificationServer');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const notificationServer = new NotificationServer(server);

// Make notificationServer available globally
global.notificationServer = notificationServer;

// Test database connection
db.pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });


