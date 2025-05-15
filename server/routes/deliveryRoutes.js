const express = require('express');
const {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery,
} = require('../controllers/deliveryController');
const { protect, adminOnly, deliveryPersonOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Delivery Person or Admin
router.post('/', protect, deliveryPersonOnly, createDelivery); // Create delivery
router.get('/', protect, deliveryPersonOnly, getDeliveries);  
router.get('/admin', protect,adminOnly, getDeliveries); // View all deliveries
router.get('/:id', protect, deliveryPersonOnly, getDeliveryById); // View single delivery
router.put('/:id', protect, deliveryPersonOnly, updateDelivery);  // Update delivery
router.put('/admin/:id', protect, adminOnly, updateDelivery);
// Admin Only
router.delete('/:id', protect, adminOnly, deleteDelivery); // Delete delivery

module.exports = router;
