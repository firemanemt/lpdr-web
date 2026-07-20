# Lost Pet Drone Recovery — Web App

A full-stack web application connecting pet owners with thermal drone pilots to find lost pets. Live at **[lpdr-web-production.up.railway.app](https://lpdr-web-production.up.railway.app)**.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Install all dependencies
npm run build   # installs frontend deps + builds, then installs backend deps

# Start the server
npm start       # starts Express server on port 4000

# Or for development with auto-reload:
cd backend && npm run dev
```

Then open **http://localhost:4000** in your browser.

Without `DATABASE_URL`, the app runs in **demo mode** with in-memory storage and seed data.

### Demo Credentials (demo mode only)

| Role | Email | Password |
|------|-------|----------|
| Pet Owner | `owner@demo.com` | `password123` |
| Drone Pilot | `pilot1@demo.com` | `password123` |
| Admin | `admin@demo.com` | `password123` |

---

## 🚄 Production Deployment (Railway)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Strong secret for JWT signing |
| `APP_URL` | Yes | Public URL of the app (for email links) |
| `SMTP_HOST` | Yes | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Yes | SMTP port (e.g., `587`) |
| `SMTP_USER` | Yes | SMTP username/email |
| `SMTP_PASS` | Yes | SMTP password or app password |
| `NODE_ENV` | Auto | Set to `production` by Railway |

### Production Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lostpetdronerecovery.com` | `LPDRadmin2024!` |

---

## ✅ Features

### Core
- User registration & login (JWT auth, email verification)
- Password reset flow
- Terms of Service & Privacy Policy
- PWA installable on iPhone/Android home screen
- iPhone safe area fixes (Dynamic Island, home indicator)

### Pet Owners
- Submit lost pet case with photos (5-step wizard, up to 5 photos)
- Real-time chat with assigned pilot (with image sharing)
- Case timeline and status tracking
- Review pilots after case completion

### Drone Pilots
- FAA Part 107 verification system (admin review)
- Availability toggle
- Pilot dashboard with case management
- Accept cases and update status (searching → found → completed)

### Map
- Interactive Leaflet map with dark CARTO tiles
- 25 real pilots from lostpetdronerecovery.com website
- Pilot popups with business name, drone model, contact info
- Service radius circles, pilot list bar

### Live Data
- 501+ cases pulled from WordPress REST API
- 25 real pilots with geocoded locations, business names, drone models
- Live stats (case count, pilot count, recovery rate)
- Contact info secured (phone/email only for verified pilots)

### Admin Dashboard (`/admin`)
- User stats (owners, pilots, admins)
- Case stats by status
- Pilot verification review (approve/reject with email notification)
- User management (search, filter by role)
- Case management (search, manually assign pilots)
- Broadcast email to all users

### Email
- Branded dark-themed HTML email templates
- Email verification (24hr token)
- Password reset (1hr token)
- Pilot verification approved/rejected emails
- Works with Gmail App Passwords or any SMTP

---

## 📁 Project Structure

```
lpdr-web/
├── package.json              # Root scripts (build + start for Railway)
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js          # Express + Socket.io server
│       ├── config/
│       │   ├── index.js      # App config (JWT, DB, SMTP, URLs)
│       │   └── database.js   # PostgreSQL schema (all tables)
│       ├── middleware/
│       │   ├── auth.js       # JWT auth, role checks
│       │   ├── validation.js # Zod schemas
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth.js       # Register, login, verify, reset
│       │   ├── pilots.js     # Pilot profiles, verification
│       │   ├── cases.js      # Cases with photos + notifications
│       │   ├── messages.js   # Chat messages
│       │   ├── content.js    # WP sync, stats, WP pilots
│       │   ├── admin.js      # Admin dashboard, broadcast
│       │   ├── map.js        # Map GeoJSON
│       │   └── notifications.js
│       └── services/
│           ├── storage.js    # In-memory storage + PostgreSQL factory
│           ├── dbStorage.js  # PostgreSQL implementation
│           ├── wpSync.js     # WordPress REST API sync
│           ├── wpPilotSync.js # Scrapes 25 real pilots from WP map
│           ├── mailService.js # Nodemailer + branded templates
│           └── notificationService.js
└── frontend/
    ├── package.json
    ├── public/
    │   ├── manifest.json     # PWA manifest
    │   └── lpdr-logo.png
    └── src/
        ├── App.jsx           # Routes
        ├── pages/
        │   ├── LandingPage.jsx       # Home with real Leaflet map
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── OwnerDashboard.jsx
        │   ├── PilotDashboard.jsx
        │   ├── PilotMapPage.jsx      # Full interactive map
        │   ├── PilotVerificationPage.jsx
        │   ├── SubmitCasePage.jsx    # 5-step wizard with photos
        │   ├── CaseDetailPage.jsx    # Chat + photos + actions
        │   ├── LiveCasesPage.jsx     # Real WP cases
        │   ├── LiveCaseDetailPage.jsx
        │   ├── AdminDashboard.jsx    # Full admin: users, cases, broadcast
        │   └── ... (FAQs, About, Terms, Privacy, etc.)
        ├── services/
        │   ├── api.js         # Axios API client
        │   └── socket.js      # Socket.io client
        ├── contexts/
        │   └── AuthContext.jsx
        └── components/
            ├── Layout.jsx     # Top bar + bottom nav
            ├── LoadingSpinner.jsx
            └── ProtectedRoute.jsx
```

---

## 🛠 Technologies

- **Frontend:** React 19, Vite, React Router, Axios, Socket.io Client, Leaflet, react-leaflet
- **Backend:** Node.js, Express, Socket.io, JWT, Zod, bcryptjs, Nodemailer, pg
- **Database:** PostgreSQL (auto-creates schema on startup)
- **Maps:** Leaflet + CARTO dark tiles, real pilot data from WP Google Map Plugin
- **WordPress Integration:** REST API for cases (501+), pilots (25), testimonials, FAQs
- **Email:** Nodemailer with SMTP (Gmail App Passwords, Resend, etc.)

---

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens with 7-day expiry
- Owner phone/email stripped from public API responses
- Contact info only accessible to verified pilots
- Admin routes require admin role
- Email verification required for new accounts
- WP pilot phone/cert numbers stripped from public API
