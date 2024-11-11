const bcrypt = require('bcrypt');



const jwt = require('jsonwebtoken');



const db = require('../config/db');







/**



 * Creates a new user in the database



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function createUser(req, res) {



  const { username, email, password, role = 'user', status = 'active' } = req.body;







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







    // Insert new user with role and status



    const result = await db.query(



      `INSERT INTO users (username, email, password, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, role, status`,



      [username, email, hashedPassword, role, status]



    );







    // Generate JWT token



    const token = jwt.sign(



      { userId: result.rows[0].id },



      process.env.JWT_SECRET,



      { expiresIn: '24h' }



    );







    res.status(201).json({



      message: 'User created successfully',



      user: result.rows[0],



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







    // Update last_active timestamp



    await db.query(



      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',



      [user.id]



    );







    // Generate JWT token with proper secret



    const token = jwt.sign(



      { 



        userId: user.id,



        username: user.username



      },



      process.env.JWT_SECRET,



      { 



        expiresIn: '24h',



        algorithm: 'HS256'



      }



    );







    res.json({



      message: 'Login successful',



      user: {



        id: user.id,



        username: user.username,



        email: user.email



      },



      token



    });



  } catch (error) {



    console.error('Login Error:', error);



    res.status(500).json({ message: 'Error during login' });



  }



}







/**



 * Gets all users from the database



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function getUsers(req, res) {



  try {



    // First verify the columns exist



    const checkColumns = await db.query(`



      SELECT EXISTS (



        SELECT 1 



        FROM information_schema.columns 



        WHERE table_name='users' AND column_name='role'



      ) as has_role,



      EXISTS (



        SELECT 1 



        FROM information_schema.columns 



        WHERE table_name='users' AND column_name='status'



      ) as has_status



    `);







    // Build the query dynamically based on available columns



    const columns = ['id', 'username', 'email', 'last_active', 'created_at', 'updated_at'];



    if (checkColumns.rows[0].has_role) columns.push('role');



    if (checkColumns.rows[0].has_status) columns.push('status');







    const result = await db.query(



      `SELECT ${columns.join(', ')} 



       FROM users 



       ORDER BY created_at DESC`



    );







    // Add default values for missing columns



    const users = result.rows.map(user => ({



      ...user,



      role: user.role || 'user',



      status: user.status || 'active'



    }));







    res.json({



      users,



      message: 'Users retrieved successfully'



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



  const { username, email, role, status } = req.body;







  try {



    // First check if the user exists



    const userCheck = await db.query(



      'SELECT * FROM users WHERE id = $1',



      [id]



    );







    if (userCheck.rows.length === 0) {



      return res.status(404).json({ message: 'User not found' });



    }







    // Check if username is already taken by another user



    const usernameCheck = await db.query(



      'SELECT * FROM users WHERE username = $1 AND id != $2',



      [username, id]



    );







    if (usernameCheck.rows.length > 0) {



      return res.status(400).json({ message: 'Username already exists' });



    }







    // Validate role



    const validRoles = ['user', 'admin'];



    if (!validRoles.includes(role)) {



      return res.status(400).json({ message: 'Invalid role' });



    }







    // Validate status



    const validStatuses = ['active', 'inactive', 'suspended'];



    if (!validStatuses.includes(status)) {



      return res.status(400).json({ message: 'Invalid status' });



    }







    // Perform the update



    const result = await db.query(



      `UPDATE users 



       SET 



         username = COALESCE($1, username),



         email = COALESCE($2, email),



         role = COALESCE($3, role),



         status = COALESCE($4, status),



         updated_at = CURRENT_TIMESTAMP



       WHERE id = $5



       RETURNING id, username, email, role, status, created_at, updated_at`,



      [username, email, role, status, id]



    );







    res.json({



      message: 'User updated successfully',



      user: result.rows[0]



    });







  } catch (error) {



    console.error('Error updating user:', error);



    res.status(500).json({ 



      message: 'Error updating user',



      detail: error.message



    });







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







/**



 * Gets current user info



 * @param {Object} req - Express request object



 * @param {Object} res - Express response object



 */



async function getCurrentUser(req, res) {



  try {



    const result = await db.query(



      'SELECT id, username, email, role, status FROM users WHERE id = $1',



      [req.user.userId]



    );







    if (result.rows.length === 0) {



      return res.status(404).json({ message: 'User not found' });



    }







    res.json({



      user: result.rows[0]



    });







  } catch (error) {



    console.error('Error fetching current user:', error);



    res.status(500).json({ message: 'Error fetching user details' });



  }



}







module.exports = {



  createUser,



  loginUser,



  getUsers,



  updateUser,



  deleteUser,



  resetPassword,



  getCurrentUser



}; 






