const Check = require('../models/Check');
const Customer = require('../models/Customer');
const AccountTransaction = require('../models/AccountTransaction');


// ============================================
// Generate Check Number
// ============================================

const generateCheckNumber = async () => {
    const lastCheck = await Check.findOne()
        .sort({ createdAt: -1 })
        .select('checkNumber');

    if (!lastCheck) {
        return 'CHK-0001';
    }

    const lastNumber = parseInt(
        lastCheck.checkNumber.replace('CHK-', ''),
        10
    );

    const nextNumber = lastNumber + 1;

    return `CHK-${String(nextNumber).padStart(4, '0')}`;
};


// ============================================
// Add New Check
// POST /api/checks
// ============================================

exports.createCheck = async (req, res) => {
    try {

        const {
            customerId,
            amount,
            bankName,
            collectionDate,
            notes
        } = req.body;


        // --------------------------------------------
        // 1. Validate customer ID
        // --------------------------------------------

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }


        // --------------------------------------------
        // 2. Validate amount
        // --------------------------------------------

        const checkAmount = Number(amount);

        if (!checkAmount || checkAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Check amount must be greater than 0'
            });
        }


        // --------------------------------------------
        // 3. Validate bank name
        // --------------------------------------------

        if (!bankName || !bankName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Bank name is required'
            });
        }


        // --------------------------------------------
        // 4. Validate collection date
        // --------------------------------------------

        if (!collectionDate) {
            return res.status(400).json({
                success: false,
                message: 'Collection date is required'
            });
        }


        const parsedCollectionDate = new Date(collectionDate);

        if (isNaN(parsedCollectionDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid collection date'
            });
        }


        // --------------------------------------------
        // 5. Find customer
        // --------------------------------------------

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
        // 6. Generate check number
        // --------------------------------------------

        const checkNumber = await generateCheckNumber();


        // --------------------------------------------
        // 7. Create check
        // --------------------------------------------

        const check = await Check.create({
            checkNumber,
            customer: customer._id,
            amount: checkAmount,
            bankName: bankName.trim(),
            collectionDate: parsedCollectionDate,
            status: 'UNDER_COLLECTION',
            collectedAt: null,
            notes: notes || ''
        });


        // --------------------------------------------
        // 8. Populate customer
        // --------------------------------------------

        const populatedCheck = await Check.findById(check._id)
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            );


        // --------------------------------------------
        // 9. Response
        // --------------------------------------------

        res.status(201).json({
            success: true,
            data: populatedCheck
        });


    } catch (error) {

        console.error('Create Check Error:', error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};



// ============================================
// Collect Check
// PATCH /api/checks/:checkNumber/collect
// ============================================

exports.collectCheck = async (req, res) => {
    try {

        const { checkNumber } = req.params;


        // --------------------------------------------
        // 1. Find check
        // --------------------------------------------

        const check = await Check.findOne({
            checkNumber
        });

        if (!check) {
            return res.status(404).json({
                success: false,
                message: 'Check not found'
            });
        }


        // --------------------------------------------
        // 2. Prevent collecting twice
        // --------------------------------------------

        if (check.status === 'COLLECTED') {
            return res.status(400).json({
                success: false,
                message: 'This check has already been collected'
            });
        }


        // --------------------------------------------
        // 3. Check collection date
        // --------------------------------------------

        const now = new Date();

        if (now < check.collectionDate) {

            return res.status(400).json({
                success: false,
                message: 'Check cannot be collected before the collection date',
                collectionDate: check.collectionDate,
                currentDate: now
            });
        }


        // --------------------------------------------
        // 4. Change status
        // --------------------------------------------

        check.status = 'COLLECTED';

        check.collectedAt = now;

        await check.save();


        // --------------------------------------------
        // 5. Create Account Transaction
        // --------------------------------------------

        await AccountTransaction.create({
            customer: check.customer,
            transactionType: 'PAYMENT',
            amount: check.amount,
            referenceNumber: check.checkNumber,
            paymentMethod: 'CHECK',
            notes: `Collected check ${check.checkNumber}`
        });


        // --------------------------------------------
        // 6. Get updated check
        // --------------------------------------------

        const updatedCheck = await Check.findById(check._id)
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            );


        // --------------------------------------------
        // 7. Response
        // --------------------------------------------

        res.status(200).json({
            success: true,
            message: 'Check collected successfully',
            data: updatedCheck
        });


    } catch (error) {

        console.error('Collect Check Error:', error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};



// ============================================
// Get All Checks
// GET /api/checks
// ============================================

exports.getChecks = async (req, res) => {
    try {

        const checks = await Check.find()
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            )
            .sort({ createdAt: -1 });


        res.status(200).json({
            success: true,
            count: checks.length,
            data: checks
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ============================================
// Get Check By Number
// GET /api/checks/:checkNumber
// ============================================

exports.getCheckByNumber = async (req, res) => {
    try {

        const check = await Check.findOne({
            checkNumber: req.params.checkNumber
        })
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            );


        if (!check) {
            return res.status(404).json({
                success: false,
                message: 'Check not found'
            });
        }


        res.status(200).json({
            success: true,
            data: check
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};