const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const axios = require("axios");

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "runastra_internal_sync_secret";

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
        if (path.endsWith("/auth/strava") && method === "GET") {
            response = handleStravaRedirect(event);
        } else if (path.endsWith("/internal/strava/link") && method === "POST") {
            response = await handleInternalLink(event);
        } else if (path.endsWith("/strava/last-activity") && method === "GET") {
            response = await handleGetLastActivity(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Strava Handler Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

function handleStravaRedirect(event) {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: JSON.stringify({ error: "userId required" }) };
    const VERCEL_URL = "https://ner-tracker.vercel.app";
    return {
        statusCode: 302,
        headers: { Location: `${VERCEL_URL}/auth/strava?state=runastra_${userId}` },
    };
}

async function handleInternalLink(event) {
    const secret = event.headers["x-internal-secret"] || event.headers["X-Internal-Secret"];
    if (secret !== INTERNAL_SECRET) return { statusCode: 401, body: "Unauthorized" };

    const body = JSON.parse(event.body || "{}");
    const { awsUserId, ...stravaData } = body;

    await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${awsUserId}`,
            SK: "STRAVA_AUTH",
            ...stravaData,
            lastSyncedAt: new Date().toISOString()
        }
    }));

    // Non-blocking or deferred: The activity will be fetched when the user lands on the Home Screen.
    // Removing blocking call to prevent Vercel/API Gateway timeouts during OAuth flow.
    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
}

async function handleGetLastActivity(event) {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: "userId required" };

    const getProfile = await ddbDocClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: "PROFILE" }
    }));

    const profile = getProfile.Item;
    const now = new Date();
    
    if (profile?.lastActivity && profile?.lastActivityUpdatedAt) {
        const lastUpdate = new Date(profile.lastActivityUpdatedAt);
        if ((now - lastUpdate) < 3600000) { 
            return { statusCode: 200, body: JSON.stringify({ status: "success", activity: profile.lastActivity, cached: true }) };
        }
    }

    const getAuth = await ddbDocClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: "STRAVA_AUTH" }
    }));

    if (!getAuth.Item) return { statusCode: 404, body: JSON.stringify({ status: "error", message: "Strava not linked" }) };

    const summary = await refreshAndCacheLastActivity(userId, getAuth.Item);
    return { statusCode: 200, body: JSON.stringify({ status: "success", activity: summary }) };
}

async function refreshAndCacheLastActivity(userId, auth) {
    try {
        let accessToken = auth.accessToken;
        const nowEpoch = Math.floor(Date.now() / 1000);

        if (auth.expiresAt < nowEpoch + 300) {
            const res = await axios.post("https://www.strava.com/oauth/token", {
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: auth.refreshToken,
                grant_type: "refresh_token"
            });
            accessToken = res.data.access_token;
            await ddbDocClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: `USER#${userId}`, SK: "STRAVA_AUTH" },
                UpdateExpression: "SET accessToken = :a, refreshToken = :r, expiresAt = :e",
                ExpressionAttributeValues: { ":a": accessToken, ":r": res.data.refresh_token, ":e": res.data.expires_at }
            }));
        }

        const actRes = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: 1 }
        });

        if (actRes.data.length > 0) {
            const raw = actRes.data[0];
            const distKm = raw.distance / 1000;
            const paceMinPerKm = raw.moving_time / 60 / distKm;
            
            let intensity = "Low";
            let nutritionTip = "Stay hydrated and stick to your regular healthy balanced diet.";
            let heroTagline = "Moving with purpose.";

            if (distKm > 10 || paceMinPerKm < 5.0) {
                intensity = "High";
                nutritionTip = "Intense effort! Aim for 20-30g of protein and complex carbs within 45 mins.";
                heroTagline = "Unstoppable force. Elite performance detected.";
            } else if (distKm > 5 || paceMinPerKm < 6.5) {
                intensity = "Moderate";
                nutritionTip = "Good work. A light protein snack (Greek yogurt or nuts) will help recovery.";
                heroTagline = "Consistency is king. Another strong finish.";
            }

            const summary = {
                id: raw.id, name: raw.name, distance: parseFloat(distKm.toFixed(2)),
                type: raw.type, startDate: raw.start_date, movingTime: raw.moving_time,
                fuelSync: { intensity, tip: nutritionTip },
                heroTagline
            };

            await ddbDocClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: `USER#${userId}`, SK: "PROFILE" },
                UpdateExpression: "SET lastActivity = :a, lastActivityUpdatedAt = :t",
                ExpressionAttributeValues: { ":a": summary, ":t": new Date().toISOString() }
            }));
            return summary;
        }
        return null;
    } catch (e) {
        console.error("Strava Sync Failed:", e);
        return null;
    }
}
