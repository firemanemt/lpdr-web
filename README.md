# Lost Pet Drone Recovery — Web App

A full-stack web application connecting pet owners with thermal drone pilots to find lost pets.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install frontend dependencies
cd ../frontend && npm install

# 3. Start backend (Terminal 1)
cd ../backend && npm run dev

# 4. Start frontend (Terminal 2)
cd ../frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Pet Owner | `owner@demo.com` | `password123` |
| Drone Pilot | `pilot1@demo.com` | `password123` |

---

## 🚄 Deploying to Railway

### Step 1: Push to GitHub

```bash
# Initialize git
cd lpdr-web
git init
git add .
git commit -m "Initial commit"

# Create a repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/lpdr-web.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. **Go to** [railway.app](https://railway.app) and log in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `lpdr-web` repo
4. **Railway auto-detects** the project — no config needed!

### Step 3: Environment Variables (Optional)

Railway sets `PORT` automatically. No required env vars for demo mode, but for production you'll want:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Strong secret for JWT signing |
| `NODE_ENV` | Set to `production` (Railway does this) |
| `DATABASE_URL` | PostgreSQL connection string (for production DB) |
| `STRIPE_SECRET_KEY` | For payment processing |
| `SENDGRID_API_KEY` | For email notifications |

### How It Works

Railway runs:
1. **Build:** `npm run build` — builds the React frontend into `frontend/dist/`
2. **Start:** `npm start` — starts the backend, which serves both the API **and** the built frontend

That's it! Your app will be live at `https://your-project.up.railway.app` 🎉

---

## 📁 Project Structure

```
lpdr-web/
├── package.json          # Root scripts for Railway (build + start)
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── .env              # Local env vars
│   └── src/
│       ├── index.js      # Express + Socket.io server
│       ├── config/       # App configuration
│       ├── middleware/    # Auth, validation, error handling
│       ├── routes/       # API routes (auth, pilots, cases, etc.)
│       └── services/     # In-memory storage with demo data
└── frontend/
    ├── package.json
    ├── vite.config.js    # Vite config with API proxy
    └── src/
        ├── App.jsx       # Routes & layouts
        ├── pages/        # All page components
        ├── components/   # Layout, spinner, protected routes
        ├── services/     # API client, WebSocket
        └── contexts/     # Auth context
```

---

## 🧪 Testing

All tested and working:

- ✅ User registration & login (JWT auth)
- ✅ Pet owner dashboard with active/past cases
- ✅ Drone pilot dashboard with availability toggle
- ✅ Submit lost pet case (4-step wizard)
- ✅ Case detail with real-time chat
- ✅ Interactive pilot map with search/filter
- ✅ FAQs and About pages
- ✅ Production build — single server serves API + frontend

---

## 🛠 Technologies

- **Frontend:** React 19, Vite, React Router, Axios, Socket.io Client
- **Backend:** Node.js, Express, Socket.io, JWT, Zod
- **Maps:** Interactive SVG-based pilot map
- **Database:** PostgreSQL (schema ready, in-memory storage for dev)
