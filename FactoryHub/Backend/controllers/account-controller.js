const AccountTransaction = require('../models/AccountTransaction');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Return = require('../models/Return');

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


// ===========================================================================
// Customer Account Statement
// ===========================================================================
//
// Read-only, authenticated report of a single customer's account for one of
// the supported reporting periods (1 / 3 / 6 months). Everything is derived
// from the AccountTransaction ledger, which is the same source of truth used
// by getCustomerAccount, so the numbers here can never disagree with the
// account screen.
//
// Accounting convention (unchanged from getCustomerAccount):
//   balance = invoices - returns - payments
//   * INVOICE  increases what the customer owes (debit)
//   * RETURN   reduces it (credit)
//   * PAYMENT  reduces it (credit; collected checks are PAYMENT ledger rows)
//
// The opening balance is the signed sum of EVERY ledger entry dated before the
// window starts — it is never assumed to be zero.

const SUPPORTED_PERIODS = Object.freeze({
    '1m': 1,
    '3m': 3,
    '6m': 6
});

// Business-timezone (server-local) day boundaries. The UI reads/writes dates in
// local time, so the report window is built in local time too and the exact
// calendar dates are echoed back to the client as YYYY-MM-DD strings.
const startOfDay = (date) =>
    new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
    );

const endOfDay = (date) =>
    new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23, 59, 59, 999
    );

// `from` = the same calendar day N months ago (start of day);
// `to`   = the end of today. Both ends are inclusive.
const buildPeriodWindow = (key) => {
    const months = SUPPORTED_PERIODS[key];
    const now = new Date();
    const to = endOfDay(now);
    const from = startOfDay(
        new Date(
            now.getFullYear(),
            now.getMonth() - months,
            now.getDate()
        )
    );

    return { key, months, from, to };
};

// A ledger entry's effect on the outstanding balance.
const signedEffect = (transaction) =>
    transaction.transactionType === 'INVOICE'
        ? (Number(transaction.amount) || 0)
        : -(Number(transaction.amount) || 0);

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Money is stored as plain numbers; keep two decimals to avoid float noise in
// the running balance.
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;


