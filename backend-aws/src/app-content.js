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
        if (path.endsWith("/banners") && method === "GET") {
            response = await handleGetBanners();
        } else if (path.endsWith("/community/hero") && method === "GET") {
            response = await handleGetCommunityHero();
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
    // PK starts with BANNER# or is exactly BANNER
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :pk) OR PK = :pk",
        ExpressionAttributeValues: { ":pk": "BANNER" }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", banners: result.Items }) };
}

async function handleGetCommunityHero() {
    const hero = {
        name: "Ajay Singh",
        avatar: "https://ui-avatars.com/api/?name=Ajay+Singh&background=ff7a00&color=fff",
        achievement: "Hit 25,000 steps for 3 consecutive days!",
        message: "Consistency is the key to progress. Keep moving, RunAstra community!"
    };
    return { statusCode: 200, body: JSON.stringify({ status: "success", hero }) };
}

async function handleGetChallenges() {
    const result = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "CHALLENGE" }
    }));
    return { statusCode: 200, body: JSON.stringify({ status: "success", challenges: result.Items }) };
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
