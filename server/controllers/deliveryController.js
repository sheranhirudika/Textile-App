const Delivery = require('../models/deliveryModel');
const Order = require('../models/orderModel'); 

// Create Delivery (Delivery Person or Admin)
exports.createDelivery = async (req, res) => {
  const { order, deliveryPerson, deliveryStatus, deliveryDate, trackingNumber } = req.body;

  const delivery = new Delivery({
    order,
    deliveryPerson,
    deliveryStatus,
    deliveryDate,
    trackingNumber,
  });

  const savedDelivery = await delivery.save();
  res.status(201).json({ message: 'Delivery created successfully', data: savedDelivery });
};

// Get All Deliveries (Admin or Delivery Person)
exports.getDeliveries = async (req, res) => {
  const deliveries = await Delivery.find().populate('order');
  res.json({ message: 'Deliveries fetched successfully', data: deliveries });
};

// Get Single Delivery by ID
exports.getDeliveryById = async (req, res) => {
  const delivery = await Delivery.findById(req.params.id).populate('order');
  if (delivery) {
    res.json({ message: 'Delivery fetched successfully', data: delivery });
  } else {
    res.status(404).json({ message: 'Delivery not found' });
  }
};

// Update Delivery (Delivery Person or Admin)
exports.updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // If deliveryStatus is updated to "Delivered" or "Cancelled", update the corresponding order status
    if (req.body.deliveryStatus === 'Delivered' || req.body.deliveryStatus === 'Cancelled') {
      const updateData = {
        status: req.body.deliveryStatus.toLowerCase()
      };

      // If delivered, also mark as paid and set payment timestamp
      if (req.body.deliveryStatus === 'Delivered') {
        updateData.isPaid = true;
        updateData.paidAt = new Date();
      }

      await Order.findByIdAndUpdate(delivery.order, updateData);
    }

    res.json({ message: 'Delivery updated successfully', data: delivery });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Delivery (Admin Only)
exports.deleteDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndDelete(req.params.id);
  if (delivery) {
    res.json({ message: 'Delivery deleted successfully' });
  } else {
    res.status(404).json({ message: 'Delivery not found' });
  }
};
