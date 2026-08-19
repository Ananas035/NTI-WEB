    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    // 1. Ensure the upload directory exists
    const uploadDir = 'uploads/models/';
    if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Configure Storage (Where and how to save the file)
    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
    });

    // 3. File Filter (Accept only images)
    const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed!'), false);
    }
    };

    // 4. Initialize Multer
    const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
    fileFilter: fileFilter
    });

    module.exports = upload;