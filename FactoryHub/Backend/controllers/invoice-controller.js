const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const AccountTransaction = require('../models/AccountTransaction');

// Generate invoice number
const generateInvoiceNumber = async () => {
    const lastInvoice = await Invoice.findOne()
        .sort({ createdAt: -1 })
        .select('invoiceNumber');

    if (!lastInvoice) {
        return 'INV-0001';
    }

    const lastNumber = parseInt(
        lastInvoice.invoiceNumber.replace('INV-', ''),
        10
    );

    const nextNumber = lastNumber + 1;

    return `INV-${String(nextNumber).padStart(4, '0')}`;
};


exports.createInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { customerId, items } = req.body;

        // -----------------------------------
        // 1. Validate request
        // -----------------------------------

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invoice must contain at least one item'
            });
        }

        // -----------------------------------
        // 2. Find customer
        // -----------------------------------

        const customer = await Customer.findOne({
            customerId: Number(customerId)
        }).session(session);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        let createdInvoice;

        // ===================================
        // START MONGODB TRANSACTION
        // ===================================

        await session.withTransaction(async () => {

            // -----------------------------------
            // 3. Prepare invoice items
            // -----------------------------------

            const invoiceItems = [];
            let invoiceTotal = 0;

            // -----------------------------------
            // 4. Process every model
            // -----------------------------------

            for (const item of items) {

                const modelCode = Number(item.modelCode);
                const quantity = Number(item.quantity);

                // Validate model code
                if (!modelCode || modelCode <= 0) {
                    throw new Error('Valid model code is required');
                }

                // Validate quantity
                if (!quantity || quantity <= 0) {
                    throw new Error(
                        `Invalid quantity for model ${modelCode}`
                    );
                }

                // Find product
                const product = await Product.findOne({
                    modelCode
                }).session(session);

                if (!product) {
                    throw new Error(
                        `Product with model code ${modelCode} not found`
                    );
                }

                // -----------------------------------
                // Check stock
                // -----------------------------------

                if (product.availablePieces < quantity) {
                    throw new Error(
                        `Not enough stock for model ${modelCode}. ` +
                        `Available: ${product.availablePieces}, ` +
                        `Requested: ${quantity}`
                    );
                }

                // -----------------------------------
                // Get price automatically
                // -----------------------------------

                const unitPrice = product.price;

                // -----------------------------------
                // Calculate total
                // -----------------------------------

                const itemTotal = quantity * unitPrice;

                invoiceItems.push({
                    product: product._id,
                    modelCode: product.modelCode,
                    quantity,
                    unitPrice,
                    total: itemTotal
                });

                invoiceTotal += itemTotal;
            }

            // -----------------------------------
            // 5. Generate invoice number
            // -----------------------------------

            const invoiceNumber = await generateInvoiceNumber();

            // -----------------------------------
            // 6. Create Invoice
            // -----------------------------------

            const invoice = new Invoice({
                invoiceNumber,
                customer: customer._id,
                items: invoiceItems,
                invoiceTotal
            });

            await invoice.save({ session });

            // -----------------------------------
            // 7. Create Account Transaction
            // -----------------------------------

            await AccountTransaction.create(
                [
                    {
                        customer: customer._id,
                        transactionType: 'INVOICE',
                        amount: invoiceTotal,
                        referenceNumber: invoice.invoiceNumber,
                        paymentMethod: null,
                        notes: `Invoice ${invoice.invoiceNumber}`
                    }
                ],
                { session }
            );

            // -----------------------------------
            // 8. Update Inventory
            // -----------------------------------

            for (const item of invoiceItems) {

                const product = await Product.findById(
                    item.product
                ).session(session);

                if (!product) {
                    throw new Error(
                        `Product not found for model ${item.modelCode}`
                    );
                }

                const previousInventory = product.availablePieces;

                if (previousInventory < item.quantity) {
                    throw new Error(
                        `Not enough stock for model ${item.modelCode}`
                    );
                }

                const currentInventory =
                    previousInventory - item.quantity;

                // Update product
                product.availablePieces = currentInventory;

                await product.save({ session });

                // Create inventory transaction
                await InventoryTransaction.create(
                    [
                        {
                            product: product._id,
                            transactionType: 'SALE',
                            quantity: item.quantity,
                            previousInventory,
                            currentInventory,
                            referenceNumber: invoice.invoiceNumber
                        }
                    ],
                    { session }
                );
            }

            createdInvoice = invoice;
        });

        // ===================================
        // TRANSACTION COMMITTED
        // ===================================

        const populatedInvoice = await Invoice.findById(
            createdInvoice._id
        )
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .populate(
                'items.product',
                'modelName modelCode price'
            );

        return res.status(201).json({
            success: true,
            data: populatedInvoice
        });

    } catch (error) {

        console.error('Create Invoice Error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });

    } finally {

        await session.endSession();
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
    try {

        const invoices = await Invoice.find()
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
            count: invoices.length,
            data: invoices
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// @desc    Get invoice by invoice number
// @route   GET /api/invoices/:invoiceNumber
exports.getInvoiceByNumber = async (req, res) => {
    try {

        const invoice = await Invoice.findOne({
            invoiceNumber: req.params.invoiceNumber
        })
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .populate(
                'items.product',
                'modelName modelCode price'
            );


        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }


        res.status(200).json({
            success: true,
            data: invoice
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};