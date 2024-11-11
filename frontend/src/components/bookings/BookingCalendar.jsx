import React, { useState, useEffect } from 'react';
import './BookingCalendar.css';

function BookingCalendar({ bookings }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Get calendar days for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get days from previous month to fill first week
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Add previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add next month days to complete last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    setCalendarDays(days);
  }, [currentDate]);

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>&lt;</button>
        <h3>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayBookings = getBookingsForDate(day.date);
          const isSelected = selectedDate && 
            selectedDate.getDate() === day.date.getDate() &&
            selectedDate.getMonth() === day.date.getMonth();

          return (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} 
                         ${isSelected ? 'selected' : ''} 
                         ${dayBookings.length > 0 ? 'has-bookings' : ''}`}
              onClick={() => handleDateClick(day.date)}
            >
              <span className="day-number">{day.date.getDate()}</span>
              {dayBookings.length > 0 && (
                <div className="booking-indicators">
                  {dayBookings.map((booking, i) => (
                    <div 
                      key={i} 
                      className={`booking-dot status-${booking.status}`}
                      title={booking.title}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date bookings */}
      {selectedDate && (
        <div className="selected-date-bookings">
          <h4>
            Bookings for {selectedDate.toLocaleDateString()}
          </h4>
          <div className="bookings-list">
            {getBookingsForDate(selectedDate).map((booking, index) => (
              <div key={index} className={`booking-item status-${booking.status}`}>
                <span className="booking-time">
                  {new Date(booking.booking_date).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className="booking-title">{booking.title}</span>
                <span className={`booking-status status-${booking.status}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingCalendar; 