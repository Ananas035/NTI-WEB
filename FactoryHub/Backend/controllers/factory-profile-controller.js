const fs = require('fs');
const path = require('path');

const FactoryProfile = require('../models/FactoryProfile');
const { uploadDir } = require('../middleware/upload-logo');

const SINGLETON_KEY = 'factory';
const LOGO_PREFIX = '/uploads/factory/';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The only factory fields ever returned to a client. `singleton` is an internal
// implementation detail and is never exposed.
const publicProfile = (profile) => ({
    _id: profile._id,
    factoryName: profile.factoryName,
    managerName: profile.managerName,
    phone: profile.phone,
    address: profile.address,
    email: profile.email,
    logoUrl: profile.logoUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const clean = (value) =>
    typeof value === 'string' ? value.trim() : '';

// Validate + normalise the text fields of the profile.
// Returns { ok:true, fields } or { ok:false, message }.
const validateProfilePayload = (body = {}) => {
    const factoryName = clean(body.factoryName);
    const managerName = clean(body.managerName);
    const phone = clean(body.phone);
    const address = clean(body.address);
    const email = clean(body.email).toLowerCase();

    if (!factoryName) {
        return { ok: false, message: 'Factory name is required' };
    }

    if (factoryName.length > 150) {
        return { ok: false, message: 'Factory name is too long' };
    }

    if (!phone) {
        return { ok: false, message: 'Contact phone is required' };
    }

    if (phone.length > 40) {
        return { ok: false, message: 'Phone number is too long' };
    }

    if (email && !EMAIL_PATTERN.test(email)) {
        return { ok: false, message: 'Email address is not valid' };
    }

    if (managerName.length > 150) {
        return { ok: false, message: 'Manager name is too long' };
    }

    if (address.length > 200) {
        return { ok: false, message: 'Address is too long' };
    }

    return {
        ok: true,
        fields: {
            factoryName,
            managerName,
            phone,
            address,
            email
        }
    };
};

// ---------------------------------------------------------------------------
// Logo file helpers
// ---------------------------------------------------------------------------

// Delete a previously stored logo file. Only ever touches files inside the
// dedicated factory-logo directory and only accepts our own relative URL form,
// so a crafted value can never traverse the filesystem.
const deleteLogoFile = (logoUrl) => {
    if (!logoUrl || typeof logoUrl !== 'string') {
        return;
    }

    if (!logoUrl.startsWith(LOGO_PREFIX)) {
        return;
    }

    const filename = path.basename(logoUrl);
    const filePath = path.join(uploadDir, filename);

    // Defence in depth: ensure the resolved path stays inside uploadDir.
    if (path.dirname(filePath) !== uploadDir) {
        return;
    }

    fs.promises.unlink(filePath).catch(() => {
        // A missing file is not an error worth surfacing.
    });
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// @desc    Get the factory profile
// @route   GET /api/factory-profile
// @access  Private (any authenticated user)
exports.getFactoryProfile = async (req, res) => {
    try {
        const profile = await FactoryProfile.findOne({
            singleton: SINGLETON_KEY
        });

        return res.status(200).json({
            success: true,
            configured: Boolean(profile),
            data: profile ? publicProfile(profile) : null
        });
    } catch (error) {
        console.error('[FactoryProfile] Get error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to load the factory profile'
        });
    }
};

// @desc    Create or update the factory profile (single shared record)
// @route   PUT /api/factory-profile
// @access  Private (ADMIN only)
exports.updateFactoryProfile = async (req, res) => {
    try {
        const validation = validateProfilePayload(req.body);

        if (!validation.ok) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Upsert the single authoritative document. A second profile can never
        // be created because the filter is always the fixed singleton key.
        const profile = await FactoryProfile.findOneAndUpdate(
            { singleton: SINGLETON_KEY },
            { $set: validation.fields },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Factory profile saved successfully',
            data: publicProfile(profile)
        });
    } catch (error) {
        console.error('[FactoryProfile] Update error:', error.message);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid factory profile data'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to save the factory profile'
        });
    }
};

// @desc    Upload / replace the factory logo
// @route   POST /api/factory-profile/logo
// @access  Private (ADMIN only)
exports.uploadFactoryLogo = async (req, res) => {
    // The uploaded file has already been validated & stored by the dedicated
    // Multer middleware. If we get here without a file, treat it as a bad
    // request rather than silently succeeding.
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No logo file was uploaded'
        });
    }

    const newLogoUrl = `${LOGO_PREFIX}${req.file.filename}`;

    try {
        const existing = await FactoryProfile.findOne({
            singleton: SINGLETON_KEY
        });

        // A logo is not a profile-creation event: the factory details must be
        // saved first. Refuse and remove the orphaned upload.
        if (!existing) {
            deleteLogoFile(newLogoUrl);

            return res.status(400).json({
                success: false,
                message:
                    'Please save the factory details before uploading a logo'
            });
        }

        const previousLogoUrl = existing.logoUrl;

        const profile = await FactoryProfile.findOneAndUpdate(
            { singleton: SINGLETON_KEY },
            { $set: { logoUrl: newLogoUrl } },
            { new: true, runValidators: true }
        );

        // Only AFTER the new logo is safely referenced in the database do we
        // remove the previously stored file (never before).
        if (previousLogoUrl && previousLogoUrl !== newLogoUrl) {
            deleteLogoFile(previousLogoUrl);
        }

        return res.status(200).json({
            success: true,
            message: 'Factory logo updated successfully',
            data: publicProfile(profile)
        });
    } catch (error) {
        // The database rejected the write. Remove the orphaned upload so it
        // cannot leak into the directory.
        deleteLogoFile(newLogoUrl);

        console.error('[FactoryProfile] Logo error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to save the factory logo'
        });
    }
};
