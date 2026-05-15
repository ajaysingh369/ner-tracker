const { GetCommand, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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
        if (path.includes("/ai/coach")) {
            return await require("./ai-coach").handler(event);
        } else if (path.endsWith("/banners") && method === "GET") {
            response = await handleGetBanners();
        } else if (path.endsWith("/community/hero") && method === "GET") {
            response = await handleGetCommunityHero();
        } else if (path.includes("/user/challenges") && method === "GET") {
            response = await handleGetUserChallenges(event);
        } else if (path.endsWith("/challenges") && method === "GET") {
            response = await handleGetChallenges();
        } else if (path.endsWith("/events") && method === "GET") {
            response = await handleGetEvents();
        } else if (path.endsWith("/challenges/join") && method === "POST") {
            response = await handleJoinChallenge(event);
        } else {
            response = { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
        }

        return {
            ...response,
            headers: { ...CORS_HEADERS, ...response.headers }
        };
    } catch (error) {
        console.error("Content Error:", error);
        return { 
            statusCode: 500, 
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Server Error" }) 
        };
    }
};

async function handleGetBanners() {
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk OR begins_with(PK, :pk_prefix)",
        ExpressionAttributeValues: { ":pk": "BANNER", ":pk_prefix": "BANNER#" }
    }));
    
    // Fallback: If no banners found in BANNER PK, check if any challenges look like banners (legacy data fix)
    let banners = result.Items || [];
    if (banners.length === 0) {
        const altResult = await ddbDocClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "PK = :pk AND (attribute_exists(imageUrl) OR contains(title, :niva))",
            ExpressionAttributeValues: { ":pk": "CHALLENGE", ":niva": "Niva" }
        }));
        banners = altResult.Items || [];
    }

    return { statusCode: 200, body: JSON.stringify({ status: "success", banners }) };
}

async function handleGetUserChallenges(event) {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return { statusCode: 400, body: "userId required" };

    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "CHALLENGE#" }
    }));

    // For each joined challenge, we need to fetch the challenge details
    const userChallenges = result.Items || [];
    const enrichedChallenges = await Promise.all(userChallenges.map(async (uc) => {
        const challengeId = uc.SK.replace("CHALLENGE#", "");
        const details = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: "CHALLENGE", SK: challengeId }
        }));
        return { ...uc, ...(details.Item || {}), challengeId };
    }));

    // ── ASTRA ARCHITECT: Personalized Mission Suggestion ──────────────────
    // 1. Fetch user's recent step history to determine tier
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
    const historyResult = await ddbDocClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":start": `STEPS#${startDate}`, ":end": `STEPS#ZZZ` }
    }));
    
    const history = historyResult.Items || [];
    const avgSteps = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.steps || 0), 0) / history.length) : 0;

    // 2. Progression Tier Logic
    let tierGoal = 5000;
    let tierName = "Foundation 5K";
    let tierDesc = "The first step to elite fitness. Hit 5,000 steps daily for 7 days.";

    if (avgSteps >= 15000) {
        tierGoal = 20000;
        tierName = "Zenith Overlord";
        tierDesc = "You are in the top 1%. Push for the ultimate 20,000 step milestone.";
    } else if (avgSteps >= 9000) {
        tierGoal = 12000;
        tierName = "Elite 12K";
        tierDesc = "Break through the common ceiling. Elevate your baseline to 12,000.";
    } else if (avgSteps >= 4000) {
        tierGoal = 8000;
        tierName = "Active 8K";
        tierDesc = "Move from casual to active. Your target is the global health standard.";
    }

    // 3. Inject if not already joined a similar tier mission
    const hasSimilar = enrichedChallenges.some(c => c.name === tierName);
    if (!hasSimilar) {
        enrichedChallenges.push({
            challengeId: `ARCHITECT_${tierGoal}`,
            name: tierName,
            description: tierDesc,
            goal: tierGoal * 7, // 7-day total goal
            progress: Math.min(Math.round(((avgSteps * history.length) / (tierGoal * 7)) * 100), 99), // Preview progress
            isRecommended: true,
            type: 'STEPS',
            status: 'suggestion'
        });
    }

    return { statusCode: 200, body: JSON.stringify({ status: "success", challenges: enrichedChallenges }) };
}

// Helper needed for history query
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

async function handleGetChallenges() {
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "CHALLENGE" }
    }));
    
    // Filter out items that look like banners if they were mis-seeded
    const challenges = (result.Items || []).filter(item => !item.imageUrl && !item.title?.includes("Niva Bupa"));
    
    return { statusCode: 200, body: JSON.stringify({ status: "success", challenges }) };
}

async function handleGetEvents() {
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "EVENT" }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", events: result.Items }) };
}

async function handleJoinChallenge(event) {
    const { userId, challengeId } = JSON.parse(event.body || "{}");
    if (!userId || !challengeId) return { statusCode: 400, body: "userId and challengeId required" };

    // Use REG#PENDING to signify 2-step approval process
    await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${userId}`,
            SK: `CHALLENGE#${challengeId}`,
            userId,
            challengeId,
            status: "REG#PENDING",
            joinedAt: new Date().toISOString(),
            progress: 0
        }
    }));

    return { statusCode: 200, body: JSON.stringify({ status: "success", message: "Registration pending approval." }) };
}
