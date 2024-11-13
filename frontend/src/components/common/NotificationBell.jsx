import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import './NotificationBell.css';
import { useTheme } from '../../context/ThemeContext';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState(null);
    const { isDarkMode } = useTheme();
    const wsRef = useRef(null);

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

    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            setNotifications(prev => [notification, ...prev]);
            
            // Show browser notification
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/path/to/icon.png'
                });
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            // Attempt to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Connect to WebSocket
        connectWebSocket();

        // Fetch existing notifications
        fetchNotifications();

        // Set up polling interval
        const interval = setInterval(fetchNotifications, 60000);

        // Cleanup function
        return () => {
            clearInterval(interval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket, fetchNotifications]);

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

    const handleClearAll = async () => {
        try {
            await api.clearNotifications();
            // Clear all notifications from state
            setNotifications([]);
            // Close dropdown after clearing
            setShowDropdown(false);
        } catch (error) {
            console.error('Error clearing notifications:', error);
            setError('Failed to clear notifications');
        }
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
                        <div className="notification-actions">
                            {notifications.length > 0 && (
                                <button 
                                    className="clear-all-button"
                                    onClick={handleClearAll}
                                    title="Clear all notifications"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
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