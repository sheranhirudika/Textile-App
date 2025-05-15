const express = require('express');
const {
  createRefund,
  getRefunds,
  getRefundById,
  updateRefund,
  deleteRefund,
} = require('../controllers/refundController');
const { protect, adminOnly, buyerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Buyer can create refund
router.post('/', protect, buyerOnly, createRefund);
router.get('/get', protect, buyerOnly, getRefunds); 

// Admin Routes
router.get('/', protect, adminOnly, getRefunds);        // View all refunds
router.get('/:id', protect, adminOnly, getRefundById);   // View single refund
router.put('/:id', protect, adminOnly, updateRefund);    // Update refund status
router.delete('/:id', protect, adminOnly, deleteRefund); // Delete refund

module.exports = router;
