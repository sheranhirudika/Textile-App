const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Rejected'],
    default: 'Requested',
  }
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
