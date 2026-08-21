const Product = require('../models/Product');

// @desc    Create a new product with an image
// @route   POST /api/products
exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        if (typeof productData.colors === 'string') {
    productData.colors = productData.colors
        .split(',')
        .map(color => color.trim())
        .filter(Boolean);
    }

        // If an image was uploaded, save its path in the database
        if (req.file) {
            productData.image = `/uploads/models/${req.file.filename}`;
        }

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            data: product
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Model Code already exists.'
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// @desc    Get product by model code
// @route   GET /api/products/code/:modelCode
exports.getProductByCode = async (req, res) => {
    try {
        const product = await Product.findOne({
            modelCode: Number(req.params.modelCode)
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product with this model code was not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// @desc    Update product by model code
// @route   PATCH /api/products/code/:modelCode
exports.updateProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Prevent changing modelCode during normal update
        delete productData.modelCode;

        // Convert colors string to array
        if (typeof productData.colors === 'string') {
            productData.colors = productData.colors
                .split(',')
                .map(color => color.trim())
                .filter(Boolean);
        }

        // Update image only if a new image was uploaded
        if (req.file) {
            productData.image = `/uploads/models/${req.file.filename}`;
        }

        const product = await Product.findOneAndUpdate(
            {
                modelCode: Number(req.params.modelCode)
            },
            productData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product with this model code was not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// @desc    Delete product by model code
// @route   DELETE /api/products/code/:modelCode
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            modelCode: Number(req.params.modelCode)
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product with this model code was not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};