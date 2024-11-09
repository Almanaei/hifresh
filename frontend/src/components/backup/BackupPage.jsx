import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../common/Pagination';
import './BackupPage.css';

function BackupPage() {
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

  if (loading) return <div>Loading backups...</div>;

  return (
    <div className="backup-page">
      <h2>Backup Management</h2>
      
      <div className="backup-actions">
        <button 
          onClick={() => handleCreateBackup('weekly')}
          disabled={creating}
        >
          Create Weekly Backup
        </button>
        <button 
          onClick={() => handleCreateBackup('monthly')}
          disabled={creating}
        >
          Create Monthly Backup
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {creating && <p>Creating backup...</p>}

      <div className="backup-list">
        <h3>Available Backups</h3>
        {backups.length === 0 ? (
          <p>No backups available</p>
        ) : (
          <>
            <div className="pagination-info">
              Showing {currentBackups.length} of {backups.length} backups
            </div>
            <table className="backup-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Created At</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {currentBackups.map((backup) => (
                  <tr key={backup.fileName}>
                    <td>{backup.fileName}</td>
                    <td>{backup.type}</td>
                    <td>{formatDate(backup.createdAt)}</td>
                    <td>{formatSize(backup.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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