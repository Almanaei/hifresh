const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const db = require('../config/db');



/**

 * Creates a new user in the database

 * @param {Object} req - Express request object

 * @param {Object} res - Express response object

 */

async function createUser(req, res) {

  const { username, password } = req.body;



  try {

    // Check if username already exists

    const userExists = await db.query(

      'SELECT * FROM users WHERE username = $1',

      [username]

    );



    if (userExists.rows.length > 0) {

      return res.status(400).json({ message: 'Username already exists' });

    }



    // Hash password

    const hashedPassword = await bcrypt.hash(password, 10);



    // Insert new user

    const result = await db.query(

      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',

      [username, hashedPassword]

    );



    // Generate JWT token

    const token = jwt.sign(

      { userId: result.rows[0].id },

      process.env.JWT_SECRET,

      { expiresIn: '24h' }

    );



    res.status(201).json({

      message: 'User created successfully',

      user: {

        id: result.rows[0].id,

        username: result.rows[0].username

      },

      token

    });

  } catch (error) {

    console.error('Error creating user:', error);

    res.status(500).json({ message: 'Error creating user' });

  }

}



/**

 * Authenticates a user and returns a JWT token

 * @param {Object} req - Express request object

 * @param {Object} res - Express response object

 */

async function loginUser(req, res) {

  const { username, password } = req.body;



  try {

    // Find user by username

    const result = await db.query(

      'SELECT * FROM users WHERE username = $1',

      [username]

    );



    const user = result.rows[0];



    if (!user) {

      return res.status(401).json({ message: 'Invalid username or password' });

    }



    // Verify password

    const validPassword = await bcrypt.compare(password, user.password);



    if (!validPassword) {

      return res.status(401).json({ message: 'Invalid username or password' });

    }



    // Generate JWT token

    const token = jwt.sign(

      { userId: user.id },

      process.env.JWT_SECRET,

      { expiresIn: '24h' }

    );



    res.json({

      message: 'Login successful',

      user: {

        id: user.id,

        username: user.username

      },

      token

    });

  } catch (error) {

    console.error('Error during login:', error);

    res.status(500).json({ message: 'Error during login' });

  }

}



module.exports = {

  createUser,

  loginUser

}; 


