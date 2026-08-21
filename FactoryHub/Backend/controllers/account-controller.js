const AccountTransaction = require('../models/AccountTransaction');
const Customer = require('../models/Customer');


// @desc    Get customer account
// @route   GET /api/accounts/customer/:customerId
exports.getCustomerAccount = async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);

        // -----------------------------------
        // 1. Validate customer ID
        // -----------------------------------

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }


        // -----------------------------------
        // 2. Find customer
        // -----------------------------------

        const customer = await Customer.findOne({
            customerId
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }


        // -----------------------------------
        // 3. Get account transactions
        // -----------------------------------

        const transactions = await AccountTransaction.find({
            customer: customer._id
        })
            .sort({ date: -1 })
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            );


        // -----------------------------------
        // 4. Calculate account balance
        // -----------------------------------

        let totalInvoices = 0;
        let totalReturns = 0;
        let totalPayments = 0;

        transactions.forEach(transaction => {

            if (transaction.transactionType === 'INVOICE') {
                totalInvoices += transaction.amount;
            }

            else if (transaction.transactionType === 'RETURN') {
                totalReturns += transaction.amount;
            }

            else if (transaction.transactionType === 'PAYMENT') {
                totalPayments += transaction.amount;
            }
        });


        // -----------------------------------
        // 5. Calculate current balance
        // -----------------------------------

        const currentBalance =
            totalInvoices -
            totalReturns -
            totalPayments;


        // -----------------------------------
        // 6. Send response
        // -----------------------------------

        res.status(200).json({
            success: true,

            customer: {
                customerId: customer.customerId,
                name: customer.name,
                showroomName: customer.showroomName,
                mobileNumber: customer.mobileNumber,
                address: customer.address
            },

            summary: {
                totalInvoices,
                totalReturns,
                totalPayments,
                currentBalance
            },

            transactions
        });

    } catch (error) {

        console.error('Get Customer Account Error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};