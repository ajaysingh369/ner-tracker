require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
}

const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String },
    gender: { type: String },
    category: { type: String, default: "100" },
    dummy: { type: Boolean, default: false }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

async function exportDummies() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to DB");

        const dummies = await Athlete.find({ dummy: true });
        console.log(`found ${dummies.length} dummy athletes`);

        if (dummies.length === 0) {
            console.log("No dummy athletes found.");
            process.exit(0);
        }

        const headers = ["athleteId", "firstname", "lastname", "email", "gender", "category"];
        const csvRows = [headers.join(",")];

        for (const a of dummies) {
            const row = [
                a.athleteId,
                `"${a.firstname || ''}"`,
                `"${a.lastname || ''}"`,
                a.email || '',
                a.gender || '',
                a.category || ''
            ];
            csvRows.push(row.join(","));
        }

        const outputPath = path.join(__dirname, '../public/dummy_athletes.csv');
        fs.writeFileSync(outputPath, csvRows.join("\n"));
        console.log(`✅ Exported to ${outputPath}`);

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

exportDummies();
