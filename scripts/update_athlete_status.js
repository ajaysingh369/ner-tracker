require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String },
    gender: { type: String },
    restDay: { type: String, default: "Monday" },
    team: { type: String, default: "blue" },
    email: { type: String },
    source: { type: String, default: "strava" },
    category: { type: String, default: "100" },
    status: { type: String, default: "pending" }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI, { useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const result = await Athlete.updateMany({}, { $set: { status: 'pending' } });
        console.log(`✅ Updated ${result.modifiedCount} athletes to status 'pending'.`);
        console.log(`ℹ️ Matched ${result.matchedCount} documents.`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit();
    }
}

migrate();
