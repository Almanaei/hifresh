const bcrypt = require('bcrypt');



const jwt = require('jsonwebtoken');



const db = require('../config/db');







/**



 * Creates a new user in the database



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function createUser(req, res) {



  const { username, email, password } = req.body;







  try {



    // Check if username already exists



    const userExists = await db.query(



      'SELECT * FROM users WHERE username = $1 OR email = $2',



      [username, email]



    );







    if (userExists.rows.length > 0) {



      const existingUser = userExists.rows[0];



      if (existingUser.username === username) {



        return res.status(400).json({ message: 'Username already exists' });



      }



      if (existingUser.email === email) {



        return res.status(400).json({ message: 'Email already registered' });



      }



    }







    // Hash password



    const hashedPassword = await bcrypt.hash(password, 10);







    // Insert new user



    const result = await db.query(



      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',



      [username, email, hashedPassword]



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



        username: result.rows[0].username,



        email: result.rows[0].email



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







/**



 * Gets all users from the database



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function getUsers(req, res) {



  const page = parseInt(req.query.page) || 1;



  const limit = parseInt(req.query.limit) || 10;



  const offset = (page - 1) * limit;







  try {



    // Get total count



    const countResult = await db.query('SELECT COUNT(*) FROM users');



    const totalItems = parseInt(countResult.rows[0].count);



    const totalPages = Math.ceil(totalItems / limit);







    // Get paginated results



    const result = await db.query(



      `SELECT id, username, email, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,



      [limit, offset]



    );







    res.json({



      users: result.rows,



      pagination: {



        currentPage: page,



        totalPages,



        totalItems,



        hasNext: page < totalPages,



        hasPrevious: page > 1



      }



    });



  } catch (error) {



    console.error('Error fetching users:', error);



    res.status(500).json({ message: 'Error fetching users' });



  }



}







/**



 * Updates a user



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function updateUser(req, res) {



  const { id } = req.params;



  const { username, email } = req.body;







  try {



    const userExists = await db.query(



      'SELECT * FROM users WHERE username = $1 AND id != $2',



      [username, id]



    );







    if (userExists.rows.length > 0) {



      return res.status(400).json({ message: 'Username already exists' });



    }







    const result = await db.query(



      `UPDATE users 
       SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, email, created_at, updated_at`,



      [username, email, id]



    );







    if (result.rows.length === 0) {



      return res.status(404).json({ message: 'User not found' });



    }







    res.json({



      message: 'User updated successfully',



      user: result.rows[0]



    });



  } catch (error) {



    console.error('Error updating user:', error);



    res.status(500).json({ message: 'Error updating user' });



  }



}







/**



 * Deletes a user



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function deleteUser(req, res) {



  const { id } = req.params;







  try {



    const result = await db.query(



      'DELETE FROM users WHERE id = $1 RETURNING id',



      [id]



    );







    if (result.rows.length === 0) {



      return res.status(404).json({ message: 'User not found' });



    }







    res.json({ message: 'User deleted successfully' });



  } catch (error) {



    console.error('Error deleting user:', error);



    res.status(500).json({ message: 'Error deleting user' });



  }



}







/**



 * Resets a user's password



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function resetPassword(req, res) {



  const { id } = req.params;



  const newPassword = Math.random().toString(36).slice(-8); // Generate random password







  try {



    const hashedPassword = await bcrypt.hash(newPassword, 10);







    const result = await db.query(



      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email`,



      [hashedPassword, id]



    );







    if (result.rows.length === 0) {



      return res.status(404).json({ message: 'User not found' });



    }







    res.json({



      message: 'Password reset successfully',



      user: result.rows[0],



      newPassword // Send the new password in response



    });



  } catch (error) {



    console.error('Error resetting password:', error);



    res.status(500).json({ message: 'Error resetting password' });



  }



}







module.exports = {



  createUser,



  loginUser,



  getUsers,



  updateUser,



  deleteUser,



  resetPassword



}; 






