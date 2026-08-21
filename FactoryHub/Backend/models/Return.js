const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required']
        },

        modelCode: {
            type: Number,
            required: [true, 'Model code is required']
        },

        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be greater than 0']
        },

        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: [0, 'Unit price cannot be negative']
        },

        total: {
            type: Number,
            required: [true, 'Item total is required'],
            min: [0, 'Item total cannot be negative']
        }
    },
    {
        _id: false
    }
);

const returnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: String,
            required: [true, 'Return number is required'],
            unique: true,
            trim: true
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required']
        },

        date: {
            type: Date,
            default: Date.now
        },

        items: {
            type: [returnItemSchema],
            required: [true, 'Return items are required'],
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: 'Return must contain at least one item'
            }
        },

        returnTotal: {
            type: Number,
            required: [true, 'Return total is required'],
            min: [0, 'Return total cannot be negative']
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Return', returnSchema);