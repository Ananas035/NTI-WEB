const mongoose = require('mongoose');

// A single authoritative factory profile per installation.
//
// Factory Hub is the software; this document is the *business identity* of the
// actual factory that prints on invoices and business documents. It is
// deliberately a factory-level record (NOT per user) so every employee sees the
// same identity and only an administrator can change it.
//
// The `singleton` field is a fixed, unique key that guarantees at most one
// profile document can ever exist: every write is an upsert filtered on it.
const factoryProfileSchema = new mongoose.Schema(
    {
        singleton: {
            type: String,
            default: 'factory',
            unique: true,
            immutable: true
        },

        // Official factory name (required) — shown prominently on invoices.
        factoryName: {
            type: String,
            required: [true, 'Factory name is required'],
            trim: true,
            maxlength: [150, 'Factory name is too long']
        },

        // Manager / administration representative (optional). The fixed Arabic
        // label "إدارة" is rendered on invoices in the frontend; it is NOT a
        // stored field.
        managerName: {
            type: String,
            trim: true,
            required: [true, 'Manager name is required'],
            default: '',
            maxlength: [150, 'Manager name is too long']
        },

        // Contact phone for the factory / management (required).
        phone: {
            type: String,
            required: [true, 'Contact phone is required'],
            trim: true,
            maxlength: [11, 'Phone number is too long']
        },

        // Optional extras that existing business documents can use.
        address: {
            type: String,
            trim: true,
            default: '',
            maxlength: [200, 'Address is too long']
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
            maxlength: [150, 'Email is too long']
        },

        // Relative public URL of the uploaded logo, e.g.
        // "/uploads/factory/factory-logo-....png". Never an absolute filesystem
        // path. Empty string means "no logo configured".
        logoUrl: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('FactoryProfile', factoryProfileSchema);
