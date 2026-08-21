const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const AccountTransaction = require('../models/AccountTransaction');


// Generate payment number
const generatePaymentNumber = async () => {
    const lastPayment = await Payment.findOne()
        .sort({ createdAt: -1 })
        .select('paymentNumber');

    if (!lastPayment) {
        return 'PAY-0001';
    }

    const lastNumber = parseInt(
        lastPayment.paymentNumber.replace('PAY-', ''),
        10
    );

    const nextNumber = lastNumber + 1;

    return `PAY-${String(nextNumber).padStart(4, '0')}`;
};


exports.createPayment = async (req, res) => {
    try {

        const {
            customerId,
            amount,
            paymentMethod,
            notes
        } = req.body;


        // -----------------------------------
        // 1. Validate customer ID
        // -----------------------------------

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }


        // -----------------------------------
        // 2. Validate amount
        // -----------------------------------

        const paymentAmount = Number(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be greater than 0'
            });
        }


        // -----------------------------------
        // 3. Validate payment method
        // -----------------------------------

        if (paymentMethod !== 'CASH') {
            return res.status(400).json({
                success: false,
                message: 'Only CASH payments are allowed here. Checks must be added through /api/checks'
            });
        }

        // -----------------------------------
        // 4. Find customer
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
        // 5. Check customer's current balance
        // -----------------------------------

        const transactions = await AccountTransaction.find({
            customer: customer._id
        });

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


        const currentBalance =
            totalInvoices -
            totalReturns -
            totalPayments;


        // -----------------------------------
        // 6. Prevent overpayment
        // -----------------------------------

        if (paymentAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount cannot be greater than customer balance',
                currentBalance
            });
        }


        // -----------------------------------
        // 7. Generate payment number
        // -----------------------------------

        const paymentNumber = await generatePaymentNumber();


        // -----------------------------------
        // 8. Create payment
        // -----------------------------------

        const payment = await Payment.create({
            paymentNumber,
            customer: customer._id,
            amount: paymentAmount,
            paymentMethod,
            notes
        });


        // -----------------------------------
        // 9. Create account transaction
        // -----------------------------------

        await AccountTransaction.create({
            customer: customer._id,
            transactionType: 'PAYMENT',
            amount: paymentAmount,
            referenceNumber: payment.paymentNumber,
            paymentMethod,
            notes: notes || `Payment ${payment.paymentNumber}`
        });


        // -----------------------------------
        // 10. Populate payment
        // -----------------------------------

        const populatedPayment = await Payment.findById(payment._id)
            .populate(
                'customer',
                'customerId name showroomName mobileNumber address'
            );


        // -----------------------------------
        // 11. Response
        // -----------------------------------

        res.status(201).json({
            success: true,
            data: populatedPayment,
            previousBalance: currentBalance,
            newBalance: currentBalance - paymentAmount
        });


    } catch (error) {

        console.error('Create Payment Error:', error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};