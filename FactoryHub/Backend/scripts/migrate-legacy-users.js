/*
 * Legacy user migration for the email-OTP change.
 *
 * Existing accounts created before `isEmailVerified` existed have NO value for
 * that field. The application treats "field is not exactly `true`" as
 * unverified, so those accounts are locked out until acted upon. This script is
 * the explicit, opt-in way to decide their fate — accounts are never silently
 * treated as verified.
 *
 * Usage (run from the Backend folder):
 *   node scripts/migrate-legacy-users.js --report
 *   node scripts/migrate-legacy-users.js --verify-existing
 *   node scripts/migrate-legacy-users.js --verify-user user@example.com
 *
 * Notes:
 *   --report          List how many accounts are verified / unverified / legacy.
 *   --verify-existing Mark every LEGACY account (missing the field) as verified.
 *                     Use this only if you trust those existing accounts.
 *   --verify-user     Verify one specific email address.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);

const getUserArg = () => {
    const match = args.find((arg) => arg.startsWith('--verify-user='));
    if (match) {
        return match.split('=').slice(1).join('=').trim().toLowerCase();
    }
    const index = args.indexOf('--verify-user');
    if (index !== -1 && args[index + 1]) {
        return args[index + 1].trim().toLowerCase();
    }
    return null;
};

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.DB_NAME
    });

    const total = await User.countDocuments({});
    const verified = await User.countDocuments({ isEmailVerified: true });
    const explicitlyUnverified = await User.countDocuments({ isEmailVerified: false });
    const legacy = await User.countDocuments({ isEmailVerified: { $exists: false } });

    console.log('--- FactoryHub user verification report ---');
    console.log(`Total users:                 ${total}`);
    console.log(`Verified (isEmailVerified):  ${verified}`);
    console.log(`Unverified (explicit false): ${explicitlyUnverified}`);
    console.log(`Legacy (field missing):      ${legacy}`);

    if (hasFlag('--verify-existing')) {
        const result = await User.updateMany(
            { isEmailVerified: { $exists: false } },
            { $set: { isEmailVerified: true, emailVerifiedAt: new Date() } }
        );
        console.log(`Marked ${result.modifiedCount} legacy account(s) as verified.`);
    }

    const email = getUserArg();
    if (email) {
        const result = await User.updateOne(
            { email },
            { $set: { isEmailVerified: true, emailVerifiedAt: new Date() } }
        );
        console.log(
            result.matchedCount
                ? `Verified account: ${email}`
                : `No account found for: ${email}`
        );
    }

    await mongoose.disconnect();
    process.exit(0);
};

run().catch((error) => {
    console.error('Migration failed:', error.message);
    process.exit(1);
});
