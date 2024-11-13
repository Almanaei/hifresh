const db = require('../config/db');

async function getNotifications(req, res) {
    try {
        const result = await db.query(`
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `, [req.user.userId]);

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
}

async function markAsRead(req, res) {
    const { id } = req.params;

    try {
        await db.query(`
            UPDATE notifications 
            SET read = true 
            WHERE id = $1 AND user_id = $2
        `, [id, req.user.userId]);

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
}

async function createNotification(userId, type, title, message, relatedId = null, relatedType = null) {
    try {
        await db.query(`
            INSERT INTO notifications 
            (user_id, type, title, message, related_id, related_type)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, type, title, message, relatedId, relatedType]);
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

async function clearNotifications(req, res) {
    try {
        await db.query(`
            DELETE FROM notifications 
            WHERE user_id = $1
        `, [req.user.userId]);

        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Error clearing notifications' });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    createNotification,
    clearNotifications
}; 