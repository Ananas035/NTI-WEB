const express = require('express');

const {
    createReturn,
    getReturns,
    getReturnByNumber
} = require('../controllers/return-controller');

const router = express.Router();
const protect = require('../middleware/auth-middleware');

router.post('/', protect, createReturn);

router.get('/', protect, getReturns);

router.get('/:returnNumber', protect, getReturnByNumber);

module.exports = router;