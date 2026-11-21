/*
 * End-to-end integration tests for the email OTP authentication flow.
 *
 * Run from the Backend folder:
 *   node tests/otp-flow.test.js
 *
 * Design notes:
 *  - Uses a SEPARATE database (DB_NAME=FactoryHub_OTPTest) on the configured
 *    MongoDB cluster and drops it afterwards, so production data is untouched.
 *  - The outbound email is replaced with an in-memory capture, so no SMTP
 *    credentials are required and no real mail is sent. This is the only
 *    substitution: all authentication/OTP logic runs for real.
 *  - Rate-limit windows are raised for the run so scenario tests are not
 *    perturbed by the outer IP limiter (the per-challenge cooldown is still
 *    exercised for real).
 */

// ---- Environment must be set BEFORE any project module is required ----
process.env.DB_NAME = 'FactoryHub_OTPTest';
process.env.PORT = '5099';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.OTP_HASH_SECRET = 'test_otp_secret';
process.env.OTP_TTL_MINUTES = '5';
process.env.OTP_MAX_ATTEMPTS = '5';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '2';
process.env.RATE_LIMIT_LOGIN_MAX = '500';
process.env.RATE_LIMIT_SIGNUP_MAX = '500';
process.env.RATE_LIMIT_OTP_VERIFY_MAX = '500';
process.env.RATE_LIMIT_OTP_RESEND_MAX = '500';

const mongoose = require('mongoose');

// Capture outbound emails instead of sending them.
const emailService = require('../services/email-service');
const sentEmails = new Map(); // email -> { otp, purpose, at }
let failNextEmail = false;

emailService.sendOtpEmail = async ({ to, otp, purpose }) => {
    if (failNextEmail) {
        failNextEmail = false;
        const err = new Error('Failed to send verification email');
        throw err;
    }
    sentEmails.set(String(to).toLowerCase(), { otp, purpose, at: Date.now() });
    return { accepted: [to] };
};

const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const { start } = require('../server');

const BASE = `http://localhost:${process.env.PORT}`;
const OTP_RE = /^\d{6}$/;

// ---- tiny test runner ----
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

const api = async (method, path, token, body) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* no body */ }
    return { status: res.status, body: json };
};

