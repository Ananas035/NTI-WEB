/*
 * End-to-end integration tests for the Factory Profile / Branding feature.
 *
 * Run from the Backend folder:
 *   node tests/factory-profile.test.js
 *
 * Harness mirrors tests/password-reset.test.js:
 *  - separate database (DB_NAME=FactoryHub_OTPTest),
 *  - outbound email replaced by an in-memory capture (no SMTP needed),
 *  - outer rate limits raised so they do not perturb scenarios.
 *
 * The only files touched on disk are the test logos this suite uploads; every
 * one of them is removed again at the end.
 */

process.env.DB_NAME = 'FactoryHub_OTPTest';
process.env.PORT = '5097';
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

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const emailService = require('../services/email-service');
const sentEmails = new Map();
emailService.sendOtpEmail = async ({ to, otp }) => {
    sentEmails.set(String(to).toLowerCase(), otp);
    return { accepted: [to] };
};

const User = require('../models/User');
const FactoryProfile = require('../models/FactoryProfile');
const { uploadDir } = require('../middleware/upload-logo');
const { start } = require('../server');

const BASE = `http://localhost:${process.env.PORT}`;

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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getOtp = (email) => sentEmails.get(String(email).toLowerCase());

const apiJson = async (method, url, token, body) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${url}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let json = null;
    try { json = await res.json(); } catch { /* none */ }
    return { status: res.status, body: json };
};

const apiForm = async (url, token, formData) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${url}`, {
        method: 'POST',
        headers,
        body: formData
    });

    let json = null;
    try { json = await res.json(); } catch { /* none */ }
    return { status: res.status, body: json };
};

const pngBlob = (size = 1024) =>
    new Blob([Buffer.alloc(size, 1)], { type: 'image/png' });

const uniqueEmail = (tag) =>
    `factoryprof_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

// Create a fully verified account and return { email, token, userId }.
const createVerifiedUser = async (tag, role = 'ADMIN') => {
    const email = uniqueEmail(tag);

    const signupRes = await apiJson('POST', '/api/auth/signup', null, {
        name: `User ${tag}`,
        email,
        password: 'InitialPass1',
        phone: '01000000000'
    });

    await apiJson('POST', '/api/auth/verify-email-otp', null, {
        challengeId: signupRes.body.data.challengeId,
        otp: getOtp(email)
    });

    // If a non-admin role is requested, flip it directly in the DB (this is
    // what a future staff-account creation would do).
    if (role !== 'ADMIN') {
        await User.updateOne({ email }, { $set: { role } });
    }

    const loginRes = await apiJson('POST', '/api/auth/login', null, {
        email,
        password: 'InitialPass1'
    });

    const verifyRes = await apiJson('POST', '/api/auth/verify-email-otp', null, {
        challengeId: loginRes.body.data.challengeId,
        otp: getOtp(email)
    });

    return {
        email,
        token: verifyRes.body.data.token,
        userId: verifyRes.body.data.user.id
    };
};

