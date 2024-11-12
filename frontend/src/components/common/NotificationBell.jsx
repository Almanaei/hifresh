import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './NotificationBell.css';
import { useTheme } from '../../context/ThemeContext';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState(null);
    const { isDarkMode } = useTheme();

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.getNotifications();
            setNotifications(response.notifications);
            setError(null);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to load notifications');
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.markNotificationAsRead(notificationId);
            // Update local state to reflect the change
            setNotifications(notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true }
                    : notification
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleBellClick = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.notification-bell')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={`notification-bell ${isDarkMode ? 'dark-theme' : ''}`}>
            <button 
                className="bell-button" 
                onClick={handleBellClick}
                title={unreadCount ? `${unreadCount} unread notifications` : 'No new notifications'}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge" data-count={unreadCount}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {notifications.length > 0 && (
                            <button 
                                className="mark-all-read"
                                onClick={() => notifications
                                    .filter(n => !n.read)
                                    .forEach(n => handleMarkAsRead(n.id))
                                }
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {error ? (
                        <div className="notification-error">{error}</div>
                    ) : notifications.length === 0 ? (
                        <div className="no-notifications">
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {formatTime(notification.created_at)}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <div className="unread-indicator" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell; 