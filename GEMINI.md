# RunAstra Architecture and Project Context

This file contains the core architectural decisions, conventions, and context for the RunAstra project. It is automatically loaded by the AI agent across CLI sessions.

## 1. Project Overview
**RunAstra** is a hybrid mobile application (React Native) inspired by the existing NER Tracker web app. Its core mission is to track step counts, distances, and calories burned while fostering engagement through challenges, leaderboards, and eventually AI-driven personal training insights.

## 2. Technology Stack & Architectural Mandates
- **Mobile Client:** React Native with Expo (Managed Workflow, utilizing custom native pre-builds).
  - Navigation: Expo Router.
  - Native APIs: `@react-native-google-signin/google-signin`, `react-native-health-connect` / `react-native-health` (iOS equivalent).
  - **MANDATE: Environment Variables:** The mobile app MUST NOT contain hardcoded backend URLs. All API requests must use `process.env.EXPO_PUBLIC_API_URL` exclusively.
- **Backend (AWS Free Tier - Serverless):** This is the **ONLY** backend for the mobile app and admin panel.
  - **Compute:** AWS Lambda (`backend-aws/src/`).
  - **API Routing:** Amazon API Gateway.
  - **Database:** Amazon DynamoDB.
- **Web Presence:** AWS S3 + CloudFront static hosting for `athleon.co.in` (landing page, legal docs).
- **AI & LLMs:** Amazon Bedrock. Use ultra-cheap models (Amazon Nova Micro / Llama 3.2) for high-volume free tier features (Mascot taunts). Use premium models (Claude 3.5 Sonnet) exclusively for paid "Astra Pro" features (Architect weekly plans).
- **Monetization:** Google AdMob Native Advanced Ads + Meta Audience Network (via mediation). Real IDs are documented in code but test IDs MUST be active during development to prevent account strikes.
- **Legacy Backend (Vercel):** The Express.js server in the root (`server.js`) is strictly for the legacy NER Tracker web app and for handling the initial Strava OAuth redirect. It MUST NOT be modified to serve new mobile app endpoints.

## 3. Core Features (Phase 1)
1. **Health Data Sync:** Automatic background/foreground sync with Android/Apple Health Connect to capture daily steps, distance, and calories.
2. **Historical Views:** Granular views of step history (Weekly, Monthly, Yearly).
3. **Strava Integration:** OAuth connection with Strava to display recent activities on the Home Screen.
4. **Challenges & Admin Panel:** Users can join challenges (e.g., the NER Tracker challenge). An Admin Panel for sponsors to create custom step-based or Strava-based challenges.
5. **Sponsor Banners:** Monetization/partnership area on the home screen pulling dynamic images.

## 4. Future Expansion (Phase 2+)
1. **AI User Insights:** Analyzing step and Strava history to provide personalized health insights.
2. **Wearable Integration:** Direct or expanded watch integrations (Garmin, Apple Watch, Fitbit).
3. **Professional Matching:** AI-driven matchmaking between users and onboarded dieticians/instructors.
4. **AI Personal Trainer:** A cost-effective, conversational virtual PT for customized workout routines.

## 6. Future Feature Roadmap (RunAstra Unique Positioning)
1.  **Astra Zenith (AI Rival):** Dynamic daily targets based on 7-day trailing averages + 10% boost. Gamifies the "beat your yesterday" concept.
2.  **Fuel-Sync (AI Nutrition):** Reactive nutrition advice triggered by Strava activity intensity (e.g., high-intensity run triggers protein/carb intake suggestion).
3.  **Digital BIB (Social Virality):** AI-generated achievement posters with hero taglines based on real stats for social sharing.
4.  **AI Personal Trainer (Pro Tier):** Conversational virtual coach using LLMs (Amazon Bedrock) trained on the user's specific history to provide weekly tactical plans.
