const express = require('express');
const router = express.Router();
const cors = require('cors');

// Import V2 Mobile specific routes
const { authRouter } = require('./routes/auth');

// Apply JSON body parsing natively here for the mobile endpoints
router.use(express.json());

// Enable aggressive CORS policies just for the mobile endpoints to simplify device-to-cloud mapping
router.use(cors({ origin: '*' }));

// Health Check / Ping
// @route   GET /api/v2/health
router.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: '📱 Mobile V2 JSON API is fully Operational!',
        timestamp: new Date().toISOString()
    });
});

// Authentication and Identity Access Management (Google SSO)
router.use('/auth', authRouter);

// Syncing and Dashboard logic (Placeholders that will be built in Phase 3)
// router.use('/sync', require('./routes/sync')); 
// router.use('/user', require('./routes/dashboard'));

module.exports = router;
