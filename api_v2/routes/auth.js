const express = require('express');
const router = express.Router();
const MobileUser = require('../models/MobileUser');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// A dummy client ID for development. In production this gets added to .env
const MOBILE_GOOGLE_CLIENT_ID = process.env.MOBILE_GOOGLE_CLIENT_ID || 'dummy_mobile_client_id.apps.googleusercontent.com';
const client = new OAuth2Client(MOBILE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_mobile_dev_key';

// @route   POST /api/v2/auth/google
// @desc    Authenticate mobile user via Google Health/SSO tokens
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ status: 'error', error: 'idToken is required' });

        let payload;

        // In dev mock mode (if idToken isn't a real Google token), we bypass Google verification and decode standard base64 generic tokens
        // This is solely for our backend tests before the mobile app is fully compiled.
        if (idToken.startsWith('mock_')) {
            payload = {
                sub: `mock_google_id_${Date.now()}`,
                email: 'native_tester@example.com',
                given_name: 'Native',
                family_name: 'Tester',
                picture: 'https://ui-avatars.com/api/?name=Native+Tester'
            };
        } else {
            // Live Production Verification
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: MOBILE_GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        }

        const { sub: googleId, email, given_name, family_name, picture } = payload;

        // 1. Find or Create the Mobile User inside MongoDB
        let user = await MobileUser.findOne({ googleId });
        
        if (!user) {
            user = await MobileUser.create({
                googleId,
                email,
                firstName: given_name,
                lastName: family_name,
                profileImage: picture
            });
            console.log(`📱 Mobile V2: New User created via Google SSO -> ${email}`);
        } else {
            console.log(`📱 Mobile V2: Existing User logged in -> ${email}`);
            // Optional: Update profile info on login if they changed their Google picture
            user.firstName = given_name || user.firstName;
            user.lastName = family_name || user.lastName;
            user.profileImage = picture || user.profileImage;
            await user.save();
        }

        // 2. Generate a secure JSON Web Token for the mobile app to use for future API calls
        const authToken = jwt.sign(
            { id: user._id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        // 3. Return native JSON payload to React Native App
        res.json({
            status: 'success',
            token: authToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImage: user.profileImage,
                premiaStatus: user.premiaStatus
            }
        });

    } catch (error) {
        console.error('❌ Mobile Auth Error:', error.message);
        res.status(401).json({ status: 'error', error: 'Google Authentication failed' });
    }
});

// Generic middleware that protects V2 mobile routes requiring login
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', error: 'Unauthorized access' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.mobileUser = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ status: 'error', error: 'Invalid or expired token' });
    }
};

// @route   GET /api/v2/auth/me
// @desc    Get signed-in user profile utilizing the auth middleware
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await MobileUser.findById(req.mobileUser.id);
        if (!user) return res.status(404).json({ status: 'error', error: 'User not found' });
        
        res.json({ status: 'success', user });
    } catch (error) {
        res.status(500).json({ status: 'error',  error: 'Server error fetching profile' });
    }
});

module.exports = {
    authRouter: router,
    authMiddleware
};
