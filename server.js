require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
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

// Caching constants
// In-memory cache structure
const activityCache = {}; // { athleteId: { data: [...], timestamp: <unix> } }
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in ms

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
const tmpDir = os.tmpdir();
const inMemoryCache = global.activityEventCache || {};
global.activityEventCache = inMemoryCache;

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
    gender: { type: String },
    restDay: { type: String, default: "Monday" },
    team: { type: String, default: "blue" },
    email: { type: String },
    source: { type: String, default: "strava" },
    category: { type: String, default: "100" },
    status: { type: String, default: "pending" }
});

const EventActivity = mongoose.model('EventActivity', new mongoose.Schema({
    eventId: String,
    month: Number,
    athleteId: String,
    athlete: Object,
    activitiesByDate: Object
}));

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


// Fetch Activities of event for an Athlete
async function fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, retry = true) {
    const cacheKey = `${athlete.athleteId}_${startTimestamp}`;
    //const cacheFile = path.join('/tmp', `activities_${cacheKey}.json`);
    const now = Date.now();

    // 1. Check in-memory cache
    // if (activityCache[cacheKey] && now - activityCache[cacheKey].timestamp < CACHE_DURATION) {
    //     return activityCache[cacheKey].data;
    // }

    // // 2. Check in file system
    // if (fs.existsSync(cacheFile)) {
    //     const stats = fs.statSync(cacheFile);
    //     if (now - stats.mtimeMs < CACHE_DURATION) {
    //         const fileData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    //         activityCache[cacheKey] = { data: fileData, timestamp: stats.mtimeMs };
    //         return fileData;
    //     }
    // }

    // 3. Fetch fresh from Strava
    let activities = [];
    let page = 1;
    const perPage = 100;
    const MAX_RETRIES = 2;
    const adjustEndTimeStamp = endTimestamp+86400;

    try {
        while (true) {
            const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                headers: { Authorization: `Bearer ${athlete.accessToken}` },
                params: { after: startTimestamp, before: adjustEndTimeStamp, per_page: perPage, page }
            });

            if (response.data.length === 0) break;

            // Process activities with athlete data
            const enrichedActivities = response.data
            .filter(activity => activity.distance >= 2000 && activity.type == "Run") // ✅ Filter first to reduce unnecessary iterations
            .map(({ id, name, distance, moving_time, start_date, type }) => {
                const utcDate = new Date(start_date);
                const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
                const exts = 0; //CalculatePoints(type, moving_time);
            
                return {
                    id, // Activity ID
                    name, // Activity Name
                    distance: parseFloat((distance / 1000).toFixed(2)), // Distance covered
                    moving_time, // Time in motion,
                    start_date: istDate.toISOString(), // Store in IST format
                    type,
                    points: exts[0],
                    emoji: exts[1], 
                    athlete: {
                        id: athlete.athleteId,
                        firstname: athlete.firstname,
                        lastname: athlete.lastname,
                        profile: athlete.profile,
                        gender: athlete.gender,
                        restDay: athlete.restDay || "Monday",
                        team: athlete.team || "blue",
                        category: athlete.category || "100"
                    }
                };
            });

            activities.push(...enrichedActivities);
            if (response.data.length < perPage) break;
            page++;
        }
        // 4. Cache result
        ///activityCache[cacheKey] = { data: activities, timestamp: now };
        ///fs.writeFileSync(cacheFile, JSON.stringify(activities), 'utf-8');

        return activities;
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
                return fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, false); // Retry with new token
            } else {
                console.error(`❌ Token refresh failed for athlete ${athlete.athleteId}`);
            }
        }

        if (error.response && error.response.status === 429) {
            console.warn(`⏳ Rate limited for athlete ${athlete.athleteId}, using stale cache if available.`);
            // if (fs.existsSync(cacheFile)) {
            //     const fileData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            //     return fileData;
            // }
        }

        console.error(`❌ Error fetching activities for athlete ${athlete.athleteId}:`, error.message);
        return [];
    }

    //return activities;
}


const getTodayDateIST = () => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date(Date.now() + istOffset);
    return now.toISOString().split("T")[0]; // YYYY-MM-DD
};

