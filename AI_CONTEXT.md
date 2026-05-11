# NER-Tracker Architectural Overview

## Project Structure
This repository contains a full-stack running event tracking and fitness leaderboard system. 
It is split into two primary domains:

1. **`mobile-app/`**: A React Native application built with Expo (Managed workflow heavily utilizing Config Plugins, but with custom native `android` pre-build folders present for extensive native functionality tweaking).
2. **Backend API (`server.js`, `api_v2/`, etc.)**: An Express.js backend that handles athlete event tracking, syncing steps from Google Health Connect, Strava integrations, and calculating daily quotas/caps (e.g., the 200KM bonus rules). It is deployed via Vercel (see `vercel.json`).

## Key Mobile Integrations
- **Health Connect (`react-native-health-connect`)**: The app relies heavily on Google Health Connect to read daily steps for users tracking distances up to 200KM. It uses the `androidx.health.connect` SDK, which necessitates strict `AndroidManifest.xml` intent-filters, `queries`, and `WRITE_STEPS`/`READ_STEPS` permissions.
- **Google Sign-In (`@react-native-google-signin/google-signin`)**: Authenticates athletes. The package name (`com.runastra.mobileapp`) must exactly match the authorized client ID in the Google Cloud Console.
- **Expo Router**: Handles all file-based navigation under the `mobile-app/app` directory (e.g., `(tabs)`, `(auth)`).

## Development vs Production
- **Mobile Environment Handling**: The `mobile-app/.env` file dictates `EXPO_PUBLIC_APP_VARIANT` (`development` or `production`). This affects the backend API URI prefix and Google Client IDs. 
- **Standalone Builds**: Because the project uses complex native modules, testing often requires a local build (`npx expo run:android`) or EAS Build in the cloud. Heavy native builds on local machines often fail due to JVM memory scaling limits (`MaxMetaspaceSize` in `gradle.properties`).
 
## Backend Quirks
- **Vercel Limits**: Vercel limits serverless execution timeouts. Heavy syncing operations (like syncing month-long steps for 500 athletes) must be paginated or client-orchestrated to avoid a `504 Gateway Timeout`.
- **Database Logic**: The backend calculates complex distance rules such as daily caps (e.g., 12 km cap) and bonus limits (up to 21km per half-marathon, mapped per month).

## Summary for AI Assistants
When assisting the user:
1. Identify if the issue is in the `mobile-app/` domain or the Backend.
2. For mobile crashes, verify native Android files (`AndroidManifest.xml`, `strings.xml`, `proguard-rules.pro`).
3. For API or sync issues, look inside `server2.js` or `api_v2/`.
