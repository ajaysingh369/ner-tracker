const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const router = express.Router();
const { StepAthlete, StepEventActivity } = require('./step_models');

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || 'http://localhost:3000/steps/auth/fitbit/callback';

// Global variable to match the primary server's DB cache
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    mongoose.set('strictQuery', false);
    cachedDb = await mongoose.connect(process.env.MONGO_URI, {
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
    console.log('✅ New MongoDB Connection established (Step Router)');
    return cachedDb;
}

// 1. Fitbit OAuth Authentication Redirect
router.get('/auth/fitbit', (req, res) => {
    const scope = 'activity profile';
    const url = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
});

// 2. Fitbit OAuth Callback Handler
router.get('/auth/fitbit/callback', async (req, res) => {
    await connectToDatabase();
    const code = req.query.code;
    if (!code) return res.status(400).send('❌ Authorization code not found');

    try {
        // Exchange code for token
        const tokenResponse = await axios.post('https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                client_id: FITBIT_CLIENT_ID,
                grant_type: 'authorization_code',
                redirect_uri: FITBIT_REDIRECT_URI,
                code: code
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, refresh_token, user_id } = tokenResponse.data;

        // Fetch user profile to get Name and details
        const profileResponse = await axios.get(`https://api.fitbit.com/1/user/${user_id}/profile.json`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const fitbitUser = profileResponse.data.user;

        // Upsert StepAthlete
        const updatedAthlete = await StepAthlete.findOneAndUpdate(
            { athleteId: user_id },
            {
                accessToken: access_token,
                refreshToken: refresh_token,
                firstname: fitbitUser.firstName || fitbitUser.displayName,
                lastname: fitbitUser.lastName || '',
                profile: fitbitUser.avatar,
                gender: fitbitUser.gender,
                dummy: false
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Fitbit Auth: Successfully updated/created step athlete record for ${updatedAthlete.athleteId}.`);

        // Redirect back to the step dashboard app
        res.redirect('/steps_dashboard.html');
    } catch (error) {
        console.error('❌ Error in Fitbit callback:', error.response ? error.response.data : error.message);
        res.status(500).send('❌ Error authenticating with Fitbit');
    }
});

/**
 * Function to Refresh Access Token
 */
const refreshFitbitToken = async (athlete) => {
    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: athlete.refreshToken
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Update in memory
        athlete.accessToken = response.data.access_token;
        athlete.refreshToken = response.data.refresh_token;

        await StepAthlete.findOneAndUpdate(
            { athleteId: athlete.athleteId },
            { accessToken: response.data.access_token, refreshToken: response.data.refresh_token }
        );

        return response.data;
    } catch (error) {
        console.error(`❌ Token refresh failed for step athlete ${athlete.athleteId}:`, error.message);
        return null;
    }
};

/**
 * Fetch and Process activities for athlete
 */
async function fetchFitbitSteps(athlete, startDate, endDate, retryContext = true) {
    try {
        // GET steps for date range (Max range varies for Fitbit API, standard is 30 days)
        const response = await axios.get(`https://api.fitbit.com/1/user/${athlete.athleteId}/activities/tracker/steps/date/${startDate}/${endDate}.json`, {
            headers: { 'Authorization': `Bearer ${athlete.accessToken}` }
        });

        const activitiesSteps = response.data['activities-tracker-steps'] || [];

        let processedActivitiesStr = {};
        let syncStatusStr = {};

        activitiesSteps.forEach(day => {
            const dateStr = day.dateTime;
            const steps = parseInt(day.value, 10);

            processedActivitiesStr[dateStr] = {
                id: `steps_${dateStr}`,
                name: 'Daily Steps',
                steps: steps,
                distance: 0,
                start_date: `${dateStr}T00:00:00Z`,
                type: 'Steps',
                points: 0,
                emoji: steps >= 10000 ? '🏃‍♂️' : '🚶'
            };
            // Mark as present only if there are steps. Empty otherwise
            syncStatusStr[dateStr] = steps > 0 ? 'present' : 'empty';
        });

        return { activities: processedActivitiesStr, statuses: syncStatusStr };

    } catch (err) {
        if (err.response && err.response.status === 401 && retryContext) {
            console.log(`🔄 Fitbit access token expired for athlete ${athlete.athleteId}, refreshing...`);
            const newTokenData = await refreshFitbitToken(athlete);

            if (newTokenData) {
                return fetchFitbitSteps(athlete, startDate, endDate, false); // Retry with new token
            } else {
                console.error(`❌ Fitbit Token refresh failed for step athlete ${athlete.athleteId}`);
            }
        }
        console.error(`❌ Error fetching Fitbit steps for ${athlete.athleteId}:`, err.message);
        return null;
    }
}

// 3. Batched Sync Range Handler
router.post('/syncStepsRange', async (req, res) => {
    await connectToDatabase();
    try {
        const { eventId, month, startDate, endDate } = req.body;

        if (!eventId || month === undefined || !startDate || !endDate) {
            return res.status(400).json({ error: 'eventId, month, startDate, and endDate (YYYY-MM-DD) are required' });
        }

        const athletes = await StepAthlete.find({ status: { $ne: 'rejected' }, dummy: false });

        let totalFetched = 0;

        const updates = {};
        const BATCH_SIZE = 5; // Fetch 5 athletes concurrently
        const DELAY_BETWEEN_BATCHES_MS = 1500; // Then wait 1.5 seconds

        for (let i = 0; i < athletes.length; i += BATCH_SIZE) {
            const batch = athletes.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(a => fetchFitbitSteps(a, startDate, endDate))
            );

            for (let idx = 0; idx < results.length; idx++) {
                const result = results[idx];
                const athlete = batch[idx];

                if (result.status === 'fulfilled' && result.value) {
                    const { activities, statuses } = result.value;

                    // Generate update payload format compatible with existing EventActivity schema style
                    updates[athlete.athleteId] = {
                        athleteId: athlete.athleteId,
                        eventId,
                        month,
                        athlete: {
                            id: athlete.athleteId,
                            firstname: athlete.firstname,
                            lastname: athlete.lastname,
                            profile: athlete.profile,
                            gender: athlete.gender,
                            restDay: athlete.restDay || "Monday",
                            category: "steps",
                            team: athlete.team || "blue"
                        },
                        activitiesByDate: activities,
                        syncStatusByDate: statuses
                    };
                    totalFetched++;
                }
            }

            // Write this specific batch directly to MongoDB to save memory
            const bulkOps = Object.values(updates).map(entry => {
                const setOps = { athlete: entry.athlete };
                for (const [k, v] of Object.entries(entry.activitiesByDate)) {
                    setOps[`activitiesByDate.${k}`] = [v];
                }
                for (const [k, v] of Object.entries(entry.syncStatusByDate)) {
                    setOps[`syncStatusByDate.${k}`] = v;
                }

                return {
                    updateOne: {
                        filter: { eventId, month, athleteId: entry.athleteId },
                        update: { $set: setOps },
                        upsert: true
                    }
                };
            });

            if (bulkOps.length > 0) {
                await StepEventActivity.bulkWrite(bulkOps);
                // Clear updates so they don't get rewritten on the next loop iteration
                for (let key in updates) delete updates[key];
            }

            // Delay next batch to avoid 429 Too Many Requests
            if (i + BATCH_SIZE < athletes.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
            }
        }

        res.json({ message: '✅ Steps Range sync complete', summary: { processed: athletes.length, fetched: totalFetched } });
    } catch (error) {
        console.error('❌ /syncEventActivitiesRange failed:', error.message);
        res.status(500).json({ error: 'Internal error', details: error.message });
    }
});

// 4. Client Dashboard Database Retrieval
router.get('/dashboard/:eventId', async (req, res) => {
    await connectToDatabase();
    try {
        const { eventId } = req.params;
        const records = await StepEventActivity.find({ eventId });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching step records' });
    }
});

// Returns list of athletes
router.get('/athletes', async (req, res) => {
    await connectToDatabase();
    try {
        const athletes = await StepAthlete.find({ status: { $ne: 'rejected' }, dummy: false }, '-accessToken -refreshToken');
        res.json(athletes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch athletes' });
    }
});

module.exports = router;
