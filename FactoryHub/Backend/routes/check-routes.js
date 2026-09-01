const express = require('express');

const {
    createCheck,
    collectCheck,
    getChecks,
    getCheckByNumber
} = require('../controllers/check-controller');

const router = express.Router();
const protect = require('../middleware/auth-middleware');

router.post('/', protect, createCheck);

router.get('/', protect, getChecks);

router.get('/:checkNumber', protect, getCheckByNumber);

router.patch('/:checkNumber/collect', protect, collectCheck);

module.exports = router;