    const Customer = require('../models/Customer');

    // @desc    Create a new customer
    // @route   POST /api/customers
    exports.createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
    };

    // @desc    Get all customers
    // @route   GET /api/customers
    exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    };

    // @desc    Get single customer by ID
    // @route   GET /api/customers/:id
    exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    };

    // @desc    Update customer
    // @route   PATCH /api/customers/:id
    exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Returns the updated document
        runValidators: true, // Ensures validation rules run on update
        });
        if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
    };

    // @desc    Delete customer
    // @route   DELETE /api/customers/:id
    exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    };