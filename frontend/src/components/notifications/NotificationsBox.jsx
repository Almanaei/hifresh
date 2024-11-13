import React from 'react';
import './NotificationsBox.css';

function NotificationsBox({ notifications, onClear }) {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Return empty string if date is invalid
    
    return date.toLocaleString(); // Format date using locale settings
  };

  return (
    <div className="notifications-box">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <button onClick={onClear} className="clear-button">
          Clear All
        </button>
      </div>
      
      <div className="notifications-list">
        {notifications.map((notification, index) => (
          <div key={index} className="notification-item">
            <div className="notification-content">
              <p>{notification.message}</p>
              {notification.date && (
                <small className="notification-date">
                  {formatDate(notification.date)}
                </small>
              )}
            </div>
            <div className="notification-status">
              {!notification.read && <span className="unread-dot" />}
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="no-notifications">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsBox; 