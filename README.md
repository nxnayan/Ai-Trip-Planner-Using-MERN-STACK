# AI Trip Planner

Comprehensive, full‑stack AI Trip Planner — a small web application that helps users create and manage travel itineraries, search hotels, and authenticate users. This repository contains a Vite + React frontend and an Express-based backend with simple local DB utilities.

**Features**
- **User authentication**: sign up / login endpoints under `backend/routes/auth.js`.
- **Trips management**: create, read, update, delete trips via `backend/routes/trips.js` and `backend/models/Trip.js`.
- **Hotels lookup**: hotel-related endpoints in `backend/routes/hotels.js`.
- **Local DB helper**: lightweight `backend/db-local.js` for storing demo data.
- **Dev-friendly tooling**: Vite frontend (`src/`) with ESLint config and a small test server (`test-server.js`).

**Tech stack**
- Frontend: React, Vite
- Backend: Node.js, Express
- Linting: ESLint
- Data: simple local JS file store (no external DB required for demo)

**Quick Start (Development)**
Prerequisites: Node.js >= 16, npm or yarn.

1. Install dependencies (root and backend):

```bash
# from repository root
npm install
cd backend
npm install
cd ..
```

2. Run the backend server (development):

```bash
# from repository root
node backend/server.js
# or, if package.json scripts are set: (from repository root)
npm run start:backend
```

3. Run the frontend dev server:

```bash
npm run dev
```

Open the app at the address printed by Vite (usually http://localhost:5173).

**Environment / Configuration**
- The backend is configured in `backend/server.js`. For the demo, it uses `backend/db-local.js` to persist data locally. If you add environment variables, create a `.env` file in `backend/` and load them with `dotenv`.

**API Endpoints (overview)**
- `POST /auth/signup` — create a new user (see `backend/routes/auth.js`).
- `POST /auth/login` — authenticate and receive session token/cookie.
- `GET /trips` — list trips.
- `POST /trips` — create a trip.
- `GET /trips/:id` — fetch a single trip.
- `PUT /trips/:id` — update a trip.
- `DELETE /trips/:id` — remove a trip.
- `GET /hotels` — search/list hotels (simple stub implementation).

Refer to the route files in `backend/routes/` for request/response shapes and required fields.

**Project Structure (important files)**
- `backend/` — backend server code and routes
	- `server.js` — Express app entrypoint
	- `db-local.js` — local data persistence helper
	- `models/Trip.js`, `models/User.js` — data models used by routes
	- `routes/*.js` — route handlers (auth, trips, hotels)
- `src/` — React frontend source
	- `main.jsx`, `App.jsx` — app bootstrap and main component
	- `assets/`, `App.css`, `index.css` — styles and static assets
- `test-server.js` — small helper server used during development/testing

**Scripts**
- `npm run dev` — start Vite frontend
- `npm run build` — build frontend for production
- `npm run preview` — preview production build locally
- Backend scripts (check `backend/package.json`) may include `start` and `dev`.

**Testing & Validation**
- This repository does not include automated tests by default. You can add Jest or Vitest for unit tests and Supertest for API tests.

**Deployment Notes**
- For production deploy, build the frontend (`npm run build`) and serve the `dist/` assets from a static server or integrate into the backend by serving static files.
- Replace `db-local.js` with a real database (Postgres, MongoDB, etc.) and update models and connection logic.

**Contributing**
- Fork the repo, create a branch per feature/fix, and open a pull request describing changes.

**Troubleshooting**
- If ports are in use, adjust the port in `backend/server.js` or Vite's config (`vite.config.js`).
- If data doesn't persist between runs, it's expected for the demo local DB — switch to a persistent DB for production.

**License**
- See the repository `LICENSE` file for licensing terms.

---

If you'd like, I can also:
- Add examples of API requests (curl/Postman) with sample payloads.
- Add a `.env.example` and detailed deployment steps for Heroku/Vercel.

File updated: README.md
