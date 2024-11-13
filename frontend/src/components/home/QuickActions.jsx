import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickActions.css';

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="quick-actions-grid">
        <button 
          className="action-card booking"
          onClick={() => navigate('/bookings/new')}
        >
          <div className="icon">📅</div>
          <div className="content">
            <h3>Create Booking</h3>
            <p>Schedule a new booking or appointment</p>
          </div>
        </button>

        <button 
          className="action-card certificate"
          onClick={() => navigate('/certificates')}
        >
          <div className="icon">📜</div>
          <div className="content">
            <h3>Generate Certificate</h3>
            <p>Create a new certificate for booking</p>
          </div>
        </button>

        <button 
          className="action-card task"
          onClick={() => navigate('/tasks')}
        >
          <div className="icon">✓</div>
          <div className="content">
            <h3>Add Task</h3>
            <p>Create a new task or assignment</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default QuickActions; 