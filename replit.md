# Replit setup

## Run the app

The Replit preview runs the Expo web version:

```bash
cd frontend
npm ci
yarn replit
```

`npm ci` installs the dependencies from `frontend/package-lock.json` (only needed
after a fresh import or dependency changes). The configured **Start application**
workflow runs `cd frontend && yarn replit` and serves Expo on port 5000.

## Project structure

- `frontend/` — Expo Router React Native app, also available as a web preview
- `backend/` — FastAPI API

The current frontend does not call the backend. The backend requires `MONGO_URL` and
`DB_NAME` through environment settings before it can start; it is not started by
the preview workflow.

AdMob is native-only; the web preview uses the platform-specific no-op ad modules.

Web purchases are optional and require `EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY`
and a configured RevenueCat Web Billing offering. Without these, the game runs
but checkout stays unavailable with an explanatory message.

## Setup verification

Dependencies use the existing npm lockfile. Type-check with
`cd frontend && npx tsc --noEmit`. Three imported goal-image filenames contained
invisible leading characters; they were normalized to match the asset imports.