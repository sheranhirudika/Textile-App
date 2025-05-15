const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  image: { type: String }, // ✅ Added image support
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
