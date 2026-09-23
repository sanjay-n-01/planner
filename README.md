# Planner

Planner is a React/Vite frontend backed by an Express and MongoDB Atlas API. It stores one single-user application state document; there is no authentication or user account system.

## Structure

```text
planner/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
└── backend/
    ├── src/
    ├── .env
    ├── package.json
    └── package-lock.json
```

## Run locally

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Configure `backend/.env` using `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
FRONTEND_ORIGIN=http://localhost:3000
```

Start the backend in one terminal:

```text
cd backend
npm install
npm start
```

Start the frontend in a second terminal:

```text
cd frontend
npm install
npm run dev
```

The frontend uses `GET /api/state` on startup and debounced `PUT /api/state` saves. It keeps localStorage as an offline fallback cache.
