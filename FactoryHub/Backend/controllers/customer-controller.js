    const Customer = require('../models/Customer');


exports.createCustomer = async (req, res) => {
    try {
        const lastCustomer = await Customer
            .findOne()
            .sort({ customerId: -1 });

        const nextCustomerId = lastCustomer
            ? lastCustomer.customerId + 1
            : 100;

        const customer = await Customer.create({
            ...req.body,
            customerId: nextCustomerId
        });

        res.status(201).json({
            success: true,
            data: customer
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID already exists.'
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


    exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    };


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