const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');

// =========================
// Configuration
// =========================
const RESET_TOKEN_TTL_MINUTES =
    Number(process.env.RESET_TOKEN_TTL_MINUTES) || 10;

// Keyed secret for hashing reset tokens. Falls back to the OTP/JWT secret so a
// fresh deployment works, but a dedicated value is recommended.
const RESET_TOKEN_SECRET =
    process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

// =========================
// Token generation / hashing
// =========================

// 256-bit random token handed to the client. High entropy so it cannot be
// guessed or brute-forced.
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// Deterministic HMAC-SHA256 digest. Determinism lets us look the token up by
// its hash directly (no plaintext scan) while still never storing the raw token.
const hashResetToken = (token) => {
    if (!RESET_TOKEN_SECRET) {
        throw new Error(
            'Reset token hashing secret is not configured (OTP_HASH_SECRET / JWT_SECRET)'
        );
    }

    return crypto
        .createHmac('sha256', RESET_TOKEN_SECRET)
        .update(`PASSWORD_RESET:${token}`)
        .digest('hex');
};

// Constant-time comparison for two hex digests (defensive; lookups are by hash).
const hashesEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');

    if (bufferA.length === 0 || bufferA.length !== bufferB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
};

// =========================
// Authorization lifecycle
// =========================

// Invalidate every still-pending reset authorization for a user (issued when a
// new one is created and after a successful password change).
const invalidatePendingAuthorizations = async (userId) => {
    await PasswordReset.updateMany(
        { user: userId, status: 'PENDING' },
        { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
    );
};

// Create a new authorization, invalidating any previous pending one so at most
// one reset token is ever active per account.
const createAuthorization = async ({ userId }) => {
    await invalidatePendingAuthorizations(userId);

    const token = generateResetToken();
    const now = new Date();

    const authorization = await PasswordReset.create({
        user: userId,
        tokenHash: hashResetToken(token),
        status: 'PENDING',
        expiresAt: new Date(
            now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
        )
    });

    // The raw token is returned ONLY here so it can be sent to the client once;
    // it is never persisted or logged.
    return { authorization, token };
};

module.exports = {
    RESET_TOKEN_TTL_MINUTES,
    generateResetToken,
    hashResetToken,
    hashesEqual,
    invalidatePendingAuthorizations,
    createAuthorization
};
