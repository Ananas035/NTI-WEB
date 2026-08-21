const express = require('express');

const {
    createInvoice,
    getInvoices,
    getInvoiceByNumber
} = require('../controllers/invoice-controller');

const router = express.Router();

router.post('/', createInvoice);

router.get('/', getInvoices);

router.get('/:invoiceNumber', getInvoiceByNumber);

module.exports = router;