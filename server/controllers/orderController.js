const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Delivery = require('../models/deliveryModel'); // Add this at the top

exports.createOrder = async (req, res) => {
  const { product, quantity, totalPrice, paymentMethod, shippingAddress } = req.body;

  try {
    const foundProduct = await Product.findById(product);
    if (!foundProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (foundProduct.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    foundProduct.stock -= quantity;
    await foundProduct.save();

    const isPaid = paymentMethod === 'Card';
    const paidAt = isPaid ? new Date() : null;

    const order = await Order.create({
      product,
      user: req.user._id,
      quantity,
      totalPrice,
      paymentMethod,
      shippingAddress,
      isPaid,
      paidAt,
    });

    // Auto-create delivery record
    const delivery = new Delivery({
      order: order._id,
      deliveryPerson: 'Unassigned', // You can update this later
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expected 3 days delivery
    });

    await delivery.save();

    res.status(201).json({
      message: 'Order and delivery created successfully',
      data: { order, delivery },
    });

  } catch (error) {
    console.error('Error creating order and delivery:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get My Own Orders (Buyer)
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('product');

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const updatedOrders = orders.map(order => {
    const product = order.product?.toObject?.(); 

    if (product && product.image) {
      product.imageUrl = `${baseUrl}/api/uploads/${product.image}`;
    }

    return {
      ...order.toObject(),
      product: product || order.product
    };
  });

  res.json({ message: 'My orders fetched successfully', data: updatedOrders });
};


// Get All Orders (Admin)
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().populate('product').populate('user', 'name email');

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const updatedOrders = orders.map(order => {
    const product = order.product?.toObject?.();

    if (product && product.image) {
      product.imageUrl = `${baseUrl}/api/uploads/${product.image}`;
    }

    return {
      ...order.toObject(),
      product: product || order.product,
    };
  });

  res.json({ message: 'All orders fetched successfully', data: updatedOrders });
};


// Get Single Order by ID (Buyer/Admin)
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('product')
    .populate('user', 'name email');

  if (order) {
    if (req.user.role === 'admin' || req.user._id.equals(order.user._id)) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const orderObj = order.toObject();
      const product = order.product?.toObject?.();

      if (product && product.image) {
        product.imageUrl = `${baseUrl}/api/uploads/${product.image}`;
      }

      orderObj.product = product || order.product;

      res.json({ message: 'Order fetched successfully', data: orderObj });
    } else {
      res.status(403).json({ message: 'Not authorized to view this order' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};


// Update Order Status (Admin/Delivery)
// Update Order Status (Admin/Delivery)
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Store previous status for comparison
    const previousStatus = order.status;
    order.status = status || order.status;
    const updatedOrder = await order.save();

    // If status changed to "shipped", update related delivery status
    if (status === 'shipped') {
      const delivery = await Delivery.findOne({ order: order._id });
      if (delivery) {
        delivery.deliveryStatus = 'In Transit';
        await delivery.save();
      }
    }
    // If status changed to "cancelled", delete the delivery record
    else if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await Delivery.deleteOne({ order: order._id });
      
      // Optional: Add refund creation logic here if needed
      // await Refund.create({ order: order._id, user: order.user, status: 'Pending' });
    }

    res.json({ message: 'Order status updated successfully', data: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Mark Order as Paid (After Stripe Payment)
exports.markOrderAsPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json({ message: 'Order marked as paid successfully', data: updatedOrder });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// Cancel Own Order (Buyer)
exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (!req.user._id.equals(order.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }

    order.status = 'Cancelled';
    const cancelledOrder = await order.save();
    res.json({ message: 'Order cancelled successfully', data: cancelledOrder });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// Delete Order (Admin)
exports.deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (order) {
    res.json({ message: 'Order deleted successfully' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};
