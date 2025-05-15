const User = require('../models/userModel');

// Create User (Admin Only)
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!['buyer', 'admin', 'delivery'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({ message: 'User created successfully', data: user });
};

// Get All Users (Admin Only)
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json({ message: 'Users fetched successfully', data: users });
};

// Get Single User by ID (Admin Only)
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    res.json({ message: 'User fetched successfully', data: user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Update User (Admin Only)
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (user) {
    res.json({ message: 'User updated successfully', data: user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (user) {
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
