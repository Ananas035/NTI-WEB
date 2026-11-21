const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const PasswordReset = require('../models/PasswordReset');

// Required as module objects (not destructured) so the send function can be
// swapped in automated tests without changing application code.
const emailService = require('../services/email-service');
const otpService = require('../services/otp-service');
const passwordResetService = require('../services/password-reset-service');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;
const MIN_PASSWORD_LENGTH = 6;

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            // Session version: bumped on password reset to revoke old tokens.
            tokenVersion: user.tokenVersion || 0
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};

// The only user fields ever returned to a client.
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
});

// A short-lived reference to a pending verification challenge. Contains NO
// token and NO OTP.
const challengeResponse = (challenge) => ({
    requiresVerification: true,
    purpose: challenge.purpose,
    challengeId: challenge.challengeId,
    email: challenge.email,
    expiresAt: challenge.expiresAt,
    resendCooldownSeconds: otpService.OTP_RESEND_COOLDOWN_SECONDS
});

// Like challengeResponse but WITHOUT the stored email — password recovery must
// never disclose the account's email address to the browser.
const resetChallengeResponse = (challenge) => ({
    requiresVerification: true,
    purpose: challenge.purpose,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    resendCooldownSeconds: otpService.OTP_RESEND_COOLDOWN_SECONDS
});

// Anti-enumeration decoy: identical shape to a real reset challenge but backed
// by no database record and no email. Verification against it always fails, so
// callers cannot tell a matched account from an unmatched one.
const decoyResetChallengeResponse = () => ({
    requiresVerification: true,
    purpose: 'PASSWORD_RESET',
    challengeId: otpService.generateChallengeId(),
    expiresAt: new Date(
        Date.now() + otpService.OTP_TTL_MINUTES * 60 * 1000
    ),
    resendCooldownSeconds: otpService.OTP_RESEND_COOLDOWN_SECONDS
});

// Issue + email a fresh challenge. Emails FIRST, then persists, so a failed
// delivery never leaves a live code in the database.
const issueChallenge = async ({ userId, email, purpose }) => {
    const prepared = otpService.prepareChallenge({ userId, email, purpose });

    await emailService.sendOtpEmail({
        to: email,
        otp: prepared.otp,
        purpose
    });

    const challenge = await otpService.persistChallenge(prepared);
    return challenge;
};

// =========================
// Shared OTP verification
// =========================

