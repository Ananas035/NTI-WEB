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


// @desc    Create a new invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
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
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }


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
                    message: `Invalid quantity for model ${modelCode}`
                });
            }


            // Find product by model code
            const product = await Product.findOne({
                modelCode
            });


            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with model code ${modelCode} not found`
                });
            }


            // -----------------------------------
            // 5. Check stock
            // -----------------------------------

            if (product.availablePieces < quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Not enough stock for model ${modelCode}. ` +
                        `Available: ${product.availablePieces}, ` +
                        `Requested: ${quantity}`
                });
            }


            // -----------------------------------
            // 6. Get price automatically
            // -----------------------------------

            const unitPrice = product.price;


            // -----------------------------------
            // 7. Calculate item total
            // -----------------------------------

            const itemTotal = quantity * unitPrice;


            // -----------------------------------
            // 8. Add item to invoice
            // -----------------------------------

            invoiceItems.push({
                product: product._id,
                modelCode: product.modelCode,
                quantity,
                unitPrice,
                total: itemTotal
            });


            // Add to invoice total
            invoiceTotal += itemTotal;
        }


        // -----------------------------------
        // 9. Generate invoice number
        // -----------------------------------

        const invoiceNumber = await generateInvoiceNumber();


        // -----------------------------------
        // 10. Create invoice
        // -----------------------------------

        const invoice = await Invoice.create({
            invoiceNumber,
            customer: customer._id,
            items: invoiceItems,
            invoiceTotal
        });

        await AccountTransaction.create({
            customer: customer._id,
            transactionType: 'INVOICE',
            amount: invoiceTotal,
            referenceNumber: invoice.invoiceNumber,
            notes: `Invoice ${invoice.invoiceNumber}`
        });


        // -----------------------------------
        // 11. Update inventory
        // -----------------------------------

        for (const item of invoiceItems) {

            const product = await Product.findById(item.product);

            const previousInventory = product.availablePieces;

            const currentInventory =
                previousInventory - item.quantity;


            // Update product stock
            product.availablePieces = currentInventory;

            await product.save();


            // Create inventory transaction
            await InventoryTransaction.create({
                product: product._id,
                transactionType: 'SALE',
                quantity: item.quantity,
                previousInventory,
                currentInventory,
                referenceNumber: invoice.invoiceNumber
            });
        }


        // -----------------------------------
        // 12. Return invoice
        // -----------------------------------

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'customerId name showroomName mobileNumber address')
            .populate('items.product', 'modelName modelCode price');


        res.status(201).json({
            success: true,
            data: populatedInvoice
        });

    } catch (error) {

        console.error('Create Invoice Error:', error);

        res.status(400).json({
            success: false,
            message: error.message
        });
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