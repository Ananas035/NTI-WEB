    const mongoose = require('mongoose');

    const productSchema = new mongoose.Schema(
    {
        modelName: {
        type: String,
        required: [true, 'Model name is required'],
        trim: true,
        },
        modelCode: {
        type: Number,
        required: [true, 'Model code is required'],
        unique: true,
        min: [1, 'Model code must be greater than 0'],
        },
        price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        },
        availablePieces: {
        type: Number,
        default: 0,
        min: [0, 'Available pieces cannot be negative'],
        },
        colors: {
        type: [String], // Array of strings as specified
        default: [],
        },
        image: {
        type: String,
        default: 'no-image.jpg', // Will be updated later via Multer
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
    );

    module.exports = mongoose.model('Product', productSchema);