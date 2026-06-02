# Attic Fanatics Funnel Analyzer — Claude Context File

Hand this file to Claude at the start of any session to get full context on this project.

---

## What This Is

A full-stack business intelligence dashboard for **atticfanatics.com** — a home services company (rodent removal, attic restoration) operating in NJ/NY/PA. It tracks marketing funnel performance, sales rep stats, and call center metrics across 5 lead channels.

**Live URL:** https://shadow-clone-production.up.railway.app
**GitHub Repo:** https://github.com/efleming531/shadow-clone
**Working branch:** `claude/dreamy-hamilton-8NO9h`
**Project subdirectory:** `attic-fanatics-dashboard/`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| HTTP client | Axios |
| Notifications | React Hot Toast |
| CSV parsing | PapaParse |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Deployment | Railway (single service) |

---

## Repo Structure

```
attic-fanatics-dashboard/
├── package.json              # Root scripts (build, start, dev)
├── railway.json              # Railway deployment config
├── backend/
│   ├── server.js             # Express entry point
│   ├── .env.example          # Required env vars template
│   ├── prisma/
│   │   ├── schema.prisma     # Full DB schema
│   │   ├── seed.js           # 90-day realistic seed data
│   │   └── seed-if-empty.js  # Auto-seeds on first deploy
│   └── src/
│       ├── middleware/
│       │   └── auth.js       # JWT authenticate + requireRole
│       ├── routes/
│       │   ├── auth.js       # POST /login, GET /me
│       │   ├── overview.js   # GET / (aggregate KPIs)
│       │   ├── funnel.js     # GET /:slug, POST /entry, CSV import
│       │   ├── sales.js      # Leaderboard + rep detail
│       │   ├── callCenter.js # Leaderboard + agent detail
│       │   ├── users.js      # CRUD users (OWNER only)
│       │   └── apiConnections.js
│       └── utils/
│           └── metrics.js    # computeMetrics(), getDateRange()
└── frontend/
    ├── index.html
    ├── vite.config.js        # Port 3000, proxies /api → :4000
    ├── tailwind.config.js    # Full design system tokens
    └── src/
        ├── App.jsx           # Routes + ProtectedRoute
        ├── main.jsx          # React root + Toaster
        ├── index.css         # Global styles + scrollbar
        ├── context/
        │   └── AuthContext.jsx  # user, login(), logout(), role helpers
        ├── utils/
        │   ├── api.js        # Axios instance with JWT interceptor
        │   └── formatters.js # fmtCurrency, fmtPercent, fmtNumber, etc.
        ├── components/
        │   ├── Layout/
        │   │   ├── Layout.jsx   # Shell with sidebar + main
        │   │   └── Sidebar.jsx  # Nav with role-aware links
        │   ├── UI/
        │   │   ├── StatCard.jsx      # Metric tile + skeleton
        │   │   ├── PeriodToggle.jsx  # Daily/Weekly/Monthly/Quarterly/Yearly
        │   │   ├── SortableTable.jsx # Click-to-sort data table
        │   │   └── Modal.jsx         # ESC-dismissible overlay
        │   └── Charts/
        │       └── FunnelChart.jsx  # Custom horizontal funnel viz
        └── pages/
            ├── Login.jsx
            ├── Overview.jsx          # 18 KPI cards + 2 charts
            ├── FunnelPage.jsx        # Per-channel metrics + line chart
            ├── SalesLeaderboard.jsx
            ├── RepDetail.jsx
            ├── CallCenterLeaderboard.jsx
            ├── AgentDetail.jsx
            ├── DataEntry.jsx         # Manual entry + CSV import + API connections
            └── UserManagement.jsx    # Add/edit/deactivate users
```

---

## Database Schema (Prisma)

```prisma
model User         { id, name, email, passwordHash, role (OWNER/MANAGER/REP), createdAt, lastLogin, isActive }
model LeadSource   { id, name, slug }  -- 5 sources seeded
model FunnelData   { id, leadSourceId, date, adSpend, impressions, clicks, leadsGenerated,
                     formCompletions, callsBooked, callsShowed, callsClosed,
                     revenue, cashCollected, leadQuality (HOT/WARM/COLD), notes, createdById }
model SalesRep     { id, userId, name, isActive }
model Deal         { id, salesRepId, leadSourceId, date, revenue, cashCollected,
                     installed, referralGenerated, salesCycleDays, notes }
model CallCenterAgent { id, userId, name, isActive }
model CallCenterLog   { id, agentId, date, speedToLeadMinutes, answered, qualified, booked, notes }
model ApiConnection   { id, provider, apiKey, isActive, lastSynced }
```

---

## API Endpoints

