require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
    status: { type: String, default: "pending" },
    dummy: { type: Boolean, default: false }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

// Simple CSV Parser handling quoted fields
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = [];
        let currentVal = '';
        let insideQuote = false;

        for (let char of line) {
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                row.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        row.push(currentVal.trim());

        if (row.length === headers.length) {
            const obj = {};
            headers.forEach((h, index) => {
                obj[h] = row[index].replace(/^"|"$/g, ''); // Remove surrounding quotes
            });
            result.push(obj);
        }
    }
    return result;
}

async function syncAthletes() {
    try {
        await mongoose.connect(MONGO_URI, { useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const csvPath = path.join(__dirname, '../google_sheet_data5.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const records = parseCSV(csvData);

        console.log(`Found ${records.length} records in CSV.`);

        const newRecords = [];
        let updatedCount = 0;
        let createdCount = 0;

        for (const record of records) {
            const email = record['Email id'];
            if (!email) continue;

            const category = record['Running Distance'] ? record['Running Distance'].replace(/KM/i, '').trim() : '100';
            const gender = record['Gender'] && record['Gender'].toLowerCase() === 'female' ? 'F' : 'M';
            const status = 'confirmed';
            const name = record['Name'] || '';

            const existingAthlete = await Athlete.findOne({ email: email });

            if (existingAthlete) {
                existingAthlete.status = status;
                existingAthlete.category = category;
                existingAthlete.gender = gender;
                await existingAthlete.save();
                updatedCount++;
            } else {
                const newAthlete = new Athlete({
                    athleteId: `dummy_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    accessToken: 'DUMMY',
                    refreshToken: 'DUMMY',
                    firstname: name,
                    email: email,
                    status: status,
                    category: category,
                    gender: gender,
                    dummy: true
                });
                await newAthlete.save();
                createdCount++;
                newRecords.push(newAthlete);
            }
        }

        console.log(`✅ Sync Complete.`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Created: ${createdCount}`);

        if (newRecords.length > 0) {
            console.log('\n🆕 Newly Added Records:');
            newRecords.forEach(a => console.log(`- ${a.firstname} (${a.email})`));
        }

    } catch (error) {
        console.error('❌ Sync failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit();
    }
}

syncAthletes();
