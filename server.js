require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/strava/callback';
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));

// Define Schema for Athletes
const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String },
    restDay: { type: String, default: "Monday" }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

// Function to Refresh Access Token
const refreshAccessToken = async (athlete) => {
    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: athlete.refreshToken,
            grant_type: 'refresh_token'
        });

        await Athlete.findOneAndUpdate(
            { athleteId: athlete.athleteId },
            { accessToken: response.data.access_token, refreshToken: response.data.refresh_token }
        );

        return response.data.access_token;
    } catch (error) {
        console.error(`❌ Token refresh failed for athlete ${athlete.athleteId}:`, error.message);
        return null;
    }
};

// OAuth Authentication with Strava
app.get('/auth/strava', (req, res) => {
    const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all,read_all`;
    res.redirect(url);
});

app.get('/auth/strava/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('❌ Authorization code not found');

    try {
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
        });

        await Athlete.findOneAndUpdate(
            { athleteId: tokenResponse.data.athlete.id },
            {
                accessToken: tokenResponse.data.access_token,
                refreshToken: tokenResponse.data.refresh_token,
                firstname: tokenResponse.data.athlete.firstname,
                lastname: tokenResponse.data.athlete.lastname,
                profile: tokenResponse.data.athlete.profile
            },
            { upsert: true, new: true }
        );

        res.redirect('/');
    } catch (error) {
        console.error('❌ Error fetching access token:', error.message);
        res.status(500).send('❌ Error fetching access token');
    }
});

// Fetch Athlete's Rest Day
app.get('/athlete/rest-day/:athleteId', async (req, res) => {
    try {
        const athlete = await Athlete.findOne({ athleteId: req.params.athleteId });
        res.json({ restDay: athlete?.restDay || "Monday" });
    } catch (error) {
        console.error("❌ Error fetching rest day:", error);
        res.status(500).json({ error: "Error fetching rest day" });
    }
});

// Update Athlete's Rest Day
app.post('/athlete/rest-day/:athleteId', async (req, res) => {
    try {
        const { restDay } = req.body;
        await Athlete.findOneAndUpdate({ athleteId: req.params.athleteId }, { restDay }, { new: true });
        res.json({ message: "✅ Rest day updated for you" });
    } catch (error) {
        console.error("❌ Error updating rest day:", error);
        res.status(500).json({ error: "Error updating rest day" });
    }
});

// Fetch Activities for Athletes
app.get('/activities', async (req, res) => {
    try {
        const { month } = req.query;
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), month === 'current' ? currentDate.getMonth() : month, 1);
        const endOfMonth = new Date(currentDate.getFullYear(), month === 'current' ? currentDate.getMonth() + 1 : month + 1, 0);

        const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        const endTimestamp = Math.floor(endOfMonth.getTime() / 1000);

        const athletes = await Athlete.find({});
        const activitiesResults = await Promise.all(
            athletes.map(athlete => fetchAthleteActivities(athlete, startTimestamp, endTimestamp))
        );

        const allActivities = activitiesResults.flat();
        const optimizedActivities = optimizeActivities(allActivities);
        const medals = calculateMedals(optimizedActivities);

        res.json({ activities: optimizedActivities, medals });
    } catch (error) {
        console.error('❌ Error fetching activities:', error.message);
        res.status(500).json({ error: "Error fetching activities" });
    }
});

// Fetch Activities for an Athlete
async function fetchAthleteActivities(athlete, startTimestamp, endTimestamp, retry = true) {
    let activities = [];
    let page = 1;
    const perPage = 100;
    const MAX_RETRIES = 2;

    try {
        while (true) {
            const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                headers: { Authorization: `Bearer ${athlete.accessToken}` },
                params: { after: startTimestamp, before: endTimestamp, per_page: perPage, page }
            });

            if (response.data.length === 0) break;

            // Process activities with athlete data
            const enrichedActivities = response.data
                .map(activity => {
                    const utcDate = new Date(activity.start_date);
                    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST

                    return {
                        ...activity,
                        start_date: istDate.toISOString(), // Store in IST format
                        athlete: {
                            id: athlete.athleteId,
                            firstname: athlete.firstname,
                            lastname: athlete.lastname,
                            profile: athlete.profile,
                            restDay: athlete.restDay || "Monday"
                        }
                    };
                })
                .filter(activity => activity.moving_time >= 1800); // Filter activities < 30 minutes

            activities.push(...enrichedActivities);
            if (response.data.length < perPage) break;
            page++;
        }
    } catch (error) {
        // 🛑 If error is 401, refresh token
        if (error.response && error.response.status === 401) {
            console.log(`🔄 Access token expired for athlete ${athlete.athleteId}, refreshing...`);

            if (!retry) {
                console.error(`❌ Token refresh failed, stopping retries for athlete ${athlete.athleteId}`);
                return [];
            }
            accessToken = await refreshAccessToken(athlete); // Refresh token

            if (accessToken) {
                console.log(`✅ Token refreshed successfully for athlete ${athlete.athleteId}`);
                return fetchAthleteActivities(athlete, startTimestamp, endTimestamp, false); // Retry with new token
            } else {
                console.error(`❌ Token refresh failed for athlete ${athlete.athleteId}`);
            }
        }
        console.error(`❌ Error fetching activities for athlete ${athlete.athleteId}:`, error.message);
    }

    return activities;
}


// Calculate Medals
// Calculate Medals using Points System
function calculateMedals(activities) {
    const athletePoints = {};

    // Calculate points for each athlete based on activity type
    activities.forEach(activity => {
        const athleteId = activity.athlete.id;
        const minutes = activity.moving_time / 60;
        let points = 0;

        if (activity.type.toLowerCase() === "run") {
            points = (minutes / 5) * 0.9;
        } else if (activity.type.toLowerCase() === "walk") {
            points = (minutes / 5) * 0.7;
        } else if (["yoga", "workout", "weighttraining"].includes(activity.type.toLowerCase())) {
            points = (minutes / 5) * 1;
        }

        athletePoints[athleteId] = (athletePoints[athleteId] || 0) + points;
    });

    // Sort athletes by total points (Descending)
    const sortedAthletes = Object.entries(athletePoints)
        .sort((a, b) => b[1] - a[1]);

    let medals = { gold: [], silver: [], bronze: [] };
    let lastPoints = null;
    let medalType = "gold"; // Start with gold

    sortedAthletes.forEach(([athleteId, points], index) => {
        if (index === 0) {
            medals.gold.push(athleteId);
            lastPoints = points;
        } else if (points === lastPoints) {
            medals[medalType].push(athleteId);
        } else if (medalType === "gold") {
            medals.silver.push(athleteId);
            lastPoints = points;
            medalType = "silver";
        } else if (medalType === "silver") {
            medals.bronze.push(athleteId);
            lastPoints = points;
            medalType = "bronze";
        }
    });

    return medals;
}



// Optimize Activities
function optimizeActivities(activities) {
    console.log(`🔥 optimizeActivities: Total activities before optimization: ${activities.length}`);
    const activityMap = new Map();

    for (const activity of activities) {
        const key = `${activity.athlete.id}-${activity.start_date.split('T')[0]}`;
        if (!activityMap.has(key) || activityMap.get(key).moving_time < activity.moving_time) {
            activityMap.set(key, activity);
        }
    }

    return Array.from(activityMap.values());
}

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