All routes require `Authorization: Bearer <token>` except `/api/auth/login`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | Public | Returns JWT + user |
| GET | /api/auth/me | Any | Current user |
| GET | /api/overview | Any | Aggregate KPIs, period query param |
| GET | /api/funnel/sources | Any | All lead sources |
| GET | /api/funnel/:slug | Any | Per-source metrics + time series |
| POST | /api/funnel/entry | OWNER/MGR | Manual data entry |
| POST | /api/funnel/import-csv | OWNER/MGR | CSV preview |
| POST | /api/funnel/import-csv/confirm | OWNER/MGR | CSV confirm import |
| GET | /api/sales/leaderboard | Any | Sales rep rankings |
| GET | /api/sales/rep/:id | Any* | Rep detail (*REP sees own only) |
| GET | /api/call-center/leaderboard | Any | Agent rankings |
| GET | /api/call-center/agent/:id | Any | Agent detail |
| GET | /api/users | OWNER | All users |
| POST | /api/users | OWNER | Create user |
| PATCH | /api/users/:id | OWNER | Update user |
| GET | /api/api-connections | OWNER | All API connections |
| POST | /api/api-connections/:provider/key | OWNER | Save API key |

---

## Computed Metrics (never stored, always calculated)

```
CPL                      = adSpend / leadsGenerated
CPM                      = (adSpend × 1000) / impressions
CTR                      = clicks / impressions
Form Completion Rate     = formCompletions / leadsGenerated
Show Rate                = callsShowed / callsBooked
Close Rate               = callsClosed / callsShowed
ROAS                     = revenue / adSpend
Cost/Booked Inspection   = adSpend / callsBooked
Cost/Inspection          = adSpend / callsShowed
Gross$/Booked Inspection = revenue / callsBooked
Collected$/Booked        = cashCollected / callsBooked
AOV                      = revenue / callsClosed
Install Rate             = installed deals / total deals
Referral Rate            = referralGenerated deals / total deals
Avg Sales Cycle          = avg(salesCycleDays) across deals
```

---

## Design System (Tailwind tokens)

```
Background:  #0a0a0a (primary)  #111111 (card)  #161616 (elevated)
Border:      #1e1e1e
Accent:      #f97316 (orange CTA)  #ea580c (hover)
Text:        #ffffff (primary)  #9ca3af (secondary)  #6b7280 (muted)
Font:        Inter (Google Fonts)
Role badges: OWNER=orange  MANAGER=blue  REP=gray
```

---

## Auth & Roles

```
OWNER   → everything: all data, user management, API connections
MANAGER → all funnel + leaderboard data, data entry, no user management
REP     → own stats page only (/sales/rep/:id for their own ID)
```

JWT stored in `localStorage` as `af_token`. Axios interceptor auto-attaches it.
On 401, clears auth and redirects to `/login`.

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Auto-injected by Railway PostgreSQL plugin |
| `JWT_SECRET` | Yes | Any long random string |
| `PORT` | Yes | Auto-injected by Railway |
| `CORS_ORIGIN` | No | Defaults to `http://localhost:3000` |

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/efleming531/shadow-clone
cd shadow-clone/attic-fanatics-dashboard

# 2. Set up env
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET

# 3. Install
npm run install:all

# 4. Set up DB (PostgreSQL must be running)
cd backend && npx prisma db push && node prisma/seed.js

# 5. Run dev servers (starts both frontend :3000 and backend :4000)
cd .. && npm run dev
```

**Login:** admin@atticfanatics.com / AtticAdmin2024!

---

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Owner | admin@atticfanatics.com | AtticAdmin2024! |
| Manager | sarah@atticfanatics.com | Manager2024! |
| Rep | mike@atticfanatics.com | Rep2024! |
| Rep | jessica@atticfanatics.com | Rep2024! |
| Rep | david@atticfanatics.com | Rep2024! |

---

## Deployment (Railway)

1. Connect GitHub repo → select `shadow-clone`
2. Set **Root Directory** to `attic-fanatics-dashboard`
3. Add PostgreSQL plugin (auto-injects `DATABASE_URL`)
4. Add env var: `JWT_SECRET` = any random string
5. Generate public domain under Settings → Networking
6. Deploy — build runs Vite + Prisma generate, start runs `prisma db push` + auto-seed + Express

---

## Known Patterns & Conventions

- **New API route:** create `backend/src/routes/yourRoute.js`, import + mount in `server.js`
- **New page:** create `frontend/src/pages/YourPage.jsx`, add route in `App.jsx`
- **Protected page:** wrap with `<ProtectedRoute requiredRole="OWNER">` in `App.jsx`
- **Role check in API:** add `requireRole('OWNER', 'MANAGER')` middleware to route
- **New metric:** add to `computeMetrics()` in `backend/src/utils/metrics.js`
- **Formatting:** use helpers from `frontend/src/utils/formatters.js`
- **Toast notifications:** `import toast from 'react-hot-toast'` → `toast.success()` / `toast.error()`
- **Loading skeletons:** pass `loading={true}` to `StatCard`, or render `<SkeletonCard />` directly

---

## Ideas for Future Features

- Goal tracking (set monthly targets per KPI, show % to goal)
- Workiz CRM integration (pull job data automatically)
- Google Ads / Meta Ads API integration (auto-import spend data)
- Email/SMS alerts when KPIs drop below thresholds
- PDF report export per funnel source or time period
- Customer satisfaction / review tracking
- Territory map (NJ/NY/PA heat map by deal density)
- Installer scheduling & capacity dashboard
- Commission calculator for sales reps
- Lead response time tracker (speed to lead from web form → call)
