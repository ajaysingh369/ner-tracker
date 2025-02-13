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
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String } // Profile photo URL
});

const Athlete = mongoose.model('Athlete', athleteSchema);

// Redirect users to Strava for authorization
app.get('/auth/strava', (req, res) => {
    const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all`;
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
        const athleteId = tokenResponse.data.athlete.id;
        const firstname = tokenResponse.data.athlete.firstname;
        const lastname = tokenResponse.data.athlete.lastname;
        const profile = tokenResponse.data.athlete.profile; // Profile photo URL

        // Save or update athlete token in the database
        await Athlete.findOneAndUpdate(
            { athleteId },
            { accessToken, firstname, lastname, profile },
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
                console.error(`Error fetching activities for athlete ${athlete.athleteId}:`, error.response ? error.response.data : error.message);
            }
        }

        // Calculate medals
        const athleteActivityCount = {};
        allActivities.forEach(activity => {
            const athleteId = activity.athlete.id;
            athleteActivityCount[athleteId] = (athleteActivityCount[athleteId] || 0) + 1;
        });

        const sortedAthletes = Object.entries(athleteActivityCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Top 3 athletes

        const medals = {
            gold: sortedAthletes[0] ? sortedAthletes[0][0] : null,
            silver: sortedAthletes[1] ? sortedAthletes[1][0] : null,
            bronze: sortedAthletes[2] ? sortedAthletes[2][0] : null
        };

        res.json({ activities: allActivities, medals });
    } catch (error) {
        console.error('Error fetching activities:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching activities');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));