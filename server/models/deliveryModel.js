const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  deliveryPerson: {
    type: String,
    default: 'Unassigned', // Optional default
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  deliveryDate: { type: Date },
  trackingNumber: {
    type: String,
    default: function () {
      return 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    },
  },
}, { timestamps: true });


module.exports = mongoose.model('Delivery', deliverySchema);
