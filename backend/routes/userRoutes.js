const express = require('express');

const router = express.Router();

const { validateUserRegistration } = require('../middleware/validationMiddleware');

const { createUser, loginUser } = require('../controllers/userController');



router.post('/signup', validateUserRegistration, createUser);

router.post('/login', loginUser);



module.exports = router; 


