const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Dedicated upload configuration for the factory logo.
//
// It deliberately does NOT reuse the product-image uploader:
//  - a stricter MIME allow-list (PNG / JPEG / WebP only),
//  - files stored in their own persistent directory (uploads/factory) so they
//    survive independently of product images,
//  - filenames derived from the verified MIME type and a random value — the
//    user-supplied original filename is never trusted or used.
const uploadDir = path.join(__dirname, '..', 'uploads', 'factory');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// MIME -> safe extension. The extension is taken from the allow-list, never
// from the client filename.
const ALLOWED_MIME = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp'
};

const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3 MB

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const extension = ALLOWED_MIME[file.mimetype];
        const unique = crypto.randomBytes(16).toString('hex');

        cb(
            null,
            `factory-logo-${Date.now()}-${unique}${extension}`
        );
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) {
        return cb(null, true);
    }

    const error = new Error(
        'Invalid file type. Only PNG, JPEG or WebP images are allowed.'
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
};

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_LOGO_BYTES,
        files: 1
    },
    fileFilter
});

// Wrap multer so its errors become the same JSON contract as the rest of the
// API (a rejected file never reaches the controller).
const handleLogoUpload = (req, res, next) => {
    upload.single('logo')(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'The logo file is too large. Maximum size is 3MB.'
            });
        }

        if (error.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid file type. Only PNG, JPEG or WebP images are allowed.'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Logo upload failed.'
        });
    });
};

module.exports = {
    handleLogoUpload,
    uploadDir,
    ALLOWED_MIME,
    MAX_LOGO_BYTES
};
