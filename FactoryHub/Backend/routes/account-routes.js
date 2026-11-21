const express = require('express');

const {
    getCustomerAccount,
    getCustomerStatement
} = require('../controllers/account-controller');

const protect = require('../middleware/auth-middleware');

const router = express.Router();

router.get(
    '/customer/:customerId',
    protect,
    getCustomerAccount
);

// Account statement (period report). Must be declared before the plain
// customer route would ever be confused with it; Express matches the more
// specific '/customer/:customerId/statement' path independently.
router.get(
    '/customer/:customerId/statement',
    protect,
    getCustomerStatement
);

module.exports = router;