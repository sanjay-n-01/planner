# Planner

Planner is a personal study and productivity dashboard for organizing daily work, long-term goals, academic preparation, and career milestones. It combines a React frontend with an Express API and MongoDB Atlas persistence while keeping local browser storage available as an offline fallback.

> **Architecture:** single-user application state store. Authentication, user accounts, JWT, and password handling are intentionally out of scope.

## Features

- Daily task planning with pending, in-progress, and completed statuses
- Backlog management for CCBP, Linux, projects, and custom tasks
- Four-year roadmap for technical learning, projects, GATE preparation, and internships
- GATE subject confidence and previous-year-question tracking
- Mock-test score history and progress visualizations
- Notes and scratch-memo support
- Restore bin for recently deleted tasks and subjects
- JSON import/export for manual snapshots and migration
- Optional daily rollover for unfinished tasks
- Evening browser notification for pending daily work
- MongoDB Atlas persistence with localStorage fallback

## Repository structure

```text
planner/
├── frontend/
│   ├── public/
│   │   └── sw.js
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── state.controller.js
│   │   ├── models/
│   │   │   └── state.model.js
│   │   ├── routes/
│   │   │   └── state.route.js
│   │   ├── app.js
│   │   └── index.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
└── README.md
```

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Service Worker and Notifications API

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- CORS
- dotenv

## Configuration

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
FRONTEND_URL=http://localhost:3000
```

`FRONTEND_URL` is optional for local development. The API also allows the standard Vite development origin at `http://localhost:5173`.

For MongoDB Atlas, create a database user and allow the development machine’s IP address in **Network Access**. URL-encode special characters in the database password before placing it in the connection string.

## Installation and local development

Install backend dependencies and start the API:

```bash
cd backend
npm install
npm run dev
```

In a second terminal, install frontend dependencies and start Vite:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:3000
```

The backend listens on `process.env.PORT`, falling back to port `5000` for local development.

## Available scripts

### Frontend

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the TypeScript check |

### Backend

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Node’s watch mode |
| `npm start` | Start the production API entry point |

## API

The backend exposes a single state resource:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/state` | Retrieve the single application state document |
| `PUT` | `/api/state` | Replace or create the application state document |

The MongoDB document contains:

```js
{
  today: [],
  backlog: [],
  roadmap: {},
  notes: [],
  subjects: [],
  scores: [],
  restore: [],
  settings: {}
}
```

All frontend `fetch()` calls are centralized in `frontend/src/services/api.js`.

## Persistence and recovery

MongoDB is the primary persistent store. The frontend:

1. Loads state from `GET /api/state` on startup.
2. Falls back to the existing localStorage cache if the API is unavailable.
3. Writes changes to localStorage immediately.
4. Sends state updates to the API after two seconds of inactivity.

The restore bin is an in-app recovery feature for recently deleted items. JSON import/export provides manual full-state snapshots. These features complement MongoDB; they do not replace Atlas backups or provide automatic version history.

## Notifications

After permission is granted, the frontend checks immediately on load and once per minute while the tab remains open. After 8 PM local time, it shows a **Tracker check-in** notification when:

- The current date has not already been recorded as opened.
- At least one item in `today` is not completed.

This feature is intentionally client-side. It does not use a push server or service-worker background sync and does not wake the browser after it has been fully closed.

## Scope and limitations

- Designed for one user and one application state document
- No authentication or account separation
- No server-side scheduled jobs
- Notifications require browser permission and an open app tab
- MongoDB stores the current state, not an automatic edit history

## Security notes

- Never commit `backend/.env` or `frontend/.env`.
- Keep MongoDB credentials in environment variables.
- Configure `FRONTEND_URL` to the deployed frontend origin in production.
- Use a restricted MongoDB user and appropriate Atlas network rules.
