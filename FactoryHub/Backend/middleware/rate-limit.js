const { rateLimit } = require('express-rate-limit');

// Shared response shape, consistent with the rest of the API.
const tooMany = (message) => ({
    success: false,
    message
});

// A custom handler keeps the JSON contract stable and avoids leaking the
// default text body.
const handler = (message) => (req, res) => {
    res.status(429).json(tooMany(message));
};

const makeLimiter = ({ windowMs, limit, message }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: handler(message)
    });

// Login attempts per IP. Password guessing is throttled before any OTP is sent.
const loginLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
    message: 'Too many login attempts. Please try again later.'
});

// Registration attempts per IP.
const signupLimiter = makeLimiter({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 5,
    message: 'Too many registration attempts. Please try again later.'
});

// OTP verification attempts per IP. Complements the per-challenge attempt cap.
const otpVerifyLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_OTP_VERIFY_MAX) || 30,
    message: 'Too many verification attempts. Please try again later.'
});

// OTP resend requests per IP. The per-challenge 60s cooldown is enforced in the
// controller as well; this is an additional outer bound per client.
const otpResendLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_OTP_RESEND_MAX) || 10,
    message: 'Too many resend requests. Please try again later.'
});

// =========================
// Password recovery limiters
// =========================

// Forgot-password (account identification) requests per IP. Bounds both
// identifier guessing and the number of recovery emails a client can trigger.
const forgotPasswordLimiter = makeLimiter({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX) || 5,
    message: 'Too many password recovery attempts. Please try again later.'
});

// Password-reset OTP verification attempts per IP.
const resetVerifyLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_RESET_VERIFY_MAX) || 30,
    message: 'Too many verification attempts. Please try again later.'
});

// Password-reset OTP resend requests per IP.
const resetResendLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_RESET_RESEND_MAX) || 10,
    message: 'Too many resend requests. Please try again later.'
});

// Password-reset completion attempts per IP.
const resetPasswordLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_RESET_PASSWORD_MAX) || 20,
    message: 'Too many reset attempts. Please try again later.'
});

module.exports = {
    loginLimiter,
    signupLimiter,
    otpVerifyLimiter,
    otpResendLimiter,
    forgotPasswordLimiter,
    resetVerifyLimiter,
    resetResendLimiter,
    resetPasswordLimiter
};
