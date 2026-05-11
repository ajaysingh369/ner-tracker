const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// --- Mock Data Store ---
const mockUser = {
    id: "user-123",
    email: "tester@runastra.com",
    firstName: "Run",
    lastName: "Tester",
    profileImage: "https://i.pravatar.cc/150?u=runastra",
    onboardingComplete: true, 
    gender: "Male",
    dob: "1995-06-15",
    height: "180",
    weight: "75",
    dailyStepGoal: "10000",
    aiConsent: true,
    isProUser: false, // Default to false for teaser testing
    lastActivity: {
        id: "act-cached",
        name: "Mock Cached Run",
        distance: 5.2,
        type: "Run",
        startDate: new Date().toISOString(),
        fuelSync: {
            intensity: "Moderate",
            tip: "Good work. A light protein snack (Greek yogurt or a handful of nuts) will help with your recovery today."
        },
        heroTagline: "Consistency is king. Another strong finish."
    },
    lastActivityUpdatedAt: new Date().toISOString()
};

const mockBanners = [
    {
        PK: "BANNER",
        SK: "1",
        title: "Niva Bupa Health Insurance",
        subtitle: "Get up to 20% discount on health premiums by completing your Daily Step Goals!",
        buttonText: "Claim Offer",
        imageUrl: "https://example.com/banner1.png"
    }
];

const mockChallenges = [
    {
        PK: "CHALLENGE",
        SK: "NER_MARCH_2026",
        name: "NER Tracker March Marathon",
        description: "Join the legacy. Complete 100,000 steps this March to earn the NER Founder Badge.",
        goal: 100000,
        type: "STEPS",
        progress: 45
    },
    {
        PK: "CHALLENGE",
        SK: "LEGACY_NER_TRACKER",
        name: "NER Tracker (Classic)",
        description: "View the official Noida Extension Runners leaderboard and calendar history.",
        goal: 0,
        type: "WEB_TRACKER",
        url: "http://localhost:3003", 
        progress: 100
    }
];

// Initial user challenges so they appear on home
const mockUserChallenges = [
    {
        challengeId: "NER_MARCH_2026",
        status: "approved",
        progress: 45,
        name: "NER Tracker March Marathon",
        description: "Join the legacy. Complete 100,000 steps this March."
    },
    {
        challengeId: "LEGACY_NER_TRACKER",
        status: "approved",
        progress: 100,
        type: "WEB_TRACKER",
        url: "http://localhost:3003",
        name: "NER Tracker (Classic)",
        description: "View official Noida Extension Runners leaderboard."
    }
];

const mockRegistrations = [];

const mockEvents = [
    {
        PK: "EVENT",
        SK: "EVT_UPCOMING_1",
        title: "Global Running Day",
        date: "June 3, 2026",
        subtitle: "Target: 5 KM Community Run",
        status: "upcoming",
        registrationUrl: "https://forms.google.com/example",
        flyerTemplateUrl: "https://example.com/flyer-v1.png",
        color: "rgba(52, 199, 89, 0.15)",
        type: "INTERNAL"
    }
];

// --- Endpoints ---

// Auth
app.post('/auth/google', (req, res) => {
    res.json({ status: "success", token: "mock-jwt-token", user: mockUser });
});

app.get('/auth/me', (req, res) => {
    res.json({ status: "success", user: mockUser });
});

app.put('/auth/profile', (req, res) => {
    console.log("Profile Update Received:", req.body);
    Object.assign(mockUser, req.body);
    res.json({ status: "success" });
});

// Participation
app.post('/challenges/join', (req, res) => {
    const reg = { ...req.body, status: "pending", requestedAt: new Date().toISOString() };
    mockRegistrations.push(reg);
    res.json({ status: "success" });
});

app.get('/admin/registrations', (req, res) => {
    res.json({ status: "success", registrations: mockRegistrations });
});

app.post('/admin/registrations/approve', (req, res) => {
    const { userId, challengeId } = req.body;
    const idx = mockRegistrations.findIndex(r => r.userId === userId && r.challengeId === challengeId);
    if (idx > -1) mockRegistrations.splice(idx, 1);
    mockUserChallenges.push({ challengeId, status: "approved", progress: 0, name: "New Approved Challenge" });
    res.json({ status: "success" });
});

app.get('/user/challenges', (req, res) => {
    res.json({ status: "success", challenges: mockUserChallenges });
});

