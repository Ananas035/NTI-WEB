const express = require('express');

const protect = require('../middleware/auth-middleware');
const authorize = require('../middleware/role-middleware');
const { handleLogoUpload } = require('../middleware/upload-logo');

const {
    getFactoryProfile,
    updateFactoryProfile,
    uploadFactoryLogo
} = require('../controllers/factory-profile-controller');

const router = express.Router();

// Read: any authenticated, verified user (the factory identity is shown on
// invoices to everyone who can view them).
// Write: the factory-administrator role only (ADMIN).
router.route('/')
    .get(protect, getFactoryProfile)
    .put(protect, authorize('ADMIN'), updateFactoryProfile);

// Logo upload/replace: ADMIN only. The dedicated Multer middleware validates
// the file before the controller ever runs.
router.post(
    '/logo',
    protect,
    authorize('ADMIN'),
    handleLogoUpload,
    uploadFactoryLogo
);

module.exports = router;
