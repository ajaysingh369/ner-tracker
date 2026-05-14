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
    
    console.log(`🌍 Fetching Global Leaderboard for: ${monthPrefix}`);

    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":sk": `STEPS#${monthPrefix}` }
    }));

    const items = result.Items || [];
    console.log(`📊 Found ${items.length} step records for this month`);

    const userTotals = {};
    items.forEach(item => {
        const uid = item.userId || item.PK.replace("USER#", "");
        if (!userTotals[uid]) userTotals[uid] = { userId: uid, steps: 0 };
        userTotals[uid].steps += (item.steps || 0);
    });

    const sorted = Object.values(userTotals)
        .sort((a, b) => b.steps - a.steps)
        .slice(0, 50);

    console.log(`🔝 Top ${sorted.length} users aggregated`);

    if (sorted.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: [] }) };

    const enrichedLeaderboard = await enrichWithProfiles(sorted);
    return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: enrichedLeaderboard }) };
}

async function handleChallengeLeaderboard(event) {
    const { challengeId } = event.queryStringParameters || {};
    
    if (!challengeId) {
        console.log("🏆 No challengeId provided, fetching Global Challenge Rank");
        // Fallback: Sum of progress across all challenges per user
        const result = await ddbDocClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "begins_with(SK, :sk)",
            ExpressionAttributeValues: { ":sk": "CHALLENGE#" }
        }));

        const items = result.Items || [];
        const userProgress = {};
        items.forEach(item => {
            if (item.PK.startsWith("USER#")) {
                const uid = item.userId || item.PK.replace("USER#", "");
                if (!userProgress[uid]) userProgress[uid] = { userId: uid, progress: 0, count: 0 };
                userProgress[uid].progress += (item.progress || 0);
                userProgress[uid].count += 1;
            }
        });

        const sorted = Object.values(userProgress)
            .map(u => ({ userId: u.userId, progress: Math.round(u.progress / (u.count || 1)) }))
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 50);

        if (sorted.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: [] }) };
        const enriched = await enrichWithProfiles(sorted);
        return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: enriched }) };
    }

    console.log(`🎖 Fetching Leaderboard for Challenge: ${challengeId}`);
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { 
            ":sk": `CHALLENGE#${challengeId}`
        }
    }));

    const sorted = (result.Items || [])
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .map(item => ({
            userId: item.userId || item.PK.replace("USER#", ""),
            progress: item.progress || 0
        }));

    if (sorted.length === 0) return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: [] }) };
    
    const enrichedLeaderboard = await enrichWithProfiles(sorted);
    return { statusCode: 200, body: JSON.stringify({ status: "success", leaderboard: enrichedLeaderboard }) };
}

async function enrichWithProfiles(list) {
    if (list.length === 0) return [];
    
    // De-duplicate userIds
    const uniqueUserIds = [...new Set(list.map(i => i.userId))];
    const keys = uniqueUserIds.map(uid => ({ PK: `USER#${uid}`, SK: "PROFILE" }));

    console.log(`👤 Enriching ${uniqueUserIds.length} profiles`);

    try {
        const profileData = await ddbDocClient.send(new BatchGetCommand({
            RequestItems: { [TABLE_NAME]: { Keys: keys } }
        }));

        const profiles = profileData.Responses[TABLE_NAME] || [];
        const profileMap = {};
        profiles.forEach(p => { 
            const uid = p.userId || p.PK.replace("USER#", "");
            profileMap[uid] = p; 
        });

        return list.map(item => ({
            ...item,
            userName: profileMap[item.userId] ? `${profileMap[item.userId].firstName} ${profileMap[item.userId].lastName}` : "Astra Runner",
            avatar: profileMap[item.userId]?.profileImage || null
        }));
    } catch (e) {
        console.error("❌ Profile Enrichment Failed:", e);
        return list.map(item => ({ ...item, userName: "Astra Runner" }));
    }
}