exports.getCustomerStatement = async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);
        const periodKey = String(req.query.period || '').trim().toLowerCase();

        // -----------------------------------
        // 1. Validate request parameters
        // -----------------------------------

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }

        if (!SUPPORTED_PERIODS[periodKey]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reporting period'
            });
        }


        // -----------------------------------
        // 2. Find the customer
        // -----------------------------------

        const customer = await Customer.findOne({ customerId });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }


        // -----------------------------------
        // 3. Reporting window
        // -----------------------------------

        const { months, from, to } = buildPeriodWindow(periodKey);


        // -----------------------------------
        // 4. The customer's full ledger
        //
        // One targeted query, oldest first: the pre-window entries are needed
        // for the opening balance and the in-window entries must be applied in
        // chronological order to produce a correct running balance.
        // -----------------------------------

        const transactions = await AccountTransaction
            .find({ customer: customer._id })
            .sort({ date: 1, createdAt: 1 })
            .lean();


        // -----------------------------------
        // 5. Opening balance + in-window entries
        // -----------------------------------

        let openingBalance = 0;
        let currentBalance = 0;
        const periodTransactions = [];

        transactions.forEach((transaction) => {
            const timestamp = new Date(
                transaction.date || transaction.createdAt
            ).getTime();

            // All-time balance (authoritative, same rule as the account view).
            currentBalance += signedEffect(transaction);

            if (timestamp < from.getTime()) {
                openingBalance += signedEffect(transaction);
            } else if (timestamp <= to.getTime()) {
                periodTransactions.push(transaction);
            }
        });


        // -----------------------------------
        // 6. In-window totals
        // -----------------------------------

        let totalSales = 0;
        let totalReturns = 0;
        let totalPayments = 0;

        periodTransactions.forEach((transaction) => {
            if (transaction.transactionType === 'INVOICE') {
                totalSales += Number(transaction.amount) || 0;
            } else if (transaction.transactionType === 'RETURN') {
                totalReturns += Number(transaction.amount) || 0;
            } else if (transaction.transactionType === 'PAYMENT') {
                totalPayments += Number(transaction.amount) || 0;
            }
        });


        // -----------------------------------
        // 7. Line-item detail for in-window invoices / returns
        //
        // Two targeted queries (never one per row) so the statement can show
        // model / quantity detail without fabricating anything. Payments carry
        // no items.
        // -----------------------------------

        const invoiceRefs = periodTransactions
            .filter((t) => t.transactionType === 'INVOICE')
            .map((t) => t.referenceNumber);

        const returnRefs = periodTransactions
            .filter((t) => t.transactionType === 'RETURN')
            .map((t) => t.referenceNumber);

        const [invoices, returns] = await Promise.all([
            invoiceRefs.length
                ? Invoice.find({
                    customer: customer._id,
                    invoiceNumber: { $in: invoiceRefs }
                })
                    .select('invoiceNumber items')
                    .populate('items.product', 'modelName modelCode')
                    .lean()
                : [],
            returnRefs.length
                ? Return.find({
                    customer: customer._id,
                    returnNumber: { $in: returnRefs }
                })
                    .select('returnNumber items')
                    .populate('items.product', 'modelName modelCode')
                    .lean()
                : []
        ]);

        const itemsByReference = new Map();

        const collectItems = (reference, docItems) => {
            const items = (docItems || []).map((item) => ({
                modelCode: item.modelCode,
                modelName:
                    (item.product && item.product.modelName) || '',
                quantity: Number(item.quantity) || 0,
                unitPrice: money(item.unitPrice),
                total: money(item.total)
            }));

            itemsByReference.set(reference, items);
        };

        invoices.forEach((invoice) =>
            collectItems(invoice.invoiceNumber, invoice.items));
        returns.forEach((ret) =>
            collectItems(ret.returnNumber, ret.items));


        // -----------------------------------
        // 8. Build the chronological statement rows
        // -----------------------------------

        let runningBalance = openingBalance;

        const statementTransactions = periodTransactions.map((transaction) => {
            const amount = Number(transaction.amount) || 0;

            let debit = 0;
            let credit = 0;

            if (transaction.transactionType === 'INVOICE') {
                debit = amount;
            } else {
                credit = amount;
            }

            runningBalance += debit - credit;

            const items = itemsByReference.get(transaction.referenceNumber) || [];
            const quantity = items.reduce(
                (sum, item) => sum + (Number(item.quantity) || 0),
                0
            );

            return {
                date: transaction.date || transaction.createdAt,
                type: transaction.transactionType,
                referenceNumber: transaction.referenceNumber,
                paymentMethod: transaction.paymentMethod || null,
                notes: transaction.notes || '',
                quantity,
                items,
                debit: money(debit),
                credit: money(credit),
                amount: money(amount),
                balance: money(runningBalance)
            };
        });

        const closingBalance = money(runningBalance);


        // -----------------------------------
        // 9. Response
        // -----------------------------------

        res.status(200).json({
            success: true,

            statement: {
                generatedAt: new Date().toISOString(),

                period: {
                    key: periodKey,
                    months,
                    from: from.toISOString(),
                    to: to.toISOString(),
                    fromDate: toDateKey(from),
                    toDate: toDateKey(to)
                },

                customer: {
                    customerId: customer.customerId,
                    name: customer.name,
                    showroomName: customer.showroomName,
                    mobileNumber: customer.mobileNumber,
                    address: customer.address
                },

                openingBalance: money(openingBalance),

                totals: {
                    sales: money(totalSales),
                    returns: money(totalReturns),
                    payments: money(totalPayments)
                },

                closingBalance,

                // All-time derived balance. When the window ends today (it
                // always does) the closing balance must match this; if the
                // ledger holds future-dated entries it may not, and `reconciled`
                // makes that visible instead of hiding it.
                currentBalance: money(currentBalance),
                reconciled:
                    Math.abs(closingBalance - money(currentBalance)) < 0.005,

                transactions: statementTransactions
            }
        });

    } catch (error) {

        console.error('Get Customer Statement Error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};