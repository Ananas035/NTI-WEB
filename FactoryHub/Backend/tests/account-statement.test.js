/*
 * End-to-end integration tests for the Customer Account Statement feature and
 * the Return document data used by the return PDF.
 *
 * Run from the Backend folder:
 *   node tests/account-statement.test.js
 *
 * Harness mirrors tests/factory-profile.test.js:
 *   - separate database (DB_NAME=FactoryHub_OTPTest),
 *   - outbound email replaced by an in-memory capture (no SMTP needed),
 *   - outer rate limits raised so they do not perturb scenarios.
 *
 * The suite creates its own customers, products, invoices, returns and
 * payments, and removes every document it created at the end.
 */

process.env.DB_NAME = 'FactoryHub_OTPTest';
process.env.PORT = '5098';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.OTP_HASH_SECRET = 'test_otp_secret';
process.env.OTP_TTL_MINUTES = '5';
process.env.OTP_MAX_ATTEMPTS = '5';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '2';
process.env.RATE_LIMIT_LOGIN_MAX = '500';
process.env.RATE_LIMIT_SIGNUP_MAX = '500';
process.env.RATE_LIMIT_OTP_VERIFY_MAX = '500';
process.env.RATE_LIMIT_OTP_RESEND_MAX = '500';

const mongoose = require('mongoose');

const emailService = require('../services/email-service');
const sentEmails = new Map();
emailService.sendOtpEmail = async ({ to, otp }) => {
    sentEmails.set(String(to).toLowerCase(), otp);
    return { accepted: [to] };
};

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Return = require('../models/Return');
const Payment = require('../models/Payment');
const AccountTransaction = require('../models/AccountTransaction');
const InventoryTransaction = require('../models/InventoryTransaction');
const { start } = require('../server');

const BASE = `http://localhost:${process.env.PORT}`;

// Markers so cleanup only ever touches this suite's documents.
const CUSTOMER_TAG = 'AcctStmtTest';
const MODEL_BASE = 990000; // model codes 990001..990099

let passed = 0;
let failed = 0;
const results = [];
const check = (name, condition, detail = '') => {
    if (condition) {
        passed += 1;
        results.push(`PASS  ${name}`);
    } else {
        failed += 1;
        results.push(`FAIL  ${name}${detail ? `  -> ${detail}` : ''}`);
    }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getOtp = (email) => sentEmails.get(String(email).toLowerCase());

const apiJson = async (method, url, token, body) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${url}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let json = null;
    try { json = await res.json(); } catch { /* none */ }
    return { status: res.status, body: json };
};