// Validate + consume an OTP challenge. Shared by the login/registration and the
// password-reset verification endpoints so security behaviour is identical.
// Returns { ok:true, challenge } on success (the challenge is atomically marked
// USED) or { ok:false, status, message } on failure.
const consumeOtpChallenge = async (challenge, otp) => {
    if (!challenge) {
        return {
            ok: false,
            status: 400,
            message: 'Invalid or expired verification request'
        };
    }

    if (challenge.status === 'USED') {
        return {
            ok: false,
            status: 400,
            message: 'This verification code has already been used'
        };
    }

    if (challenge.status === 'INVALIDATED' || challenge.status === 'EXPIRED') {
        return {
            ok: false,
            status: 400,
            message: 'This verification request is no longer valid'
        };
    }

    const now = new Date();

    if (challenge.expiresAt <= now) {
        challenge.status = 'EXPIRED';
        await challenge.save();
        return { ok: false, status: 400, message: 'The verification code has expired' };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
        challenge.status = 'INVALIDATED';
        challenge.invalidatedAt = now;
        await challenge.save();
        return {
            ok: false,
            status: 429,
            message: 'Too many incorrect attempts. Please request a new code.'
        };
    }

    const providedHash = otpService.hashOtp({
        otp: String(otp).trim(),
        challengeId: challenge.challengeId,
        purpose: challenge.purpose,
        userId: challenge.user
    });

    if (!otpService.hashesEqual(providedHash, challenge.otpHash)) {
        const updated = await OtpChallenge.findOneAndUpdate(
            { _id: challenge._id, status: 'PENDING' },
            { $inc: { attempts: 1 } },
            { new: true }
        );

        if (updated && updated.attempts >= updated.maxAttempts) {
            await OtpChallenge.updateOne(
                { _id: updated._id },
                { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
            );
            return {
                ok: false,
                status: 429,
                message: 'Too many incorrect attempts. Please request a new code.'
            };
        }

        return { ok: false, status: 400, message: 'Incorrect verification code' };
    }

    // Correct code: consume atomically (one-time use under concurrency).
    const consumed = await OtpChallenge.findOneAndUpdate(
        { _id: challenge._id, status: 'PENDING', usedAt: null },
        { $set: { status: 'USED', usedAt: new Date() } },
        { new: true }
    );

    if (!consumed) {
        return {
            ok: false,
            status: 400,
            message: 'This verification code has already been used'
        };
    }

    return { ok: true, challenge: consumed };
};

// Shared resend logic. Emails the new code first, then rotates the hash so the
// previous code is invalidated. Returns { ok:true, challenge } or
// { ok:false, status, message, retryAfterSeconds? }.
const resendChallenge = async (challenge) => {
    if (!challenge || challenge.status !== 'PENDING') {
        return {
            ok: false,
            status: 400,
            message: 'Invalid or inactive verification request'
        };
    }

    const now = new Date();

    if (challenge.expiresAt <= now) {
        challenge.status = 'EXPIRED';
        await challenge.save();
        return {
            ok: false,
            status: 400,
            message: 'This verification request has expired'
        };
    }

    const elapsedMs = now.getTime() - new Date(challenge.lastSentAt).getTime();
    const cooldownMs = otpService.OTP_RESEND_COOLDOWN_SECONDS * 1000;

    if (elapsedMs < cooldownMs) {
        const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return {
            ok: false,
            status: 429,
            message: 'Please wait before requesting another code.',
            retryAfterSeconds
        };
    }

    // Send first so a delivery failure leaves the previous code untouched.
    const otp = otpService.generateOtp();

    try {
        await emailService.sendOtpEmail({
            to: challenge.email,
            otp,
            purpose: challenge.purpose
        });
    } catch (emailError) {
        return {
            ok: false,
            status: 502,
            message:
                'Could not send the verification email. Please try again shortly.'
        };
    }

    challenge.otpHash = otpService.hashOtp({
        otp,
        challengeId: challenge.challengeId,
        purpose: challenge.purpose,
        userId: challenge.user
    });
    challenge.expiresAt = new Date(
        now.getTime() + otpService.OTP_TTL_MINUTES * 60 * 1000
    );
    challenge.attempts = 0;
    challenge.resendCount += 1;
    challenge.lastSentAt = now;
    await challenge.save();

    return { ok: true, challenge };
};

// =========================
// SIGNUP  ->  registration verification required
// =========================
const signup = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'A valid email address is required'
            });
        }

        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        let user = await User.findOne({ email: normalizedEmail });

        if (user && user.isEmailVerified === true) {
            // Existing, active account.
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        if (user) {
            // An unverified account already exists for this email (e.g. an
            // interrupted registration). Re-registration updates the details to
            // the latest submission and re-issues a registration challenge, so
            // retries never create inconsistent or duplicate accounts.
            user.name = name;
            user.phone = phone;
            user.password = await bcrypt.hash(password, 10);
            await user.save();
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            user = await User.create({
                name,
                email: normalizedEmail,
                password: hashedPassword,
                phone,
                role: 'ADMIN',
                isEmailVerified: false
            });
        }

        let challenge;
        try {
            challenge = await issueChallenge({
                userId: user._id,
                email: user.email,
                purpose: 'REGISTRATION'
            });
        } catch (emailError) {
            // Do not report success and do not let the user proceed. The
            // unverified account remains so the user can retry registration.
            console.error('[Auth] Registration OTP email failed to send.');
            return res.status(502).json({
                success: false,
                message:
                    'Could not send the verification email. Please try again shortly.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Registration started. Please verify the code sent to your email.',
            data: challengeResponse(challenge)
        });
    } catch (error) {
        console.error('[Auth] Signup error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to complete registration at this time'
        });
    }
};

