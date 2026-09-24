# Replit setup

## Run the app

The Replit preview runs the Expo web version:

```bash
cd frontend
yarn replit
```

The `replit` script starts Expo on `0.0.0.0:5000` for the Replit web preview.

## Project structure

- `frontend/` — Expo Router React Native app, also available as a web preview
- `backend/` — FastAPI API

The current frontend does not call the backend. The backend requires `MONGO_URL` and
`DB_NAME` in `backend/.env` before it can start.

AdMob is native-only; the web preview uses the platform-specific no-op ad modules.