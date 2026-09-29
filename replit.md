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
`DB_NAME` in `backend/.env` before it can start.

AdMob is native-only; the web preview uses the platform-specific no-op ad modules.