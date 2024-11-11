import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import './ReportPage.css';

function ReportPage() {
  const { isDarkMode } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('daily');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.generateReport(period);
      setReports(response);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = async (format) => {
    try {
      const response = await api.exportReport(period, format);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${period}-${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`report-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>Reports & Analytics</h2>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="report-actions">
        <button 
          className={`report-button ${period === 'daily' ? 'active' : ''}`}
          onClick={() => setPeriod('daily')}
        >
          Daily Report
        </button>
        <button 
          className={`report-button ${period === 'weekly' ? 'active' : ''}`}
          onClick={() => setPeriod('weekly')}
        >
          Weekly Report
        </button>
        <button 
          className={`report-button ${period === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          Monthly Report
        </button>
      </div>

      <div className="report-content">
        <div className="report-header">
          <h3>{period.charAt(0).toUpperCase() + period.slice(1)} Report</h3>
          <div className="export-buttons">
            <button 
              onClick={() => handleExport('pdf')}
              className="export-button pdf"
            >
              <span className="button-icon">📄</span>
              Export PDF
            </button>
            <button 
              onClick={() => handleExport('csv')}
              className="export-button csv"
            >
              <span className="button-icon">📊</span>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating report...</p>
          </div>
        ) : (
          <>
            <div className="statistics-grid">
              <div className="stat-card">
                <h4>Total Bookings</h4>
                <p>{reports.totalBookings || 0}</p>
              </div>
              <div className="stat-card">
                <h4>Confirmed</h4>
                <p>{reports.confirmedBookings || 0}</p>
              </div>
              <div className="stat-card">
                <h4>Cancelled</h4>
                <p>{reports.cancelledBookings || 0}</p>
              </div>
              <div className="stat-card">
                <h4>Revenue</h4>
                <p>${reports.totalRevenue || 0}</p>
              </div>
            </div>

            <div className="report-details">
              <h4>Booking Details</h4>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bookings</th>
                    <th>Confirmed</th>
                    <th>Cancelled</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.details?.map((detail, index) => (
                    <tr key={index}>
                      <td>{formatDate(detail.date)}</td>
                      <td>{detail.bookings}</td>
                      <td>
                        <span className="status confirmed">
                          {detail.confirmed}
                        </span>
                      </td>
                      <td>
                        <span className="status cancelled">
                          {detail.cancelled}
                        </span>
                      </td>
                      <td>${detail.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportPage; 