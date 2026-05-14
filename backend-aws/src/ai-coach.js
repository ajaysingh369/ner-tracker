const { GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient, TABLE_NAME } = require("./db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "runastra_secret_key";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-internal-secret",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

// Mock Weather Service for demonstration
const getMockWeather = (city) => {
    const cityUpper = city.toUpperCase();
    if (cityUpper.includes("DELHI")) return { temp: 42, condition: "Heatwave", advice: "Heatwave alert! Avoid outdoor activity between 11 AM and 5 PM. Stick to indoor steps today." };
    if (cityUpper.includes("MUMBAI")) return { temp: 32, condition: "Heavy Rain", advice: "Monsoon intensity is high. Indoor walking or treadmill is your best friend today." };
    if (cityUpper.includes("BANGALORE") || cityUpper.includes("BENGALURU")) return { temp: 24, condition: "Pleasant", advice: "Perfect weather in the Garden City. Head to Cubbon Park for a long walk!" };
    if (cityUpper.includes("CHENNAI")) return { temp: 36, condition: "Humid", advice: "High humidity detected. Stay hydrated and try to finish your run before 7 AM." };
    if (cityUpper.includes("ABUJA")) return { temp: 34, condition: "Sunny", advice: "It's a bright day in Abuja. Keep a cap on and stay hydrated." };
    return null;
};

const getWeather = async (city) => {
    if (!city) return null;
    
    // 1. Try Mock First for known India-specific logic demonstration
    const mock = getMockWeather(city);
    if (mock) return mock;

    // 2. Try Real API if Key exists
    if (OPENWEATHER_API_KEY) {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`);
            if (res.ok) {
                const data = await res.json();
                const temp = Math.round(data.main.temp);
                let condition = data.weather[0].main;
                let advice = `It's ${temp}°C with ${condition} in ${city}.`;
                
                if (temp > 38) advice = `Extreme heat (${temp}°C) in ${city}. Please avoid outdoor activities and stay hydrated.`;
                else if (condition === "Rain" || condition === "Drizzle" || condition === "Thunderstorm") advice = `It's raining in ${city}. A great day for some indoor stretching or treadmill work!`;
                else if (temp < 10) advice = `Bracing cold (${temp}°C) in ${city}. Warm up well before you start!`;
                
                return { temp, condition, advice };
            }
        } catch (e) {
            console.log("Weather API Error:", e);
        }
    }
    return null;
};

exports.handler = async (event) => {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;

    console.log(`🤖 AI Coach Request: ${method} ${path}`);

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("🚫 AI Coach: Missing or invalid Authorization header");
        return { statusCode: 401, headers: CORS_HEADERS, body: "Unauthorized" };
    }
    
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        console.log(`👤 AI Coach for User: ${userId}`);

        if (!path.includes("/ai/coach")) {
            return { statusCode: 404, headers: CORS_HEADERS, body: "Not Found" };
        }
        
        const now = new Date();
        const startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        
        console.log(`📊 Fetching history from ${startDate}`);
        const historyResult = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND SK BETWEEN :start AND :end",
            ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":start": `STEPS#${startDate}`, ":end": `STEPS#ZZZ` }
        }));

        const history = historyResult.Items || [];
        console.log(`📈 Found ${history.length} history records`);
        const avgSteps = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.steps || 0), 0) / history.length) : 0;

        // ── Comeback & Victory Logic ──
        const todayStr = new Date().toISOString().split('T')[0];
        const todayData = history.find(h => h.date === todayStr);
        const dailySteps = todayData ? todayData.steps : 0;

        // Get the absolute last sync record
        const lastRecordResult = await ddbDocClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND SK BEGINS_WITH(:sk)",
            ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "STEPS#" },
            ScanIndexForward: false, // Latest first
            Limit: 1
        }));
        
        const lastRecord = lastRecordResult.Items?.[0];
        const lastSyncDate = lastRecord ? new Date(lastRecord.date) : null;
        const daysSinceSync = lastSyncDate ? Math.floor((new Date() - lastSyncDate) / (1000 * 60 * 60 * 24)) : 99;

        // Calculate Zenith (Mirroring sync.js logic)
        let zenithTarget = 8000;
        if (history.length > 0) {
            const last7 = history.slice(-7);
            const avg = Math.round(last7.reduce((acc, curr) => acc + (curr.steps || 0), 0) / last7.length);
            zenithTarget = Math.round(avg * 1.10); // Standard 10% boost
        }

        console.log(`📋 Fetching Profile for ${userId}`);
        const profileResult = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: "PROFILE" }
        }));
        const profile = profileResult.Item || {};
        const isPro = profile.isProUser === true;
        const firstName = profile.firstName || "Runner";

        console.log(`🌤 Weather Check for ${profile.city || 'Unknown'}`);
        const weather = await getWeather(profile.city);

        let pulseMessage = `Namaste ${firstName}! You're crushing it. Your consistency is in the top 15% of the community.`;
        let pulseInsight = "Peak performance detected on weekend mornings. Try to replicate that today!";

        if (weather) {
            pulseInsight = weather.advice;
            if (weather.temp > 38 || weather.condition.includes("Rain")) {
                pulseMessage = `Heads up ${firstName}! ${weather.condition} in ${profile.city} might slow you down, but let's keep the streak alive indoors.`;
            }
        }

        if (daysSinceSync >= 5) {
            pulseMessage = `Welcome back, ${firstName}! We've missed your energy. The roads in ${profile.city || 'the city'} have been quiet without you. Let's start with a light 5k today?`;
            pulseInsight = weather ? weather.advice : "It's been over 5 days since your last sync. A fresh start is just one step away.";
        } else if (dailySteps > zenithTarget) {
            pulseMessage = `UNSTOPPABLE! You've just smashed your Zenith target of ${zenithTarget.toLocaleString()} steps. You're operating at an elite level today, ${firstName}!`;
            pulseInsight = weather ? `Even with the ${weather.condition} in ${profile.city}, you surged! Hydrate well.` : "You are currently in 'Surge' mode. Ensure you hydrate well after this massive effort.";
        }

        const dailyPulse = {
            title: "Daily AI Pulse",
            message: pulseMessage,
            insight: pulseInsight
        };

        let tacticalPlan = `### 🎯 Weekly Tactical Masterplan\n\nHello **${firstName}**, based on your average of **${avgSteps.toLocaleString()} steps**, here is your strategy:\n\n`;

        if (avgSteps < 5000) {
            tacticalPlan += `#### 🚶 Foundation Week\nYour consistency is low. Focus on three 15-minute walks daily.\n\n* **Goal:** Hit 6,000 steps at least 4 times this week.`;
        } else {
            tacticalPlan += `#### 🏆 Elite Performance\nOutstanding work. Focus now on recovery and variety.\n\n* **Goal:** Maintain your 10k+ streak.`;
        }

        console.log("✅ AI Coach Plan Generated Successfully");
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
        console.error("❌ AI Coach Error:", err);
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "Error generating plan", details: err.message }) };
    }
};
