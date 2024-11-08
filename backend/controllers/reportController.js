const db = require('../config/db');

/**
 * Generates a booking report
 */
async function generateReport(req, res) {
  const { period } = req.params;
  const userId = req.user.userId;

  try {
    let query;
    let timeFrame;

    switch (period) {
      case 'daily':
        timeFrame = "date_trunc('day', booking_date) = date_trunc('day', CURRENT_DATE)";
        break;
      case 'weekly':
        timeFrame = "booking_date >= date_trunc('week', CURRENT_DATE)";
        break;
      case 'monthly':
        timeFrame = "booking_date >= date_trunc('month', CURRENT_DATE)";
        break;
      default:
        return res.status(400).json({ message: 'Invalid report period' });
    }

    // Get booking statistics
    query = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE user_id = $1 AND ${timeFrame}
    `;
    const statsResult = await db.query(query, [userId]);

    // Get detailed bookings
    query = `
      SELECT 
        id, title, description, booking_date, status, 
        created_at, updated_at
      FROM bookings
      WHERE user_id = $1 AND ${timeFrame}
      ORDER BY booking_date DESC
    `;
    const bookingsResult = await db.query(query, [userId]);

    const report = {
      period,
      generated_at: new Date().toISOString(),
      statistics: statsResult.rows[0],
      bookings: bookingsResult.rows
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
}

module.exports = {
  generateReport
}; 