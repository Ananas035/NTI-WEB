const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        paymentNumber: {
            type: String,
            required: [true, 'Payment number is required'],
            unique: true,
            trim: true
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required']
        },

        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0.01, 'Payment amount must be greater than 0']
        },

        paymentMethod: {
            type: String,
            enum: ['CASH', 'CHECK'],
            required: [true, 'Payment method is required']
        },

        notes: {
            type: String,
            trim: true,
            default: ''
        },

        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Payment', paymentSchema);