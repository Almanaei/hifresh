const db = require('../config/db');

async function getAnalytics(req, res) {
  try {
    // Get booking trends
    const bookingTrends = await db.query(`
      SELECT 
        DATE_TRUNC('month', booking_date) as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      GROUP BY DATE_TRUNC('month', booking_date)
      ORDER BY month DESC
      LIMIT 12
    `);

    // Get user activity
    const userActivity = await db.query(`
      SELECT 
        u.username,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        MAX(b.created_at) as last_activity
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id, u.username
      ORDER BY total_bookings DESC
      LIMIT 10
    `);

    // Get popular booking times
    const popularTimes = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM booking_date) as hour,
        COUNT(*) as booking_count
      FROM bookings
      GROUP BY EXTRACT(HOUR FROM booking_date)
      ORDER BY booking_count DESC
    `);

    // Get attachment statistics
    const attachmentStats = await db.query(`
      SELECT 
        COUNT(CASE WHEN attachment_url IS NOT NULL THEN 1 END) as bookings_with_attachments,
        COUNT(*) as total_bookings
      FROM bookings
    `);

    // Get daily booking distribution
    const dailyDistribution = await db.query(`
      SELECT 
        EXTRACT(DOW FROM booking_date) as day_of_week,
        COUNT(*) as booking_count
      FROM bookings
      GROUP BY EXTRACT(DOW FROM booking_date)
      ORDER BY day_of_week
    `);

    // Get booking status trends over time
    const statusTrends = await db.query(`
      SELECT 
        DATE_TRUNC('week', booking_date) as week,
        status,
        COUNT(*) as count
      FROM bookings
      GROUP BY DATE_TRUNC('week', booking_date), status
      ORDER BY week DESC
      LIMIT 52
    `);

    // Get average bookings per user
    const userStats = await db.query(`
      SELECT 
        ROUND(AVG(booking_count)::numeric, 2) as avg_bookings_per_user,
        MAX(booking_count) as max_bookings_per_user,
        MIN(booking_count) as min_bookings_per_user
      FROM (
        SELECT user_id, COUNT(*) as booking_count
        FROM bookings
        GROUP BY user_id
      ) as user_counts
    `);

    // Get attachment type distribution
    const attachmentTypes = await db.query(`
      SELECT 
        COALESCE(
          CASE 
            WHEN attachment_name ~ '\\.(jpg|jpeg|png|gif)$' THEN 'image'
            WHEN attachment_name ~ '\\.pdf$' THEN 'pdf'
            WHEN attachment_name ~ '\\.(doc|docx)$' THEN 'document'
            ELSE 'other'
          END,
          'none'
        ) as file_type,
        COUNT(*) as count
      FROM bookings
      GROUP BY file_type
      ORDER BY count DESC
    `);

    // Get booking creation time patterns
    const creationPatterns = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM bookings
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `);

    // Get booking duration statistics
    const durationStats = await db.query(`
      SELECT 
        status,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_duration_hours
      FROM bookings
      WHERE status IN ('confirmed', 'cancelled')
      GROUP BY status
    `);

    // Get daily booking rates for the last 30 days
    const dailyRates = await db.query(`
      SELECT 
        DATE_TRUNC('day', booking_date) as date,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', booking_date)
      ORDER BY date ASC
    `);

    // Get weekly booking rates for the last 12 weeks
    const weeklyRates = await db.query(`
      SELECT 
        DATE_TRUNC('week', booking_date) as week,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE booking_date >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', booking_date)
      ORDER BY week ASC
    `);

    // Get monthly booking rates for the last 12 months
    const monthlyRates = await db.query(`
      SELECT 
        DATE_TRUNC('month', booking_date) as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE booking_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date)
      ORDER BY month ASC
    `);

    // Calculate success rates
    const calculateRates = (data) => {
      return data.map(row => ({
        ...row,
        success_rate: row.total_bookings > 0 
          ? Math.round((row.confirmed_bookings / row.total_bookings) * 100) 
          : 0,
        cancellation_rate: row.total_bookings > 0 
          ? Math.round((row.cancelled_bookings / row.total_bookings) * 100) 
          : 0
      }));
    };

    res.json({
      bookingTrends: bookingTrends.rows,
      userActivity: userActivity.rows,
      popularTimes: popularTimes.rows,
      attachmentStats: attachmentStats.rows[0],
      dailyDistribution: dailyDistribution.rows,
      statusTrends: statusTrends.rows,
      userStats: userStats.rows[0],
      attachmentTypes: attachmentTypes.rows,
      creationPatterns: creationPatterns.rows,
      durationStats: durationStats.rows,
      bookingRates: {
        daily: calculateRates(dailyRates.rows),
        weekly: calculateRates(weeklyRates.rows),
        monthly: calculateRates(monthlyRates.rows)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
}

module.exports = {
  getAnalytics
}; 