const mongoose = require('mongoose');

const Return = require('../models/Return');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryTransaction = require('../models/InventoryTransaction');
const AccountTransaction = require('../models/AccountTransaction');


// ============================================
// Generate Return Number
// ============================================

const generateReturnNumber = async (session = null) => {
    let query = Return.findOne()
        .sort({ createdAt: -1 })
        .select('returnNumber');

    if (session) {
        query = query.session(session);
    }

    const lastReturn = await query;

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
// Get Customer Purchased Quantity
// For Specific Model
// ============================================

const getCustomerPurchasedQuantity = async (
    customerId,
    modelCode,
    session
) => {

    const invoices = await Invoice.find({
        customer: customerId
    })
        .select('items')
        .session(session);

    let purchasedQuantity = 0;

    for (const invoice of invoices) {

        if (!Array.isArray(invoice.items)) {
            continue;
        }

        for (const item of invoice.items) {

            if (
                Number(item.modelCode) ===
                Number(modelCode)
            ) {
                purchasedQuantity +=
                    Number(item.quantity) || 0;
            }
        }
    }

    return purchasedQuantity;
};


// ============================================
// Get Customer Returned Quantity
// For Specific Model
// ============================================

const getCustomerReturnedQuantity = async (
    customerId,
    modelCode,
    session
) => {

    const returns = await Return.find({
        customer: customerId
    })
        .select('items')
        .session(session);

    let returnedQuantity = 0;

    for (const returnDoc of returns) {

        if (!Array.isArray(returnDoc.items)) {
            continue;
        }

        for (const item of returnDoc.items) {

            if (
                Number(item.modelCode) ===
                Number(modelCode)
            ) {
                returnedQuantity +=
                    Number(item.quantity) || 0;
            }
        }
    }

    return returnedQuantity;
};


// ============================================
// Create Return
// POST /api/returns
// ============================================

exports.createReturn = async (req, res) => {

    const session =
        await mongoose.startSession();

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


        const customer =
            await Customer.findOne({
                customerId: Number(customerId)
            }).session(session);


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }


        // --------------------------------------------
        // 2. Validate items
        // --------------------------------------------

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Return must contain at least one item'
            });
        }


        let createdReturn;


        // ============================================
        // START TRANSACTION
        // ============================================

        await session.withTransaction(async () => {


            // --------------------------------------------
            // 3. Prepare return items
            // --------------------------------------------

            const returnItems = [];

            let returnTotal = 0;


            // ==========================================
            // 4. Validate Every Model
            // ==========================================

            for (const item of items) {

                const modelCode =
                    Number(item.modelCode);

                const quantity =
                    Number(item.quantity);


                // ----------------------------------------
                // Validate model code
                // ----------------------------------------

                if (
                    !modelCode ||
                    modelCode <= 0
                ) {

                    throw new Error(
                        'Valid model code is required'
                    );
                }


                // ----------------------------------------
                // Validate quantity
                // ----------------------------------------

                if (
                    !quantity ||
                    quantity <= 0
                ) {

                    throw new Error(
                        `Invalid quantity for model ${modelCode}`
                    );
                }


                // ----------------------------------------
                // Find product
                // ----------------------------------------

                const product =
                    await Product.findOne({
                        modelCode
                    }).session(session);


                if (!product) {

                    throw new Error(
                        `Product with model code ${modelCode} not found`
                    );
                }


                // ========================================
                // CUSTOMER RETURN VALIDATION
                // ========================================

                const purchasedQuantity =
                    await getCustomerPurchasedQuantity(
                        customer._id,
                        modelCode,
                        session
                    );


                const previouslyReturnedQuantity =
                    await getCustomerReturnedQuantity(
                        customer._id,
                        modelCode,
                        session
                    );


                const availableToReturn =
                    purchasedQuantity -
                    previouslyReturnedQuantity;


                // ----------------------------------------
                // Customer hasn't purchased this model
                // ----------------------------------------

                if (purchasedQuantity <= 0) {

                    throw new Error(
                        `العميل ${customer.name} لم يستلم أي قطع من الموديل ${modelCode} ولا يمكن تسجيل مرتجع منه`
                    );
                }


                // ----------------------------------------
                // Requested quantity is too high
                // ----------------------------------------

                if (
                    quantity >
                    availableToReturn
                ) {

                    throw new Error(
                        `العميل ${customer.name} أخذ من الموديل ${modelCode} عدد ${availableToReturn} قطعة فقط، ولا يمكن إرجاع ${quantity} قطعة`
                    );
                }


                // ----------------------------------------
                // Calculate price
                // ----------------------------------------

                const unitPrice =
                    Number(product.price) || 0;


                const total =
                    quantity * unitPrice;


                returnItems.push({

                    product:
                        product._id,

                    modelCode:
                        product.modelCode,

                    quantity,

                    unitPrice,

                    total

                });


                returnTotal += total;
            }


            // --------------------------------------------
            // 5. Generate return number
            // --------------------------------------------

            const returnNumber =
                await generateReturnNumber(session);


            // --------------------------------------------
            // 6. Create Return
            // --------------------------------------------

            const newReturn =
                new Return({

                    returnNumber,

                    customer:
                        customer._id,

                    items:
                        returnItems,

                    returnTotal,

                    notes:
                        notes || ''

                });


            await newReturn.save({
                session
            });


            // --------------------------------------------
            // 7. Update Inventory
            // --------------------------------------------

            for (const item of returnItems) {

                const product =
                    await Product.findById(
                        item.product
                    ).session(session);


                if (!product) {

                    throw new Error(
                        `Product not found for model ${item.modelCode}`
                    );
                }


                const previousInventory =
                    Number(product.availablePieces) || 0;


                const currentInventory =
                    previousInventory +
                    item.quantity;


                // Update inventory
                product.availablePieces =
                    currentInventory;


                await product.save({
                    session
                });


                // Inventory transaction
                await InventoryTransaction.create(
                    [
                        {

                            product:
                                product._id,

                            transactionType:
                                'RETURN',

                            quantity:
                                item.quantity,

                            previousInventory,

                            currentInventory,

                            referenceNumber:
                                returnNumber

                        }
                    ],
                    {
                        session
                    }
                );
            }


            // --------------------------------------------
            // 8. Create Account Transaction
            // --------------------------------------------

            await AccountTransaction.create(
                [
                    {

                        customer:
                            customer._id,

                        transactionType:
                            'RETURN',

                        amount:
                            returnTotal,

                        referenceNumber:
                            returnNumber,

                        paymentMethod:
                            null,

                        notes:
                            `Return ${returnNumber}`

                    }
                ],
                {
                    session
                }
            );


            createdReturn =
                newReturn;
        });


        // ============================================
        // TRANSACTION COMMITTED
        // ============================================


        const populatedReturn =
            await Return.findById(
                createdReturn._id
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

            data:
                populatedReturn

        });


    } catch (error) {

        console.error(
            'Create Return Error:',
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    } finally {

        await session.endSession();
    }
};


// ============================================
// Get All Returns
// GET /api/returns
// ============================================

exports.getReturns = async (req, res) => {

    try {

        const returns =
            await Return.find()
                .populate(
                    'customer',
                    'customerId name showroomName mobileNumber address'
                )
                .populate(
                    'items.product',
                    'modelName modelCode price'
                )
                .sort({
                    createdAt: -1
                });


        res.status(200).json({

            success: true,

            count:
                returns.length,

            data:
                returns

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                error.message

        });
    }
};


// ============================================
// Get Return By Number
// GET /api/returns/:returnNumber
// ============================================

exports.getReturnByNumber = async (req, res) => {

    try {

        const returnDoc =
            await Return.findOne({
                returnNumber:
                    req.params.returnNumber
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

                message:
                    'Return not found'

            });
        }


        res.status(200).json({

            success: true,

            data:
                returnDoc

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                error.message

        });
    }
};