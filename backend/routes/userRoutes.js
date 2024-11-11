const express = require('express');



const router = express.Router();



const { validateUserRegistration } = require('../middleware/validationMiddleware');



const { createUser, loginUser, getUsers, updateUser, deleteUser, resetPassword, getCurrentUser } = require('../controllers/userController');



const verifyToken = require('../middleware/authMiddleware');







router.post('/signup', validateUserRegistration, createUser);



router.post('/login', loginUser);



router.get('/', verifyToken, getUsers);



router.put('/:id', verifyToken, updateUser);



router.delete('/:id', verifyToken, deleteUser);



router.post('/:id/reset-password', verifyToken, resetPassword);



router.post('/update-activity', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.userId]
    );
    res.json({ message: 'Activity updated' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity' });
  }
});



router.get('/me', verifyToken, getCurrentUser);







module.exports = router; 






