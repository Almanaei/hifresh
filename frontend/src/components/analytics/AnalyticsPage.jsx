import React, { useState, useEffect } from 'react';
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
      month: 'short'
    });
  };

  const formatRateDate = (dateString, view) => {
    const date = new Date(dateString);
    switch (view) {
      case 'daily':
        return date.toLocaleDateString();
      case 'weekly':
        return `Week of ${date.toLocaleDateString()}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
          label: 'Success Rate (%)',
          data: rates.map(rate => rate.success_rate),
          backgroundColor: 'rgba(40, 167, 69, 0.6)',
          yAxisID: 'y2',
        },
        {
          label: 'Cancellation Rate (%)',
          data: rates.map(rate => rate.cancellation_rate),
          backgroundColor: 'rgba(220, 53, 69, 0.6)',
          yAxisID: 'y2',
        }
      ]
    };
  };

  const rateChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${rateView.charAt(0).toUpperCase() + rateView.slice(1)} Booking Rates`
      }
    },
    scales: {
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Rate (%)'
        },
        grid: {
          drawOnChartArea: false
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 20,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Monthly Booking Trends',
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          min: 0
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!analytics) return null;

  return (
    <div className="analytics-page">
      <h2>Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Total Bookings</h3>
          <p className="summary-value">{analytics.attachmentStats.total_bookings}</p>
        </div>
        <div className="summary-card">
          <h3>Active Users</h3>
          <p className="summary-value">{analytics.userActivity.length}</p>
        </div>
        <div className="summary-card">
          <h3>Attachments Used</h3>
          <p className="summary-value">
            {Math.round((analytics.attachmentStats.bookings_with_attachments / 
                       analytics.attachmentStats.total_bookings) * 100)}%
          </p>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="analytics-card">
        <h3>Monthly Booking Trends</h3>
        <div style={{ height: '300px', padding: '20px 0' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* User Activity Table */}
      <div className="analytics-card">
        <h3>Top Active Users</h3>
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Total Bookings</th>
                <th>Confirmed</th>
                <th>Cancelled</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {analytics.userActivity.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.total_bookings}</td>
                  <td>{user.confirmed_bookings}</td>
                  <td>{user.cancelled_bookings}</td>
                  <td>{new Date(user.last_activity).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popular Hours Chart */}
      <div className="analytics-card">
        <h3>Popular Booking Hours</h3>
        <div className="hours-chart">
          {analytics.popularTimes.map(time => (
            <div key={time.hour} className="hour-bar">
              <div 
                className="bar"
                style={{ 
                  height: `${(time.booking_count / Math.max(...analytics.popularTimes.map(t => t.booking_count))) * 100}%` 
                }}
              />
              <div className="hour-label">{time.hour}:00</div>
            </div>
          ))}
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
        <div style={{ height: '400px', padding: '20px 0' }}>
          {analytics?.bookingRates && (
            <Bar 
              data={getRateChartData()} 
              options={rateChartOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage; 