// Leaderboards
app.get('/leaderboard/global', (req, res) => {
    const board = [
        { userId: "1", userName: "Ajay Singh", steps: 124500, avatar: "https://i.pravatar.cc/150?u=1" },
        { userId: "2", userName: "Neha Kapoor", steps: 112000, avatar: "https://i.pravatar.cc/150?u=2" },
        { userId: "3", userName: "Vikram Raj", steps: 98000, avatar: "https://i.pravatar.cc/150?u=3" },
        { userId: "4", userName: "Priya Mehra", steps: 85000, avatar: "https://i.pravatar.cc/150?u=4" },
        { userId: "5", userName: "Sanjay D.", steps: 72000, avatar: "https://i.pravatar.cc/150?u=5" }
    ];
    res.json({ status: "success", leaderboard: board });
});

app.get('/leaderboard/challenge', (req, res) => {
    const board = [
        { userId: "2", userName: "Neha Kapoor", progress: 85, avatar: "https://i.pravatar.cc/150?u=2" },
        { userId: "1", userName: "Ajay Singh", progress: 70, avatar: "https://i.pravatar.cc/150?u=1" },
        { userId: "3", userName: "Vikram Raj", progress: 45, avatar: "https://i.pravatar.cc/150?u=3" }
    ];
    res.json({ status: "success", leaderboard: board });
});

// Sync & History
app.post('/mobile/sync', (req, res) => {
    console.log("Sync Received:", req.body);
    mockUserChallenges.forEach(c => {
        if (c.status === 'approved') c.progress = Math.min(c.progress + 5, 100); 
    });
    res.json({ success: true, syncedCount: req.body.records.length });
});

app.get('/mobile/history', (req, res) => {
    res.json({ success: true, data: [], zenith: { target: 8500, mood: "Surge", message: "Push for 10% more today!" } });
});

// App Content
app.get('/banners', (req, res) => {
    res.json({ status: "success", banners: mockBanners });
});

app.get('/events', (req, res) => {
    res.json({ status: "success", events: mockEvents });
});

app.post('/events', (req, res) => {
    const e = { ...req.body, SK: Date.now().toString() };
    mockEvents.push(e);
    res.json({ status: "success", event: e });
});

app.get('/community/hero', (req, res) => {
    res.json({ status: "success", hero: { name: "Rahul S.", title: "Consistency King", achievement: "Beat Zenith 5 days in a row!", avatar: "https://i.pravatar.cc/150?u=hero", message: "Rahul is unstoppable! 🔥" } });
});

app.get('/notifications', (req, res) => {
    const mockNotifications = [
        { SK: "NOTIF_1", title: "Almost there! ⚡", message: "You are at 8,200 steps. Just 1,800 more to hit your daily goal!", type: "GOAL", isRead: false, timestamp: new Date().toISOString() },
        { SK: "NOTIF_2", title: "Zenith Achieved! 🏆", message: "Boom! You just beat your 7-day average.", type: "ZENITH", isRead: true, timestamp: new Date().toISOString() }
    ];
    res.json({ status: "success", notifications: mockNotifications });
});

// ── FIXED AI COACH ENDPOINT ───────────────────────────────────────────
app.get('/ai/coach/plan', (req, res) => {
    res.json({ 
        status: "success", 
        isPro: mockUser.isProUser,
        dailyPulse: {
            title: "Daily AI Pulse",
            message: `Namaste ${mockUser.firstName}! You're crushing it. Your consistency is in the top 15% of the Noida Runners community.`,
            insight: "Peak performance detected on weekend mornings. Try to replicate that today!"
        },
        proTeaser: "Unlock your full 7-day tactical analysis, recovery predictions, and personalized cross-training plans.",
        tacticalPlan: `### 🎯 Weekly Tactical Masterplan\n\nHello **${mockUser.firstName}**, your data shows strong momentum.\n\n#### 📈 Performance Analysis\n* **Current Average:** 8,421 steps/day.\n* **Zenith Trend:** You are beating your Zenith 4/7 days.\n\n#### 🧘 Recovery Prediction\nEnergy levels look stable. You are primed for a **Zenith Overdrive** attempt this Wednesday.`
    });
});

// Strava Last Activity
app.get('/strava/last-activity', (req, res) => {
    res.json({ 
        status: "success", 
        activity: mockUser.lastActivity,
        cached: true 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 RunAstra Mock API running at http://localhost:${PORT}`);
});
