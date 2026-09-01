const express = require('express');

const {
    createPayment
} = require('../controllers/payment-controller');

const router = express.Router();
const protect = require('../middleware/auth-middleware');

router.post('/', protect, createPayment);

module.exports = router;