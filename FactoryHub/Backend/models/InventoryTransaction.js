const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required']
        },

        transactionType: {
            type: String,
            enum: {
                values: ['ADD', 'RESTOCK', 'SALE', 'RETURN'],
                message: 'Transaction type must be ADD, RESTOCK, SALE, or RETURN'
            },
            required: [true, 'Transaction type is required']
        },

        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be greater than 0']
        },

        previousInventory: {
            type: Number,
            required: [true, 'Previous inventory is required'],
            min: [0, 'Previous inventory cannot be negative']
        },

        currentInventory: {
            type: Number,
            required: [true, 'Current inventory is required'],
            min: [0, 'Current inventory cannot be negative']
        },

        referenceNumber: {
            type: String,
            default: null,
            trim: true
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
    'InventoryTransaction',
    inventoryTransactionSchema
);