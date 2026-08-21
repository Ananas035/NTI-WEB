const Return = require('../models/Return');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryTransaction = require('../models/InventoryTransaction');
const AccountTransaction = require('../models/AccountTransaction');


// ============================================
// Generate Return Number
// ============================================

const generateReturnNumber = async () => {
    const lastReturn = await Return.findOne()
        .sort({ createdAt: -1 })
        .select('returnNumber');

    if (!lastReturn) {
        return 'RET-0001';
    }

    const lastNumber = parseInt(
        lastReturn.returnNumber.replace('RET-', ''),
        10
    );

    const nextNumber = lastNumber + 1;

    return `RET-${String(nextNumber).padStart(4, '0')}`;
};


// ============================================
// Create Return
// POST /api/returns
// ============================================

exports.createReturn = async (req, res) => {
    try {

        const {
            customerId,
            items,
            notes
        } = req.body;


        // --------------------------------------------
        // 1. Validate customer
        // --------------------------------------------

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }


        const customer = await Customer.findOne({
            customerId: Number(customerId)
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }


        // --------------------------------------------
        // 2. Validate items
        // --------------------------------------------

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Return must contain at least one item'
            });
        }


        // --------------------------------------------
        // 3. Prepare return items
        // --------------------------------------------

        const returnItems = [];

        let returnTotal = 0;


        for (const item of items) {

            const modelCode = Number(item.modelCode);
            const quantity = Number(item.quantity);


            // Validate model code

            if (!modelCode || modelCode <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid model code is required'
                });
            }


            // Validate quantity

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for model ${modelCode}`
                });
            }


            // --------------------------------------------
            // Find product by MODEL CODE
            // --------------------------------------------

            const product = await Product.findOne({
                modelCode
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with model code ${modelCode} not found`
                });
            }


            // --------------------------------------------
            // Calculate item total
            // --------------------------------------------

            const unitPrice = product.price;

            const total = quantity * unitPrice;


            returnItems.push({
                product: product._id,
                modelCode: product.modelCode,
                quantity,
                unitPrice,
                total
            });


            returnTotal += total;
        }


        // --------------------------------------------
        // 4. Generate Return Number
        // --------------------------------------------

        const returnNumber = await generateReturnNumber();


        // --------------------------------------------
        // 5. Create Return
        // --------------------------------------------

        const newReturn = await Return.create({
            returnNumber,
            customer: customer._id,
            items: returnItems,
            returnTotal,
            notes: notes || ''
        });


        // --------------------------------------------
        // 6. Update Inventory
        // --------------------------------------------

        for (const item of returnItems) {

            const product = await Product.findById(item.product);

            if (!product) {
                throw new Error(
                    `Product not found for model ${item.modelCode}`
                );
            }


            const previousInventory = product.availablePieces;

            const currentInventory =
                previousInventory + item.quantity;


            // Update product inventory

            product.availablePieces = currentInventory;

            await product.save();


            // --------------------------------------------
            // Create Inventory Transaction
            // --------------------------------------------

            await InventoryTransaction.create({
                product: product._id,
                transactionType: 'RETURN',
                quantity: item.quantity,
                previousInventory,
                currentInventory,
                referenceNumber: returnNumber
            });
        }


        // --------------------------------------------
        // 7. Create Account Transaction
        // --------------------------------------------

        await AccountTransaction.create({
            customer: customer._id,
            transactionType: 'RETURN',
            amount: returnTotal,
            referenceNumber: returnNumber,
            paymentMethod: null,
            notes: `Return ${returnNumber}`
        });


        // --------------------------------------------
        // 8. Populate response
        // --------------------------------------------

        const populatedReturn = await Return.findById(newReturn._id)
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .populate(
                'items.product',
                'modelName modelCode price'
            );


        // --------------------------------------------
        // 9. Response
        // --------------------------------------------

        res.status(201).json({
            success: true,
            data: populatedReturn
        });


    } catch (error) {

        console.error('Create Return Error:', error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};



// ============================================
// Get All Returns
// GET /api/returns
// ============================================

exports.getReturns = async (req, res) => {
    try {

        const returns = await Return.find()
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .populate(
                'items.product',
                'modelName modelCode price'
            )
            .sort({ createdAt: -1 });


        res.status(200).json({
            success: true,
            count: returns.length,
            data: returns
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ============================================
// Get Return By Number
// GET /api/returns/:returnNumber
// ============================================

exports.getReturnByNumber = async (req, res) => {
    try {

        const returnDoc = await Return.findOne({
            returnNumber: req.params.returnNumber
        })
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .populate(
                'items.product',
                'modelName modelCode price'
            );


        if (!returnDoc) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }


        res.status(200).json({
            success: true,
            data: returnDoc
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};