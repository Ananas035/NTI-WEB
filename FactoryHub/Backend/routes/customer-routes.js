
const express = require('express');
const {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
    } = require('../controllers/customer-controller');

    const router = express.Router();

    router.route('/')
    .get(getCustomers)
    .post(createCustomer);

    router.route('/:id')
    .get(getCustomerById)
    .patch(updateCustomer)
    .delete(deleteCustomer);

    module.exports = router;