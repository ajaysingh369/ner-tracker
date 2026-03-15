const mongoose = require('mongoose');
require('dotenv').config();

async function updateActivity() {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            console.error('❌ MONGO_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const EventActivity = mongoose.models.EventActivity || mongoose.model('EventActivity', new mongoose.Schema({
            eventId: String,
            athleteId: String,
            activitiesByDate: Object
        }));

        const athleteId = '203531647';
        const dateKey = '2026-02-22';
        const activity = {
            id: 27507827150,
            name: 'Y',
            distance: 2.56,
            moving_time: 1238,
            start_date: '2026-02-23T18:06:06Z',
            type: 'Run',
            points: 0,
            emoji: '🏃‍♂️'
        };

        const result = await EventActivity.updateOne(
            { athleteId: athleteId },
            {
                $set: {
                    [`activitiesByDate.${dateKey}`]: [activity]
                }
            }
        );

        console.log('📝 Update Result:', result);

        if (result.matchedCount === 0) {
            console.warn('⚠️ No document matched for athleteId:', athleteId);
        } else if (result.modifiedCount === 1) {
            console.log('✅ Successfully updated activity for', athleteId, 'on', dateKey);
        } else {
            console.log('ℹ️ Document matched but no change made (possibly already updated).');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
    }
}

updateActivity();
