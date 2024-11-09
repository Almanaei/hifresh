import React, { useState } from 'react';
import api from '../../services/api';
import './ReportPage.css';

function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleGenerateReport = async (period) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.generateReport(period);
      setReport(response);
      setSelectedPeriod(period);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExport = (format) => {
    if (!report) return;

    const exportData = {
      reportType: `${selectedPeriod} Report`,
      generatedAt: report.generated_at,
      statistics: report.statistics,
      bookings: report.bookings
    };

    let content;
    let filename;
    let type;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      filename = `report-${selectedPeriod}-${new Date().toISOString()}.json`;
      type = 'application/json';
    } else if (format === 'csv') {
      // Create CSV content
      const headers = ['Title', 'Date', 'Status', 'Created At'];
      const rows = report.bookings.map(booking => [
        booking.title,
        formatDate(booking.booking_date),
        booking.status,
        formatDate(booking.created_at)
      ]);
      
      content = [
        `${selectedPeriod.toUpperCase()} REPORT`,
        `Generated at: ${formatDate(report.generated_at)}`,
        '',
        'STATISTICS',
        `Total Bookings: ${report.statistics.total_bookings}`,
        `Pending Bookings: ${report.statistics.pending_bookings}`,
        `Confirmed Bookings: ${report.statistics.confirmed_bookings}`,
        `Cancelled Bookings: ${report.statistics.cancelled_bookings}`,
        '',
        'BOOKINGS',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      filename = `report-${selectedPeriod}-${new Date().toISOString()}.csv`;
      type = 'text/csv';
    }

    // Create and trigger download
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="report-page">
      <h2>Booking Reports</h2>

      <div className="report-actions">
        <button 
          onClick={() => handleGenerateReport('daily')}
          className={`report-button ${selectedPeriod === 'daily' ? 'active' : ''}`}
          disabled={loading}
        >
          Daily Report
        </button>
        <button 
          onClick={() => handleGenerateReport('weekly')}
          className={`report-button ${selectedPeriod === 'weekly' ? 'active' : ''}`}
          disabled={loading}
        >
          Weekly Report
        </button>
        <button 
          onClick={() => handleGenerateReport('monthly')}
          className={`report-button ${selectedPeriod === 'monthly' ? 'active' : ''}`}
          disabled={loading}
        >
          Monthly Report
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p>Generating report...</p>}

      {report && (
        <div className="report-content">
          <div className="report-header">
            <h3>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report</h3>
            <p>Generated at: {formatDate(report.generated_at)}</p>
            <div className="export-buttons">
              <button onClick={() => handleExport('csv')} className="export-button">
                Export as CSV
              </button>
              <button onClick={() => handleExport('json')} className="export-button">
                Export as JSON
              </button>
            </div>
          </div>

          <div className="statistics-grid">
            <div className="stat-card">
              <h4>Total Bookings</h4>
              <p>{report.statistics.total_bookings}</p>
            </div>
            <div className="stat-card">
              <h4>Pending</h4>
              <p>{report.statistics.pending_bookings}</p>
            </div>
            <div className="stat-card">
              <h4>Confirmed</h4>
              <p>{report.statistics.confirmed_bookings}</p>
            </div>
            <div className="stat-card">
              <h4>Cancelled</h4>
              <p>{report.statistics.cancelled_bookings}</p>
            </div>
          </div>

          <div className="report-details">
            <h4>Booking Details</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {report.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.title}</td>
                    <td>{formatDate(booking.booking_date)}</td>
                    <td>
                      <span className={`status status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{formatDate(booking.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportPage; 