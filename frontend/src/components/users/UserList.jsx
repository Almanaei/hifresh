import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../common/Pagination';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.getUsers(currentPage);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEditChange = (e) => {
    setEditingUser({
      ...editingUser,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetPassword = async (id) => {
    if (window.confirm('Are you sure you want to reset this user\'s password?')) {
      try {
        const response = await api.resetUserPassword(id);
        setResetPasswordResult({
          userId: id,
          newPassword: response.newPassword
        });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const clearResetPasswordResult = () => {
    setResetPasswordResult(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-list">
      <h2>User Management</h2>

      <div className="user-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <>
          {pagination && (
            <>
              <div className="pagination-info">
                Showing {users.length} of {pagination.totalItems} users
              </div>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    {editingUser && editingUser.id === user.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="username"
                            value={editingUser.username}
                            onChange={handleEditChange}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            name="email"
                            value={editingUser.email || ''}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.updated_at)}</td>
                        <td>
                          <button onClick={handleUpdate}>Save</button>
                          <button 
                            onClick={() => setEditingUser(null)}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.username}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.updated_at)}</td>
                        <td>
                          <button 
                            onClick={() => handleEdit(user)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="reset-button"
                          >
                            Reset Password
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {resetPasswordResult && (
        <div className="modal-overlay" onClick={clearResetPasswordResult}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Password Reset Successful</h2>
              <button className="close-button" onClick={clearResetPasswordResult}>&times;</button>
            </div>
            <div className="modal-body">
              <p>The new password for the user is:</p>
              <div className="password-display">
                <code>{resetPasswordResult.newPassword}</code>
              </div>
              <p className="warning-text">
                Please make sure to copy this password and send it to the user securely.
                This password will not be shown again.
              </p>
            </div>
            <div className="button-group">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(resetPasswordResult.newPassword);
                  alert('Password copied to clipboard!');
                }}
                className="copy-button"
              >
                Copy Password
              </button>
              <button 
                onClick={clearResetPasswordResult}
                className="close-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList; 