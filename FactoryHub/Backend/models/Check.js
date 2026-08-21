const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema(
    {
        checkNumber: {
            type: String,
            required: [true, 'Check number is required'],
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
            required: [true, 'Check amount is required'],
            min: [0.01, 'Check amount must be greater than 0']
        },

        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true
        },

        collectionDate: {
            type: Date,
            required: [true, 'Collection date is required']
        },

        status: {
            type: String,
            enum: ['UNDER_COLLECTION', 'COLLECTED'],
            default: 'UNDER_COLLECTION'
        },

        collectedAt: {
            type: Date,
            default: null
        },

        notes: {
            type: String,
            trim: true,
            default: ''
        },

        dateAdded: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Check', checkSchema);