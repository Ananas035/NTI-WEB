
const express = require('express');
const {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
    } = require('../controllers/customer-controller');

    const router = express.Router();
    const protect = require('../middleware/auth-middleware');
    const authorize = require('../middleware/role-middleware');

    router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

    router.route('/:id')
    .get(protect, getCustomerById)
    .patch(protect, updateCustomer)
    .delete(protect, authorize('ADMIN'), deleteCustomer);

    module.exports = router;