const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const axios = require("axios");

// Native RunAstra Credentials
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "239306";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "4ae5f1b29f76497e96343ce3f95a23278b0640f2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-secret",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

exports.handler = async (event) => {
    console.log("Strava Handler Event:", JSON.stringify(event));
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    try {
        let response;
        if (path.includes("/auth/strava") && method === "GET") {
            response = handleStravaRedirect(event);
        } else if (path.includes("/strava/callback") && method === "GET") {
            response = await handleStravaCallback(event);
        } else if (path.includes("/strava/activities") && method === "GET") {
            response = await handleGetActivities(event);
        } else if (path.includes("/strava/last-activity") && method === "GET") {
            response = await handleGetLastActivity(event);
        } else {
            console.log("No route matched for path:", path, "method:", method);
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found", path, method }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Strava Handler Global Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                error: "Internal Server Error", 
                message: error.message,
                stack: error.stack 
            }),
        };
    }
};

function getApiGatewayUrl(event) {
    const host = event.headers.host || event.requestContext?.domainName;
    // Handle both custom domains and default execute-api domains
    if (host.includes('execute-api')) {
        const stage = event.requestContext?.stage || 'prod';
        return `https://${host}/${stage}`;
    }
    return `https://${host}`;
}

function handleStravaRedirect(event) {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: JSON.stringify({ error: "userId required" }) };
    
    const API_URL = getApiGatewayUrl(event);
    const REDIRECT_URI = `${API_URL}/strava/callback`;
    
    // Using mobile-optimized endpoint for app-to-app redirection
    const url = `https://www.strava.com/oauth/mobile/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=activity:read_all,profile:read_all&state=${userId}`;
    
    return {
        statusCode: 302,
        headers: { Location: url },
    };
}

async function handleStravaCallback(event) {
    const { code, state: awsUserId } = event.queryStringParameters || {};
    
    if (!code) {
        return { statusCode: 400, body: "Authorization code not found" };
    }
    if (!awsUserId) {
        return { statusCode: 400, body: "User ID (state) not found" };
    }

    try {
        const tokenResponse = await axios.post("https://www.strava.com/oauth/token", {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        const stravaAthlete = tokenResponse.data.athlete;
        
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `USER#${awsUserId}`,
                SK: "STRAVA_AUTH",
                stravaId: stravaAthlete.id.toString(),
                accessToken: tokenResponse.data.access_token,
                refreshToken: tokenResponse.data.refresh_token,
                expiresAt: tokenResponse.data.expires_at,
                profile: stravaAthlete.profile,
                firstname: stravaAthlete.firstname,
                lastname: stravaAthlete.lastname,
                lastSyncedAt: new Date().toISOString()
            }
        }));

        console.log(`✅ Native AWS Bridge: Token sync successful for user ${awsUserId}`);
        return {
            statusCode: 302,
            headers: { Location: `mobileapp://strava-callback?status=success&userId=${awsUserId}` },
        };
    } catch (error) {
        console.error("❌ Native Strava Callback Error:", error.message);
        return {
            statusCode: 302,
            headers: { Location: `mobileapp://strava-callback?status=error` },
        };
    }
}

async function handleGetActivities(event) {
    const { userId, per_page = 30 } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: "userId required" };

    const getAuth = await ddbDocClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: "STRAVA_AUTH" }
    }));

    if (!getAuth.Item) return { statusCode: 404, body: JSON.stringify({ status: "error", message: "Strava not linked" }) };

    try {
        const auth = getAuth.Item;
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
            params: { per_page }
        });

        const activities = actRes.data.map(raw => {
            const distKm = raw.distance / 1000;
            return {
                id: raw.id,
                name: raw.name,
                distance: parseFloat(distKm.toFixed(2)),
                type: raw.type,
                startDate: raw.start_date,
                movingTime: raw.moving_time,
                averageSpeed: raw.average_speed,
                totalElevationGain: raw.total_elevation_gain,
                hasHeartrate: raw.has_heartrate,
                averageHeartrate: raw.average_heartrate,
                maxHeartrate: raw.max_heartrate
            };
        });

        return { statusCode: 200, body: JSON.stringify({ status: "success", activities }) };
    } catch (e) {
        console.error("Strava Activities Fetch Failed:", e);
        return { statusCode: 500, body: JSON.stringify({ status: "error", message: e.message }) };
    }
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
                hasHeartrate: raw.has_heartrate,
                averageHeartrate: raw.average_heartrate,
                maxHeartrate: raw.max_heartrate,
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