// =========================
// LOGIN  ->  login verification required
// =========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Generic message for both "no such user" and "wrong password" so the
        // response cannot be used to enumerate accounts.
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Credentials are valid but the account has not completed email
        // verification. No token is issued. Re-issue a registration challenge
        // so the user can finish verifying.
        if (user.isEmailVerified !== true) {
            let challenge = null;
            try {
                challenge = await issueChallenge({
                    userId: user._id,
                    email: user.email,
                    purpose: 'REGISTRATION'
                });
            } catch (emailError) {
                console.error('[Auth] Unverified-login OTP email failed to send.');
            }

            return res.status(403).json({
                success: false,
                message:
                    'Your email is not verified yet. Please verify the code sent to your email.',
                data: challenge ? challengeResponse(challenge) : null
            });
        }

        // Valid, verified credentials: create a LOGIN challenge. Still no token.
        let challenge;
        try {
            challenge = await issueChallenge({
                userId: user._id,
                email: user.email,
                purpose: 'LOGIN'
            });
        } catch (emailError) {
            console.error('[Auth] Login OTP email failed to send.');
            return res.status(502).json({
                success: false,
                message:
                    'Could not send the verification email. Please try again shortly.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Verification code sent to your email.',
            data: challengeResponse(challenge)
        });
    } catch (error) {
        console.error('[Auth] Login error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to sign in at this time'
        });
    }
};

// =========================
// VERIFY OTP (registration + login)
// =========================
const verifyEmailOtp = async (req, res) => {
    try {
        const { challengeId, otp } = req.body;

        if (!challengeId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Verification reference and code are required'
            });
        }

        if (!OTP_PATTERN.test(String(otp).trim())) {
            return res.status(400).json({
                success: false,
                message: 'The verification code must be 6 digits'
            });
        }

        const challenge = await OtpChallenge.findOne({ challengeId });

        // A password-reset code must never authorise a login/session.
        if (challenge && challenge.purpose === 'PASSWORD_RESET') {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification request'
            });
        }

        const result = await consumeOtpChallenge(challenge, otp);

        if (!result.ok) {
            return res.status(result.status).json({
                success: false,
                message: result.message
            });
        }

        const consumed = result.challenge;
        const user = await User.findById(consumed.user);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification request'
            });
        }

        if (consumed.purpose === 'REGISTRATION') {
            // Activate the account on registration verification.
            user.isEmailVerified = true;
            user.emailVerifiedAt = new Date();
            await user.save();
        } else if (user.isEmailVerified !== true) {
            // A LOGIN code must never grant access to an unverified account.
            return res.status(403).json({
                success: false,
                message: 'This account has not been verified'
            });
        }

        // Retire any other outstanding codes for this user.
        await OtpChallenge.updateMany(
            { user: user._id, status: 'PENDING' },
            { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
        );

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message:
                consumed.purpose === 'REGISTRATION'
                    ? 'Account verified successfully'
                    : 'Login successful',
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        console.error('[Auth] Verify OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify the code at this time'
        });
    }
};

// =========================
// RESEND OTP (registration + login)
// =========================
const resendEmailOtp = async (req, res) => {
    try {
        const { challengeId } = req.body;

        if (!challengeId) {
            return res.status(400).json({
                success: false,
                message: 'Verification reference is required'
            });
        }

        const challenge = await OtpChallenge.findOne({ challengeId });

        if (challenge && challenge.purpose === 'PASSWORD_RESET') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive verification request'
            });
        }

        const result = await resendChallenge(challenge);

        if (!result.ok) {
            const body = {
                success: false,
                message: result.message
            };

            if (result.retryAfterSeconds) {
                body.retryAfterSeconds = result.retryAfterSeconds;
            }

            return res.status(result.status).json(body);
        }

        return res.status(200).json({
            success: true,
            message: 'A new verification code has been sent to your email.',
            data: challengeResponse(result.challenge)
        });
    } catch (error) {
        console.error('[Auth] Resend OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to resend the code at this time'
        });
    }
};

