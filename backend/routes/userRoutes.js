const express = require('express');



const router = express.Router();



const { validateUserRegistration } = require('../middleware/validationMiddleware');



const { createUser, loginUser, getUsers, updateUser, deleteUser, resetPassword } = require('../controllers/userController');



const verifyToken = require('../middleware/authMiddleware');







router.post('/signup', validateUserRegistration, createUser);



router.post('/login', loginUser);



router.get('/', verifyToken, getUsers);



router.put('/:id', verifyToken, updateUser);



router.delete('/:id', verifyToken, deleteUser);



router.post('/:id/reset-password', verifyToken, resetPassword);







module.exports = router; 






