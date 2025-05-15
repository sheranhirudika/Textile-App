const Product = require('../models/productModel');

// Create Product (Admin Only)
exports.createProduct = async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const image = req.file ? req.file.filename : null; // ✅ Support Image Upload

  const product = new Product({
    name,
    description,
    price,
    stock,
    category,
    image,
  });

  const savedProduct = await product.save();
  res.status(201).json({ message: 'Product created successfully', data: savedProduct });
};

exports.getProducts = async (req, res) => {
  const products = await Product.find();

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const updatedProducts = products.map(product => ({
    ...product.toObject(),
    imageUrl: product.image ? `${baseUrl}/api/uploads/${product.image}` : null,
  }));

  res.json({ message: 'Products fetched successfully', data: updatedProducts });
};

// Get Single Product (Anyone)
exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productWithImage = {
      ...product.toObject(),
      imageUrl: product.image ? `${baseUrl}/api/uploads/${product.image}` : null,
    };

    res.json({ message: 'Product fetched successfully', data: productWithImage });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// Update Product (Admin Only)
exports.updateProduct = async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.category = category || product.category;
    if (req.file) {
      product.image = req.file.filename; // Update Image if New Uploaded
    }

    const updatedProduct = await product.save();
    res.json({ message: 'Product updated successfully', data: updatedProduct });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// Delete Product (Admin Only)
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (product) {
    res.json({ message: 'Product deleted successfully' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};