// =========================
// PASSWORD RECOVERY — helpers
// =========================

// Keep only digits so "0100 000 0000" and "01000000000" compare equal.
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

// Find the single account whose identifier (email or name) AND stored phone
// match the supplied values. Returns null unless exactly one account matches.
const findAccountByIdentifierAndPhone = async (identifier, phoneDigits) => {
    const id = String(identifier || '').trim();

    if (!id || !phoneDigits) {
        return null;
    }

    const byEmail = await User.findOne({ email: id.toLowerCase() });

    // Username (name) lookup is case-insensitive; email takes precedence.
    const candidates = byEmail
        ? [byEmail]
        : await User.find({ name: id }).collation({
              locale: 'en',
              strength: 2
          });

    const matches = candidates.filter(
        (candidate) =>
            candidate.phone &&
            normalizePhone(candidate.phone) === phoneDigits
    );

    // Ambiguous (multiple) or no match -> treated as "not identified".
    return matches.length === 1 ? matches[0] : null;
};

// =========================
// FORGOT PASSWORD — stage 1 (account identification)
// =========================
const forgotPassword = async (req, res) => {
    // Generic public message used for BOTH matched and unmatched requests so
    // the endpoint cannot be used to enumerate accounts.
    const GENERIC_MESSAGE =
        'If the provided details match an account, a verification code has been sent to its email.';

    try {
        const { identifier, phone } = req.body;

        if (!identifier || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Account identifier and phone number are required'
            });
        }

        const phoneDigits = normalizePhone(phone);

        if (phoneDigits.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A valid phone number is required'
            });
        }

        const user = await findAccountByIdentifierAndPhone(identifier, phoneDigits);

        // No matching account: behave exactly like success but send nothing.
        if (!user) {
            return res.status(200).json({
                success: true,
                message: GENERIC_MESSAGE,
                data: decoyResetChallengeResponse()
            });
        }

        // Matched: the OTP destination is the STORED email only — never a value
        // supplied by the request.
        let challenge;
        try {
            challenge = await issueChallenge({
                userId: user._id,
                email: user.email,
                purpose: 'PASSWORD_RESET'
            });
        } catch (emailError) {
            console.error('[Auth] Password-reset OTP email failed to send.');
            return res.status(502).json({
                success: false,
                message:
                    'Could not send the verification email. Please try again shortly.'
            });
        }

        return res.status(200).json({
            success: true,
            message: GENERIC_MESSAGE,
            data: resetChallengeResponse(challenge)
        });
    } catch (error) {
        console.error('[Auth] Forgot-password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to start password recovery at this time'
        });
    }
};

// =========================
// VERIFY RESET OTP — stage 2
// =========================
const verifyResetOtp = async (req, res) => {
    try {
        const { challengeId, otp } = req.body;

        if (!challengeId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Verification reference and code are required'
            });
        }

        if (!OTP_PATTERN.test(String(otp).trim())) {
            return res.status(400).json({
                success: false,
                message: 'The verification code must be 6 digits'
            });
        }

        const challenge = await OtpChallenge.findOne({ challengeId });

        // Only a PASSWORD_RESET challenge may authorise a reset. A registration
        // or login challenge id is rejected outright.
        if (!challenge || challenge.purpose !== 'PASSWORD_RESET') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification request'
            });
        }

        const result = await consumeOtpChallenge(challenge, otp);

        if (!result.ok) {
            return res.status(result.status).json({
                success: false,
                message: result.message
            });
        }

        const user = await User.findById(result.challenge.user);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification request'
            });
        }

        // Issue a dedicated, short-lived, single-use reset authorization. This
        // is NOT a login token and grants no access to application endpoints.
        const { token, authorization } =
            await passwordResetService.createAuthorization({
                userId: user._id
            });

        // No other reset codes should remain usable once one is verified.
        await OtpChallenge.updateMany(
            { user: user._id, purpose: 'PASSWORD_RESET', status: 'PENDING' },
            { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
        );

        return res.status(200).json({
            success: true,
            message: 'Verification successful. You can now set a new password.',
            data: {
                resetToken: token,
                expiresAt: authorization.expiresAt
            }
        });
    } catch (error) {
        console.error('[Auth] Verify-reset-OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify the code at this time'
        });
    }
};