const uploadedFiles = [];
const trackLogo = (profile) => {
    if (profile && profile.logoUrl) {
        uploadedFiles.push(path.basename(profile.logoUrl));
    }
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

    // Clean slate for the collection under test.
    await FactoryProfile.deleteMany({});
    await User.deleteMany({ email: { $regex: /^factoryprof_/ } });

    // =====================================================
    // 10 / 19. Missing profile is handled gracefully
    // =====================================================
    const admin = await createVerifiedUser('admin');

    const noAuth = await apiJson('GET', '/api/factory-profile', null);
    check('1. GET without token -> 401', noAuth.status === 401, `got ${noAuth.status}`);

    const getMissing = await apiJson('GET', '/api/factory-profile', admin.token);
    check('19. GET with no profile -> 200 configured:false',
        getMissing.status === 200 && getMissing.body.configured === false && getMissing.body.data === null,
        JSON.stringify(getMissing.body));

    // =====================================================
    // 9. Authorization for writes
    // =====================================================
    const putNoAuth = await apiJson('PUT', '/api/factory-profile', null, {
        factoryName: 'X', phone: '1'
    });
    check('9a. PUT without token -> 401', putNoAuth.status === 401, `got ${putNoAuth.status}`);

    const staff = await createVerifiedUser('staff', 'STAFF');
    const putStaff = await apiJson('PUT', '/api/factory-profile', staff.token, {
        factoryName: 'Should Fail', phone: '01000000000'
    });
    check('9b. STAFF cannot update profile -> 403', putStaff.status === 403, `got ${putStaff.status}`);

    const logoStaff = await apiForm('/api/factory-profile/logo', staff.token, (() => {
        const fd = new FormData();
        fd.append('logo', pngBlob(), 'logo.png');
        return fd;
    })());
    check('9c. STAFF cannot upload logo -> 403', logoStaff.status === 403, `got ${logoStaff.status}`);

    // =====================================================
    // 16. Logo before profile exists is refused
    // =====================================================
    const logoNoProfile = await apiForm('/api/factory-profile/logo', admin.token, (() => {
        const fd = new FormData();
        fd.append('logo', pngBlob(), 'logo.png');
        return fd;
    })());
    check('16. logo upload before profile -> 400', logoNoProfile.status === 400, `got ${logoNoProfile.status}`);

    // =====================================================
    // 1 / 20. Create the profile
    // =====================================================
    const create = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'Delta Textiles Factory',
        managerName: 'Eng. Ahmed Ali',
        phone: '01234567890',
        address: 'Cairo Industrial Zone',
        email: 'info@delta-textiles.example'
    });
    check('1. authorized admin creates profile -> 200',
        create.status === 200 && create.body.data.factoryName === 'Delta Textiles Factory',
        `got ${create.status}`);

    check('1b. managementName is not returned by the API',
        create.status === 200 && !('managementName' in create.body.data),
        JSON.stringify(Object.keys(create.body?.data || {})));

    const getAfterCreate = await apiJson('GET', '/api/factory-profile', admin.token);
    check('2. admin retrieves profile -> configured:true',
        getAfterCreate.status === 200 &&
        getAfterCreate.body.configured === true &&
        getAfterCreate.body.data.factoryName === 'Delta Textiles Factory');

    // =====================================================
    // 3 / 4 / 5. Individual field updates
    // =====================================================
    const updName = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'Delta Textiles Factory (Updated)',
        managerName: 'Eng. Ahmed Ali',
        phone: '01234567890'
    });
    check('3. update factory name -> 200',
        updName.status === 200 &&
        updName.body.data.factoryName === 'Delta Textiles Factory (Updated)',
        JSON.stringify(updName.body?.data?.factoryName));

    const updManager = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'Delta Textiles Factory (Updated)',
        managerName: 'Eng. Mohamed Hassan',
        phone: '01234567890'
    });
    check('4. update manager name -> 200',
        updManager.status === 200 &&
        updManager.body.data.managerName === 'Eng. Mohamed Hassan');

    check('5. manager name + phone saved correctly',
        updManager.body.data.managerName === 'Eng. Mohamed Hassan' &&
        updManager.body.data.phone === '01234567890');

    // A legacy managementName sent by an old client must be ignored: never
    // stored, never returned, and never a required field.
    const legacy = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'Delta Textiles Factory (Updated)',
        managementName: 'Should Be Ignored',
        managerName: 'Eng. Mohamed Hassan',
        phone: '01234567890'
    });
    const legacyDoc = await FactoryProfile.findOne({ singleton: 'factory' });
    check('5b. legacy managementName is ignored and never persisted/returned',
        legacy.status === 200 &&
        !('managementName' in legacy.body.data) &&
        (legacyDoc === null || legacyDoc.get('managementName') === undefined),
        JSON.stringify(legacy.body?.data));

    // =====================================================
    // 20. Single-profile enforcement + validation
    // =====================================================
    const count = await FactoryProfile.countDocuments({});
    check('Single authoritative profile document', count === 1, `count=${count}`);

    const badNoName = await apiJson('PUT', '/api/factory-profile', admin.token, {
        phone: '01234567890'
    });
    check('Validation: missing factory name -> 400', badNoName.status === 400, `got ${badNoName.status}`);

    const badNoPhone = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'No Phone Co'
    });
    check('Validation: missing phone -> 400', badNoPhone.status === 400, `got ${badNoPhone.status}`);

    const badEmail = await apiJson('PUT', '/api/factory-profile', admin.token, {
        factoryName: 'Bad Email Co',
        phone: '0123',
        email: 'not-an-email'
    });
    check('Validation: invalid email -> 400', badEmail.status === 400, `got ${badEmail.status}`);

    // =====================================================
    // 6 / 7. Valid logo upload + replacement
    // =====================================================
    const upload1 = await apiForm('/api/factory-profile/logo', admin.token, (() => {
        const fd = new FormData();
        fd.append('logo', pngBlob(2048), 'my-logo.png');
        return fd;
    })());
    trackLogo(upload1.body?.data);
    check('6. valid logo upload -> 200', upload1.status === 200, `got ${upload1.status}`);
    check('6. logoUrl returned as a public path (no filesystem path)',
        typeof upload1.body?.data?.logoUrl === 'string' &&
        upload1.body.data.logoUrl.startsWith('/uploads/factory/') &&
        !/^[A-Za-z]:/.test(upload1.body.data.logoUrl),
        upload1.body?.data?.logoUrl);

    const firstLogoUrl = upload1.body.data.logoUrl;
    const firstLogoFile = path.join(uploadDir, path.basename(firstLogoUrl));
    check('6. logo file exists on disk', fs.existsSync(firstLogoFile));

    const upload2 = await apiForm('/api/factory-profile/logo', admin.token, (() => {
        const fd = new FormData();
        fd.append('logo', pngBlob(4096), 'replacement.png');
        return fd;
    })());
    trackLogo(upload2.body?.data);
    check('12. logo replacement changes the logoUrl',
        upload2.status === 200 && upload2.body.data.logoUrl !== firstLogoUrl);

    await wait(200); // async unlink
    check('12. previous logo file removed after safe replacement', !fs.existsSync(firstLogoFile));

    const getLogo = await apiJson('GET', '/api/factory-profile', admin.token);
    check('11. GET returns the new logo',
        getLogo.body.data.logoUrl === upload2.body.data.logoUrl);

    // =====================================================
    // 7 / 8. Invalid + oversized uploads rejected
    // =====================================================
    const badType = await apiForm('/api/factory-profile/logo', admin.token, (() => {
        const fd = new FormData();
        fd.append('logo', new Blob([Buffer.from('hello')], { type: 'text/plain' }), 'notes.txt');
        return fd;
    })());
    check('7. invalid file type rejected -> 400', badType.status === 400, `got ${badType.status}`);

    const beforeOversize = (await apiJson('GET', '/api/factory-profile', admin.token)).body.data.logoUrl;

    const oversize = await apiForm('/api/factory-profile/logo', admin.token, (() => {
        const fd = new FormData();
        fd.append('logo', pngBlob(4 * 1024 * 1024), 'huge.png');
        return fd;
    })());
    check('8. oversized image rejected -> 400', oversize.status === 400, `got ${oversize.status}`);

    const afterOversize = (await apiJson('GET', '/api/factory-profile', admin.token)).body.data.logoUrl;
    check('8. rejected upload did not change the stored logo', afterOversize === beforeOversize);

    // =====================================================
    // Report
    // =====================================================
    console.log('\n===== FACTORY PROFILE TEST RESULTS =====');
    results.forEach((line) => console.log(line));
    console.log(`\nPassed: ${passed}  Failed: ${failed}`);

    // Cleanup: remove test users, the profile document and every test logo.
    await User.deleteMany({ email: { $regex: /^factoryprof_/ } });
    await FactoryProfile.deleteMany({});
    for (const name of uploadedFiles) {
        try { fs.unlinkSync(path.join(uploadDir, name)); } catch { /* ignore */ }
    }

    await mongoose.connection.close();
    process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
    console.error('Test run crashed:', error);
    process.exit(1);
});
