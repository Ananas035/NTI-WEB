const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        phone: {
            type: String,
            trim: true
        },

        role: {
            type: String,
            // ADMIN is the factory-administrator role (may configure the
            // factory profile). STAFF is a regular employee role that may view
            // the profile but never change it. Existing accounts are ADMIN and
            // keep working unchanged.
            enum: ['ADMIN', 'STAFF'],
            default: 'ADMIN'
        },

        // Email verification state.
        // Defaults to false for NEW accounts so an account can never be used
        // before its OTP challenge is verified. Pre-existing documents that
        // were created before this field existed have no value here, so
        // `isEmailVerified !== true` correctly treats them as unverified as
        // well (see middleware/auth-middleware.js). Existing accounts are
        // migrated deliberately with scripts/migrate-legacy-users.js.
        isEmailVerified: {
            type: Boolean,
            default: false,
            index: true
        },

        emailVerifiedAt: {
            type: Date,
            default: null
        },

        // Session/token version. Embedded into every access JWT and compared on
        // each protected request. Incrementing it revokes all previously issued
        // access tokens for this user (used after a password reset). Defaults to
        // 0 so existing tokens/users without the field remain valid until the
        // first reset.
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);