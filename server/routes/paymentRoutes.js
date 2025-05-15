const express = require('express');
const { createPaymentIntent } = require('../controllers/paymentController');
const { protect, buyerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Buyer can create payment intent
router.post('/create-payment-intent', protect, buyerOnly, createPaymentIntent);

module.exports = router;
