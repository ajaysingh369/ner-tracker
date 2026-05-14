/**
 * Strava Webhook Subscription Script
 * 
 * Run this script to register your callback URL with Strava.
 * 
 * Usage: 
 * 1. Deploy your Lambda and API Gateway.
 * 2. Update CALLBACK_URL below.
 * 3. node register_strava_webhook.js
 */

const axios = require('axios');

// --- CONFIGURATION ---
const CLIENT_ID = "239306";
const CLIENT_SECRET = "4ae5f1b29f76497e96343ce3f95a23278b0640f2";
const VERIFY_TOKEN = "runastra_webhook_secret";
const CALLBACK_URL = "YOUR_API_GATEWAY_URL/strava/webhook"; // Update this!

async function register() {
    console.log("🚀 Starting Strava Webhook Registration...");
    console.log(`🔗 Callback URL: ${CALLBACK_URL}`);

    try {
        const response = await axios.post("https://www.strava.com/api/v3/push_subscriptions", {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            callback_url: CALLBACK_URL,
            verify_token: VERIFY_TOKEN
        });

        console.log("✅ SUCCESS!");
        console.log("📦 Subscription Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ REGISTRATION FAILED");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

async function checkSubscriptions() {
    console.log("🔍 Checking existing subscriptions...");
    try {
        const response = await axios.get("https://www.strava.com/api/v3/push_subscriptions", {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }
        });
        console.log("📋 Active Subscriptions:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Check Failed:", error.message);
    }
}

// registration check
if (process.argv.includes('--check')) {
    checkSubscriptions();
} else {
    register();
}
