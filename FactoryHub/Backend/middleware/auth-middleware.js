const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        // Session-version check: a password reset bumps tokenVersion, which
        // revokes every token issued before the reset. Tokens created before
        // the field existed decode with no version and are treated as 0, so
        // they remain valid until the first reset.
        const tokenVersion = decoded.tokenVersion || 0;
        const userVersion = user.tokenVersion || 0;

        if (tokenVersion !== userVersion) {
            return res.status(401).json({
                success: false,
                message: 'Session expired, please sign in again'
            });
        }

        // Unverified accounts can never reach a protected endpoint, even if a
        // token somehow existed. Pre-existing documents without the field are
        // treated as unverified (strict `=== true` check).
        if (user.isEmailVerified !== true) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required',
                requiresEmailVerification: true
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token'
        });
    }
};

module.exports = protect;