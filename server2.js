require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (including index.html)
app.use(express.static(path.join(__dirname, 'public')));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/strava/callback';
const MONGO_URI = process.env.MONGO_URI; // MongoDB connection string

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define a schema for storing athlete tokens
const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String } // Profile photo URL
});

const Athlete = mongoose.model('Athlete', athleteSchema);

const refreshAccessToken = async (athlete) => {
    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: athlete.refreshToken, // Store refreshToken in DB
            grant_type: 'refresh_token'
        });

        // Update token in DB
        await Athlete.findOneAndUpdate(
            { athleteId: athlete.athleteId },
            { accessToken: response.data.access_token, refreshToken: response.data.refresh_token }
        );

        return response.data.access_token;
    } catch (error) {
        console.error(`Failed to refresh token for athlete ${athlete.athleteId}:`, error.message);
        return null;
    }
};

// Redirect users to Strava for authorization
app.get('/auth/strava', (req, res) => {
    const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all,read_all`;
    //const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all`;
    res.redirect(url);
});

// Handle Strava callback and fetch access token
app.get('/auth/strava/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Authorization code not found');
    }

    try {
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
        });
        
        const accessToken = tokenResponse.data.access_token;
        const refreshToken =  tokenResponse.data.refresh_token;
        const athleteId = tokenResponse.data.athlete.id;
        const firstname = tokenResponse.data.athlete.firstname;
        const lastname = tokenResponse.data.athlete.lastname;
        const profile = tokenResponse.data.athlete.profile; // Profile photo URL

        // Save or update athlete token in the database
        await Athlete.findOneAndUpdate(
            { athleteId },
            { accessToken, refreshToken, firstname, lastname, profile },
            { upsert: true, new: true }
        );

        res.redirect('/'); // Redirect to root URL
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        res.status(500).send(`Error fetching access token: ${error.response ? error.response.data : error.message}`);
    }
});

// Fetch activities for all authorized athletes
app.get('/activities', async (req, res) => {
    try {
        const { month } = req.query;
        const currentDate = new Date();
        const startOfMonth = month === 'current' 
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) 
            : new Date(currentDate.getFullYear(), month, 1);

        const endOfMonth = month === 'current' 
            ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0) 
            : new Date(currentDate.getFullYear(), month + 1, 0);

        const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        const endTimestamp = Math.floor(endOfMonth.getTime() / 1000);

        const athletes = await Athlete.find({});
        
        console.time("Total Execution Time"); // Start execution time tracking

        // Fetch activities for all athletes in parallel
        const activitiesResults = await Promise.all(
            athletes.map(athlete => fetchAthleteActivities(athlete, startTimestamp, endTimestamp, 0))
        );

        // Flatten array of results and remove null values
        const allActivities = activitiesResults.flat().filter(activity => activity !== null);

        // Optimize activities to keep the longest moving_time per athlete per day
        const optimizedActivities = optimizeActivities(allActivities);

        // Calculate medals (Top 3 athletes by activity count)
        const medals = calculateMedals(optimizedActivities);

        console.timeEnd("Total Execution Time"); // Log execution time
        res.json({ activities: optimizedActivities, medals });
    } catch (error) {
        console.error('Error fetching activities:', error.message);
        res.status(500).send('Error fetching activities');
    }
});

/**
 * Fetches paginated activities for an athlete (Handles API Pagination Efficiently)
 */
