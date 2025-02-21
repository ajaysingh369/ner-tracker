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
        //console.log("token::", tokenResponse);
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
app.get('/activities_old', async (req, res) => {
    try {
        const { month } = req.query;
        const currentDate = new Date();
        const startOfMonth = month === 'current' ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) : new Date(currentDate.getFullYear(), month, 1);
        const endOfMonth = month === 'current' ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0) : new Date(currentDate.getFullYear(), month + 1, 0);

        const athletes = await Athlete.find({});
        const allActivities = [];

        for (const athlete of athletes) {
            try {
                const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                    headers: { Authorization: `Bearer ${athlete.accessToken}` },
                    params: {
                        after: Math.floor(startOfMonth.getTime() / 1000), // Convert to Unix timestamp
                        before: Math.floor(endOfMonth.getTime() / 1000)
                    }
                });

                const activitiesWithAthlete = activitiesResponse.data.map(activity => ({
                    ...activity,
                    athlete: {
                        id: athlete.athleteId,
                        firstname: athlete.firstname,
                        lastname: athlete.lastname,
                        profile: athlete.profile
                    }
                }));

                allActivities.push(...activitiesWithAthlete);
            } catch (error) {
                if (error.response && error.response.status === 401) {  // Token expired
                    console.log(`Access token expired for athlete ${athlete.athleteId}, refreshing...`);
                    token = await refreshAccessToken(athlete);

                    if (token) {
                        const retryResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                            headers: { Authorization: `Bearer ${token}` },
                            params: {
                                after: Math.floor(startOfMonth.getTime() / 1000), // Convert to Unix timestamp
                                before: Math.floor(endOfMonth.getTime() / 1000)
                            }
                        });
                        allActivities.push(...retryResponse.data);
                    }
                } else {
                    console.error(`Error fetching activities for athlete ${athlete.athleteId}:`, error.message);
                }
                //console.error(`Error fetching activities for athlete ${athlete.athleteId}:`, error.response ? error.response.data : error.message);
            }
        }

        // Step 1: Use a Map to track the highest elapsed_time for each athlete.id and start_date
        const activityMap = new Map();

        for (const activity of allActivities) {
        // Skip activities with elapsed_time < 3000
        if (activity.elapsed_time < 3000) continue;

        const key = `${activity.athlete.id}-${activity.start_date}`;
        const existingActivity = activityMap.get(key);

        // If no existing activity or current activity has higher elapsed_time, update the Map
        if (!existingActivity || existingActivity.elapsed_time < activity.elapsed_time) {
            activityMap.set(key, activity);
        }
        }

        // Step 2: Convert the Map values back to an array
        const optimizedActivities = Array.from(activityMap.values());

        // Update the allActivities object
        allActivities.activities = optimizedActivities;

        // Calculate medals
        const athleteActivityCount = {};
       // console.log("AJAY::", JSON.stringify(allActivities));
       optimizedActivities.forEach(activity => {
            const athleteId = activity.athlete.id;
            athleteActivityCount[athleteId] = (athleteActivityCount[athleteId] || 0) + 1;
        });
        console.log("AJAY::", JSON.stringify(athleteActivityCount));
        const sortedAthletes = Object.entries(athleteActivityCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Top 3 athletes

        const medals = {
            gold: sortedAthletes[0] ? sortedAthletes[0][0] : null,
            silver: sortedAthletes[1] ? sortedAthletes[1][0] : null,
            bronze: sortedAthletes[2] ? sortedAthletes[2][0] : null
        };

        res.json({ activities: optimizedActivities, medals });
    } catch (error) {
        console.error('Error fetching activities:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching activities');
    }
});


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
        let allActivities = [];

        for (const athlete of athletes) {
            try {
                const activities = await fetchAthleteActivities(athlete, startTimestamp, endTimestamp);
                const filteredActivities = activities.map(activity => ({
                    id: activity.id,
                    name: activity.name,
                    distance: activity.distance,
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

                allActivities.push(...filteredActivities);
            } catch (error) {
                console.error(`Error fetching activities for athlete ${athlete.athleteId}:`, error.message);
            }
        }

        // Deduplicate & Optimize Activities (Retain longest elapsed_time per athlete per day)
        const optimizedActivities = optimizeActivities(allActivities);

        // Calculate medals (Top 3 athletes by activity count)
        const medals = calculateMedals(optimizedActivities);

        res.json({ activities: optimizedActivities, medals });
    } catch (error) {
        console.error('Error fetching activities:', error.message);
        res.status(500).send('Error fetching activities');
    }
});

