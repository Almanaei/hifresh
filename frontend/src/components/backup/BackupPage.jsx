import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import Pagination from '../common/Pagination';
import './BackupPage.css';

function BackupPage() {
  const { isDarkMode } = useTheme();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getBackups();
      setBackups(response.backups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async (period) => {
    setCreating(true);
    setError('');
    
    try {
      await api.createBackup(period);
      await fetchBackups();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBackups = backups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(backups.length / itemsPerPage);

  if (loading) return (
    <div className={`backup-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading backups...</p>
      </div>
    </div>
  );

  return (
    <div className={`backup-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>Backup Management</h2>
      
      <div className="backup-actions">
        <button 
          onClick={() => handleCreateBackup('weekly')}
          disabled={creating}
          className="backup-button"
        >
          <span className="button-icon">📅</span>
          Create Weekly Backup
        </button>
        <button 
          onClick={() => handleCreateBackup('monthly')}
          disabled={creating}
          className="backup-button"
        >
          <span className="button-icon">📆</span>
          Create Monthly Backup
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {creating && (
        <div className="creating-message">
          <div className="loading-spinner"></div>
          Creating backup...
        </div>
      )}

      <div className="backup-list">
        <h3>Available Backups</h3>
        {backups.length === 0 ? (
          <div className="empty-state">
            <p>No backups available</p>
            <p>Create your first backup using the buttons above</p>
          </div>
        ) : (
          <>
            <div className="pagination-info">
              Showing {currentBackups.length} of {backups.length} backups
            </div>
            <div className="table-container">
              <table className="backup-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Created At</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBackups.map((backup) => (
                    <tr key={backup.fileName}>
                      <td>{backup.fileName}</td>
                      <td>
                        <span className={`backup-type ${backup.type}`}>
                          {backup.type}
                        </span>
                      </td>
                      <td>{formatDate(backup.createdAt)}</td>
                      <td>{formatSize(backup.size)}</td>
                      <td>
                        <button className="download-button">
                          <span className="button-icon">💾</span>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BackupPage; 