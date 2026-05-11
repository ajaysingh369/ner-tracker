const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");

async function seed() {
    console.log("🌱 Seeding LIVE RunAstra DynamoDB...");

    const items = [
        // Banners
        {
            PK: "BANNER",
            SK: "B1",
            title: "Niva Bupa Health Insurance",
            subtitle: "Get up to 20% discount on health premiums by completing your Daily Step Goals!",
            buttonText: "Claim Offer",
            imageUrl: "https://example.com/niva-bupa-banner.png"
        },
        // Challenges
        {
            PK: "CHALLENGE",
            SK: "NER_MARCH_2026",
            name: "NER Tracker March Marathon",
            description: "Join the Noida Extension Runners legacy. Complete 100,000 steps this month.",
            goal: 100000,
            type: "STEPS"
        },
        {
            PK: "CHALLENGE",
            SK: "LEGACY_NER_TRACKER",
            name: "NER Tracker (Classic)",
            description: "View the official Noida Extension Runners leaderboard and calendar history.",
            goal: 0,
            type: "WEB_TRACKER",
            url: "https://ner-tracker.vercel.app" // Fallback to live webapp for now
        },
        // Events
        {
            PK: "EVENT",
            SK: "EVT_JUNE_3",
            title: "Global Running Day",
            date: "June 3, 2026",
            subtitle: "Target: 5 KM Community Run",
            status: "upcoming",
            type: "INTERNAL",
            color: "rgba(52, 199, 89, 0.15)"
        }
    ];

    try {
        for (const item of items) {
            await ddbDocClient.send(new PutCommand({
                TableName: "RunAstraTable",
                Item: item
            }));
            console.log(`✅ Seeded: ${item.PK} - ${item.SK}`);
        }
        console.log("✨ Seeding complete. Your AWS backend is ready!");
    } catch (e) {
        console.error("❌ Seeding failed:", e);
    }
}

seed();
