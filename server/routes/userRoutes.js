const express = require('express');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, adminOnly, buyerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin can manage users
router.route('/')
  .post(protect, adminOnly, createUser)    // Create user
  .get(protect, adminOnly, getUsers);       // Get all users

router.route('/my/:id')
  .get( getUserById)  
  .put(protect, buyerOnly, updateUser);        

router.route('/:id')
  .get(protect, adminOnly, getUserById)    
 // Get single user
  .put(protect, adminOnly, updateUser)      // Update user
  .delete(protect, adminOnly, deleteUser); 
   // Delete user

     
             

module.exports = router;
