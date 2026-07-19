# LPDR Phase 1 — Production Readiness Complete ✅

## What Was Added

### 1. PostgreSQL Database Layer 🔢
- **`dbStorage.js`** — Full PostgreSQL implementation of the storage interface
- Auto-detects: if `DATABASE_URL` is set → PostgreSQL; otherwise → in-memory demo mode
- All data persists across server restarts when DB is connected
- **Same API** as in-memory storage, so the rest of the app doesn't change
- Database schema includes all tables: users, pilot_profiles, pilot_equipment, pilot_pricing, cases, case_photos, case_timeline, messages, reviews, transactions, pilot_locations, notification_tokens
- **Automatic migration** — new columns (email verification, pilot verification) are added via ALTER TABLE IF NOT EXISTS

### 2. Real User Authentication 🔐
- **Email Verification** — New users get a verification email with a 24-hour token
  - `/verify-email?token=...` page auto-verifies and logs in
  - Resend verification link available
  - If no SMTP configured, verification URL is logged to console (for dev/demo)
- **Password Reset** — "Forgot password" flow with 1-hour token
  - `/forgot-password` → sends email → `/reset-password?token=...` → set new password
- **Password Change** — Authenticated users can change their password
- **ToS Required** — Registration requires agreeing to Terms of Service (enforced server-side with Zod validation)

### 3. Terms of Service + Privacy Policy 📋
- **`/terms`** — Full Terms of Service covering:
  - Service description, user accounts, pet owner responsibilities
  - Drone pilot responsibilities, FAA compliance
  - Pilot verification disclaimer, membership fees
  - Assumption of risk, limitation of liability, indemnification
  - Privacy reference, termination, governing law (New York)
- **`/privacy`** — Full Privacy Policy covering:
  - Data collection, usage, protection, sharing
  - Data retention, user rights (access, correction, deletion, portability)
  - Cookies, children's privacy, breach notification
- Both linked from registration page (required checkbox)

### 4. Pilot Verification System 🛡️
- **Registration** — Pilots can enter FAA Part 107 cert #, insurance provider, policy # during signup
- **Verification Page** — `/pilot/verification` — dedicated page to:
  - See current verification status (unsubmitted/pending/approjected/rejected)
  - Submit verification with FAA cert + insurance info
  - View rejection notes and resubmit
- **Verification Flow**:
  1. Pilot submits FAA cert number → status becomes "pending"
  2. Admin reviews in `/api/admin/verifications` → approves or rejects with notes
  3. Pilot receives email notification of result
  4. Approved pilots get verified badge, appear on map, can access owner contact info
- **Unverified pilots** see a "Get Verified to Appear on Map" CTA on their dashboard
- **Dashboard badges** — VERIFIED ✓ or PENDING status shown inline

### 5. Secure WordPress API 🔒
- **Public API** (`/api/content/live-cases`) — **strips** phone, email, full address, zip code
  - Only shows first name + initial (e.g., "Sarah J.")
  - Shows city/state but not street address
  - Shows `has_contact_info: true` so UI knows contact exists
- **Authenticated API** (`/api/content/live-cases/:wpId/contact`) — Only for verified pilots
  - Returns full contact info (phone, email, address)
  - Returns 403 if pilot is not verified
- **LiveCaseDetailPage** — Updated to:
  - Show "Contact info is private" for unauthenticated users
  - Show "Sign in as verified pilot" link
  - Auto-fetch contact info for verified pilots
  - Show lock icon for non-verified pilots with explanation

### 6. Admin Routes 👨‍💼
- **`/api/admin/stats`** — Dashboard stats (user counts, case counts, pending verifications)
- **`/api/admin/users`** — List all users (with role filter)
- **`/api/admin/cases`** — List all cases
- **`/api/admin/verifications`** — List pending pilot verifications
- **`/api/admin/verifications/:id/review`** — Approve/reject a pilot verification (sends email)
- All admin routes require `admin` role authentication

### 7. Email Service 📧
- **`mailService.js`** — Nodemailer-based email service
  - Verification emails with branded dark-themed HTML
  - Password reset emails
  - Verification approved/rejected notifications
  - If SMTP not configured, emails are logged to console (dev mode)
  - Full LPDR-branded HTML email templates with logo, colors, CTAs

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Pet Owner | owner@demo.com | password123 |
| Drone Pilot (Verified) | pilot1@demo.com | password123 |
| Drone Pilot (Verified) | pilot2@demo.com | password123 |
| Drone Pilot (Verified) | pilot3@demo.com | password123 |
| Drone Pilot (Unverified) | pilot4@demo.com | password123 |
| Drone Pilot (Verified) | pilot5@demo.com | password123 |
| Admin | admin@demo.com | password123 |

