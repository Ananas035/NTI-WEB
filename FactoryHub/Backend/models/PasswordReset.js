const mongoose = require('mongoose');

// A short-lived, single-use authorization issued ONLY after a successful
// PASSWORD_RESET OTP verification. It authorises exactly one password change
// for exactly one account. It is deliberately NOT a login JWT:
//   - it is never accepted by the normal auth middleware,
//   - it carries no role and grants no access to business endpoints,
//   - it expires quickly (10 minutes by default),
//   - it is consumed atomically on first use.
//
// Only a keyed HMAC-SHA256 digest of the token is stored (`tokenHash`), so a
// database leak does not reveal a usable token. `expiresAt` is the
// authoritative server-side expiry; the TTL index is asynchronous housekeeping
// only and is never relied upon as the security check.
const passwordResetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // HMAC-SHA256 digest of the raw reset token.
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'USED', 'EXPIRED', 'INVALIDATED'],
            default: 'PENDING',
            index: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        usedAt: {
            type: Date,
            default: null
        },

        invalidatedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Asynchronous housekeeping only.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup of the active authorization for a user during cleanup.
passwordResetSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
