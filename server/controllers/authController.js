const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register User (Public - Buyer or Delivery can register)
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!['buyer', 'delivery'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role for registration' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({
    message: 'User registered successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    }
  });
};

// Login User (Buyer, Delivery, Admin)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// Forgot Password - Send Reset Email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.log('Password reset requested for email:', email);
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    // Always return success even if user doesn't exist (for security)
    if (!user) {
      console.log('User not found, returning generic success message');
      return res.status(200).json({ 
        message: 'Password reset link sent to email if account exists' 
      });
    }

    console.log('User found, generating reset token');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('Plain reset token (for logging only):', resetToken);
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    console.log('Hashed token for database:', hashedToken);
    
    // Set reset token and expiration
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save();
    console.log('User saved with reset token and expiration');

    // Create reset URL - use the NON-HASHED token in the URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    console.log('Reset URL created:', resetUrl);

    // Email config
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUsername = process.env.EMAIL_USERNAME;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    
    console.log('Email config:', { emailService, emailUsername, emailFrom });
    
    if (!emailUsername || !emailPassword) {
      console.log('Email credentials not configured! Token has been saved but email not sent.');
      // Log token for development purposes only - REMOVE IN PRODUCTION
      console.log('Development mode: Reset link is:', resetUrl);
      
      return res.status(200).json({ 
        message: 'Password reset link generated (email would be sent in production)'
        // For development only, returning the token - REMOVE IN PRODUCTION
        // resetToken: resetToken,
        // resetUrl: resetUrl
      });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUsername,
        pass: emailPassword,
      },
    });

    const mailOptions = {
      from: emailFrom,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #6b46c1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    console.log('Sending email to:', user.email);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json({ 
      message: 'Password reset link sent to email' 
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    
    // If there was an error handling the user's token or saving to DB
    if (user) {
      console.log('Cleaning up user token due to error');
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }
    
    res.status(500).json({ 
      message: 'Error sending reset email' 
    });
  }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    console.log('Verifying token:', req.params.token);
    
    if (!req.params.token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('Hashed token:', resetPasswordToken);

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    console.log('Resetting password with token:', req.params.token);
    
    if (!req.params.token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    if (!req.body.password) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    console.log('Password reset successful for user:', user.email);
    
    res.status(200).json({ 
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};