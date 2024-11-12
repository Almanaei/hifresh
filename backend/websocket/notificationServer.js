const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');

class NotificationServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map to store client connections with their user IDs

    this.wss.on('connection', (ws, req) => {
      const token = url.parse(req.url, true).query.token;
      
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        // Store the connection with user ID
        this.clients.set(userId, ws);
        console.log(`Client connected for user ${userId}`);

        ws.on('close', () => {
          this.clients.delete(userId);
          console.log(`Client disconnected for user ${userId}`);
        });

      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.terminate();
      }
    });
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  }

  // Broadcast notification to all connected clients
  broadcast(notification) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }
}

module.exports = NotificationServer; 