const crypto = require('crypto');
const OtpChallenge = require('../models/OtpChallenge');

// =========================
// Configuration (env-driven, secure defaults)
// =========================
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 5;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RESEND_COOLDOWN_SECONDS =
    Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;

// Secret used to key the OTP digest. The digest binds the code to its
// challenge/purpose/user, so even with database read access an attacker cannot
// recover the 6-digit code without this secret. Falls back to JWT_SECRET so a
// fresh deployment still works, but a dedicated value is recommended.
const OTP_HASH_SECRET =
    process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

if (!OTP_HASH_SECRET) {
    // Thrown lazily inside hashOtp so requiring the module never crashes the
    // server just to print a warning.
    console.warn(
        '[OTP] No OTP_HASH_SECRET or JWT_SECRET configured. OTP hashing is unavailable.'
    );
}

// =========================
// OTP generation
// =========================

// Cryptographically secure 6-digit numeric code ("000000".."999999").
// crypto.randomInt is used instead of Math.random which is not suitable for
// security-sensitive values.
const generateOtp = () => {
    const value = crypto.randomInt(0, 1000000);
    return String(value).padStart(6, '0');
};

// =========================
// OTP hashing / comparison
// =========================

const hashOtp = ({ otp, challengeId, purpose, userId }) => {
    if (!OTP_HASH_SECRET) {
        throw new Error(
            'OTP hashing secret is not configured (OTP_HASH_SECRET / JWT_SECRET)'
        );
    }

    // Bind the digest to the challenge id, purpose and user so a code is only
    // ever valid for the exact challenge it was issued for.
    const message =
        `${challengeId}:${purpose}:${String(userId)}:${otp}`;

    return crypto
        .createHmac('sha256', OTP_HASH_SECRET)
        .update(message)
        .digest('hex');
};

// Constant-time comparison of two hex digests.
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
// Challenge helpers
// =========================

const generateChallengeId = () => crypto.randomBytes(32).toString('hex');

// Invalidate every still-pending challenge for a user/purpose. Used before a
// new challenge is issued and after a successful verification so that at most
// one code is ever active for a given user and flow.
const invalidatePendingChallenges = async (userId, purpose) => {
    await OtpChallenge.updateMany(
        { user: userId, purpose, status: 'PENDING' },
        { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
    );
};

// Prepare (but do NOT persist) a brand-new challenge. The plaintext OTP is
// returned only so the caller can email it; it is never stored or logged.
// Callers email first and persist only after a successful send, so a failed
// email never leaves a live-but-undelivered code in the database.
const prepareChallenge = ({ userId, email, purpose }) => {
    const challengeId = generateChallengeId();
    const otp = generateOtp();
    const now = new Date();

    return {
        challengeId,
        otp,
        email,
        purpose,
        user: userId,
        otpHash: hashOtp({ otp, challengeId, purpose, userId }),
        status: 'PENDING',
        expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000),
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        resendCount: 0,
        lastSentAt: now
    };
};

// Persist a prepared challenge, invalidating any previous pending one for the
// same user/purpose so at most one code is active at a time.
const persistChallenge = async (prepared) => {
    await invalidatePendingChallenges(prepared.user, prepared.purpose);
    return OtpChallenge.create(prepared);
};

module.exports = {
    OTP_TTL_MINUTES,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
    generateOtp,
    hashOtp,
    hashesEqual,
    generateChallengeId,
    invalidatePendingChallenges,
    prepareChallenge,
    persistChallenge
};
