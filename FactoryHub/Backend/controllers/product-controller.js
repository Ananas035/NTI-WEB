const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');


exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Convert colors string to array
        if (typeof productData.colors === 'string') {
            productData.colors = productData.colors
                .split(',')
                .map(color => color.trim())
                .filter(Boolean);
        }

        // If an image was uploaded
        if (req.file) {
            productData.image = `/uploads/models/${req.file.filename}`;
        }

        // Initial stock
        const initialQuantity = Number(productData.availablePieces) || 0;

        // Create product
        const product = await Product.create(productData);

        // Create first inventory transaction automatically
        if (initialQuantity > 0) {
            await InventoryTransaction.create({
                product: product._id,
                transactionType: 'ADD',
                quantity: initialQuantity,
                previousInventory: 0,
                currentInventory: initialQuantity,
                referenceNumber: null
            });
        }

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




exports.updateProduct = async (req, res) => {
    try {
        const productData = { ...req.body };


        delete productData.modelCode;


        if (typeof productData.colors === 'string') {
            productData.colors = productData.colors
                .split(',')
                .map(color => color.trim())
                .filter(Boolean);
        }


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