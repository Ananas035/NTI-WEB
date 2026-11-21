/*
 * End-to-end integration tests for the Forgot Password / Password Reset flow.
 *
 * Run from the Backend folder:
 *   node tests/password-reset.test.js
 *
 * Same harness philosophy as tests/otp-flow.test.js:
 *  - separate database (DB_NAME=FactoryHub_OTPTest) on the configured cluster,
 *  - outbound email is replaced by an in-memory capture (no SMTP needed),
 *  - rate-limit windows raised so outer IP limits do not perturb scenarios
 *    (the per-challenge cooldown is still exercised for real).
 */

process.env.DB_NAME = 'FactoryHub_OTPTest';
process.env.PORT = '5098';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.OTP_HASH_SECRET = 'test_otp_secret';
process.env.OTP_TTL_MINUTES = '5';
process.env.OTP_MAX_ATTEMPTS = '5';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '2';
process.env.RESET_TOKEN_TTL_MINUTES = '10';
process.env.RATE_LIMIT_LOGIN_MAX = '500';
process.env.RATE_LIMIT_SIGNUP_MAX = '500';
process.env.RATE_LIMIT_OTP_VERIFY_MAX = '500';
process.env.RATE_LIMIT_OTP_RESEND_MAX = '500';
process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX = '500';
process.env.RATE_LIMIT_RESET_VERIFY_MAX = '500';
process.env.RATE_LIMIT_RESET_RESEND_MAX = '500';
process.env.RATE_LIMIT_RESET_PASSWORD_MAX = '500';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailService = require('../services/email-service');
const sentEmails = new Map(); // email -> { otp, purpose, at }
let failNextEmail = false;

emailService.sendOtpEmail = async ({ to, otp, purpose }) => {
    if (failNextEmail) {
        failNextEmail = false;
        throw new Error('Failed to send verification email');
    }
    sentEmails.set(String(to).toLowerCase(), { otp, purpose, at: Date.now() });
    return { accepted: [to] };
};

const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const PasswordReset = require('../models/PasswordReset');
const { start } = require('../server');

const BASE = `http://localhost:${process.env.PORT}`;
const OTP_RE = /^\d{6}$/;

let passed = 0;
let failed = 0;
const results = [];

const check = (name, condition, detail = '') => {
    if (condition) {
        passed += 1;
        results.push(`PASS  ${name}`);
    } else {
        failed += 1;
        results.push(`FAIL  ${name}${detail ? `  -> ${detail}` : ''}`);
    }
};

const api = async (method, path, body) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* none */ }
    return { status: res.status, body: json };
};

