const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  markOrderAsPaid,
  cancelOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, adminOnly, buyerOnly, deliveryPersonOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Buyer Routes
router.post('/', protect, buyerOnly, createOrder); // Place Order
router.get('/myorders', protect, buyerOnly, getMyOrders); // View my orders
router.put('/cancel/:id', protect, buyerOnly, cancelOrder); // Cancel my order

// Admin Routes
router.get('/', protect, adminOnly, getAllOrders); // Admin view all orders
router.delete('/:id', protect, adminOnly, deleteOrder); // Admin delete order

// Common Routes (Admin or Buyer)
router.get('/:id', protect, getOrderById); // View Single Order

// Admin or Delivery can update status
router.put('/status/:id', protect, updateOrderStatus);

// Buyer marks order paid after card payment
router.put('/pay/:id', protect, markOrderAsPaid);

module.exports = router;
