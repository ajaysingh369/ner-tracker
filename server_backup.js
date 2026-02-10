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

// Global variable to cache the connection across invocations
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // Fix: prevent buffering which can cause timeouts
  mongoose.set('strictQuery', false);

  cachedDb = await mongoose.connect(MONGO_URI, {
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Fail fast if DB is down
    socketTimeoutMS: 45000,
  });

  console.log('✅ New MongoDB Connection established');
  return cachedDb;
}

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
  status: { type: String, default: "pending" },
  dummy: { type: Boolean, default: false }
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
//athleteSchema.index({ category: 1, status: 1, athleteId: 1 });
// Athlete.createIndexes().then(() => {
//   console.log('✅ Athlete indexes ensured');
// }).catch(err => {
//   console.error('❌ Athlete index creation error:', err.message);
// });




const athletesCache = new Map(); // key -> { expiresAt: number, payload: object }

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

function istDayKey(iso) {
  // iso is a UTC ISO string from Strava (e.g., "2025-08-14T21:30:00Z")
  const d = new Date(iso);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000); // shift to IST
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // "YYYY-MM-DD" in IST
}

// OAuth Authentication with Strava
app.get('/auth/strava', (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all,profile:read_all`;
  res.redirect(url);
});

app.get('/auth/strava/callback', async (req, res) => {
  await connectToDatabase();
  const code = req.query.code;
  if (!code) return res.status(400).send('❌ Authorization code not found');

  try {
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    const stravaAthlete = tokenResponse.data.athlete;
    const stravaEmail = stravaAthlete.email; // Requires read_all scope

    console.log(`🔹 Strava Auth: Received callback for athlete ${stravaAthlete.id} (${stravaAthlete.firstname} ${stravaAthlete.lastname})`);
    console.log(`🔹 Strava Auth: Athlete from Strava: ${JSON.stringify(stravaAthlete)}`);
    if (stravaEmail) console.log(`🔹 Strava Auth: Email from Strava: ${stravaEmail}`);
    else console.warn(`⚠️ Strava Auth: No email received from Strava. Check scopes.`);

    // 1. Try to find by Strava ID
    let athlete = await Athlete.findOne({ athleteId: stravaAthlete.id });
    if (athlete) console.log(`✅ Strava Auth: Found existing athlete by ID: ${athlete.athleteId}`);

    // 2. If not found by ID, try to find by Email (to link dummy records)
    if (!athlete) {
      if (stravaEmail) {
        console.log(`🔍 Strava Auth: Athlete not found by ID. Searching by email: ${stravaEmail}...`);
        athlete = await Athlete.findOne({ email: stravaEmail });
        if (athlete) {
          console.log(`🔗 Strava Auth: Linking Strava user ${stravaAthlete.id} to existing record via email ${stravaEmail} (Old ID: ${athlete.athleteId})`);
          athlete.athleteId = stravaAthlete.id;
        }
      }

      // 2.1 Fallback: Try to find by Name if Email failed or is missing
      if (!athlete) {
        const fullName = `${stravaAthlete.firstname} ${stravaAthlete.lastname}`.trim();
        console.log(`🔍 Strava Auth: Athlete not found by Email. Searching by Name: "${fullName}"...`);

        // Case-insensitive search for name in firstname field (where CSV stored full name)
        athlete = await Athlete.findOne({
          firstname: { $regex: new RegExp(`^${fullName}$`, 'i') },
          dummy: true // Only link to dummy records to avoid accidental takeovers
        });

        if (athlete) {
          console.log(`🔗 Strava Auth: Linking Strava user ${stravaAthlete.id} to existing dummy record via Name "${fullName}" (Old ID: ${athlete.athleteId})`);
          athlete.athleteId = stravaAthlete.id;
        } else {
          console.log(`ℹ️ Strava Auth: No existing dummy record found by Name.`);
        }
      }
    }

    // 3. Upsert (Update existing or Create new)
    const updatedAthlete = await Athlete.findOneAndUpdate(
      { athleteId: stravaAthlete.id },
      {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        firstname: stravaAthlete.firstname,
        lastname: stravaAthlete.lastname,
        profile: stravaAthlete.profile,
        email: stravaEmail, // Ensure email is saved
        dummy: false
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Strava Auth: Successfully updated/created athlete record for ${updatedAthlete.athleteId}. Dummy: ${updatedAthlete.dummy}`);

    res.redirect('/');
  } catch (error) {
    console.error('❌ Error fetching access token:', error.message);
    res.status(500).send('❌ Error fetching access token');
  }
});