const uniqueEmail = (tag) =>
    `pwreset_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

const getOtp = (email) => sentEmails.get(String(email).toLowerCase())?.otp;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Create a fully verified account and return { email, phone, password, name }.
const createVerifiedUser = async (tag, phone, name, password = 'InitialPass1') => {
    const email = uniqueEmail(tag);

    const signup = await api('POST', '/api/auth/signup', {
        name,
        email,
        password,
        phone
    });

    const signupOtp = getOtp(email);
    await api('POST', '/api/auth/verify-email-otp', {
        challengeId: signup.body.data.challengeId,
        otp: signupOtp
    });

    return { email, phone, password, name };
};

// Run stages 1-2 for an account and return the reset authorization token.
const obtainResetToken = async (identifier, phone) => {
    const forgot = await api('POST', '/api/auth/forgot-password', {
        identifier,
        phone
    });

    const otp = getOtp(identifier);
    const verify = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: forgot.body.data.challengeId,
        otp
    });

    return { forgot, verify, token: verify.body?.data?.resetToken };
};

const run = async () => {
    await start();

    let tries = 0;
    while (mongoose.connection.readyState !== 1 && tries < 50) {
        await wait(200);
        tries += 1;
    }
    if (mongoose.connection.readyState !== 1) {
        console.error('Could not connect to the test database. Aborting.');
        process.exit(1);
    }

    await User.deleteMany({ email: { $regex: /^pwreset_/ } });
    await OtpChallenge.deleteMany({ email: { $regex: /^pwreset_/ } });

    // =====================================================
    // 1. Valid identifier (email) + matching phone -> OTP
    // =====================================================
    const userA = await createVerifiedUser('a', '01011111111', 'Owner A');
    const forgotA = await api('POST', '/api/auth/forgot-password', {
        identifier: userA.email,
        phone: '01011111111'
    });
    check('1. valid identifier+phone -> 200', forgotA.status === 200, `got ${forgotA.status}`);
    check('1. no email disclosed in response', forgotA.body?.data?.email === undefined, JSON.stringify(forgotA.body?.data));
    check('1. purpose is PASSWORD_RESET', forgotA.body?.data?.purpose === 'PASSWORD_RESET');
    const otpA = getOtp(userA.email);
    check('1. OTP emailed, 6 digits', OTP_RE.test(otpA || ''), `otp=${otpA}`);

    // username (name) also works as identifier
    const forgotByUsername = await api('POST', '/api/auth/forgot-password', {
        identifier: 'Owner A',
        phone: '01011111111'
    });
    check('1b. username identifier works', forgotByUsername.status === 200 && forgotByUsername.body?.data?.challengeId, `got ${forgotByUsername.status}`);

    // =====================================================
    // 2. Invalid username/email -> generic, no email
    // =====================================================
    const before = sentEmails.size;
    const forgotBad = await api('POST', '/api/auth/forgot-password', {
        identifier: uniqueEmail('ghost'),
        phone: '01011111111'
    });
    check('2. unknown identifier -> 200 generic', forgotBad.status === 200, `got ${forgotBad.status}`);
    check('2. unknown identifier still returns a challengeId (no enumeration)', Boolean(forgotBad.body?.data?.challengeId));
    check('2. no email sent for unknown identifier', sentEmails.size === before, 'an email was sent');

    // The decoy challenge id must not verify.
    const decoyVerify = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: forgotBad.body.data.challengeId,
        otp: '123456'
    });
    check('2b. decoy challenge cannot be verified', decoyVerify.status === 400, `got ${decoyVerify.status}`);

    // =====================================================
    // 3. Incorrect phone -> generic, no email
    // =====================================================
    const before3 = sentEmails.size;
    const forgotWrongPhone = await api('POST', '/api/auth/forgot-password', {
        identifier: userA.email,
        phone: '01999999999'
    });
    check('3. wrong phone -> 200 generic', forgotWrongPhone.status === 200, `got ${forgotWrongPhone.status}`);
    check('3. no email sent on wrong phone', sentEmails.size === before3, 'an email was sent');

    // =====================================================
    // 4. Identifier and phone belonging to different accounts
    // =====================================================
    const userB = await createVerifiedUser('b', '01022222222', 'Owner B');
    const before4 = sentEmails.size;
    const mixed = await api('POST', '/api/auth/forgot-password', {
        identifier: userB.email,
        phone: '01011111111' // belongs to A, not B
    });
    check('4. mixed identifier/phone -> generic', mixed.status === 200, `got ${mixed.status}`);
    check('4. no email sent for mixed data', sentEmails.size === before4, 'an email was sent');

    // =====================================================
    // 6. Caller cannot choose the OTP destination
    // =====================================================
    const attackerAddr = uniqueEmail('attacker');
    await api('POST', '/api/auth/forgot-password', {
        identifier: userA.email,
        phone: '01011111111',
        email: attackerAddr // malicious extra field
    });
    check('6. OTP went to the STORED email', Boolean(getOtp(userA.email)));
    check('6. OTP NOT sent to attacker-supplied address', getOtp(attackerAddr) === undefined);

    // =====================================================
    // 7/8. Successful verification + incorrect OTP
    // =====================================================
    const forgotU = await api('POST', '/api/auth/forgot-password', {
        identifier: userA.email,
        phone: '01011111111'
    });
    const challengeU = forgotU.body.data.challengeId;
    const otpU = getOtp(userA.email);

    const badOtp = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: challengeU,
        otp: otpU === '000000' ? '111111' : '000000'
    });
    check('8. incorrect OTP -> 400', badOtp.status === 400, `got ${badOtp.status}`);

    const goodOtp = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: challengeU,
        otp: otpU
    });
    check('7. correct OTP -> 200', goodOtp.status === 200, `got ${goodOtp.status}`);
    check('7. reset token issued', typeof goodOtp.body?.data?.resetToken === 'string' && goodOtp.body.data.resetToken.length >= 32);
    check('7. no login token issued on reset verification', goodOtp.body?.data?.token === undefined);
    check('7. no user/email disclosed', goodOtp.body?.data?.user === undefined && goodOtp.body?.data?.email === undefined);

    // =====================================================
    // 10. OTP used more than once
    // =====================================================
    const reuseOtp = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: challengeU,
        otp: otpU
    });
    check('10. reused reset OTP -> 400', reuseOtp.status === 400, `got ${reuseOtp.status}`);

    // =====================================================
    // 11/12. Registration and login OTPs are rejected here
    // =====================================================
    // Unverified user -> registration challenge.
    const regEmail = uniqueEmail('reg');
    const regSignup = await api('POST', '/api/auth/signup', {
        name: 'Reg User',
        email: regEmail,
        password: 'InitialPass1',
        phone: '01033333333'
    });
    const regChallenge = regSignup.body.data.challengeId;
    const regOtp = getOtp(regEmail);

    const regOnReset = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: regChallenge,
        otp: regOtp
    });
    check('11. registration OTP rejected by reset verification', regOnReset.status === 400, `got ${regOnReset.status}`);
    check('11. registration OTP does not yield a reset token', regOnReset.body?.data?.resetToken === undefined);

    // Login challenge for a verified user.
    const loginStart = await api('POST', '/api/auth/login', {
        email: userB.email,
        password: userB.password
    });
    const loginChallenge = loginStart.body.data.challengeId;
    const loginOtp = getOtp(userB.email);
    const loginOnReset = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: loginChallenge,
        otp: loginOtp
    });
    check('12. login OTP rejected by reset verification', loginOnReset.status === 400, `got ${loginOnReset.status}`);

    // And a reset OTP must not work on the normal verify endpoint.
    const resetForgot = await api('POST', '/api/auth/forgot-password', {
        identifier: userB.email,
        phone: userB.phone
    });
    const resetChallengeB = resetForgot.body.data.challengeId;
    const resetOtpB = getOtp(userB.email);
    const resetOnNormal = await api('POST', '/api/auth/verify-email-otp', {
        challengeId: resetChallengeB,
        otp: resetOtpB
    });
    check('12b. reset OTP rejected by normal verify endpoint', resetOnNormal.status === 400, `got ${resetOnNormal.status}`);

    // =====================================================
    // 9. Expired reset OTP
    // =====================================================
    const expEmail = uniqueEmail('exp');
    const expUser = await createVerifiedUser('exp', '01044444444', 'Exp User');
    const expForgot = await api('POST', '/api/auth/forgot-password', {
        identifier: expUser.email,
        phone: '01044444444'
    });
    const expChallenge = expForgot.body.data.challengeId;
    const expOtp = getOtp(expUser.email);
    await OtpChallenge.updateOne(
        { challengeId: expChallenge },
        { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );
    const expVerify = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: expChallenge,
        otp: expOtp
    });
    check('9. expired reset OTP -> 400', expVerify.status === 400, `got ${expVerify.status}`);

    // =====================================================
    // 23. Resend cooldown + new code invalidates old
    // =====================================================
    const reUser = await createVerifiedUser('resend', '01055555555', 'Resend User');
    const reForgot = await api('POST', '/api/auth/forgot-password', {
        identifier: reUser.email,
        phone: '01055555555'
    });
    const reChallenge = reForgot.body.data.challengeId;
    const reOldOtp = getOtp(reUser.email);

    const earlyResend = await api('POST', '/api/auth/resend-reset-otp', {
        challengeId: reChallenge
    });
    check('23. reset resend before cooldown -> 429', earlyResend.status === 429, `got ${earlyResend.status}`);
    check('23. cooldown reports retryAfterSeconds', typeof earlyResend.body?.retryAfterSeconds === 'number');

    await wait(2200);
    const resend = await api('POST', '/api/auth/resend-reset-otp', {
        challengeId: reChallenge
    });
    check('23. reset resend after cooldown -> 200', resend.status === 200, `got ${resend.status}`);
    const reNewOtp = getOtp(reUser.email);
    check('23. resend issued a different code', Boolean(reNewOtp) && reNewOtp !== reOldOtp);

    const reOldAttempt = await api('POST', '/api/auth/verify-reset-otp', {
        challengeId: reChallenge,
        otp: reOldOtp
    });
    check('23. old reset code invalidated', reOldAttempt.status === 400, `got ${reOldAttempt.status}`);

    // =====================================================
    // 13/14/15. Reset authorization: expiry, missing, replay
    // =====================================================
    const noAuth = await api('POST', '/api/auth/reset-password', {
        password: 'BrandNewPass1'
    });
    check('14. reset without authorization -> 400', noAuth.status === 400, `got ${noAuth.status}`);

    const bogusAuth = await api('POST', '/api/auth/reset-password', {
        resetToken: 'a'.repeat(64),
        password: 'BrandNewPass1'
    });
    check('13. bogus reset token -> 400', bogusAuth.status === 400, `got ${bogusAuth.status}`);

    // =====================================================
    // 18/19/20/21. Full successful reset (user A)
    // =====================================================
    const fullUser = await createVerifiedUser('full', '01066666666', 'Full User', 'OldPass123');

    // Obtain a login token BEFORE the reset so we can prove revocation.
    const preLogin = await api('POST', '/api/auth/login', {
        email: fullUser.email,
        password: 'OldPass123'
    });
    const preToken = (await api('POST', '/api/auth/verify-email-otp', {
        challengeId: preLogin.body.data.challengeId,
        otp: getOtp(fullUser.email)
    })).body.data.token;
    const preProtected = await api('GET', '/api/products', undefined);
    // (no token -> 401); now with token:
    const preRes = await fetch(`${BASE}/api/products`, { headers: { Authorization: `Bearer ${preToken}` } });
    check('22. protected endpoint works with a valid pre-reset token', preRes.status === 200, `got ${preRes.status}`);

    const { token: fullResetToken } = await obtainResetToken(fullUser.email, '01066666666');
    check('18. obtained reset authorization', typeof fullResetToken === 'string');

    const resetDone = await api('POST', '/api/auth/reset-password', {
        resetToken: fullResetToken,
        password: 'NewPass456'
    });
    check('18. reset completed -> 200', resetDone.status === 200, `got ${resetDone.status}`);
    check('18. response has no password/hash', !/password|hash/i.test(JSON.stringify(resetDone.body)) || resetDone.body?.data === undefined);

    const dbUser = await User.findOne({ email: fullUser.email });
    check('18. new hash stored (old password fails golden check)', await bcrypt.compare('NewPass456', dbUser.password) === true);
    check('18. old password no longer matches stored hash', await bcrypt.compare('OldPass123', dbUser.password) === false);

    // 19. old password rejected at login
    const oldLogin = await api('POST', '/api/auth/login', {
        email: fullUser.email,
        password: 'OldPass123'
    });
    check('19. old password rejected after reset -> 401', oldLogin.status === 401, `got ${oldLogin.status}`);

    // 20/21. new password accepted, fresh login OTP still required
    const newLogin = await api('POST', '/api/auth/login', {
        email: fullUser.email,
        password: 'NewPass456'
    });
    check('20. new password accepted -> 200 challenge', newLogin.status === 200, `got ${newLogin.status}`);
    check('21. login still requires a fresh OTP (no token yet)', newLogin.body?.data?.token === undefined && newLogin.body?.data?.requiresVerification === true);
    check('21. a new login OTP was emailed', OTP_RE.test(getOtp(fullUser.email) || ''));

    // 22b. old access token revoked by tokenVersion bump
    const preAfter = await fetch(`${BASE}/api/products`, { headers: { Authorization: `Bearer ${preToken}` } });
    check('22b. pre-reset access token revoked -> 401', preAfter.status === 401, `got ${preAfter.status}`);

    // 15. reuse the reset authorization
    const reuseAuth = await api('POST', '/api/auth/reset-password', {
        resetToken: fullResetToken,
        password: 'AnotherPass789'
    });
    check('15. reused reset authorization -> 400', reuseAuth.status === 400, `got ${reuseAuth.status}`);

    // 13b. expired authorization
    const expAuthUser = await createVerifiedUser('authz', '01077777777', 'Authz User');
    const { token: expResetToken } = await obtainResetToken(expAuthUser.email, '01077777777');
    await PasswordReset.updateOne(
        { tokenHash: require('../services/password-reset-service').hashResetToken(expResetToken) },
        { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );
    const expAuth = await api('POST', '/api/auth/reset-password', {
        resetToken: expResetToken,
        password: 'Whatever123'
    });
    check('13b. expired reset authorization -> 400', expAuth.status === 400, `got ${expAuth.status}`);

    // =====================================================
    // 17. Password policy
    // =====================================================
    const policyUser = await createVerifiedUser('policy', '01088888888', 'Policy User');
    const { token: policyToken } = await obtainResetToken(policyUser.email, '01088888888');
    const shortPw = await api('POST', '/api/auth/reset-password', {
        resetToken: policyToken,
        password: '123'
    });
    check('17. short password violates policy -> 400', shortPw.status === 400, `got ${shortPw.status}`);

    // =====================================================
    // 24. SMTP failure handled safely (matched account)
    // =====================================================
    const smtpUser = await createVerifiedUser('smtp', '01099999999', 'Smtp User');
    failNextEmail = true;
    const smtpFail = await api('POST', '/api/auth/forgot-password', {
        identifier: smtpUser.email,
        phone: '01099999999'
    });
    check('24. SMTP failure on matched account -> 502', smtpFail.status === 502, `got ${smtpFail.status}`);
    const pendingAfter = await OtpChallenge.countDocuments({
        email: smtpUser.email,
        purpose: 'PASSWORD_RESET',
        status: 'PENDING'
    });
    check('24. no live reset challenge left after SMTP failure', pendingAfter === 0, `pending=${pendingAfter}`);

    // =====================================================
    // 25. Concurrent reset attempts cannot reuse one authorization
    // =====================================================
    const concUser = await createVerifiedUser('conc', '01012121212', 'Concurrent User');
    const { token: concToken } = await obtainResetToken(concUser.email, '01012121212');

    const [r1, r2] = await Promise.all([
        api('POST', '/api/auth/reset-password', { resetToken: concToken, password: 'Concurrent1' }),
        api('POST', '/api/auth/reset-password', { resetToken: concToken, password: 'Concurrent1' })
    ]);
    const statuses = [r1.status, r2.status].sort();
    check('25. exactly one concurrent reset succeeds', statuses[0] === 200 && statuses[1] === 400, `statuses=${statuses}`);

    const concUserDb = await User.findOne({ email: concUser.email });
    check('25. password set exactly once to the new value', await bcrypt.compare('Concurrent1', concUserDb.password) === true);

    // =====================================================
    // Log hygiene: responses never contain OTP/token/hash material
    // =====================================================
    const leak = JSON.stringify([
        forgotA.body,
        forgotBad.body,
        goodOtp.body,
        resetDone.body
    ]);
    check(
        'no OTP/password/hash in recovery responses',
        !/"password"|"otp"|"otpHash"|"tokenHash"/i.test(leak),
        'unexpected field present'
    );

    // ---- report ----
    console.log('\n===== PASSWORD RESET TEST RESULTS =====');
    results.forEach((line) => console.log(line));
    console.log(`\nPassed: ${passed}  Failed: ${failed}`);

    // ---- cleanup ----
    await User.deleteMany({ email: { $regex: /^pwreset_/ } });
    await OtpChallenge.deleteMany({ email: { $regex: /^pwreset_/ } });
    await PasswordReset.deleteMany({ tokenHash: { $exists: true } });
    await mongoose.connection.close();

    process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
    console.error('Test run crashed:', error);
    process.exit(1);
});
