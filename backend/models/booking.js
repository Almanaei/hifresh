const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  booking_date: {
    type: Date,
    required: true
  },
  visit_date: Date,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  mobile: String,
  email: String,
  attachment_url: String,
  attachment_name: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
bookingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 