const uniqueEmail = (tag) =>
    `otp_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

const getOtp = (email) => sentEmails.get(email.toLowerCase())?.otp;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
    // Start the API (connects the DB and begins listening).
    await start();

    // Wait for the DB connection to be ready.
    let tries = 0;
    while (mongoose.connection.readyState !== 1 && tries < 50) {
        await wait(200);
        tries += 1;
    }
    if (mongoose.connection.readyState !== 1) {
        console.error('Could not connect to the test database. Aborting.');
        process.exit(1);
    }

    // Clean leftover test data from previous runs (no dropDatabase privilege
    // is assumed on the test database).
    await User.deleteMany({});
    await OtpChallenge.deleteMany({});

    // =====================================================
    // 1. Registration sends a 6-digit OTP
    // =====================================================
    const regEmail = uniqueEmail('reg');
    const regPassword = 'Secret123';
    const signup = await api('POST', '/api/auth/signup', null, {
        name: 'Test Owner',
        email: regEmail,
        password: regPassword,
        phone: '01000000000'
    });

    check('1. signup returns 201', signup.status === 201, `got ${signup.status}`);
    check(
        '1. signup requires verification and issues no token',
        signup.body?.data?.requiresVerification === true &&
            signup.body?.data?.token === undefined,
        JSON.stringify(signup.body)
    );
    check(
        '1. signup response never contains an OTP',
        !JSON.stringify(signup.body).match(/\d{6}/) ||
            !('otp' in (signup.body?.data || {})),
        'otp leaked in response'
    );

    const regOtp = getOtp(regEmail);
    check('1. a registration OTP was emailed', Boolean(regOtp), 'no email captured');
    check('1. OTP is exactly 6 numeric digits', OTP_RE.test(regOtp || ''), `otp=${regOtp}`);

    const regChallengeId = signup.body.data.challengeId;

    // =====================================================
    // 3. Protected endpoint before verification is impossible
    //    (no token exists yet, so also covers "no token" case)
    // =====================================================
    const noToken = await api('GET', '/api/products', null);
    check('3. protected endpoint without token -> 401', noToken.status === 401, `got ${noToken.status}`);

    const profileNoToken = await api('GET', '/api/auth/profile', null);
    check('15. profile without token -> 401', profileNoToken.status === 401, `got ${profileNoToken.status}`);

    // =====================================================
    // 7. Incorrect OTP is rejected
    // =====================================================
    const wrong = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: regChallengeId,
        otp: '000000' === regOtp ? '111111' : '000000'
    });
    check('7. wrong OTP -> 400', wrong.status === 400, `got ${wrong.status}`);
    check('7. wrong OTP issues no token', wrong.body?.data?.token === undefined);

    // =====================================================
    // 2. Correct registration OTP verifies the account + issues token
    // =====================================================
    const verifyReg = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: regChallengeId,
        otp: regOtp
    });
    check('2. correct registration OTP -> 200', verifyReg.status === 200, `got ${verifyReg.status}`);
    check('2. token issued after verification', typeof verifyReg.body?.data?.token === 'string' && verifyReg.body.data.token.length > 0);

    const regToken = verifyReg.body?.data?.token;

    const userDoc = await User.findOne({ email: regEmail });
    check('2. account marked verified in DB', userDoc?.isEmailVerified === true);

    // Protected business module now works with the token.
    const products = await api('GET', '/api/products', regToken);
    check('17. business endpoint works after verification', products.status === 200, `got ${products.status}`);

    // =====================================================
    // 4. Login with an UNVERIFIED account is blocked
    // =====================================================
    const unvEmail = uniqueEmail('unverified');
    const unvSignup = await api('POST', '/api/auth/signup', null, {
        name: 'Unverified',
        email: unvEmail,
        password: 'Secret123'
    });
    check('4. unverified signup started', unvSignup.status === 201);

    const unvLogin = await api('POST', '/api/auth/login', null, {
        email: unvEmail,
        password: 'Secret123'
    });
    check('4. login on unverified account -> 403', unvLogin.status === 403, `got ${unvLogin.status}`);
    check('4. unverified login issues no token', unvLogin.body?.data?.token === undefined);

    // =====================================================
    // 5. Verified login: password ok -> challenge, no token yet
    // =====================================================
    const login1 = await api('POST', '/api/auth/login', null, {
        email: regEmail,
        password: regPassword
    });
    check('5. verified login -> 200 challenge', login1.status === 200, `got ${login1.status}`);
    check(
        '5. no access token before OTP verification',
        login1.body?.data?.token === undefined && login1.body?.data?.requiresVerification === true
    );

    const loginOtp = getOtp(regEmail);
    check('5. a LOGIN OTP was emailed', Boolean(loginOtp));
    check('5. login OTP is 6 digits', OTP_RE.test(loginOtp || ''));

    const loginChallengeId = login1.body.data.challengeId;

    // =====================================================
    // 6. Verify login OTP -> token
    // =====================================================
    const verifyLogin = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: loginChallengeId,
        otp: loginOtp
    });
    check('6. correct login OTP -> 200 + token', verifyLogin.status === 200 && typeof verifyLogin.body?.data?.token === 'string');

    // =====================================================
    // 9. Reusing a consumed OTP is rejected
    // =====================================================
    const reuse = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: loginChallengeId,
        otp: loginOtp
    });
    check('9. reused OTP -> 400', reuse.status === 400, `got ${reuse.status}`);
    check('9. reuse issues no token', reuse.body?.data?.token === undefined);

    // =====================================================
    // 8. Expired OTP is rejected (via server-side expiresAt)
    // =====================================================
    const expEmail = uniqueEmail('expired');
    const expSignup = await api('POST', '/api/auth/signup', null, {
        name: 'Expired',
        email: expEmail,
        password: 'Secret123'
    });
    const expChallengeId = expSignup.body.data.challengeId;
    const expOtp = getOtp(expEmail);

    await OtpChallenge.updateOne(
        { challengeId: expChallengeId },
        { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const expired = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: expChallengeId,
        otp: expOtp
    });
    check('8. expired OTP -> 400', expired.status === 400, `got ${expired.status}`);

    // =====================================================
    // 10. Exceeding max verification attempts invalidates the challenge
    // =====================================================
    const attEmail = uniqueEmail('attempts');
    const attSignup = await api('POST', '/api/auth/signup', null, {
        name: 'Attempts',
        email: attEmail,
        password: 'Secret123'
    });
    const attChallengeId = attSignup.body.data.challengeId;
    const attOtp = getOtp(attEmail);

    let lastAttemptStatus = 0;
    for (let i = 0; i < 5; i += 1) {
        const attempt = await api('POST', '/api/auth/verify-email-otp', null, {
            challengeId: attChallengeId,
            otp: '000000' === attOtp ? '111111' : '000000'
        });
        lastAttemptStatus = attempt.status;
    }
    check('10. attempt cap reached -> 429', lastAttemptStatus === 429, `got ${lastAttemptStatus}`);

    // Even the correct code now fails: the challenge is invalidated.
    const afterCap = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: attChallengeId,
        otp: attOtp
    });
    check('10. invalidated challenge rejects correct code', afterCap.status === 400, `got ${afterCap.status}`);

    // =====================================================
    // 11/12. Resend cooldown + new code invalidates the old one
    // =====================================================
    const reEmail = uniqueEmail('resend');
    const reSignup = await api('POST', '/api/auth/signup', null, {
        name: 'Resend',
        email: reEmail,
        password: 'Secret123'
    });
    const reChallengeId = reSignup.body.data.challengeId;
    const oldOtp = getOtp(reEmail);

    // 11. Immediate resend is blocked by the server cooldown.
    const earlyResend = await api('POST', '/api/auth/resend-email-otp', null, {
        challengeId: reChallengeId
    });
    check('11. resend before cooldown -> 429', earlyResend.status === 429, `got ${earlyResend.status}`);
    check('11. cooldown reports retryAfterSeconds', typeof earlyResend.body?.retryAfterSeconds === 'number');

    // Wait out the (test) cooldown, then resend.
    await wait(2200);
    const resend = await api('POST', '/api/auth/resend-email-otp', null, {
        challengeId: reChallengeId
    });
    check('12. resend after cooldown -> 200', resend.status === 200, `got ${resend.status}`);

    const newOtp = getOtp(reEmail);
    check('12. a different code was issued', Boolean(newOtp) && newOtp !== oldOtp, `old=${oldOtp} new=${newOtp}`);

    // 12. The previous code no longer works.
    const oldCodeAttempt = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: reChallengeId,
        otp: oldOtp
    });
    check('12. old code invalidated -> 400', oldCodeAttempt.status === 400, `got ${oldCodeAttempt.status}`);

    const newCodeAttempt = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: reChallengeId,
        otp: newOtp
    });
    check('12. new code works -> 200', newCodeAttempt.status === 200, `got ${newCodeAttempt.status}`);

    // =====================================================
    // 13. Challenge isolation: registration vs login codes are not interchangeable
    // =====================================================
    // A verified user starts a LOGIN challenge.
    const isoEmail = uniqueEmail('iso');
    await api('POST', '/api/auth/signup', null, {
        name: 'Iso',
        email: isoEmail,
        password: 'Secret123'
    });
    const isoRegChallengeId = (await OtpChallenge.findOne({ email: isoEmail, purpose: 'REGISTRATION', status: 'PENDING' })).challengeId;
    const isoRegOtp = getOtp(isoEmail);
    await api('POST', '/api/auth/verify-email-otp', null, { challengeId: isoRegChallengeId, otp: isoRegOtp });

    const isoLogin = await api('POST', '/api/auth/login', null, {
        email: isoEmail,
        password: 'Secret123'
    });
    const isoLoginChallengeId = isoLogin.body.data.challengeId;
    const isoLoginOtp = getOtp(isoEmail);

    // A second, still-unverified registration challenge.
    const iso2Email = uniqueEmail('iso2');
    const iso2Signup = await api('POST', '/api/auth/signup', null, {
        name: 'Iso2',
        email: iso2Email,
        password: 'Secret123'
    });
    const iso2RegChallenge = iso2Signup.body.data.challengeId;
    const iso2Otp = getOtp(iso2Email);

    // registration challenge id + another login OTP -> must fail
    const cross1 = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: iso2RegChallenge,
        otp: isoLoginOtp
    });
    check('13. login OTP cannot authorise a registration challenge', cross1.status === 400, `got ${cross1.status}`);

    // login challenge id + a registration OTP -> must fail
    const cross2 = await api('POST', '/api/auth/verify-email-otp', null, {
        challengeId: isoLoginChallengeId,
        otp: iso2Otp
    });
    check('13. registration OTP cannot authorise a login challenge', cross2.status === 400, `got ${cross2.status}`);

    // =====================================================
    // 15. Administrative endpoint with insufficient role
    // =====================================================
    const staffToken = verifyLogin.body.data.token;
    await User.updateOne({ email: regEmail }, { $set: { role: 'STAFF' } });
    const adminCall = await api('GET', '/api/auth/admin', staffToken);
    check('15. STAFF hitting ADMIN endpoint -> 403', adminCall.status === 403, `got ${adminCall.status}`);

    // =====================================================
    // 16. Email delivery failure does not allow bypass
    // =====================================================
    const failEmail = uniqueEmail('mailfail');
    failNextEmail = true;
    const failSignup = await api('POST', '/api/auth/signup', null, {
        name: 'MailFail',
        email: failEmail,
        password: 'Secret123'
    });
    check('16. signup with failing email -> 502', failSignup.status === 502, `got ${failSignup.status}`);
    check('16. no token on email failure', failSignup.body?.data?.token === undefined);

    const pendingAfterFail = await OtpChallenge.countDocuments({ email: failEmail, status: 'PENDING' });
    check('16. no live challenge left after email failure', pendingAfterFail === 0, `pending=${pendingAfterFail}`);

    // =====================================================
    // No secrets leaked in error responses
    // =====================================================
    const leakCheck = JSON.stringify([wrong.body, expired.body, cross1.body, reuse.body]);
    check('14. error bodies contain no OTP/password/token', !/password|jwt|secret|otpHash/i.test(leakCheck));

    // ---- report ----
    console.log('\n===== OTP FLOW TEST RESULTS =====');
    results.forEach((line) => console.log(line));
    console.log(`\nPassed: ${passed}  Failed: ${failed}`);

    // ---- cleanup ----
    await User.deleteMany({ email: { $regex: /^otp_/ } });
    await OtpChallenge.deleteMany({ email: { $regex: /^otp_/ } });
    await mongoose.connection.close();

    process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
    console.error('Test run crashed:', error);
    process.exit(1);
});
