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
    const body = JSON.parse(event.body || "{}");
    const { athleteId, records } = body;

    if (!athleteId || !Array.isArray(records)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid payload. 'athleteId' and 'records[]' required." }),
        };
    }

    // Design: PK: USER#<athleteId>, SK: STEPS#<date>
    const putRequests = records.map(record => ({
        PutRequest: {
            Item: {
                PK: `USER#${athleteId}`,
                SK: `STEPS#${record.date}`,
                userId: athleteId,
                date: record.date,
                steps: record.steps || 0,
                distanceKm: record.distanceKm || 0,
                source: record.source || 'health_connect',
                lastSyncedAt: new Date().toISOString()
            }
        }
    }));

    // DynamoDB BatchWriteItem has a limit of 25 items
    const chunks = [];
    for (let i = 0; i < putRequests.length; i += 25) {
        chunks.push(putRequests.slice(i, i + 25));
    }

    await Promise.all(chunks.map(chunk => 
        ddbDocClient.send(new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: chunk
            }
        }))
    ));

    // ── AUTOMATED PROGRESS TRIGGER ─────────────────────────────────────────
    updateChallengeProgress(athleteId).catch(e => console.error("Progress Trigger Error:", e));

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, syncedCount: putRequests.length }),
    };
}

async function handleHistory(event) {
    const { athleteId, range } = event.queryStringParameters || {};
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

    const result = await ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
        ExpressionAttributeValues: {
            ":pk": `USER#${athleteId}`,
            ":start": `STEPS#${startDate}`,
            ":end": `STEPS#ZZZ` 
        }
    }));

    const data = result.Items.map(item => ({
        date: item.date,
        steps: item.steps,
        distanceKm: item.distanceKm,
        source: item.source
    }));

    // ── Astra Zenith Logic (AI/Curiosity Driven) ──────────────────────────
    let zenithTarget = 8000; 
    let zenithMood = "Steady";
    let zenithMessage = "Move more to set your Zenith!";

    if (data.length > 0) {
        const last7 = data.slice(-7);
        const avg = Math.round(last7.reduce((acc, curr) => acc + (curr.steps || 0), 0) / last7.length);
        
        // ── Lull Detection (Contextual Intelligence) ──────────────────────
        const last3 = data.slice(-3);
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

            const daySeed = new Date().getDate() + new Date().getMonth();
            const rand = (daySeed * 13) % 100;

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