async function fetchAthleteActivities(athlete, startTimestamp, endTimestamp, retryCount) {
    let activities = [];
    let page = 1;
    const perPage = 100;
    const MAX_RETRIES = 2;

    while (true) {
        try {
            //console.log(`Fetching page ${page} for athlete ${athlete.athleteId}`);
            
            const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                headers: { Authorization: `Bearer ${athlete.accessToken}` },
                params: { after: startTimestamp, before: endTimestamp, per_page: perPage, page }
            });

            if (response.data.length === 0) break; // No more data

            // Extract only the necessary fields
            const filteredActivities = response.data.map(activity => ({
                id: activity.id,
                name: activity?.name,
                distance: activity.distance,
                moving_time: activity.moving_time,
                elapsed_time: activity.elapsed_time,
                start_date: activity.start_date,
                type: activity.type,
                athlete: {
                    id: athlete.athleteId,
                    firstname: athlete.firstname,
                    lastname: athlete.lastname,
                    profile: athlete.profile
                }
            }));

            activities.push(...filteredActivities);
            if (response.data.length < perPage) break;
            page++; // Move to next page

        } catch (error) {
            if (error.response && error.response.status === 401) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`⚠ Token expired for ${athlete.athleteId}, refreshing...`);
                    const token = await refreshAccessToken(athlete);
                    if (token) {
                        return fetchAthleteActivities(athlete, startTimestamp, endTimestamp, retryCount + 1);
                    }
                }
                console.error(`❌ Token refresh failed for athlete ${athlete.athleteId}, skipping.`);
            }
            break;
        }
    }

    return activities;
}

function convertToIST(utcDateStr) {
    const utcDate = new Date(utcDateStr);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC +5:30
    const istDate = new Date(utcDate.getTime() + istOffset);

    return istDate.toISOString().split("T")[0]; // Returns "YYYY-MM-DD"
}
/**
 * Keeps only the longest moving_time per athlete per day
 */
function optimizeActivities(activities) {
    const activityMap = new Map();
    let removedCount = 0;

    for (const activity of activities) {
        if (activity.moving_time < 1800) {
            removedCount++;
            continue;
        }

        // Convert UTC to IST before using it as a key
        const istDate = convertToIST(activity.start_date);
        const key = `${activity.athlete.id}-${istDate}`;
        const existingActivity = activityMap.get(key);

        // Only replace if the new activity has a longer moving_time
        if (!existingActivity || existingActivity.moving_time < activity.moving_time) {
            activityMap.set(key, activity);
        }
    }

    const optimizedActivities = Array.from(activityMap.values());

    return optimizedActivities;
}

/**
 * Calculates medals for top 3 athletes based on activity count.
 */
function calculateMedals(activities) {
    const athleteActivityCount = {};

    // Count activities per athlete
    activities.forEach(activity => {
        const athleteId = activity.athlete.id;
        athleteActivityCount[athleteId] = (athleteActivityCount[athleteId] || 0) + 1;
    });

    //console.log(`📊 Athlete Activity Counts:`, athleteActivityCount);

    // Sort athletes by activity count in descending order
    const sortedAthletes = Object.entries(athleteActivityCount)
        .sort((a, b) => b[1] - a[1]); // Sorting by count

    if (sortedAthletes.length === 0) return { gold: [], silver: [], bronze: [] };

    // Identify activity counts for each medal level
    let goldCount = sortedAthletes[0][1];
    let silverCount = null;
    let bronzeCount = null;

    const medals = { gold: [], silver: [], bronze: [] };

    sortedAthletes.forEach(([athleteId, count]) => {
        if (count === goldCount) {
            medals.gold.push(athleteId);
        } else if (!silverCount || count === silverCount) {
            silverCount = count;
            medals.silver.push(athleteId);
        } else if (!bronzeCount || count === bronzeCount) {
            bronzeCount = count;
            medals.bronze.push(athleteId);
        }
    });

    return medals;
}



async function refreshAccessToken2(athlete) {
    try {
        const response = await axios.post('https://www.strava.com/api/v3/oauth/token', {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            refresh_token: athlete.refreshToken,
            grant_type: 'refresh_token'
        });

        const newAccessToken = response.data.access_token;
        athlete.accessToken = newAccessToken;
        await athlete.save(); // Update in DB

        return newAccessToken;
    } catch (error) {
        console.error(`Failed to refresh token for athlete ${athlete.athleteId}:`, error.message);
        return null;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


/*
curl -X GET "https://www.strava.com/api/v3/athlete/activities?after=1704067200&before=1706745600&per_page=200&page=1" \
     -H "Authorization: Bearer b9d7a1a67dc6fbe2e0c198a49629f780da491f78"
*/