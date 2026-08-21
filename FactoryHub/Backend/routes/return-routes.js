const express = require('express');

const {
    createReturn,
    getReturns,
    getReturnByNumber
} = require('../controllers/return-controller');

const router = express.Router();

router.post('/', createReturn);

router.get('/', getReturns);

router.get('/:returnNumber', getReturnByNumber);

module.exports = router;