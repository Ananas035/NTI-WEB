const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');

exports.createInventoryTransaction = async (req, res) => {
    try {
        const {
            modelCode,
            transactionType,
            quantity,
            referenceNumber,
            date
        } = req.body;

        // 1. Validate model code
        if (!modelCode) {
            return res.status(400).json({
                success: false,
                message: 'Model code is required'
            });
        }

        // 2. Find product using modelCode
        const product = await Product.findOne({
            modelCode: Number(modelCode)
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product with this model code was not found'
            });
        }

        // 3. Validate transaction type
        if (!['ADD', 'SALE', 'RETURN'].includes(transactionType)) {
            return res.status(400).json({
                success: false,
                message: 'Transaction type must be ADD, SALE, or RETURN'
            });
        }

        // 4. Validate quantity
        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const transactionQuantity = Number(quantity);

        // 5. Save previous inventory
        const previousInventory = product.availablePieces;

        // 6. Calculate new inventory
        let currentInventory;

        if (transactionType === 'ADD') {
            currentInventory =
                previousInventory + transactionQuantity;
        }

        if (transactionType === 'SALE') {
            if (transactionQuantity > previousInventory) {
                return res.status(400).json({
                    success: false,
                    message: 'Not enough inventory available'
                });
            }

            currentInventory =
                previousInventory - transactionQuantity;
        }

        if (transactionType === 'RETURN') {
            currentInventory =
                previousInventory + transactionQuantity;
        }

        // 7. Update product inventory
        product.availablePieces = currentInventory;

        await product.save();

        // 8. Create inventory transaction
        const transaction = await InventoryTransaction.create({
            product: product._id,
            transactionType,
            quantity: transactionQuantity,
            previousInventory,
            currentInventory,
            referenceNumber: referenceNumber || null,
            date: date || Date.now()
        });

        // 9. Return response
        res.status(201).json({
            success: true,
            data: {
                transaction,
                product
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


exports.restockProduct = async (req, res) => {
    try {
        const modelCode = Number(req.params.modelCode);
        const quantity = Number(req.body.quantity);

        // Validate model code
        if (!modelCode) {
            return res.status(400).json({
                success: false,
                message: 'Model code is required'
            });
        }

        // Validate quantity
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Find product by model code
        const product = await Product.findOne({
            modelCode
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product with this model code was not found'
            });
        }

        // Current stock before restock
        const previousInventory = product.availablePieces;

        // Calculate new stock
        const currentInventory = previousInventory + quantity;

        // Update product stock
        product.availablePieces = currentInventory;

        await product.save();

        // Create inventory transaction
        const transaction = await InventoryTransaction.create({
            product: product._id,
            transactionType: 'RESTOCK',
            quantity,
            previousInventory,
            currentInventory,
            referenceNumber: null
        });

        res.status(201).json({
            success: true,
            data: {
                transaction,
                product
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


exports.getInventoryTransactions = async (req, res) => {
    try {
        const transactions = await InventoryTransaction
            .find()
            .populate('product', 'modelName modelCode price')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.getInventoryByModelCode = async (req, res) => {
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

        const transactions = await InventoryTransaction
            .find({ product: product._id })
            .populate('product', 'modelName modelCode price')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};