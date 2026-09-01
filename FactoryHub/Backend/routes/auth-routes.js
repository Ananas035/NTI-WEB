const express = require('express');

const {
    signup,
    login
} = require('../controllers/auth-controller');

const protect = require('../middleware/auth-middleware');
const authorize = require('../middleware/role-middleware');

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.get('/profile', protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

router.get('/admin', protect, authorize('ADMIN'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome Admin',
        user: req.user
    });
});

module.exports = router;