/**
 * Fetches paginated activities for an athlete.
 */
async function fetchAthleteActivities(athlete, startTimestamp, endTimestamp, retryCount) {
    let activities = [];
    let page = 1;
    const perPage = 50;
    const MAX_RETRIES = 2;

    while (true) {
        try {
            if(athlete.athleteId == 112972100) {
                console.log(`Fetching activities for athlete ${athlete.athleteId}, Page: ${page}`);
            }
            
            const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
                headers: { Authorization: `Bearer ${athlete.accessToken}` },
                params: { after: startTimestamp, before: endTimestamp, per_page: perPage, page }
            });
            // if(athlete.athleteId == 112972100) {
            //     console.log(`Response received for athlete ${athlete.athleteId}, Page: ${page}, Activities: ${response.data.length}`);
            //     const filteredActivities = response.data.map(activity => ({
            //         id: activity.id,
            //         name: activity.name,
            //         distance: activity.distance,
            //         moving_time: activity.moving_time,
            //         elapsed_time: activity.elapsed_time,
            //         start_date: activity.start_date,
            //         type: activity.type,
            //         athlete: {
            //             id: athlete.athleteId,
            //             firstname: athlete.firstname,
            //             lastname: athlete.lastname,
            //             profile: athlete.profile
            //         }
            //     }));
            //     console.log(JSON.stringify(filteredActivities));
            // }
            if (response.data.length === 0) break; // No more data

            activities.push(...response.data);
            if (response.data.length < perPage) break; // No more data
            page++; // Fetch next page
        } catch (error) {
            if (error.response && error.response.status === 401) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`Access token expired for athlete ${athlete.athleteId}, refreshing... (Attempt ${retryCount + 1})`);
                    const token = await refreshAccessToken(athlete);
                    if (token) {
                        return fetchAthleteActivities(athlete, startTimestamp, endTimestamp, retryCount + 1);
                    }
                }
                console.error(`Failed to refresh token for athlete ${athlete.athleteId}, skipping further attempts.`);
            }
            break; // Stop infinite loop if failure occurs
        }
    }
    // if(athlete.athleteId == 112972100) {
    //  console.log(`Total activities fetched for athlete ${athlete.athleteId}: ${activities.length}`);
    //  console.log(startTimestamp, endTimestamp, athlete.accessToken);
    // }
    return activities;
}


/**
 * Optimizes activities by keeping the longest elapsed_time per athlete per day.
 */
function optimizeActivities(activities) {
    const activityMap = new Map();

    for (const activity of activities) {
        if (activity.elapsed_time < 3000) {
            if(activity.athlete.athleteId == 112972100) {
            console.log("Ignored::", JSON.stringify(activity));
            }
            continue; // Ignore activities shorter than ~30 min
        }

        const key = `${activity.athlete.id}-${activity.start_date.split('T')[0]}`;
        const existingActivity = activityMap.get(key);

        if(activity.athlete.athleteId == 112972100 && existingActivity) {
            console.log("Key::", key);
            console.log("existing::", JSON.stringify(existingActivity));
            console.log("new::", JSON.stringify(activity));
        }

        if (!existingActivity || existingActivity.elapsed_time < activity.elapsed_time) {
            activityMap.set(key, activity);
        }
    }

    return Array.from(activityMap.values());
}

/**
 * Calculates medals for top 3 athletes based on activity count.
 */
function calculateMedals(activities) {
    const athleteActivityCount = activities.reduce((acc, activity) => {
        acc[activity.athlete.id] = (acc[activity.athlete.id] || 0) + 1;
        return acc;
    }, {});

    const sortedAthletes = Object.entries(athleteActivityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return {
        gold: sortedAthletes[0] ? sortedAthletes[0][0] : null,
        silver: sortedAthletes[1] ? sortedAthletes[1][0] : null,
        bronze: sortedAthletes[2] ? sortedAthletes[2][0] : null
    };
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