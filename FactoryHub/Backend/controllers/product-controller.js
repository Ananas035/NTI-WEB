    const Product = require('../models/Product');

    // @desc    Create a new product with an image
    // @route   POST /api/products
    exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // If an image was uploaded, save its path in the database
        if (req.file) {
        productData.image = `/uploads/models/${req.file.filename}`;
        }

        const product = await Product.create(productData);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Model Code already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
    };

    // @desc    Update product
    // @route   PATCH /api/products/:id
    exports.updateProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // If a new image was uploaded, update the path
        if (req.file) {
        productData.image = `/uploads/models/${req.file.filename}`;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, productData, {
        new: true,
        runValidators: true,
        });
        
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
    };

// Get, GetById, and Delete functions remain exactly the same as before!

    // @desc    Delete product
    // @route   DELETE /api/products/:id
    exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    };
    
    
    
    exports.getProducts = async (req, res) => { /* ... */ };
    exports.getProductById = async (req, res) => { /* ... */ };
    exports.deleteProduct = async (req, res) => { /* ... */ };