// POST endpoint to fetch today's activities and store in DB
app.post('/syncEventActivities', async (req, res) => {
    const { eventId, month, date } = req.body;
    //console.log(eventId, month, date);

    if (!eventId || month === undefined || !date) {
        return res.status(400).json({ error: 'eventId, month, and date (YYYY-MM-DD) are required' });
    }

    // Parse the input date (e.g. "2025-08-01") and set start & end timestamp
    const parsedDate = new Date(date + "T00:00:00.000+05:30"); // IST midnight
    if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const startOfDay = new Date(parsedDate);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    // Fetch all athletes of selected category
    //const athletes = await Athlete.find({ category: { $in: ["100", "150", "200"] } });
    //const athletes = await Athlete.find({ category: { $in: ["100", "150"] } });
    //const athletes = await Athlete.find({ athleteId: { $in: ["61676509", "148869247"] } });
    const athletes = await Athlete.find({ athleteId: "61676509" });
    
    if (!athletes.length) {
        return res.status(404).json({ error: 'No athlete found with given ID' });
    }

    const results = await Promise.allSettled(
        athletes.map(athlete =>
            fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp)
        )
    );

    const successfulActivities = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value);

    const updates = {};

    for (const activity of successfulActivities) {
        const athleteId = activity.athlete.id;
        const activityDateKey = new Date(activity.start_date).toISOString().split("T")[0];

        if (!updates[athleteId]) {
            updates[athleteId] = {
                athleteId,
                eventId,
                month,
                athlete: activity.athlete,
                activitiesByDate: {}
            };
        }

        if (!updates[athleteId].activitiesByDate[activityDateKey]) {
            updates[athleteId].activitiesByDate[activityDateKey] = [];
        }

        updates[athleteId].activitiesByDate[activityDateKey].push({
            id: activity.id,
            name: activity.name,
            distance: activity.distance,
            moving_time: activity.moving_time,
            start_date: activity.start_date,
            type: activity.type,
            points: activity.points,
            emoji: activity.emoji
        });
    }

    const bulkOps = Object.values(updates).map(entry => ({
        updateOne: {
            filter: { eventId, month, athleteId: entry.athleteId },
            update: {
                $set: {
                    athlete: entry.athlete,
                    [`activitiesByDate.${date}`]: entry.activitiesByDate[date] || []
                }
            },
            upsert: true
        }
    }));

    if (bulkOps.length > 0) {
        await EventActivity.bulkWrite(bulkOps);
    }

    res.json({
        message: `✅ Synced ${bulkOps.length} athlete records for ${date}`,
        activitiesFetched: successfulActivities.length
    });
});



// Get athletes by event and category
app.get('/athletesByEvent', async (req, res) => {
    try {
        const { eventid, month, category } = req.query;
        const athletes = await Athlete.find({ category: category });

        const athleteList = athletes.map((athlete) => ({
            id: athlete.athleteId,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            profile: athlete.profile,
            gender: athlete.gender,
            restDay: athlete.restDay || "Monday",
            team: athlete.team || "blue",
            category: athlete.category || "100"
        }));

        res.json({ athletes: athleteList });
    } catch (error) {
        console.error("❌ Error fetching athletesByEvent:", error.message);
        res.status(500).json({ error: "Error fetching athlete data" });
    }
});

// ✅ New /activitiesByEvent: Fetch from MongoDB
app.get('/activitiesByEvent', async (req, res) => {
    try {
        const { eventid, month, category } = req.query;
        if (!eventid || !month || !category) {
            return res.status(400).json({ error: "Missing eventid, month, or category" });
        }

        // Get athletes matching this category
        const athletes = await Athlete.find({ category });

        // Get athleteIds
        const athleteIds = athletes.map((a) => a.athleteId);

        // Fetch activity documents from MongoDB
        const results = await EventActivity.find({
            eventId: eventid,
            month: parseInt(month),
            athleteId: { $in: athleteIds }
        });

        // Format response: include athleteId, athlete info, and activitiesByDate
        const activities = results.map((doc) => ({
            athleteId: doc.athleteId,
            athlete: doc.athlete,
            activitiesByDate: doc.activitiesByDate
        }));

        res.json({ activities, medals: {} }); // You may calculate medals separately if needed
    } catch (err) {
        console.error("❌ Error fetching /activitiesByEvent:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
