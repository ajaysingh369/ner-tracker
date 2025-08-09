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
    activitiesByDate: Object,
    syncStatusByDate: Object
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

        // Update in memory
        athlete.accessToken = response.data.access_token;
        athlete.refreshToken = response.data.refresh_token;

        await Athlete.findOneAndUpdate(
            { athleteId: athlete.athleteId },
            { accessToken: response.data.access_token, refreshToken: response.data.refresh_token }
        );

        return response.data;
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
const refreshFailureTimestamps = {};

// Token refresh with locking
async function safeRefreshAccessToken(athlete) {
    if (!refreshLocks[athlete.athleteId]) {
        refreshLocks[athlete.athleteId] = refreshAccessToken(athlete)
            .finally(() => { delete refreshLocks[athlete.athleteId]; });
    }
    return refreshLocks[athlete.athleteId];
}

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
                const exts = [0, "🏃‍♂️"]; //CalculatePoints(type, moving_time);
            
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
            //const newTokenData = await refreshAccessToken(athlete);
            const newTokenData = await safeRefreshAccessToken(athlete);

            if (newTokenData) {
                athlete.accessToken = newTokenData.access_token; // ✅ Important fix
                athlete.refreshToken = newTokenData.refresh_token;
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

// Global map to prevent multiple refresh calls for same athlete at same time
const refreshLocks = new Map();

app.post('/syncEventActivities_New', async (req, res) => {
    const { eventId, month, date } = req.body;
    if (!eventId || month === undefined || !date) {
        return res.status(400).json({ error: 'eventId, month, and date (YYYY-MM-DD) are required' });
    }

    const parsedDate = new Date(date + "T00:00:00.000+05:30"); // IST midnight
    if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const startOfDay = new Date(parsedDate);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch all athletes for this category
    const athletes = await Athlete.find({ category: { $in: ["100", "150", "200"] } });

    const updates = {};
    let totalFetched = 0;
    let skipped = 0;

    // Process in batches
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 2000; // 2 seconds between batches

    for (let i = 0; i < athletes.length; i += BATCH_SIZE) {
        const batch = athletes.slice(i, i + BATCH_SIZE);

        for (const athlete of batch) {
            // ✅ Skip if date is older than yesterday and already synced
            if (parsedDate < yesterday) {
                const existing = await EventActivity.findOne({
                    eventId,
                    month,
                    athleteId: athlete.athleteId,
                    [`activitiesByDate.${date}`]: { $exists: true, $ne: [] }
                });
                if (existing) {
                    console.log(`⏩ Skipping ${athlete.firstname} ${athlete.lastname} — already synced for ${date}`);
                    skipped++;
                    continue;
                }
            }

            const activities = await fetchAthleteActivitiesWithRefresh(athlete, startTimestamp, endTimestamp);
            totalFetched += activities.length;

            for (const activity of activities) {
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
        }

        // Delay between batches to avoid rate limits
        if (i + BATCH_SIZE < athletes.length) {
            console.log(`⏳ Waiting ${BATCH_DELAY_MS / 1000} sec before next batch...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }

    // Bulk write all updates
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
        activitiesFetched: totalFetched,
        skipped
    });
});


// Helper — fetch activities & handle token refresh safely
// Helper — fetch activities & handle token refresh safely
async function fetchAthleteActivitiesWithRefresh(athlete, startTimestamp, endTimestamp) {
    let refreshedOnce = false; // ✅ Limit refresh attempts

    try {
        return await fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp);
    } catch (error) {
        if (error.response && error.response.status === 401 && !refreshedOnce) {
            refreshedOnce = true; // ✅ Ensure only 1 refresh attempt

            // Lock to prevent duplicate refresh for same athlete
            if (refreshLocks.has(athlete.athleteId)) {
                await refreshLocks.get(athlete.athleteId);
            } else {
                const refreshPromise = (async () => {
                    console.log(`🔄 Access token expired for athlete ${athlete.athleteId}, refreshing...`);
                    const newTokenData = await refreshAccessToken(athlete);
                    if (newTokenData) {
                        athlete.accessToken = newTokenData.access_token;
                        athlete.refreshToken = newTokenData.refresh_token;
                        console.log(`✅ Token refreshed successfully for athlete ${athlete.athleteId}`);
                    } else {
                        console.error(`❌ Token refresh failed for athlete ${athlete.athleteId}`);
                        throw new Error("Refresh failed");
                    }
                })();
                refreshLocks.set(athlete.athleteId, refreshPromise);
                await refreshPromise;
                refreshLocks.delete(athlete.athleteId);
            }

            // Retry once after refresh
            try {
                return await fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, false);
            } catch (err) {
                console.error(`❌ Retry failed for athlete ${athlete.athleteId} after refresh, skipping.`);
                return [];
            }
        }
        console.error(`❌ Error fetching athlete ${athlete.athleteId}:`, error.message);
        return [];
    }
}


function* dateRangeIter(startISO, endISO) {
    const cur = new Date(startISO + 'T00:00:00.000+05:30');
    const end = new Date(endISO + 'T00:00:00.000+05:30');
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      yield `${y}-${m}-${d}`;
      cur.setDate(cur.getDate() + 1);
    }
  }
  
  function toUnixRangeForIST(dateISO) {
    const start = new Date(dateISO + 'T00:00:00.000+05:30');
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return {
      after: Math.floor(start.getTime() / 1000),
      before: Math.floor(end.getTime() / 1000)
    };
  }

// POST /syncEventActivitiesRange
// Body:
// {
//   "eventId": "tkfvr",
//   "month": 7,                         // 0-indexed Aug = 7 (your BE now expects 0-indexed)
//   "startDate": "2025-08-01",          // optional; default 2025-08-01
//   "endDate": "2025-08-31",            // optional; default today (IST)
//   "categories": ["100","150","200"]   // optional; default all
// }
app.post('/syncEventActivitiesRange', async (req, res) => {
    try {
      const {
        eventId,
        month,
        startDate,
        endDate,
        categories
      } = req.body;
  
      if (!eventId || month === undefined) {
        return res.status(400).json({ error: 'eventId and month are required' });
      }
  
      const todayIST = (() => {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const now = new Date(Date.now() + istOffset);
        return now.toISOString().split('T')[0];
      })();
  
      const startISO = startDate || '2025-08-01';
      const endISO = endDate || todayIST;
      const cats = Array.isArray(categories) && categories.length ? categories : ['100', '150', '200'];
  
      const summary = [];
      const MAX_REQUESTS_PER_WINDOW = 95; // safety margin
      const DEFAULT_BATCH = 10;
  
      // Iterate dates outer → reduces memory + lets us skip fast per-date
      for (const dateISO of dateRangeIter(startISO, endISO)) {
        console.log(`\n📅 Syncing date ${dateISO}`);
  
        for (const category of cats) {
          console.log(` ▶️ Category ${category}`);
  
          const athletes = await Athlete.find({ category });
          if (!athletes.length) {
            console.log(`  ⚠️ No athletes in ${category}`);
            summary.push({ date: dateISO, category, processed: 0, skipped: 0, fetched: 0 });
            continue;
          }
  
          // Find athleteIds already synced for this date (present or empty)
          const alreadySyncedDocs = await EventActivity.find(
            {
              eventId,
              month,
              $or: [
                { [`syncStatusByDate.${dateISO}`]: { $in: ['present', 'empty'] } },
                // legacy safety: if activitiesByDate exists (even empty), treat as synced
                { [`activitiesByDate.${dateISO}`]: { $exists: true } }
              ]
            },
            { athleteId: 1 }
          );
  
          const alreadySynced = new Set(alreadySyncedDocs.map(d => d.athleteId));
          const toProcess = athletes.filter(a => !alreadySynced.has(a.athleteId));
  
          const skipped = athletes.length - toProcess.length;
          console.log(`  Athletes total: ${athletes.length}, to process: ${toProcess.length}, skipped: ${skipped}`);
  
          if (toProcess.length === 0) {
            summary.push({ date: dateISO, category, processed: 0, skipped, fetched: 0 });
            continue;
          }
  
          // Adaptive batch + delay
          const BATCH_SIZE = toProcess.length > 50 ? Math.min(DEFAULT_BATCH, 8) : DEFAULT_BATCH;
          const estDelayMs = Math.ceil((15 * 60 * 1000) / (MAX_REQUESTS_PER_WINDOW / BATCH_SIZE)); // coarse budget
          let fetchedCount = 0;
  
          const updates = {}; // athleteId -> upsert payload
  
          const { after, before } = toUnixRangeForIST(dateISO);
          const beforeAdjusted = before + 86400; // your earlier buffer; keep if you need it
  
          for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
            const batch = toProcess.slice(i, i + BATCH_SIZE);
            console.log(`  • Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)}`);
  
            const results = await Promise.allSettled(
              batch.map(a => fetchAthleteActivitiesByEvent(a, after, before)) // you can switch to beforeAdjusted if needed
            );
  
            results.forEach(result => {
              if (result.status !== 'fulfilled') return;
              const activityList = result.value || [];
              if (activityList.length > 0) fetchedCount++;
  
              // We expect only activities of this *exact* date
              // But we’ll bucket by the actual activity.start_date date (IST) to be safe.
              activityList.forEach(activity => {
                const dayKey = new Date(activity.start_date).toISOString().split('T')[0];
                const athleteId = activity.athlete.id;
  
                if (!updates[athleteId]) {
                  updates[athleteId] = {
                    athleteId,
                    eventId,
                    month,
                    athlete: activity.athlete,
                    activitiesByDate: {},
                    syncStatusByDate: {}
                  };
                }
                if (!updates[athleteId].activitiesByDate[dayKey]) {
                  updates[athleteId].activitiesByDate[dayKey] = [];
                }
                updates[athleteId].activitiesByDate[dayKey].push({
                  id: activity.id,
                  name: activity.name,
                  distance: activity.distance,
                  moving_time: activity.moving_time,
                  start_date: activity.start_date,
                  type: activity.type,
                  points: activity.points,
                  emoji: activity.emoji
                });
                updates[athleteId].syncStatusByDate[dayKey] = 'present';
              });
            });
  
            // Mark EMPTY for any athlete in this batch that returned zero activities
            for (const a of batch) {
              if (updates[a.athleteId]) continue; // has present data for some dayKey
              // Explicitly mark this date as empty
              if (!updates[a.athleteId]) {
                updates[a.athleteId] = {
                  athleteId: a.athleteId,
                  eventId,
                  month,
                  athlete: {
                    id: a.athleteId,
                    firstname: a.firstname,
                    lastname: a.lastname,
                    profile: a.profile,
                    gender: a.gender,
                    restDay: a.restDay || 'Monday',
                    team: a.team || 'blue',
                    category: a.category || '100'
                  },
                  activitiesByDate: {},
                  syncStatusByDate: {}
                };
              }
              updates[a.athleteId].activitiesByDate[dateISO] = [];
              updates[a.athleteId].syncStatusByDate[dateISO] = 'empty';
            }
  
            if (i + BATCH_SIZE < toProcess.length) {
              console.log(`  ⏳ Waiting ${estDelayMs}ms before next batch...`);
              await new Promise(r => setTimeout(r, estDelayMs));
            }
          }
  
          // Build bulk upserts
          const bulkOps = Object.values(updates).map(entry => {
            const setOps = {
              athlete: entry.athlete
            };
            // merge multiple dayKeys this pass may have touched
            for (const [k, v] of Object.entries(entry.activitiesByDate)) {
              setOps[`activitiesByDate.${k}`] = v;
            }
            for (const [k, v] of Object.entries(entry.syncStatusByDate)) {
              setOps[`syncStatusByDate.${k}`] = v; // "present" | "empty"
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
            await EventActivity.bulkWrite(bulkOps);
          }
  
          summary.push({
            date: dateISO,
            category,
            processed: bulkOps.length,
            skipped,
            fetched: fetchedCount,
            batchSize: BATCH_SIZE,
            delayMs: estDelayMs
          });
  
          // Small pause between categories per date
          await new Promise(r => setTimeout(r, 2000));
        }
  
        // Optional: a short pause between dates to be polite
        await new Promise(r => setTimeout(r, 2000));
      }
  
      res.json({ message: '✅ Range sync complete', range: { startISO, endISO }, summary });
    } catch (e) {
      console.error('❌ /syncEventActivitiesRange failed:', e.message);
      res.status(500).json({ error: 'Internal error', details: e.message });
    }
  });
  


// POST endpoint to fetch today's activities and store in DB
app.post('/syncEventActivities', async (req, res) => {
    const { eventId, month, date } = req.body;
    console.log(eventId, month, date);

    if (!eventId || month === undefined || !date) {
        return res.status(400).json({ error: 'eventId, month, and date (YYYY-MM-DD) are required' });
    }

    const parsedDate = new Date(date + "T00:00:00.000+05:30");
    if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const today = new Date();
    const daysOld = Math.floor((today - parsedDate) / (1000 * 60 * 60 * 24));

    const startOfDay = new Date(parsedDate);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    const allCategories = ["100", "150", "200"];  //["100", "150", "200"];

    // Fetch all athletes of selected category
    //const athletes = await Athlete.find({ category: { $in: ["100", "150", "200"] } });
    //const athletes = await Athlete.find({ category: { $in: ["200"] } });
    //const athletes = await Athlete.find({ athleteId: { $in: ["61676509", "148869247"] } });
    //const athletes = await Athlete.find({ athleteId: "179482954" });
    //"180767613", "179474640", "178581154", "178886643", "179553849", "179079797"
    //"175300317"
    //"113441625", "116199491", "178718682"

    //failed - 111078445

    const summary = [];

    for (const category of allCategories) {
        console.log(`\n=== Starting sync for category ${category} ===`);

        //const athletes = await Athlete.find({ athleteId: { $in: ["180767613", "179474640", "178581154", "178886643", "179553849", "179079797", "175300317", 113441625", "116199491", "178718682", ""] } });
        let athletes = await Athlete.find({ category });
        //const athletes = await Athlete.find({ athleteId: "179482954" });
        if (!athletes.length) {
            console.log(`⚠️ No athletes found for category ${category}`);
            summary.push({ category, processed: 0, skipped: 0, fetched: 0 });
            continue;
        }

        // Skip check for old dates
        let existingDocsMap = new Map();
        if (daysOld > 2) {
            const existingDocs = await EventActivity.find({
                eventId,
                month,
                [`activitiesByDate.${date}`]: { $exists: true, $ne: [] }
            }, { athleteId: 1 });

            existingDocs.forEach(doc => {
                const activities = doc.activitiesByDate?.[date];
                if (Array.isArray(activities) && activities.length > 0) {
                    existingDocsMap.set(doc.athleteId, true);
                }
            });

            //existingDocs.forEach(doc => existingDocsMap.set(doc.athleteId, true));
        }

        const filteredAthletes = athletes.filter(a => !(daysOld > 2 && existingDocsMap.has(a.athleteId)));
        const skippedCount = athletes.length - filteredAthletes.length;

        console.log(`Processing ${filteredAthletes.length} athletes, skipping ${skippedCount} already synced`);

        // Adaptive batch size based on total count
        let BATCH_SIZE = filteredAthletes.length > 50 ? 8 : 12;
        const MAX_REQUESTS_PER_WINDOW = 95; // safe margin
        let delayBetweenBatches = Math.ceil((15 * 60 * 1000) / (MAX_REQUESTS_PER_WINDOW / BATCH_SIZE));

        let fetchedCount = 0;
        const updates = {};

        for (let i = 0; i < filteredAthletes.length; i += BATCH_SIZE) {
            const batch = filteredAthletes.slice(i, i + BATCH_SIZE);

            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filteredAthletes.length / BATCH_SIZE)}`);

            const results = await Promise.allSettled(
                batch.map(a => fetchAthleteActivitiesByEvent(a, startTimestamp, endTimestamp))
            );

            results.forEach(result => {
                if (result.status === "fulfilled" && result.value.length > 0) {
                    fetchedCount++;
                    result.value.forEach(activity => {
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
                    });
                }
            });

            if (i + BATCH_SIZE < filteredAthletes.length) {
                console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
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

        summary.push({
            category,
            processed: bulkOps.length,
            skipped: skippedCount,
            fetched: fetchedCount,
            batchSize: BATCH_SIZE,
            delayBetweenBatches
        });

        // ⏳ Wait before moving to next category
        console.log(`✅ Finished category ${category}. Waiting 60s before next category...`);
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }

    res.json({ message: "✅ Sync complete", summary });
});

app.post('/syncEventActivities_old', async (req, res) => {
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
    //const athletes = await Athlete.find({ category: { $in: ["200"] } });
    //const athletes = await Athlete.find({ athleteId: { $in: ["61676509", "148869247"] } });
    const athletes = await Athlete.find({ athleteId: "179283352" });
    
    if (!athletes.length) {
        return res.status(404).json({ error: 'No athlete found with given ID' });
    }

    const results = await Promise.allSettled(
        athletes.map(athlete =>
            fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, true)
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
