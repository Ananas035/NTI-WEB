const express = require('express');

const {
    getCustomerAccount
} = require('../controllers/account-controller');

const router = express.Router();

router.get(
    '/customer/:customerId',
    getCustomerAccount
);

module.exports = router;