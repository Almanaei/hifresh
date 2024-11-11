const db = require('../config/db');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } = require('date-fns');

const getAnalytics = async (req, res) => {
  try {
    // Get all bookings with user information
    const bookingsQuery = `
      SELECT b.*, u.username 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
    `;
    const { rows: bookings } = await db.query(bookingsQuery);

    // Calculate basic stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const bookingsWithAttachments = bookings.filter(b => b.attachment_url).length;

    // Calculate average bookings per day
    const bookingDatesQuery = `
      SELECT DATE(booking_date) as date, COUNT(*) as count
      FROM bookings
      GROUP BY DATE(booking_date)
    `;
    const { rows: bookingDates } = await db.query(bookingDatesQuery);
    const averageBookingsPerDay = totalBookings / (bookingDates.length || 1);

    // Find most active day
    const mostActiveDayQuery = `
      SELECT DATE(booking_date) as date, COUNT(*) as count
      FROM bookings
      GROUP BY DATE(booking_date)
      ORDER BY count DESC
      LIMIT 1
    `;
    const { rows: mostActiveDay } = await db.query(mostActiveDayQuery);

    // Calculate popular times
    const popularTimesQuery = `
      SELECT EXTRACT(HOUR FROM booking_date) as hour, COUNT(*) as booking_count
      FROM bookings
      GROUP BY EXTRACT(HOUR FROM booking_date)
      ORDER BY hour
    `;
    const { rows: popularTimes } = await db.query(popularTimesQuery);

    // Calculate booking trends (last 12 months)
    const bookingTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', booking_date) as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE booking_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date)
      ORDER BY month DESC
    `;
    const { rows: bookingTrends } = await db.query(bookingTrendsQuery);

    // Calculate booking rates
    const calculateRates = async (interval, dateFormat) => {
      const query = `
        SELECT 
          DATE_TRUNC($1, booking_date) as date,
          COUNT(*) as total_bookings,
          ROUND(COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as confirmation_rate,
          ROUND(COUNT(CASE WHEN attachment_url IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as attachment_rate
        FROM bookings
        WHERE booking_date >= NOW() - $2::interval
        GROUP BY DATE_TRUNC($1, booking_date)
        ORDER BY date DESC
      `;

      const { rows } = await db.query(query, [interval, dateFormat]);
      return rows;
    };

    const [dailyRates, weeklyRates, monthlyRates] = await Promise.all([
      calculateRates('day', '7 days'),
      calculateRates('week', '4 weeks'),
      calculateRates('month', '6 months')
    ]);

    res.json({
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      bookingsWithAttachments,
      averageBookingsPerDay: Math.round(averageBookingsPerDay * 10) / 10,
      mostActiveDay: mostActiveDay[0]?.date || 'N/A',
      popularTimes: popularTimes.map(time => ({
        hour: parseInt(time.hour),
        booking_count: parseInt(time.booking_count)
      })),
      bookingTrends: bookingTrends.map(trend => ({
        month: trend.month,
        confirmed_bookings: parseInt(trend.confirmed_bookings),
        cancelled_bookings: parseInt(trend.cancelled_bookings),
        total_bookings: parseInt(trend.total_bookings)
      })),
      bookingRates: {
        daily: dailyRates,
        weekly: weeklyRates,
        monthly: monthlyRates
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
};

module.exports = {
  getAnalytics
}; 