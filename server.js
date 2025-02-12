require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (including index.html)
app.use(express.static(path.join(__dirname, 'public')));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://ner-tracker.vercel.app/auth/strava/callback';

// Store access tokens (in-memory for simplicity, use a database in production)
const tokens = {};

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
        tokens[athleteId] = accessToken; // Store token
        res.redirect(`/?athleteId=${athleteId}`); // Redirect to root URL
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        res.status(500).send(`Error fetching access token: ${error.response ? error.response.data : error.message}`);
    }
});

// Fetch activities for a user
app.get('/activities/:athleteId', async (req, res) => {
    const athleteId = req.params.athleteId;
    const accessToken = tokens[athleteId];

    if (!accessToken) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        res.json(activitiesResponse.data);
    } catch (error) {
        console.error('Error fetching activities:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching activities');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));