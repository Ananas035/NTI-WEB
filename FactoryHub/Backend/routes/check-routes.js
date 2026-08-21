const express = require('express');

const {
    createCheck,
    collectCheck,
    getChecks,
    getCheckByNumber
} = require('../controllers/check-controller');

const router = express.Router();

router.post('/', createCheck);

router.get('/', getChecks);

router.get('/:checkNumber', getCheckByNumber);

router.patch('/:checkNumber/collect', collectCheck);

module.exports = router;