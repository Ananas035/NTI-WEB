const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        customerId: {
            type: Number,
            unique: true,
            required: true
        },

        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },

        showroomName: {
            type: String,
            required: [true, 'Showroom/Store name is required'],
            trim: true
        },

        mobileNumber: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true
        },

        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Customer', customerSchema);