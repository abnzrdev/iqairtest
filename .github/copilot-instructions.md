# Copilot Instructions

## Architecture Snapshot
- The app is deliberately split: a FastAPI backend serves sensor data and auth while a Next.js App Router front renders pages and the map. See the entrypoints in [backend/main.py](backend/main.py) and the App Router root in [frontend/app/page.tsx](frontend/app/page.tsx) for how user data is fetched and rendered.
- The frontend talks to the backend through [frontend/lib/api.ts](frontend/lib/api.ts); it keeps a bearer token in `js-cookie` and the Axios instance automatically attaches that token before every request.
- [frontend/components/MapVisualization.tsx](frontend/components/MapVisualization.tsx) shows how purchased sensors and mock air-quality points are merged into Leaflet markers, so any backend change that alters the `/sensors/*` shape must stay compatible with the props consumed by this component.

## Backend Workflow Notes
- Start the API with `python backend/main.py` or `python backend/run.py` (the latter runs `uvicorn` with reload on port 8002); the frontend defaults to `NEXT_PUBLIC_API_URL=http://localhost:8002`, so keep the ports in sync.
- Environment variables live in `backend/.env`: `MONGO_URL`, `DATABASE_NAME`, `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_SECRET`, `IQAIR_API_KEY`, and `SENSOR_API_URL`. The new [guided-setup.sh](guided-setup.sh) script creates sensible defaults and reminds the developer to edit secrets.
- Authentication uses OAuth2: `/register`, `/token`, `/me`, `/admin/login` (via `ADMIN_SECRET`). Admin-only endpoints guard with `require_admin`, so the `/admin` routes in the backend must be called via tokens minted with the secret.
- Sensor flows (`/sensors/*`, `/purchase/sensors/{id}`, `/me/sensors`, `/admin/sensors`) all revolve around `sensor_permissions` stored on the user document; backend logs (see prints in [backend/main.py](backend/main.py)) expose what happens when permissions are updated.
- Seed data: [backend/create_test_user.py](backend/create_test_user.py) spins up `test@example.com`/`test123` so you can log in quickly without creating a new account.

## Frontend Flow & Patterns
- The home view (`frontend/app/page.tsx`) is client-only (`'use client'`) and boots via `authAPI.getMe`. It loads the air quality data, all map points, and purchased sensors, then renders `Navigation`, `CitySelector`, `AirQualityCard`, `MapVisualization`, and `AuthModal`.
- Tailwind + custom gradients dominate the styling; look at `globals.css` for the global dark background and the `snapshot` classes used in the hero for animation triggers.
- The component graph is simple: `AuthModal` handles login/register UI, `CitySelector` triggers `airQualityAPI.getAirQuality`, and `AirQualityCard` renders the first result from `airQualityAPI.getAllAirQuality`. `MapVisualization` consumes the same data plus `/sensors/map` to draw markers, so keep the props consistent.
- Build and lint commands: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`. The TypeScript paths (`@/*`) are defined in [frontend/tsconfig.json](frontend/tsconfig.json), so use `@/components` or `@/lib` rather than relative paths when adding new files.

## Integration & Known Drivers
- The backend currently mocks real IQAir and sensor data inside `/air-quality` and `/air-quality/all`; these methods fall back to a canned Almaty response when no real API or websocket data is present. Expect `calculate_aqi` to run on `pm25` and check the `global_cities` list in [backend/main.py](backend/main.py) for the fake world points that feed the map.
- Mongo is the single data store. The API uses Motor (see [backend/requirements.txt](backend/requirements.txt)) and stores `air_quality_history`, `sensors`, `users`, `purchases`, and `cities`. Ensure Mongo is reachable before running the backend—`guided-setup.sh` even probes port 27017 and warns if it cannot connect.
- The backend hardcodes CORS origins (`http://localhost:3000`, `port 3001`, plus a specific IP). If you serve the frontend from another host or port, update the middleware list in [backend/main.py](backend/main.py).

## Helpful Workflows & Tips
- Run `bash guided-setup.sh` to install Python/Node deps, create both `.env` files, and get a friendly walkthrough. The script tells you why each step exists and what to do when something breaks.
- After setup, activate `backend/venv/bin/activate` and run `python backend/main.py` (or `backend/run.py`). On the frontend side, `cd frontend && npm run dev` gives you a Next.js dev server that hot reloads the UI and map.
- Want a quick user? Run `backend/venv/bin/python backend/create_test_user.py` to insert the test account that `AuthModal` can use right away.
- Follow the `authAPI`, `airQualityAPI`, `sensorAPI`, and `adminAPI` helpers inside [frontend/lib/api.ts](frontend/lib/api.ts) for every fetch—changing request or response fields there is how you propagate schema changes to the UI.
- If you change backend routes, double-check that the frontend’s fetch params match (e.g., `airQualityAPI.getAirQuality` only passes `city`, `state`, `country`, `lat`, and `lon`). The UI also expects `sensorAPI.mapSensors` to return `lat`/`lng` for markers.

Please read through this file every time you return to the repo and let me know if any part feels unclear or still missing so I can improve it.

## For Beginners & Non-native English Speakers

- **Simple language:** I am a beginner in web development and English is my second language. Please write answers in short sentences and simple words.
- **Explain terms:** When you use a technical word, add a one-line simple explanation (example: "API = a way for programs to talk to each other").
- **Show steps:** Give step-by-step instructions I can copy and run. Use code blocks for commands and show exact file names to edit.
- **Explain changes simply:** When you change files, always include three short parts:
	- **What:** one-line summary of what changed.
	- **Why:** one-line reason the change was needed.
	- **How to test:** exact commands to run to check the change.
- **Small examples:** Show small code examples only for the needed part. Do not show whole files unless needed.
- **Ask one question if needed:** If you need more information, ask a single clear question so I can answer fast.

Please keep replies short and friendly so I can learn and follow them easily.