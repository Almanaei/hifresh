const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Verifies JWT token in request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify that the user exists in the database
      const userCheck = await db.query(
        'SELECT id FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = decoded;

      // Update last_active timestamp
      await db.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [decoded.userId]
      );

      next();
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = verifyToken;


