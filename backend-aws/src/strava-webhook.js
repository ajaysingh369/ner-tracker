const { GetCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const axios = require("axios");
const { updateChallengeProgress } = require("./progress-engine");

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "239306";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "4ae5f1b29f76497e96343ce3f95a23278b0640f2";
const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "runastra_webhook_secret";

exports.handler = async (event) => {
    console.log("📥 Strava Webhook Received:", JSON.stringify(event));

    const method = event.requestContext?.http?.method || event.httpMethod;
    
    // 1. Handshake (Validation)
    if (method === "GET") {
        const query = event.queryStringParameters || {};
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("✅ Webhook Validated");
            return {
                statusCode: 200,
                body: JSON.stringify({ "hub.challenge": challenge })
            };
        }
        return { statusCode: 403, body: "Forbidden" };
    }

    // 2. Event Processing
    if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const { aspect_type, object_id, object_type, owner_id } = body;

        // We only care about new activities
        if (object_type === 'activity' && aspect_type === 'create') {
            console.log(`🏃 New Activity Detected: ${object_id} for Strava User: ${owner_id}`);
            
            try {
                // Optimized Lookup: Using Global Secondary Index (GSI)
                // Index Name: stravaId-index
                // Partition Key: stravaId
                // Projection: ALL or INCLUDE (PK, SK)
                const userResult = await ddbDocClient.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    IndexName: "stravaId-index",
                    KeyConditionExpression: "stravaId = :sid",
                    ExpressionAttributeValues: { ":sid": owner_id.toString() }
                }));

                const auth = userResult.Items?.[0];
                if (!auth) {
                    console.warn(`⚠️ User not found for Strava ID: ${owner_id}`);
                    return { statusCode: 200, body: "OK" };
                }

                const userId = auth.PK.replace("USER#", "");
                await processActivity(userId, auth, object_id);

            } catch (err) {
                console.error("❌ Webhook Processing Error:", err);
            }
        }

        // Always return 200 to Strava within 2 seconds
        return { statusCode: 200, body: "EVENT_RECEIVED" };
    }

    return { statusCode: 404, body: "Not Found" };
};

async function processActivity(userId, auth, activityId) {
    try {
        let accessToken = auth.accessToken;
        const nowEpoch = Math.floor(Date.now() / 1000);

        // Refresh token if expired
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

        // Fetch full activity details
        const actRes = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const raw = actRes.data;
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

        // Cache as last activity in profile
        await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" },
            UpdateExpression: "SET lastActivity = :a, lastActivityUpdatedAt = :t",
            ExpressionAttributeValues: { ":a": summary, ":t": new Date().toISOString() }
        }));

        console.log(`✅ Webhook: Processed activity ${activityId} for user ${userId}`);

        // Trigger Progress Engine for distance-based challenges
        await updateChallengeProgress(userId);

    } catch (e) {
        console.error(`❌ Activity Processing Failed (${activityId}):`, e.message);
    }
}
