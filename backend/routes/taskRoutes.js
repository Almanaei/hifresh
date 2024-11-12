const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

// Enhanced debug middleware
router.use((req, res, next) => {
  console.log('Task route accessed:', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Get all tasks
router.get('/', verifyToken, (req, res, next) => {
  console.log('GET /tasks - Before controller');
  taskController.getTasks(req, res, next);
});

// Create task
router.post('/', verifyToken, (req, res, next) => {
  console.log('POST /tasks - Before controller');
  taskController.createTask(req, res, next);
});

// Update task
router.put('/:id', verifyToken, (req, res, next) => {
  console.log('PUT /tasks/:id - Before controller');
  taskController.updateTask(req, res, next);
});

// Delete task
router.delete('/:id', verifyToken, (req, res, next) => {
  console.log('DELETE /tasks/:id - Before controller');
  taskController.deleteTask(req, res, next);
});

module.exports = router; 