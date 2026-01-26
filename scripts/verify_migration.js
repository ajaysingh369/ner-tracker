require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    status: { type: String, default: "pending" }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

async function verify() {
    try {
        await mongoose.connect(MONGO_URI, { useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        const total = await Athlete.countDocuments();
        const pending = await Athlete.countDocuments({ status: 'pending' });

        console.log(`Total Athletes: ${total}`);
        console.log(`Pending Athletes: ${pending}`);

        if (total === pending) {
            console.log('✅ Verification SUCCESS: All athletes are pending.');
        } else {
            console.error(`❌ Verification FAILED: ${total - pending} athletes are NOT pending.`);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit();
    }
}

verify();
