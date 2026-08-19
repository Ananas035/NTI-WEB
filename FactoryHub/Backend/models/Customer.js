const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
        {
        name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        },
        showroomName: {
        type: String,
        required: [true, 'Showroom/Store name is required'],
        trim: true,
        },
        mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        },
        address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        },
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
    );

module.exports = mongoose.model('Customer', customerSchema);