require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/strava/callback';
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB for update'))
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));


// Define Schema for Athletes
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
    category: { type: String, default: "100" }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

const updates = async () => {
    const bulkOps = [
        { updateOne: { filter: { "athlete.email": "write.neetu@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "Vivekdbest2019@yahoo.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "rsharma1012@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "anie.misra@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "sonalchalana@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "nkaur07@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "rituchaudhary2585@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "negi.yogita@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "aparnasn177@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "mananojha475@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "shalinipojha@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "meenu.yadav67@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "mahishrm@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "athlete.email": "tiwari.sang@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "athlete.email": "binnukumar100@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "athlete.email": "shuklaprashant89@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "athlete.email": "porwal.saket@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "athlete.email": "rekhalohia03@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "athlete.email": "" }, update: { $set: { category: "100" } } } },

        // Add more here
    ];

    await Athlete.bulkWrite(bulkOps);
    console.log("✅ Athlete categories updated.");
    mongoose.disconnect();
};

updates().catch(console.error);
