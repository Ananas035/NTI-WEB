const express = require('express');

const {
    createInvoice,
    getInvoices,
    getInvoiceByNumber
} = require('../controllers/invoice-controller');

const router = express.Router();
const protect = require('../middleware/auth-middleware');

router.post('/', protect, createInvoice);

router.get('/', protect, getInvoices);

router.get('/:invoiceNumber', protect, getInvoiceByNumber);

module.exports = router;