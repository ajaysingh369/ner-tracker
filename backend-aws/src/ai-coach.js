const { GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
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

    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { statusCode: 401, headers: CORS_HEADERS, body: "Unauthorized" };
    }
    
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        if (!path.includes("/ai/coach")) {
            return { statusCode: 404, headers: CORS_HEADERS, body: "Not Found" };
        }
        
        const now = new Date();
        const startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        
        const historyResult = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
            ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":start": `STEPS#${startDate}`, ":end": `STEPS#ZZZ` }
        }));

        const history = historyResult.Items || [];
        const avgSteps = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.steps || 0), 0) / history.length) : 0;

        const profileResult = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" }
        }));
        const profile = profileResult.Item || {};
        const isPro = profile.isProUser === true;

        const dailyPulse = {
            title: "Daily AI Pulse",
            message: `Namaste ${profile.firstName}! You're crushing it. Your consistency is in the top 15% of the Noida Runners community.`,
            insight: "Peak performance detected on weekend mornings. Try to replicate that today!"
        };

        let tacticalPlan = `### 🎯 Weekly Tactical Masterplan\n\nHello **${profile.firstName}**, based on your average of **${avgSteps.toLocaleString()} steps**, here is your strategy:\n\n`;

        if (avgSteps < 5000) {
            tacticalPlan += `#### 🚶 Foundation Week\nYour consistency is low. Focus on three 15-minute walks daily.\n\n* **Goal:** Hit 6,000 steps at least 4 times this week.`;
        } else {
            tacticalPlan += `#### 🏆 Elite Performance\nOutstanding work. Focus now on recovery and variety.\n\n* **Goal:** Maintain your 10k+ streak.`;
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                status: "success", isPro, dailyPulse, tacticalPlan,
                proTeaser: !isPro ? "Unlock full 7-day tactical analysis and recovery predictions." : null,
                generatedAt: new Date().toISOString()
            }),
        };
    } catch (err) {
        console.error("AI Coach Error:", err);
        return { statusCode: 500, headers: CORS_HEADERS, body: "Error generating plan" };
    }
};
