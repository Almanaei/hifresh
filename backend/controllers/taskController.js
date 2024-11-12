const db = require('../config/db');
const { createNotification } = require('./notificationController');

// Debug logging function
const debug = (message, data = '') => {
    console.log(`[TaskController] ${message}`, data);
};

async function getTasks(req, res) {
    debug('Getting tasks for user:', req.user.userId);
    try {
        // First verify the tasks table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'tasks'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            debug('Tasks table does not exist');
            // Create the table if it doesn't exist
            await db.query(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    text VARCHAR(255) NOT NULL,
                    completed BOOLEAN DEFAULT false,
                    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
                CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
            `);
            debug('Created tasks table');
        }

        // Modified query to get tasks created by OR assigned to the user
        const result = await db.query(`
            SELECT t.*, u.username,
                   CASE 
                       WHEN t.created_by = $1 THEN 'created'
                       WHEN t.assigned_to = $1 THEN 'assigned'
                   END as relationship
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.created_by = $1 
               OR t.assigned_to = $1
            ORDER BY t.created_at DESC
        `, [req.user.userId]);

        debug('Tasks fetched successfully:', result.rows.length);
        res.json({ tasks: result.rows });
    } catch (error) {
        debug('Error in getTasks:', error);
        res.status(500).json({ 
            message: 'Error fetching tasks',
            error: error.message 
        });
    }
}

async function createTask(req, res) {
    const { text, assigned_to } = req.body;
    debug('Creating task:', { text, assigned_to, userId: req.user.userId });

    try {
        // Validate input
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ 
                message: 'Task text is required',
                error: 'VALIDATION_ERROR'
            });
        }

        // If assigned_to is provided, verify the user exists
        if (assigned_to) {
            const userCheck = await db.query(
                'SELECT id FROM users WHERE id = $1',
                [assigned_to]
            );
            if (userCheck.rows.length === 0) {
                return res.status(400).json({ 
                    message: 'Assigned user not found',
                    error: 'USER_NOT_FOUND'
                });
            }
        }

        const result = await db.query(`
            INSERT INTO tasks (text, created_by, assigned_to)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [text, req.user.userId, assigned_to]);

        // Get username for assigned user
        if (result.rows[0].assigned_to) {
            const userResult = await db.query(
                'SELECT username FROM users WHERE id = $1',
                [result.rows[0].assigned_to]
            );
            result.rows[0].username = userResult.rows[0]?.username;

            // Create notification for assigned user
            if (assigned_to !== req.user.userId) {
                const notification = {
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: `You have been assigned a new task: ${text}`,
                    taskId: result.rows[0].id
                };

                // Send real-time notification
                if (global.notificationServer) {
                    global.notificationServer.sendNotification(assigned_to, notification);
                }

                // Also save to database
                await createNotification(
                    assigned_to,
                    notification.type,
                    notification.title,
                    notification.message,
                    result.rows[0].id,
                    'task'
                );
            }
        }

        debug('Task created successfully:', result.rows[0].id);
        res.status(201).json({ task: result.rows[0] });
    } catch (error) {
        debug('Error in createTask:', error);
        res.status(500).json({ 
            message: 'Error creating task',
            error: error.message
        });
    }
}

async function updateTask(req, res) {
    const { id } = req.params;
    const { completed } = req.body;
    debug('Updating task:', { id, completed, userId: req.user.userId });

    try {
        // Verify task exists and belongs to user
        const taskCheck = await db.query(
            'SELECT id FROM tasks WHERE id = $1 AND created_by = $2',
            [id, req.user.userId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Task not found or unauthorized',
                error: 'TASK_NOT_FOUND'
            });
        }

        const result = await db.query(`
            UPDATE tasks
            SET completed = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND created_by = $3
            RETURNING *
        `, [completed, id, req.user.userId]);

        // Get username for assigned user
        if (result.rows[0].assigned_to) {
            const userResult = await db.query(
                'SELECT username FROM users WHERE id = $1',
                [result.rows[0].assigned_to]
            );
            result.rows[0].username = userResult.rows[0]?.username;
        }

        debug('Task updated successfully:', result.rows[0].id);
        res.json({ task: result.rows[0] });
    } catch (error) {
        debug('Error in updateTask:', error);
        res.status(500).json({ 
            message: 'Error updating task',
            error: error.message
        });
    }
}

async function deleteTask(req, res) {
    const { id } = req.params;
    debug('Deleting task:', { id, userId: req.user.userId });

    try {
        // Verify task exists and belongs to user
        const result = await db.query(`
            DELETE FROM tasks 
            WHERE id = $1 AND created_by = $2
            RETURNING *
        `, [id, req.user.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Task not found or unauthorized',
                error: 'TASK_NOT_FOUND'
            });
        }

        debug('Task deleted successfully:', id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        debug('Error in deleteTask:', error);
        res.status(500).json({ 
            message: 'Error deleting task',
            error: error.message
        });
    }
}

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
}; 