const uniqueEmail = (tag) =>
    `acctstmt_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

const createVerifiedUser = async (tag) => {
    const email = uniqueEmail(tag);

    const signupRes = await apiJson('POST', '/api/auth/signup', null, {
        name: `User ${tag}`,
        email,
        password: 'InitialPass1',
        phone: '01000000000'
    });

    await apiJson('POST', '/api/auth/verify-email-otp', null, {
        challengeId: signupRes.body.data.challengeId,
        otp: getOtp(email)
    });

    const loginRes = await apiJson('POST', '/api/auth/login', null, {
        email,
        password: 'InitialPass1'
    });

    const verifyRes = await apiJson('POST', '/api/auth/verify-email-otp', null, {
        challengeId: loginRes.body.data.challengeId,
        otp: getOtp(email)
    });

    return { email, token: verifyRes.body.data.token };
};

// ---------------------------------------------------------------------------
// Local-date helpers (mirror the controller's business-timezone behaviour)
// ---------------------------------------------------------------------------

const dateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const expectedFromKey = (months) => {
    const now = new Date();
    return dateKey(new Date(now.getFullYear(), now.getMonth() - months, now.getDate()));
};

const expectedToKey = () => dateKey(new Date());

const monthsAgo = (months) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - months, now.getDate(), 10, 0, 0);
};

const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

// ---------------------------------------------------------------------------

const run = async () => {
    await start();

    let tries = 0;
    while (mongoose.connection.readyState !== 1 && tries < 50) {
        await wait(200);
        tries += 1;
    }
    if (mongoose.connection.readyState !== 1) {
        console.error('Could not connect to the test database. Aborting.');
        process.exit(1);
    }

    const admin = await createVerifiedUser('admin');

    // =====================================================
    // Fixtures
    // =====================================================

    const mkCustomer = async (suffix) => {
        const res = await apiJson('POST', '/api/customers', admin.token, {
            name: `${CUSTOMER_TAG} ${suffix}`,
            showroomName: `Showroom ${suffix}`,
            mobileNumber: '01000000000',
            address: 'Cairo'
        });
        return res.body.data;
    };

    const mkProduct = async (code, name, price, pieces) => {
        const res = await apiJson('POST', '/api/products', admin.token, {
            modelName: name,
            modelCode: code,
            price,
            availablePieces: pieces
        });
        return res.body.data;
    };

    const customerA = await mkCustomer('Alpha');
    const customerB = await mkCustomer('Beta');

    const p1 = await mkProduct(MODEL_BASE + 1, `${CUSTOMER_TAG} Model One`, 100, 100);
    const p2 = await mkProduct(MODEL_BASE + 2, `${CUSTOMER_TAG} Model Two`, 50, 100);

    const mkInvoice = async (customerId, items) =>
        apiJson('POST', '/api/invoices', admin.token, { customerId, items });

    const mkReturn = async (customerId, items) =>
        apiJson('POST', '/api/returns', admin.token, { customerId, items });

    const mkPayment = async (customerId, amount) =>
        apiJson('POST', '/api/payments', admin.token, {
            customerId,
            amount,
            paymentMethod: 'CASH',
            notes: `Payment ${amount}`
        });

    // ---------------------------------------------------
    // Customer A ledger
    //   Historical (outside every window):
    //     INV-H : 2 x P1 = 200          (8 months ago)
    //     PAY-H : 50                    (7 months ago)
    //   In window (chronological):
    //     INV-W1: 2 x P1 + 1 x P2 = 250 (3 days ago)
    //     INV-W2: 1 x P2           =  50 (2 days ago)
    //     RET-W : 1 x P1 + 1 x P2  = 150 (1 day ago)  <-- multi-item
    //     PAY-W : 30                    (today)
    //   opening = 200 - 50 = 150
    //   sales = 300, returns = 150, payments = 30
    //   closing = 150 + 300 - 150 - 30 = 270
    // ---------------------------------------------------

    const invH = await mkInvoice(customerA.customerId, [
        { modelCode: p1.modelCode, quantity: 2 }
    ]);
    const invHNumber = invH.body.data.invoiceNumber;

    await mkPayment(customerA.customerId, 50);
    const payHNumber = (await Payment.findOne({ customer: customerA._id }))
        .paymentNumber;

    const invW1 = await mkInvoice(customerA.customerId, [
        { modelCode: p1.modelCode, quantity: 2 },
        { modelCode: p2.modelCode, quantity: 1 }
    ]);
    const invW1Number = invW1.body.data.invoiceNumber;

    const invW2 = await mkInvoice(customerA.customerId, [
        { modelCode: p2.modelCode, quantity: 1 }
    ]);
    const invW2Number = invW2.body.data.invoiceNumber;

    const retW = await mkReturn(customerA.customerId, [
        { modelCode: p1.modelCode, quantity: 1 },
        { modelCode: p2.modelCode, quantity: 1 }
    ]);
    const retWNumber = retW.body.data.returnNumber;

    const payW = await mkPayment(customerA.customerId, 30);
    const payWNumber = payW.body.data.paymentNumber;

    // ---------------------------------------------------
    // Backdate to make the history deterministic.
    // ---------------------------------------------------

    const setDate = async (model, filter, date) => {
        await model.updateOne(filter, { $set: { date } });
    };

    await setDate(Invoice, { invoiceNumber: invHNumber }, monthsAgo(8));
    await setDate(
        AccountTransaction,
        { transactionType: 'INVOICE', referenceNumber: invHNumber },
        monthsAgo(8)
    );

    await setDate(Payment, { paymentNumber: payHNumber }, monthsAgo(7));
    await setDate(
        AccountTransaction,
        { transactionType: 'PAYMENT', referenceNumber: payHNumber },
        monthsAgo(7)
    );

    await setDate(Invoice, { invoiceNumber: invW1Number }, daysAgo(3));
    await setDate(
        AccountTransaction,
        { transactionType: 'INVOICE', referenceNumber: invW1Number },
        daysAgo(3)
    );

    await setDate(Invoice, { invoiceNumber: invW2Number }, daysAgo(2));
    await setDate(
        AccountTransaction,
        { transactionType: 'INVOICE', referenceNumber: invW2Number },
        daysAgo(2)
    );

    await setDate(Return, { returnNumber: retWNumber }, daysAgo(1));
    await setDate(
        AccountTransaction,
        { transactionType: 'RETURN', referenceNumber: retWNumber },
        daysAgo(1)
    );

    // PAY-W keeps today's date.

    // Customer B: an unrelated ledger that must never appear on A's statement.
    const invB = await mkInvoice(customerB.customerId, [
        { modelCode: p1.modelCode, quantity: 1 }
    ]);
    const invBNumber = invB.body.data.invoiceNumber;

    // =====================================================
    // Security / validation
    // =====================================================

    const noAuth = await apiJson(
        'GET',
        `/api/accounts/customer/${customerA.customerId}/statement?period=1m`,
        null
    );
    check('1. statement without token -> 401', noAuth.status === 401, `got ${noAuth.status}`);

    const badId = await apiJson(
        'GET',
        '/api/accounts/customer/0/statement?period=1m',
        admin.token
    );
    check('2. invalid customer id -> 400', badId.status === 400, `got ${badId.status}`);

    const badPeriod = await apiJson(
        'GET',
        `/api/accounts/customer/${customerA.customerId}/statement?period=99m`,
        admin.token
    );
    check('3. invalid period -> 400', badPeriod.status === 400, `got ${badPeriod.status}`);

    const missingPeriod = await apiJson(
        'GET',
        `/api/accounts/customer/${customerA.customerId}/statement`,
        admin.token
    );
    check('4. missing period -> 400', missingPeriod.status === 400, `got ${missingPeriod.status}`);

    const unknownCustomer = await apiJson(
        'GET',
        '/api/accounts/customer/999999/statement?period=1m',
        admin.token
    );
    check('5. unknown customer -> 404', unknownCustomer.status === 404, `got ${unknownCustomer.status}`);

    // =====================================================
    // Period windows (exact dates)
    // =====================================================

    for (const [key, months] of [['1m', 1], ['3m', 3], ['6m', 6]]) {
        const res = await apiJson(
            'GET',
            `/api/accounts/customer/${customerA.customerId}/statement?period=${key}`,
            admin.token
        );

        const st = res.body && res.body.statement;

        check(
            `6.${key} returns 200 with a statement`,
            res.status === 200 && !!st,
            `got ${res.status}`
        );

        check(
            `6.${key} exact period dates`,
            st.period.fromDate === expectedFromKey(months) &&
            st.period.toDate === expectedToKey(),
            JSON.stringify(st && st.period)
        );
    }

    // =====================================================
    // Accounting figures (6-month window)
    // =====================================================

    const six = await apiJson(
        'GET',
        `/api/accounts/customer/${customerA.customerId}/statement?period=6m`,
        admin.token
    );
    const s = six.body.statement;

    check('7. opening balance is the pre-period history (150)',
        s.openingBalance === 150, `got ${s.openingBalance}`);

    check('8. in-window sales total is 300',
        s.totals.sales === 300, `got ${s.totals.sales}`);

    check('9. in-window returns total is 150',
        s.totals.returns === 150, `got ${s.totals.returns}`);

    check('10. in-window payments total is 30',
        s.totals.payments === 30, `got ${s.totals.payments}`);

    check('11. closing balance is 270',
        s.closingBalance === 270, `got ${s.closingBalance}`);

    check('12. closing balance reconciles with the live account balance',
        s.currentBalance === 270 && s.reconciled === true,
        JSON.stringify({ current: s.currentBalance, reconciled: s.reconciled }));

    // Chronological order + running balance.
    const rows = s.transactions;
    check('13. in-window rows are the 4 expected transactions',
        rows.length === 4, `got ${rows.length}`);

    const ascending = rows.every((row, i) =>
        i === 0 || new Date(rows[i - 1].date).getTime() <= new Date(row.date).getTime()
    );
    check('14. rows are in chronological order', ascending);

    const expectedRunning = [400, 450, 300, 270];
    check('15. running balance after each row is correct',
        rows.map((r) => r.balance).join(',') === expectedRunning.join(','),
        rows.map((r) => r.balance).join(','));

    const returnRow = rows.find((r) => r.type === 'RETURN');
    check('16. return is credited (reduces the balance), never debited',
        returnRow.debit === 0 && returnRow.credit === 150,
        JSON.stringify(returnRow));

    check('17. multi-item return exposes both items',
        returnRow.items.length === 2 &&
        returnRow.items.reduce((sum, it) => sum + it.quantity, 0) === 2,
        JSON.stringify(returnRow.items));

    const paymentRow = rows.find((r) => r.type === 'PAYMENT');
    check('18. payment is credited and carries its method',
        paymentRow.debit === 0 && paymentRow.credit === 30 &&
        paymentRow.paymentMethod === 'CASH',
        JSON.stringify(paymentRow));

    check('19. historical entries are excluded from the rows but drive the opening balance',
        !rows.some((r) => r.referenceNumber === invHNumber || r.referenceNumber === payHNumber));

    // =====================================================
    // Isolation: other customers never leak in
    // =====================================================

    check('20. another customer\'s invoice never appears on this statement',
        !rows.some((r) => r.referenceNumber === invBNumber),
        invBNumber);

    // Customer B's own statement contains only B's invoice.
    const stB = (await apiJson(
        'GET',
        `/api/accounts/customer/${customerB.customerId}/statement?period=6m`,
        admin.token
    )).body.statement;

    check('21. a different customer gets their own isolated statement',
        stB.transactions.length === 1 &&
        stB.transactions[0].referenceNumber === invBNumber &&
        stB.openingBalance === 0,
        JSON.stringify(stB.transactions.map((t) => t.referenceNumber)));

    // =====================================================
    // Return document data (used by the return PDF)
    // =====================================================

    const productBefore = await Product.findOne({ modelCode: p1.modelCode });
    const balanceBefore = s.currentBalance;

    const retRes = await apiJson(
        'GET',
        `/api/returns/${encodeURIComponent(retWNumber)}`,
        admin.token
    );
    const retDoc = retRes.body && retRes.body.data;

    check('22. saved return is retrievable by its number',
        retRes.status === 200 &&
        retDoc.returnNumber === retWNumber &&
        retDoc.customer &&
        retDoc.customer.customerId === customerA.customerId,
        `got ${retRes.status}`);

    check('23. return document carries the recorded items and total',
        retDoc.items.length === 2 &&
        retDoc.returnTotal === 150 &&
        retDoc.items.every((it) => it.unitPrice > 0 && it.total === it.quantity * it.unitPrice),
        JSON.stringify({ total: retDoc.returnTotal, items: retDoc.items.length }));

    check('24. return item rows expose the model name (populated)',
        retDoc.items.every((it) => it.product && it.product.modelName),
        JSON.stringify(retDoc.items.map((it) => it.product)));

    const productAfter = await Product.findOne({ modelCode: p1.modelCode });
    const balanceAfter = (await apiJson(
        'GET',
        `/api/accounts/customer/${customerA.customerId}/statement?period=6m`,
        admin.token
    )).body.statement.currentBalance;

    check('25. reading a return document changes no inventory',
        productAfter.availablePieces === productBefore.availablePieces,
        `${productBefore.availablePieces} -> ${productAfter.availablePieces}`);

    check('26. reading a return document changes no account balance',
        balanceAfter === balanceBefore,
        `${balanceBefore} -> ${balanceAfter}`);

    const missingReturn = await apiJson('GET', '/api/returns/RET-9999', admin.token);
    check('27. nonexistent return -> 404', missingReturn.status === 404, `got ${missingReturn.status}`);

    const noAuthReturn = await apiJson('GET', `/api/returns/${retWNumber}`, null);
    check('28. return document without token -> 401', noAuthReturn.status === 401, `got ${noAuthReturn.status}`);

    const returnsForA = await apiJson('GET', '/api/returns', admin.token);
    const savedRet = returnsForA.body.data.find((r) => r.returnNumber === retWNumber);
    check('29. return appears in the registered-returns list',
        !!savedRet, 'missing from list');

    // =====================================================
    // Report
    // =====================================================

    console.log('\n===== ACCOUNT STATEMENT / RETURN PDF TEST RESULTS =====');
    results.forEach((line) => console.log(line));
    console.log(`\nPassed: ${passed}  Failed: ${failed}`);

    // =====================================================
    // Cleanup (only this suite's documents)
    // =====================================================

    const products = await Product.find({
        modelCode: { $gte: MODEL_BASE, $lt: MODEL_BASE + 100 }
    });
    const productIds = products.map((p) => p._id);

    const customers = await Customer.find({
        name: { $regex: `^${CUSTOMER_TAG}` }
    });
    const customerIds = customers.map((c) => c._id);

    await AccountTransaction.deleteMany({ customer: { $in: customerIds } });
    await Invoice.deleteMany({ customer: { $in: customerIds } });
    await Return.deleteMany({ customer: { $in: customerIds } });
    await Payment.deleteMany({ customer: { $in: customerIds } });
    await InventoryTransaction.deleteMany({ product: { $in: productIds } });
    await Product.deleteMany({ _id: { $in: productIds } });
    await Customer.deleteMany({ _id: { $in: customerIds } });
    await User.deleteMany({ email: { $regex: /^acctstmt_/ } });

    await mongoose.connection.close();
    process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
    console.error('Test run crashed:', error);
    process.exit(1);
});
