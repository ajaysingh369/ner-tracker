const { GetCommand, QueryCommand, ScanCommand, BatchGetCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");

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
        if (path.endsWith("/leaderboard/global") && method === "GET") {
            response = await handleGlobalLeaderboard();
        } else if (path.endsWith("/leaderboard/challenge") && method === "GET") {
            response = await handleChallengeLeaderboard(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Leaderboard Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

async function handleGlobalLeaderboard() {
    const now = new Date();
    const monthPrefix = now.toISOString().substring(0, 7); 
    
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":sk": `STEPS#${monthPrefix}` }
    }));

    const userTotals = {};
    result.Items.forEach(item => {
        if (!userTotals[item.userId]) userTotals[item.userId] = { userId: item.userId, steps: 0 };
        userTotals[item.userId].steps += (item.steps || 0);
    });

    const sorted = Object.values(userTotals)
        .sort((a, b) => b.steps - a.steps)
        .slice(0, 50);

    if (sorted.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: [] }) };

    const enrichedLeaderboard = await enrichWithProfiles(sorted);
    return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: enrichedLeaderboard }) };
}

async function handleChallengeLeaderboard(event) {
    const { challengeId } = event.queryStringParameters || {};
    if (!challengeId) return { statusCode: 400, body: "challengeId required" };

    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk AND #st = :status",
        ExpressionAttributeValues: { 
            ":sk": `CHALLENGE#${challengeId}`,
            ":status": "approved"
        },
        ExpressionAttributeNames: { "#st": "status" }
    }));

    const sorted = result.Items
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .map(item => ({
            userId: item.userId,
            progress: item.progress || 0
        }));

    if (sorted.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: [] }) };
    
    const enrichedLeaderboard = await enrichWithProfiles(sorted);
    return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: enrichedLeaderboard }) };
}

async function enrichWithProfiles(list) {
    const keys = list.map(item => ({ PK: `USER#${item.userId}`, SK: "PROFILE" }));

    try {
        const profileData = await ddbDocClient.send(new BatchGetCommand({
            RequestItems: { [TABLE_NAME]: { Keys: keys } }
        }));

        const profiles = profileData.Responses[TABLE_NAME] || [];
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.userId] = p; });

        return list.map(item => ({
            ...item,
            userName: profileMap[item.userId] ? `${profileMap[item.userId].firstName} ${profileMap[item.userId].lastName}` : "Astra Runner",
            avatar: profileMap[item.userId]?.profileImage || null
        }));
    } catch (e) {
        console.error("Profile Enrichment Failed:", e);
        return list.map(item => ({ ...item, userName: "Astra Runner" }));
    }
}
