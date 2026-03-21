const mongoose = require('mongoose');

// V2 Schema specifically tailored to Mobile native app authentication
const mobileUserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    profileImage: { type: String },
    
    // Future expansion: linking to Strava athlete profile or tracking generic status
    stravaId: { type: String, default: null },
    mobileStepsActive: { type: Boolean, default: true },
    premiaStatus: { type: String, default: 'free' } // 'free', 'pro'
}, {
    timestamps: true
});

module.exports = mongoose.model('MobileUser', mobileUserSchema);