// Token refresh with locking
async function safeRefreshAccessToken(athlete) {
  if (!refreshLocks.has(athlete.athleteId)) {
    const p = refreshAccessToken(athlete).finally(() => refreshLocks.delete(athlete.athleteId));
    refreshLocks.set(athlete.athleteId, p);
  }
  return refreshLocks.get(athlete.athleteId);
}

// async function safeRefreshAccessToken(athlete) {
//     if (!refreshLocks[athlete.athleteId]) {
//         refreshLocks[athlete.athleteId] = refreshAccessToken(athlete)
//             .finally(() => { delete refreshLocks[athlete.athleteId]; });
//     }
//     return refreshLocks[athlete.athleteId];
// }

async function fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, retry = true) {
  const now = Date.now();


  // 3. Fetch fresh from Strava
  let activities = [];
  let page = 1;
  const perPage = 100;
  const adjustEndTimeStamp = endTimestamp;

  try {
    while (true) {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${athlete.accessToken}` },
        params: { after: startTimestamp, before: adjustEndTimeStamp, per_page: perPage, page }
      });

      if (response.data.length === 0) break;

      // Process activities with athlete data
      const enrichedActivities = response.data
        .filter(activity => activity.distance >= 2000 && (activity.type == "Run" || activity.type == "Walk")) // ✅ Filter first to reduce unnecessary iterations
        .map(({ id, name, distance, moving_time, start_date, type }) => {
          const utcDate = new Date(start_date);
          const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
          const exts = [0, "🏃‍♂️"]; //CalculatePoints(type, moving_time);

          return {
            id, // Activity ID
            name, // Activity Name
            distance: parseFloat((distance / 1000).toFixed(2)), // Distance covered
            moving_time, // Time in motion,
            start_date: start_date, //istDate.toISOString(), // Store in IST format
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
    return activities;
  } catch (error) {
    // 🛑 If error is 401, refresh token
    if (error.response && error.response.status === 401) {

      // Check for Scope/Permission errors specifically
      if (error.response.data && error.response.data.errors) {
        const isScopeError = error.response.data.errors.some(e => e.code === 'missing' && e.field.includes('read'));
        if (isScopeError) {
          console.error(`❌ Authorization Error for athlete ${athlete.athleteId}: Missing required permissions (scope). Cannot sync.`);
          console.error(`   Details: ${JSON.stringify(error.response.data)}`);
          return null; // Do NOT retry, Do NOT refresh.
        }
      }

      console.log(`🔄 fetchAthleteActivitiesByEvent::Access token expired for athlete ${athlete.athleteId}, refreshing...`);

      if (!retry) {
        console.error(`❌ fetchAthleteActivitiesByEvent::Token refresh failed, stopping retries for athlete ${athlete.athleteId}`);
        return null;
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
        return null;
      }
    }

    if (error.response && error.response.status === 429) {
      console.warn(`⏳ Rate limited for athlete ${athlete.athleteId}, using stale cache if available.`);
    }

    console.error(`❌ Error fetching activities for athlete ${athlete.athleteId}:`, error.message);
    return null;
  }

  //return activities;
}

// Global map to prevent multiple refresh calls for same athlete at same time
const refreshLocks = new Map();

app.post('/syncEventActivities_New', async (req, res) => {
  await connectToDatabase();
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
async function fetchAthleteActivitiesWithRefresh(athlete, startTimestamp, endTimestamp) {
  let refreshedOnce = false; // ✅ Limit refresh attempts

  try {
    const activities = await fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp);
    return activities === null ? [] : activities;
  } catch (error) {
    if (error.response && error.response.status === 401 && !refreshedOnce) {
      refreshedOnce = true; // ✅ Ensure only 1 refresh attempt

      // Lock to prevent duplicate refresh for same athlete
      if (refreshLocks.has(athlete.athleteId)) {
        await refreshLocks.get(athlete.athleteId);
      } else {
        const refreshPromise = (async () => {
          console.log(`🔄 fetchAthleteActivitiesWithRefresh:: Access token expired for athlete ${athlete.athleteId}, refreshing...`);
          const newTokenData = await refreshAccessToken(athlete);
          if (newTokenData) {
            athlete.accessToken = newTokenData.access_token;
            athlete.refreshToken = newTokenData.refresh_token;
            console.log(`✅ fetchAthleteActivitiesWithRefresh :: Token refreshed successfully for athlete ${athlete.athleteId}`);
          } else {
            console.error(`❌ fetchAthleteActivitiesWithRefresh :: Token refresh failed for athlete ${athlete.athleteId}`);
            throw new Error("Refresh failed");
          }
        })();
        refreshLocks.set(athlete.athleteId, refreshPromise);
        await refreshPromise;
        refreshLocks.delete(athlete.athleteId);
      }

      // Retry once after refresh
      try {
        const activities = await fetchAthleteActivitiesByEvent(athlete, startTimestamp, endTimestamp, false);
        return activities === null ? [] : activities;
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


app.post('/syncEventActivitiesRange', async (req, res) => {
  await connectToDatabase();
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

    const startISO = startDate || '2026-02-01';
    const endISO = endDate || todayIST;
    const cats = Array.isArray(categories) && categories.length ? categories : ['50', '100', '150', '200'];

    const summary = [];
    const MAX_REQUESTS_PER_WINDOW = 95; // safety margin
    const DEFAULT_BATCH = 10;

    // Iterate dates outer → reduces memory + lets us skip fast per-date
    for (const dateISO of dateRangeIter(startISO, endISO)) {
      console.log(`\n📅 Syncing date ${dateISO}`);

      for (const category of cats) {
        console.log(` ▶️ Category ${category}`);

        const athletes = await Athlete.find({ category, status: 'confirmed', dummy: false });
        //const athletes = await Athlete.find({ athleteId: { $in: ["", "38976447", "", "", ""] } });
        //const athletes = await Athlete.find({ athleteId: "179282852" });
        if (!athletes.length) {
          console.log(`  ⚠️ No athletes in ${category}`);
          summary.push({ date: dateISO, category, processed: 0, skipped: 0, fetched: 0 });
          continue;
        }

        // Find athleteIds already synced for this date (present or empty)
        const alreadySyncedDocs = await EventActivity.find(
          {
            eventId,
            month, // or monthNum if you normalized
            $or: [
              { [`syncStatusByDate.${dateISO}`]: { $in: ['present', 'empty'] } },
              { [`activitiesByDate.${dateISO}`]: { $exists: true } } // legacy guard
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

        for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
          const batch = toProcess.slice(i, i + BATCH_SIZE);
          console.log(`  • Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)}`);

          const results = await Promise.allSettled(
            batch.map(a => fetchAthleteActivitiesByEvent(a, after, before))
          );

          const failedAthleteIds = new Set();

          results.forEach((result, idx) => {
            if (result.status !== 'fulfilled') {
              failedAthleteIds.add(batch[idx].athleteId);
              return;
            }

            // If null, it means sync failed (e.g. token error). Do NOT process, Do NOT mark empty.
            if (result.value === null) {
              failedAthleteIds.add(batch[idx].athleteId);
              return;
            }

            const activityList = result.value;
            if (activityList.length > 0) fetchedCount++;

            // We expect only activities of this *exact* date
            // But we’ll bucket by the actual activity.start_date date (IST) to be safe.
            activityList.forEach(activity => {
              const dayKey = istDayKey(activity.start_date);
              if (dayKey !== dateISO) {
                console.log("date differes in sync::", dayKey, dateISO, activity.start_date);
                return;
              }
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
              if (!updates[athleteId].activitiesByDate[dateISO]) {
                updates[athleteId].activitiesByDate[dateISO] = [];
              }
              updates[athleteId].activitiesByDate[dateISO].push({
                id: activity.id,
                name: activity.name,
                distance: activity.distance,
                moving_time: activity.moving_time,
                start_date: activity.start_date,
                type: activity.type,
                points: activity.points,
                emoji: activity.emoji
              });
              updates[athleteId].syncStatusByDate[dateISO] = 'present';
            });
          });

          // Mark EMPTY for any athlete in this batch that returned zero activities (and didn't fail)
          for (const a of batch) {
            if (failedAthleteIds.has(a.athleteId)) continue; // SKIP if sync failed
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
  await connectToDatabase();
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

  const allCategories = ["50", "100", "150", "200"];  //["100", "150", "200"];

  // Fetch all athletes of selected category
  //const athletes = await Athlete.find({ category: { $in: ["100", "150", "200"] } });
  //const athletes = await Athlete.find({ athleteId: { $in: ["203741775", "146379015", "167833362", "203739883"] } });
  //const athletes = await Athlete.find({ athleteId: "179482954" });
  const summary = [];

  for (const category of allCategories) {
    console.log(`\n=== Starting sync for category ${category} ===`);

    //const athletes = await Athlete.find({ athleteId: { $in: ["203741775", "146379015", "167833362", "203739883"] } });
    //let athletes = await Athlete.find({ category, status: 'confirmed', dummy: false });
    const athletes = await Athlete.find({ athleteId: "170742333" });
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
        if (result.status === "fulfilled" && result.value && result.value.length > 0) {
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

// Get athletes by event and category
app.get('/athletesByEvent', async (req, res) => {
  await connectToDatabase();
  try {
    const {
      eventid,   // kept for shape/forward compat
      month,     // kept for shape/forward compat
      category,
      page = '1',
      pageSize = '200',
      fields  // optional: "athleteId,firstname,lastname,profile,gender,restDay,team,category"
    } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    // Parse & clamp paging
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(5000, Math.max(1, parseInt(pageSize, 10) || 200));

    // Projection (only what the UI needs by default)
    const fieldList = (fields || 'athleteId,firstname,lastname,profile,gender,restDay,team,category,status,dummy')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const projection = {};
    for (const f of fieldList) projection[f] = 1;

    console.log('DEBUG: fieldList:', fieldList);
    console.log('DEBUG: projection:', projection);

    // Cache key
    const cacheKey = `athletes:${category}:p${p}:ps${ps}:f${fieldList.sort().join('|')}`;
    const now = Date.now();
    const cached = athletesCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      console.log('DEBUG: Serving from cache');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.json(cached.payload);
    }

    // Filter — if you use status to exclude pending/inactive, keep it
    const filter = { category, status: 'confirmed' };
    // If you want only active participants, uncomment:
    // filter.status = 'active';

    console.log('DEBUG: filter:', filter);

    // Run count + page query in parallel; lean() + projection keeps it fast/light
    const [total, docs] = await Promise.all([
      Athlete.countDocuments(filter).maxTimeMS(5000),
      Athlete.find(filter, projection)
        .sort({ lastname: 1, firstname: 1, athleteId: 1 })
        .skip((p - 1) * ps)
        .limit(ps)
        .lean()
        .maxTimeMS(5000)
    ]);

    console.log(`DEBUG: Found ${docs.length} docs. Sample:`, docs.length > 0 ? JSON.stringify(docs[0]) : 'None');
    if (docs.length > 0) {
      const dummies = docs.filter(d => d.dummy);
      console.log(`DEBUG: Found ${dummies.length} dummy athletes in result.`);
    }

    const payload = {
      page: p,
      pageSize: ps,
      total,
      pages: Math.ceil(total / ps),
      athletes: docs.map(a => ({
        id: a.athleteId,
        firstname: a.firstname || '',
        lastname: a.lastname || '',
        profile: a.profile || '',
        gender: a.gender ?? null,
        restDay: a.restDay || 'Monday',
        team: a.team || 'blue',
        category: a.category || '100',
        status: a.status || 'pending',
        dummy: !!a.dummy
      })),
      debug: {
        fieldList,
        projection,
        filter,
        docsFound: docs.length,
        dummiesFound: docs.filter(d => d.dummy).length
      }
    };

    // Store in memory for 5 min
    athletesCache.set(cacheKey, { expiresAt: now + 5 * 60 * 1000, payload });

    // Edge cache (Vercel/CloudFront) for 5 min, allow stale for 1h
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.json(payload);
  } catch (err) {
    console.error('❌ /athletesByEvent failed:', err.message);
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Fast lookups per event + month + athlete
EventActivity.schema.index({ eventId: 1, month: 1, athleteId: 1 }, { unique: false });
// ✅ New Index for optimized category fetch
EventActivity.schema.index({ eventId: 1, month: 1, "athlete.category": 1 });


// ✅ New /activitiesByEvent: Fetch from MongoDB
app.get('/activitiesByEvent', async (req, res) => {
  await connectToDatabase();
  try {
    const { eventid, month, category, athleteIds } = req.query;
    if (!eventid || month === undefined) {
      return res.status(400).json({ error: "Missing eventid or month" });
    }

    const query = { eventId: eventid, month: parseInt(month, 10) };

    if (athleteIds) {
      const ids = athleteIds.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) query.athleteId = { $in: ids };
    } else if (category) {
      // ✅ Optimized: Query directly by embedded category
      query["athlete.category"] = category;
    }

    // lean() to reduce overhead
    const docs = await EventActivity.find(query, {
      _id: 0, athleteId: 1, athlete: 1, activitiesByDate: 1
    })
      .lean()
      .maxTimeMS(5000);

    // Cache headers for CDN; safe because data only changes when you sync
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=1800');

    return res.json({
      activities: docs.map(d => ({
        athleteId: d.athleteId,
        athlete: d.athlete,
        activitiesByDate: d.activitiesByDate || {}
      })),
      medals: {} // (optional)
    });
  } catch (err) {
    console.error('❌ /activitiesByEvent error:', err.message);
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Use an environment variable for admin protection
const ADMIN_SECRET = process.env.ADMIN_SECRET || "ajaysingh369";

// Simple header-based guard
function assertAdmin(req, res, next) {
  const secret = req.header("x-admin-secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * POST /admin/clearSyncStatus
 * Body: {
 *   "eventId": "BADHTE_KADAM_2025_AUG",
 *   "dates": ["2025-08-15", "2025-08-16"],
 *   "athleteIds": ["12345","67890"], // optional
 *   "dryRun": true                    // optional (default: false)
 * }
 */
app.post("/admin/clearSyncStatus", assertAdmin, async (req, res) => {
  await connectToDatabase();
  try {
    const { eventId, dates, athleteIds, dryRun = false } = req.body || {};

    if (!eventId || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        error: "Invalid payload. 'eventId' and non-empty 'dates[]' are required.",
      });
    }

    // Validate YYYY-MM-DD format and build $unset map
    const unsetFields = {};
    for (const d of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return res.status(400).json({ error: `Invalid date format: ${d}. Use YYYY-MM-DD.` });
      }
      unsetFields[`activitiesByDate.${d}`] = [];
      unsetFields[`syncStatusByDate.${d}`] = "";
    }

    // Build filter
    const filter = { eventId: String(eventId) };
    if (Array.isArray(athleteIds) && athleteIds.length) {
      filter.athleteId = { $in: athleteIds.map(String) };
    }

    // How many docs match?
    const matched = await EventActivity.countDocuments(filter);

    // If dryRun, don’t modify—just report
    if (dryRun) {
      return res.json({
        eventId,
        dates,
        athleteIds: athleteIds || null,
        matched,
        modified: 0,
        dryRun: true,
        note: "This was a dry run—no changes were made.",
      });
    }

    // Perform the unset
    const result = await EventActivity.updateMany(filter, { $unset: unsetFields });
    const modified =
      typeof result.modifiedCount === "number"
        ? result.modifiedCount
        : (result.nModified || 0);

    return res.json({
      eventId,
      dates,
      athleteIds: athleteIds || null,
      matched,
      modified,
      dryRun: false,
    });
  } catch (err) {
    console.error("clearSyncStatus error:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
});


// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
