const { BatchWriteCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const { updateChallengeProgress } = require("./progress-engine");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "runastra_secret_key";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-secret",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

exports.handler = async (event) => {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    try {
        let response;
        if (path.endsWith("/mobile/sync") && method === "POST") {
            response = await handleSync(event);
        } else if (path.endsWith("/mobile/history") && method === "GET") {
            response = await handleHistory(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

async function handleSync(event) {
    console.log("📥 Received Sync Request:", event.body);
    const body = JSON.parse(event.body || "{}");
    const { athleteId, records } = body;

    if (!athleteId || !Array.isArray(records)) {
        console.warn("⚠️ Invalid Sync Payload:", { athleteId, recordsCount: records?.length });
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid payload. 'athleteId' and 'records[]' required." }),
        };
    }

    if (records.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ success: true, syncedCount: 0, message: "No records to sync." }) };
    }

    // Design: PK: USER#<athleteId>, SK: STEPS#<date>
    const putRequests = records.map(record => ({
        PutRequest: {
            Item: {
                PK: `USER#${athleteId}`,
                SK: `STEPS#${record.date}`,
                userId: athleteId,
                date: record.date,
                steps: parseInt(record.steps) || 0,
                distanceKm: parseFloat(record.distanceKm) || 0,
                source: record.source || 'health_connect',
                lastSyncedAt: new Date().toISOString()
            }
        }
    }));

    console.log(`📤 Preparing to batch write ${putRequests.length} records for user ${athleteId}`);

    // DynamoDB BatchWriteItem has a limit of 25 items
    const chunks = [];
    for (let i = 0; i < putRequests.length; i += 25) {
        chunks.push(putRequests.slice(i, i + 25));
    }

    try {
        await Promise.all(chunks.map(chunk => 
            ddbDocClient.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk
                }
            }))
        ));
        console.log("✅ Batch Write Successful");
    } catch (dbErr) {
        console.error("❌ DynamoDB Sync Error:", dbErr);
        throw dbErr;
    }

    // ── AUTOMATED PROGRESS TRIGGER ─────────────────────────────────────────
    updateChallengeProgress(athleteId).catch(e => console.error("Progress Trigger Error:", e));

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, syncedCount: putRequests.length }),
    };
}

async function handleHistory(event) {
    const { athleteId, range } = event.queryStringParameters || {};
    console.log(`🔍 Fetching history for athleteId: ${athleteId}, range: ${range}`);
    
    if (!athleteId) {
        return { statusCode: 400, body: JSON.stringify({ error: "athleteId is required" }) };
    }

    let startDate;
    const now = new Date();
    
    if (range === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
    } else if (range === 'monthly') {
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
    } else if (range === 'yearly') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
    } else {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0]; // Default 30 days
    }

    console.log(`📅 History Query Range: ${startDate} to ZZZ`);

    const result = await ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
        ExpressionAttributeValues: {
            ":pk": `USER#${athleteId}`,
            ":start": `STEPS#${startDate}`,
            ":end": `STEPS#ZZZ` 
        }
    }));

    const rawItems = result.Items || [];
    console.log(`📊 Found ${rawItems.length} records in DynamoDB`);

    let data = [];
    if (range === 'yearly') {
        // 1. Initialize all 12 months with 0s to ensure a full chart
        const monthlyAggregation = {};
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
            monthlyAggregation[monthStr] = { 
                date: `${monthStr}-01`, 
                steps: 0, 
                distanceKm: 0, 
                source: 'aggregated' 
            };
        }

        // 2. Fill in the actual data
        rawItems.forEach(item => {
            const month = item.date.substring(0, 7);
            if (monthlyAggregation[month]) {
                monthlyAggregation[month].steps += (item.steps || 0);
                monthlyAggregation[month].distanceKm += (item.distanceKm || 0);
            }
        });
        
        data = Object.values(monthlyAggregation).sort((a, b) => a.date.localeCompare(b.date));
    } else {
        data = rawItems.map(item => ({
            date: item.date,
            steps: item.steps,
            distanceKm: item.distanceKm,
            source: item.source
        }));
    }

    // ── Astra Zenith Logic (Always based on last 7 RAW days) ────────────────
    let zenithTarget = 8000; 
    let zenithMood = "Steady";
    let zenithMessage = "Move more to set your Zenith!";

    // To calculate a valid daily Zenith, we need the last 7 days of RAW data
    // Even if the user requested 'yearly', we want the DAILY average for Zenith.
    // If we already have the raw items (weekly/monthly/default), we use them.
    // If it's yearly, rawItems contains many more days, so we slice the tail.
    const zenithSourceData = rawItems.length > 0 ? rawItems.slice(-7) : [];

    if (zenithSourceData.length > 0) {
        const avg = Math.round(zenithSourceData.reduce((acc, curr) => acc + (curr.steps || 0), 0) / zenithSourceData.length);
        
        // ── Lull Detection (Contextual Intelligence) ──────────────────────
        const last3 = zenithSourceData.slice(-3);
        const isLull = last3.length === 3 && last3.every(d => (d.steps || 0) < (avg * 0.6)); 

        if (isLull) {
            zenithTarget = 3000;
            zenithMood = "Recovery";
            zenithMessage = "The AI noticed you're resting. Let's hit just 3,000 steps today to keep the streak 'Warm' without overtraining.";
        } else {
            const moods = [
                { type: "Maintain", boost: 1.0, msg: "Zenith is in maintain mode today, so you also just maintain your pace. :)", weight: 20 },
                { type: "Growth", boost: 1.05, msg: "Zenith is feeling energetic! Aim for a steady growth day.", weight: 40 },
                { type: "Surge", boost: 1.10, msg: "Zenith is in Surge mode today, so be hyper active! :)", weight: 30 },
                { type: "Zenith Overdrive", boost: 1.15, msg: "Zenith is in OVERDRIVE! Today is for record-breaking. Let's go!", weight: 10 }
            ];

            const now = new Date();
            const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 3600 * 24));
            // Multiplying by a prime number and taking modulo ensures a wider spread of days
            const rand = (daysSinceEpoch * 37) % 100;

            let selectedMood = moods[0];
            let cumulativeWeight = 0;
            for (const m of moods) {
                cumulativeWeight += m.weight;
                if (rand < cumulativeWeight) {
                    selectedMood = m;
                    break;
                }
            }

            zenithTarget = Math.round(avg * selectedMood.boost);
            if (zenithTarget < 1000) zenithTarget = 3000; // Minimum baseline
            zenithMood = selectedMood.type;
            zenithMessage = selectedMood.msg;
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            data,
            zenith: {
                target: zenithTarget,
                label: "Astra Zenith",
                mood: zenithMood,
                message: zenithMessage
            }
        }),
    };
}