// =========================
// RESEND RESET OTP — stage 2 helper
// =========================
const resendResetOtp = async (req, res) => {
    try {
        const { challengeId } = req.body;

        if (!challengeId) {
            return res.status(400).json({
                success: false,
                message: 'Verification reference is required'
            });
        }

        const challenge = await OtpChallenge.findOne({ challengeId });

        if (!challenge || challenge.purpose !== 'PASSWORD_RESET') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive verification request'
            });
        }

        const result = await resendChallenge(challenge);

        if (!result.ok) {
            const body = {
                success: false,
                message: result.message
            };

            if (result.retryAfterSeconds) {
                body.retryAfterSeconds = result.retryAfterSeconds;
            }

            return res.status(result.status).json(body);
        }

        return res.status(200).json({
            success: true,
            message: 'A new verification code has been sent to your email.',
            data: resetChallengeResponse(result.challenge)
        });
    } catch (error) {
        console.error('[Auth] Resend-reset-OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to resend the code at this time'
        });
    }
};

// =========================
// RESET PASSWORD — stage 3
// =========================
const resetPassword = async (req, res) => {
    try {
        const { resetToken, password } = req.body;

        if (!resetToken || !password) {
            return res.status(400).json({
                success: false,
                message: 'Reset authorization and new password are required'
            });
        }

        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const tokenHash = passwordResetService.hashResetToken(
            String(resetToken).trim()
        );

        const authorization = await PasswordReset.findOne({ tokenHash });

        if (!authorization) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset authorization'
            });
        }

        if (authorization.status === 'USED') {
            return res.status(400).json({
                success: false,
                message: 'This reset authorization has already been used'
            });
        }

        if (
            authorization.status === 'INVALIDATED' ||
            authorization.status === 'EXPIRED'
        ) {
            return res.status(400).json({
                success: false,
                message: 'This reset authorization is no longer valid'
            });
        }

        const now = new Date();

        if (authorization.expiresAt <= now) {
            authorization.status = 'EXPIRED';
            await authorization.save();
            return res.status(400).json({
                success: false,
                message: 'This reset authorization has expired'
            });
        }

        // Hash the new password BEFORE consuming the authorization, so a hashing
        // failure cannot burn the authorization.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Consume the authorization atomically; a concurrent second request
        // cannot also succeed (one-time use).
        const consumed = await PasswordReset.findOneAndUpdate(
            { _id: authorization._id, status: 'PENDING', usedAt: null },
            { $set: { status: 'USED', usedAt: new Date() } },
            { new: true }
        );

        if (!consumed) {
            return res.status(400).json({
                success: false,
                message: 'This reset authorization has already been used'
            });
        }

        const user = await User.findById(consumed.user);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset authorization'
            });
        }

        // Replace the hash and bump the session version so every previously
        // issued access token for this account is revoked.
        user.password = hashedPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        // Invalidate all outstanding challenges (login, registration, reset) and
        // any other pending reset authorizations for this account.
        await OtpChallenge.updateMany(
            { user: user._id, status: 'PENDING' },
            { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
        );

        await PasswordReset.updateMany(
            { user: user._id, status: 'PENDING' },
            { $set: { status: 'INVALIDATED', invalidatedAt: new Date() } }
        );

        // Success response never contains the password or its hash.
        return res.status(200).json({
            success: true,
            message: 'Password reset successful. Please sign in with your new password.'
        });
    } catch (error) {
        console.error('[Auth] Reset-password error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to reset the password at this time'
        });
    }
};

module.exports = {
    signup,
    login,
    verifyEmailOtp,
    resendEmailOtp,
    forgotPassword,
    verifyResetOtp,
    resendResetOtp,
    resetPassword
};
