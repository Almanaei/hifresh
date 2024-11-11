import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import './AnalyticsPage.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsPage() {
  const { isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rateView, setRateView] = useState('daily');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.getAnalytics();
      setAnalytics(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRateDate = (dateString, view) => {
    const date = new Date(dateString);
    switch (view) {
      case 'daily':
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      case 'weekly':
        return `Week of ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      default:
        return dateString;
    }
  };

  const getRateChartData = () => {
    if (!analytics?.bookingRates) return null;

    const rates = analytics.bookingRates[rateView];
    return {
      labels: rates.map(rate => formatRateDate(rate.date || rate.week || rate.month, rateView)),
      datasets: [
        {
          label: 'Total Bookings',
          data: rates.map(rate => rate.total_bookings),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          type: 'line',
          yAxisID: 'y1',
        },
        {
          label: 'Confirmation Rate (%)',
          data: rates.map(rate => rate.confirmation_rate),
          backgroundColor: 'rgba(40, 167, 69, 0.6)',
          yAxisID: 'y2',
        },
        {
          label: 'Attachment Usage (%)',
          data: rates.map(rate => rate.attachment_rate),
          backgroundColor: 'rgba(255, 193, 7, 0.6)',
          yAxisID: 'y2',
        }
      ]
    };
  };

  // Move chartOptions definition here, before it's used
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 20,
          padding: 20,
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        }
      },
      title: {
        display: true,
        text: 'Monthly Booking Trends',
        padding: {
          top: 10,
          bottom: 20
        },
        color: isDarkMode ? '#e5e7eb' : '#1f2937'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#2d2d2d' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: isDarkMode ? '#e5e7eb' : '#1f2937',
        borderColor: isDarkMode ? '#404040' : '#e5e7eb',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          min: 0,
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        },
        grid: {
          color: isDarkMode ? '#404040' : '#e5e7eb'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const rateChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Bookings',
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        },
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        },
        grid: {
          color: isDarkMode ? '#404040' : '#e5e7eb'
        }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Rate (%)',
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        },
        min: 0,
        max: 100
      }
    }
  };

  // Prepare chart data
  const chartData = {
    labels: analytics?.bookingTrends.map(trend => formatDate(trend.month)).reverse(),
    datasets: [
      {
        label: 'Confirmed Bookings',
        data: analytics?.bookingTrends.map(trend => trend.confirmed_bookings || 0).reverse(),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Pending Bookings',
        data: analytics?.bookingTrends.map(trend => 
          (trend.total_bookings - (trend.confirmed_bookings || 0) - (trend.cancelled_bookings || 0)) || 0
        ).reverse(),
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Cancelled Bookings',
        data: analytics?.bookingTrends.map(trend => trend.cancelled_bookings || 0).reverse(),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        tension: 0.4,
      }
    ]
  };

  const getTimeLabel = (hour) => {
    const formattedHour = new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
    const nextHour = new Date(2000, 0, 1, hour + 1).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
    return `${formattedHour} - ${nextHour}`;
  };

  const getBarColor = (count, maxCount) => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 75) return 'linear-gradient(180deg, #00C853 0%, #43A047 100%)';
    if (percentage >= 50) return 'linear-gradient(180deg, #2196F3 0%, #1976D2 100%)';
    return 'linear-gradient(180deg, #90CAF9 0%, #64B5F6 100%)';
  };

  // Update the summary cards to show real metrics
  const getSummaryData = () => {
    if (!analytics) return {};

    const totalBookings = analytics.totalBookings || 0;
    const confirmedBookings = analytics.confirmedBookings || 0;
    const pendingBookings = analytics.pendingBookings || 0;
    const cancelledBookings = analytics.cancelledBookings || 0;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      confirmationRate: totalBookings ? 
        Math.round((confirmedBookings / totalBookings) * 100) : 0,
      attachmentRate: totalBookings ? 
        Math.round((analytics.bookingsWithAttachments / totalBookings) * 100) : 0
    };
  };

  if (loading) return (
    <div className={`analytics-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`analytics-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className={`analytics-page ${isDarkMode ? 'dark-theme' : ''}`}>
      <h2>Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Total Bookings</h3>
          <p className="summary-value">{getSummaryData().totalBookings}</p>
        </div>
        <div className="summary-card">
          <h3>Confirmed Bookings</h3>
          <p className="summary-value">{getSummaryData().confirmedBookings}</p>
        </div>
        <div className="summary-card">
          <h3>Confirmation Rate</h3>
          <p className="summary-value">{getSummaryData().confirmationRate}%</p>
        </div>
        <div className="summary-card">
          <h3>Attachments Used</h3>
          <p className="summary-value">{getSummaryData().attachmentRate}%</p>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="analytics-card">
        <h3>Booking Status Distribution</h3>
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Booking Rates Section */}
      <div className="analytics-card">
        <div className="rate-controls">
          <button 
            className={`rate-button ${rateView === 'daily' ? 'active' : ''}`}
            onClick={() => setRateView('daily')}
          >
            Daily
          </button>
          <button 
            className={`rate-button ${rateView === 'weekly' ? 'active' : ''}`}
            onClick={() => setRateView('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`rate-button ${rateView === 'monthly' ? 'active' : ''}`}
            onClick={() => setRateView('monthly')}
          >
            Monthly
          </button>
        </div>
        <div className="chart-container">
          <Bar data={getRateChartData()} options={rateChartOptions} />
        </div>
      </div>

      {/* Popular Hours Chart */}
      <div className="analytics-card">
        <h3>Popular Booking Hours</h3>
        <div className="hours-chart-container">
          {/* Y-axis labels */}
          <div className="chart-y-axis">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Main chart area */}
          <div className="hours-chart">
            {/* Reference lines */}
            <div className="comparison-line peak" title="100% (Peak Traffic)"></div>
            <div className="comparison-line high" title="75% of Peak Traffic"></div>
            <div className="comparison-line medium" title="50% of Peak Traffic"></div>
            <div className="comparison-line low" title="25% of Peak Traffic"></div>

            {/* Hour bars */}
            {analytics?.popularTimes?.map(time => {
              const maxCount = Math.max(...analytics.popularTimes.map(t => t.booking_count));
              const percentage = (time.booking_count / maxCount) * 100;

              return (
                <div key={time.hour} className="hour-bar-wrapper">
                  <div className="hour-count">
                    {time.booking_count}
                  </div>
                  <div 
                    className="hour-bar"
                    style={{ 
                      height: `${percentage}%`,
                      background: getBarColor(time.booking_count, maxCount)
                    }}
                  >
                    <div className="hour-tooltip">
                      <div className="tooltip-header">
                        {getTimeLabel(time.hour)}
                      </div>
                      <div className="tooltip-content">
                        <strong>{time.booking_count}</strong> bookings
                        <div className="tooltip-percentage">
                          {percentage.toFixed(1)}% of peak
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hour-label">
                    <span className="hour-time">{getTimeLabel(time.hour)}</span>
                    <span className="hour-percentage">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="hours-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ 
                background: 'linear-gradient(180deg, #00C853 0%, #43A047 100%)' 
              }}></span>
              <div className="legend-info">
                <span className="legend-title">Peak Hours</span>
                <span className="legend-subtitle">75-100% utilization</span>
              </div>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ 
                background: 'linear-gradient(180deg, #2196F3 0%, #1976D2 100%)' 
              }}></span>
              <div className="legend-info">
                <span className="legend-title">Regular Hours</span>
                <span className="legend-subtitle">50-74% utilization</span>
              </div>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ 
                background: 'linear-gradient(180deg, #90CAF9 0%, #64B5F6 100%)' 
              }}></span>
              <div className="legend-info">
                <span className="legend-title">Off-Peak Hours</span>
                <span className="legend-subtitle">0-49% utilization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="analytics-card">
        <h3>Booking Statistics</h3>
        <div className="statistics-grid">
          <div className="stat-card">
            <h4>Pending Bookings</h4>
            <p>{getSummaryData().pendingBookings}</p>
          </div>
          <div className="stat-card">
            <h4>Cancelled Bookings</h4>
            <p>{getSummaryData().cancelledBookings}</p>
          </div>
          <div className="stat-card">
            <h4>Average Bookings/Day</h4>
            <p>{analytics?.averageBookingsPerDay?.toFixed(1) || 0}</p>
          </div>
          <div className="stat-card">
            <h4>Most Active Day</h4>
            <p>{analytics?.mostActiveDay ? formatDate(analytics.mostActiveDay) : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage; 