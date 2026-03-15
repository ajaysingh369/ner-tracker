const mongoose = require('mongoose');

// Define Schema for Step Athletes
const stepAthleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true }, // Fitbit User ID
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String },
    gender: { type: String },
    restDay: { type: String, default: 'Monday' },
    team: { type: String, default: 'blue' },
    email: { type: String },
    source: { type: String, default: 'fitbit' },
    category: { type: String, default: 'steps' },
    status: { type: String, default: 'pending' },
    dummy: { type: Boolean, default: false }
});

// Define Schema for Step Event Activities
const stepEventActivitySchema = new mongoose.Schema({
    eventId: String, // e.g., "MARCH_2026_STEPS"
    month: Number,
    athleteId: String,
    athlete: Object,
    activitiesByDate: Object, // e.g., { "2026-03-15": { steps: 12000, distance: 8.5 } }
    syncStatusByDate: Object
});

const StepAthlete = mongoose.model('StepAthlete', stepAthleteSchema);
const StepEventActivity = mongoose.model('StepEventActivity', stepEventActivitySchema);

module.exports = {
    StepAthlete,
    StepEventActivity
};
