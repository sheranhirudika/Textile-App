const Refund = require('../models/refundModel');
const Order = require('../models/orderModel');

// Create Refund Request (Buyer)
exports.createRefund = async (req, res) => {
  const { orderId, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const refund = await Refund.create({
    order: orderId,
    user: req.user._id,
    reason,
  });

  res.status(201).json({ message: 'Refund request created successfully', data: refund });
};

// Get All Refunds (Admin Only)
exports.getRefunds = async (req, res) => {
  const refunds = await Refund.find().populate('order').populate('user', 'name email');
  res.json({ message: 'Refunds fetched successfully', data: refunds });
};

// Get Single Refund by ID (Admin Only)
exports.getRefundById = async (req, res) => {
  const refund = await Refund.findById(req.params.id).populate('order').populate('user', 'name email');
  if (refund) {
    res.json({ message: 'Refund fetched successfully', data: refund });
  } else {
    res.status(404).json({ message: 'Refund not found' });
  }
};

// Update Refund Status (Admin Only)
exports.updateRefund = async (req, res) => {
  const refund = await Refund.findById(req.params.id);

  if (refund) {
    refund.status = req.body.status || refund.status;
    const updatedRefund = await refund.save();
    res.json({ message: 'Refund status updated successfully', data: updatedRefund });
  } else {
    res.status(404).json({ message: 'Refund not found' });
  }
};

// Delete Refund (Admin Only)
exports.deleteRefund = async (req, res) => {
  const refund = await Refund.findByIdAndDelete(req.params.id);
  if (refund) {
    res.json({ message: 'Refund deleted successfully' });
  } else {
    res.status(404).json({ message: 'Refund not found' });
  }
};
