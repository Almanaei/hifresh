import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import './UserList.css';

function UserList() {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      });
      setEditingUser(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.deleteUser(userId);
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className={`users-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="users-list">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                {editingUser && editingUser.id === user.id ? (
                  // Edit mode
                  <>
                    <td>
                      <input
                        type="text"
                        name="username"
                        value={editingUser.username}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        name="email"
                        value={editingUser.email}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <select
                        name="role"
                        value={editingUser.role}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name="status"
                        value={editingUser.status}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>{formatLastActive(user.last_active)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={handleUpdate}
                          className="save-button"
                        >
                          <span className="button-icon">💾</span>
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingUser(null)}
                          className="cancel-button"
                        >
                          <span className="button-icon">❌</span>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <span className="last-active">
                        {formatLastActive(user.last_active)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="edit-button"
                        >
                          <span className="button-icon">✏️</span>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="delete-button"
                        >
                          <span className="button-icon">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserList;