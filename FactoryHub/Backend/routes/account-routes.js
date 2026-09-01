const express = require('express');

const {
    getCustomerAccount
} = require('../controllers/account-controller');

const protect = require('../middleware/auth-middleware');

const router = express.Router();

router.get(
    '/customer/:customerId',
    protect,
    getCustomerAccount
);

module.exports = router;