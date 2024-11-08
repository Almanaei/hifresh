const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateCertificate(req, res) {
  const { bookingId } = req.params;
  const { template = 'default' } = req.body;

  try {
    // Get booking details
    const bookingResult = await db.query(`
      SELECT b.*, u.username, u.email 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set up PDF file path
    const fileName = `certificate-${certificateNumber}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add certificate content
    doc
      .font('Helvetica-Bold')
      .fontSize(30)
      .text('CERTIFICATE', { align: 'center' })
      .moveDown()
      .fontSize(15)
      .text('This is to certify that', { align: 'center' })
      .moveDown()
      .fontSize(25)
      .text(booking.title, { align: 'center' })
      .moveDown()
      .fontSize(15)
      .text(`Certificate Number: ${certificateNumber}`, { align: 'center' })
      .moveDown()
      .text(`Issue Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown()
      .text(`Booking Date: ${new Date(booking.booking_date).toLocaleDateString()}`, { align: 'center' })
      .moveDown()
      .text(`Client: ${booking.username}`, { align: 'center' });

    // Add border
    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .stroke();

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Save certificate record in database
    const result = await db.query(`
      INSERT INTO certificates 
        (booking_id, certificate_number, template_used, pdf_url)
      VALUES 
        ($1, $2, $3, $4)
      RETURNING *
    `, [bookingId, certificateNumber, template, `/uploads/${fileName}`]);

    res.json({
      message: 'Certificate generated successfully',
      certificate: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}

async function getCertificates(req, res) {
  try {
    const result = await db.query(`
      SELECT c.*, b.title as booking_title, u.username
      FROM certificates c
      JOIN bookings b ON c.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      ORDER BY c.created_at DESC
    `);

    res.json({ certificates: result.rows });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
}

module.exports = {
  generateCertificate,
  getCertificates
}; 