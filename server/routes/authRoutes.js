const express = require('express');
const { registerUser, loginUser, forgotPassword, verifyResetToken, resetPassword } = require('../controllers/authController');

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token/verify', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