---

## New Pages & Routes

| Route | Page | Auth Required |
|-------|------|---------------|
| `/terms` | Terms of Service | No |
| `/privacy` | Privacy Policy | No |
| `/verify-email` | Email Verification | No |
| `/forgot-password` | Forgot Password | No |
| `/reset-password` | Reset Password | No |
| `/pilot/verification` | Pilot Verification | Yes (pilot) |

---

## What You Need To Do on Railway (from your iPhone)

### Step 1: Add PostgreSQL Database
1. Open the Railway app or go to railway.app in Safari
2. Open your LPDR project
3. Tap **"New"** → **"Database"** → **"PostgreSQL"**
4. Wait for it to provision (1-2 minutes)
5. Railway will automatically set `DATABASE_URL` in your environment

### Step 2: Set Environment Variables
In your Railway project, go to the backend service → **Variables** tab, add:

```
JWT_SECRET=change-this-to-a-random-string-at-least-32-characters
```

**Optional** (for real email sending):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@lostpetdronerecovery.com
```

> If you don't set SMTP, the app still works — verification/reset links are logged to the server console instead of emailed.

### Step 3: Redeploy
After adding PostgreSQL and the JWT_SECRET variable, Railway will automatically redeploy. The app will:
- Connect to PostgreSQL
- Create all tables automatically
- Start serving with persistent data

### Step 4: Verify It Worked
- Visit your Railway URL → app should load
- Register a new account → should work
- Check Railway logs → should see "PostgreSQL storage active"

---

## If You Want Email Working (Optional)

The easiest option from your iPhone:
1. Use a Gmail account with an App Password
2. Go to Gmail → Settings → Security → 2-Step Verification → App Passwords
3. Generate a password for "Mail"
4. Set these in Railway variables:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASS=your-16-char-app-password`

---

## What's Still Demo Mode (Until You Add PostgreSQL)

Without `DATABASE_URL`, the app runs in **demo mode**:
- All data resets when the server restarts
- Email verification links are logged to console (not sent)
- Password reset links are logged to console
- Pilot verification submissions work but reset on restart

Once you add PostgreSQL, everything becomes persistent and production-ready.

---

## Files Changed (25 files, +2590 lines)

### Backend (new files marked ✨)
- `backend/package.json` — Added nodemailer
- `backend/src/config/database.js` — Updated schema with verification, email fields
- `backend/src/config/index.js` — Added SMTP config
- `backend/src/index.js` — Added admin route
- `backend/src/middleware/validation.js` — Added ToS, pilot verification schemas
- ✨ `backend/src/routes/admin.js` — Admin dashboard API
- `backend/src/routes/auth.js` — Email verify, password reset, change password
- `backend/src/routes/content.js` — Secure WP API (contact endpoint for pilots)
- `backend/src/routes/pilots.js` — Verification submission/status endpoints
- ✨ `backend/src/services/dbStorage.js` — PostgreSQL storage implementation
- ✨ `backend/src/services/mailService.js` — Email sending service
- `backend/src/services/storage.js` — Auto-detect DB vs in-memory, admin methods, verification methods
- `backend/src/services/wpSync.js` — Strips sensitive data, adds getWPCasesFull()

### Frontend (new files marked ✨)
- `frontend/src/App.jsx` — Added new routes
- ✨ `frontend/src/pages/TermsPage.jsx` — Terms of Service
- ✨ `frontend/src/pages/PrivacyPage.jsx` — Privacy Policy
- ✨ `frontend/src/pages/VerifyEmailPage.jsx` — Email verification
- ✨ `frontend/src/pages/ForgotPasswordPage.jsx` — Password reset request
- ✨ `frontend/src/pages/ResetPasswordPage.jsx` — Password reset form
- ✨ `frontend/src/pages/PilotVerificationPage.jsx` — FAA verification form
- `frontend/src/pages/LoginPage.jsx` — Forgot password link, removed default values
- `frontend/src/pages/RegisterPage.jsx` — ToS checkbox, pilot cert fields
- `frontend/src/pages/PilotDashboard.jsx` — Verification badge, CTA link
- `frontend/src/pages/LiveCaseDetailPage.jsx` — Secure contact info
- `frontend/src/services/api.js` — New API endpoints
