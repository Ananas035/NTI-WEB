const mongoose = require('mongoose');

// One short-lived email OTP challenge, used for BOTH registration
// verification and login verification. The two flows are separated by the
// `purpose` field so an OTP issued for one flow can never authorise the other.
//
// Security notes:
//  - The OTP itself is NEVER stored. Only a keyed HMAC-SHA256 digest
//    (`otpHash`) is persisted, and the digest is bound to the challenge id,
//    purpose and owning user (see services/otp-service.js).
//  - `challengeId` is a 256-bit random hex string handed to the client. It is
//    the only reference the client ever holds before verification.
//  - `expiresAt` is the authoritative server-side expiry. The TTL index is a
//    housekeeping aid only: TTL deletion is asynchronous, so every code path
//    ALSO checks `expiresAt` explicitly and never relies on the TTL sweep.
const otpChallengeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // The email the code was sent to. Stored so resend/verify flows do not
        // need to re-read the user and so the destination is auditable.
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        purpose: {
            type: String,
            required: true,
            enum: ['REGISTRATION', 'LOGIN', 'PASSWORD_RESET'],
            index: true
        },

        challengeId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        // HMAC-SHA256 digest of (challengeId + purpose + user + otp).
        otpHash: {
            type: String,
            required: true
        },

        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'USED', 'EXPIRED', 'INVALIDATED'],
            default: 'PENDING',
            index: true
        },

        // Server-authoritative lifetime (5 minutes by default).
        expiresAt: {
            type: Date,
            required: true
        },

        // Verification-attempt bookkeeping (brute-force protection).
        attempts: {
            type: Number,
            default: 0
        },

        maxAttempts: {
            type: Number,
            default: 5
        },

        // Resend bookkeeping.
        resendCount: {
            type: Number,
            default: 0
        },

        lastSentAt: {
            type: Date,
            default: Date.now
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

// Housekeeping TTL: Mongo removes documents once expiresAt is in the past.
// NOTE: this is asynchronous and must never be treated as the security check.
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup of the single active challenge for a user/purpose (invalidation
// and "one active challenge" support).
otpChallengeSchema.index({ user: 1, purpose: 1, status: 1 });

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
