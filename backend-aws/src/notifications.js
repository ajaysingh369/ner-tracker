const { GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../firebase-service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.handler = async (event) => {
    console.log("🚀 Starting Daily AI Push Engine...");

    try {
        // 1. Fetch all users with FCM tokens
        const users = await ddbDocClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "attribute_exists(fcmToken) AND SK = :sk",
            ExpressionAttributeValues: { ":sk": "PROFILE" }
        }));

        console.log(`📱 Found ${users.Items.length} users with push tokens.`);

        for (const user of users.Items) {
            await processUserPush(user);
        }

        return { status: "success", count: users.Items.length };
    } catch (err) {
        console.error("❌ Push Engine Error:", err);
        throw err;
    }
};

async function processUserPush(user) {
    try {
        // 2. Fetch user's history for recap (Simplified for now - using last recorded steps)
        // In a real scenario, we'd fetch exactly yesterday's record SK.
        const steps = user.dailySteps || 0;
        const goal = user.dailyStepGoal || 10000;

        // 3. Generate Gemini Insight
        const prompt = `
            Context: A fitness app user named ${user.firstName}. 
            Yesterday's Performance: ${steps} steps out of a goal of ${goal}.
            Task: Write a 1-sentence recap and a 1-sentence high-energy motivational motto for today. 
            Tone: Professional, inspiring, and concise. No hashtags.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // 4. Send Push Notification
        const message = {
            notification: {
                title: `Rise & Run, ${user.firstName}! 🚀`,
                body: text,
            },
            data: {
                screen: "/explore" // Deep link to AI Coach tab
            },
            token: user.fcmToken,
            android: {
                priority: "high",
                notification: {
                    color: "#ff7a00",
                    sound: "default",
                    clickAction: "FLUTTER_NOTIFICATION_CLICK" // Standard action for many wrappers
                }
            }
        };

        await admin.messaging().send(message);
        console.log(`✅ Push sent to ${user.firstName}`);
    } catch (err) {
        console.error(`❌ Failed to send push to ${user.userId}:`, err);
    }
}
