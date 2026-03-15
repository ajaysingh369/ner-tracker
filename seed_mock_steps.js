require('dotenv').config();
const mongoose = require('mongoose');
const { StepAthlete, StepEventActivity } = require('./step_models');

async function seedMockData() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        const eventId = "MARCH_2026_STEPS";
        const month = 3;

        // Clean up old mock data
        await StepAthlete.deleteMany({ dummy: true });
        await StepEventActivity.deleteMany({ eventId });
        console.log('🧹 Cleared old mock data');

        const mockAthletes = [
            { id: "mock_1", fname: "Alice", lname: "Walker", gender: "F" },
            { id: "mock_2", fname: "Bob", lname: "Strider", gender: "M" },
            { id: "mock_3", fname: "Charlie", lname: "Pacer", gender: "M" },
            { id: "mock_4", fname: "Diana", lname: "Runner", gender: "F" },
            { id: "mock_5", fname: "Eve", lname: "Trekker", gender: "F" }
        ];

        for (const athlete of mockAthletes) {
            // 1. Create Athlete
            await StepAthlete.create({
                athleteId: athlete.id,
                accessToken: "mock_access",
                refreshToken: "mock_refresh",
                firstname: athlete.fname,
                lastname: athlete.lname,
                gender: athlete.gender,
                dummy: true,
                status: "confirmed"
            });

            // 2. Generate March Steps
            const activitiesByDate = {};
            const syncStatusByDate = {};

            // Generate daily steps for March (1 to 31)
            for (let day = 1; day <= 31; day++) {
                const dateStr = `2026-03-${String(day).padStart(2, '0')}`;

                // Randomly generate steps or leave missing for realistic mock
                const hasSteps = Math.random() > 0.15; // 85% chance to have steps

                if (hasSteps) {
                    const steps = Math.floor(Math.random() * 8000) + 4000; // 4000 to 12000 steps
                    activitiesByDate[dateStr] = [{
                        id: `steps_${dateStr}`,
                        name: 'Daily Steps',
                        steps: steps,
                        distance: 0,
                        start_date: `${dateStr}T00:00:00Z`,
                        type: 'Steps',
                        points: 0,
                        emoji: steps >= 10000 ? '🏃‍♂️' : '🚶'
                    }];
                    syncStatusByDate[dateStr] = 'present';
                } else {
                    activitiesByDate[dateStr] = [];
                    syncStatusByDate[dateStr] = 'empty';
                }
            }

            // 3. Save Event Activity
            await StepEventActivity.create({
                eventId,
                month,
                athleteId: athlete.id,
                athlete: {
                    id: athlete.id,
                    firstname: athlete.fname,
                    lastname: athlete.lname,
                    gender: athlete.gender,
                    category: "steps",
                },
                activitiesByDate,
                syncStatusByDate
            });
        }

        console.log('🎉 Successfully seeded 5 mock athletes and their step data for March 2026!');

    } catch (err) {
        console.error('❌ Seeding error:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedMockData();
