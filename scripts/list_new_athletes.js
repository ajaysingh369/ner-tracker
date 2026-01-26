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
    firstname: String,
    email: String,
    dummy: Boolean
});

const Athlete = mongoose.model('Athlete', athleteSchema);

async function listNewAthletes() {
    try {
        await mongoose.connect(MONGO_URI, { useUnifiedTopology: true });

        const newAthletes = await Athlete.find({ dummy: true });

        let output = 'Newly Added Records:\n';
        newAthletes.forEach(a => {
            output += `- ${a.firstname} (${a.email})\n`;
        });

        fs.writeFileSync(path.join(__dirname, '../new_athletes_list.txt'), output);
        console.log('✅ List written to new_athletes_list.txt');

    } catch (error) {
        console.error('❌ Failed to list athletes:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

listNewAthletes();
