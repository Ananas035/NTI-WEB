const express = require('express');

const {
    signup,
    login,
    verifyEmailOtp,
    resendEmailOtp,
    forgotPassword,
    verifyResetOtp,
    resendResetOtp,
    resetPassword
} = require('../controllers/auth-controller');

const protect = require('../middleware/auth-middleware');
const authorize = require('../middleware/role-middleware');

const {
    loginLimiter,
    signupLimiter,
    otpVerifyLimiter,
    otpResendLimiter,
    forgotPasswordLimiter,
    resetVerifyLimiter,
    resetResendLimiter,
    resetPasswordLimiter
} = require('../middleware/rate-limit');

const router = express.Router();

// Registration: starts email verification (no token issued).
router.post('/signup', signupLimiter, signup);

// Login: verifies the password, then starts email verification (no token yet).
router.post('/login', loginLimiter, login);

// Complete either flow. Only here is a usable JWT issued.
router.post('/verify-email-otp', otpVerifyLimiter, verifyEmailOtp);

// Re-issue a code for a still-valid pending challenge (cooldown + rate limited).
router.post('/resend-email-otp', otpResendLimiter, resendEmailOtp);

// =========================
// Password recovery (unauthenticated by design)
// =========================

// Stage 1: identify the account by identifier + phone and email a reset OTP.
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

// Stage 2: verify the reset OTP and obtain a single-use reset authorization.
router.post('/verify-reset-otp', resetVerifyLimiter, verifyResetOtp);

// Stage 2 helper: re-issue a reset OTP for the same pending challenge.
router.post('/resend-reset-otp', resetResendLimiter, resendResetOtp);

// Stage 3: complete the reset using the reset authorization (NOT a login JWT).
router.post('/reset-password', resetPasswordLimiter, resetPassword);

router.get('/profile', protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

router.get('/admin', protect, authorize('ADMIN'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome Admin',
        user: req.user
    });
});

module.exports = router;
