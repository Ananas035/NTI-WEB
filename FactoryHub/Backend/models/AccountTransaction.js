const mongoose = require('mongoose');

const accountTransactionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required']
        },

        transactionType: {
            type: String,
            enum: ['INVOICE', 'RETURN', 'PAYMENT'],
            required: [true, 'Transaction type is required']
        },

        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative']
        },

        referenceNumber: {
            type: String,
            required: [true, 'Reference number is required'],
            trim: true
        },

        paymentMethod: {
            type: String,
            enum: ['CASH', 'CHECK', null],
            default: null
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

module.exports = mongoose.model(
    'AccountTransaction',
    accountTransactionSchema
);