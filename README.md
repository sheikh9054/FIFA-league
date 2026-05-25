# FIFA 25 Local League Management Platform

A professional esports-inspired FIFA/EA FC 25 local league platform with live standings, ELO ratings, friendly matches, tournaments, and realtime updates.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Stack](https://img.shields.io/badge/Express-4-green) ![Stack](https://img.shields.io/badge/PostgreSQL-16-blue) ![Stack](https://img.shields.io/badge/Socket.IO-4-purple)

## Features

- **League Dashboard** — Stats cards, recent matches, activity feed, standings preview
- **Player Profiles** — ELO, form streak, W/D/L, goals, match history, ELO chart
- **Match Recording** — Auto standings + ELO updates, notes, screenshots support
- **Standings Table** — Champions/relegation zones, search, live Socket.IO updates
- **Friendly Matches** — Separate from league, optional ELO impact, H2H & leaderboard
- **Fixture Generator** — Round robin, knockout, Champions League groups
- **Analytics** — Top scorers, best attack/defense, clean sheets, win streaks
- **Admin Panel** — Add players, export JSON, reset ELO
- **Auth** — JWT login, guest mode, admin roles
- **Realtime** — Live standings, match popups, activity feed via Socket.IO
- **PWA Ready** — manifest.json for installable app

## Project Structure

```
fifa league/
├── backend/                 # Express API + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── socket/
├── frontend/                # Next.js 14 + Tailwind + Framer Motion
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
├── docker-compose.yml
└── README.md
```

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) OR local PostgreSQL / [Supabase](https://supabase.com)

### 1. Start Database

```bash
docker compose up -d postgres
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

API runs at **http://localhost:4000**

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at **http://localhost:3000**

### Demo Credentials

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@fifaleague.local     | admin123  |

**Invite code:** `FC25LOCAL`

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://fifa:fifa_secret@localhost:5432/fifa_league?schema=public"
PORT=4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_DEFAULT_LEAGUE_ID=seed-league-1
```

## Supabase PostgreSQL

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings → Database
3. Set `DATABASE_URL` in `backend/.env` (use pooled connection for serverless)

```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Deployment (Vercel + Render)

**Full guide:** [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

| Part | Platform | Why |
|------|----------|-----|
| Frontend | **Vercel** | Next.js optimized hosting |
| API + Socket.IO | **Render** (free) | Vercel cannot run Express servers |
| Database | **Supabase** (free) | PostgreSQL in the cloud |

**Quick Vercel setup:**
1. Import repo → set **Root Directory** to `frontend`
2. Add env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_DEFAULT_LEAGUE_ID`
3. Deploy API to Render first (see `render.yaml` + `DEPLOY_VERCEL.md`)

### Docker (API + DB)

```bash
docker compose up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/guest` | Guest access |
| GET | `/api/leagues/:id/dashboard` | Dashboard data |
| GET | `/api/standings/:leagueId` | Standings |
| POST | `/api/matches` | Record league match |
| POST | `/api/friendlies` | Record friendly |
| POST | `/api/fixtures/generate` | Generate schedule |
| GET | `/api/stats/:leagueId` | Analytics |
| GET | `/api/admin/export/:leagueId` | Export data |

## Socket.IO Events

| Event | Description |
|-------|-------------|
| `join:league` | Subscribe to league room |
| `match:recorded` | New match result |
| `standings:updated` | Standings changed |
| `activity:new` | Activity feed update |
| `announcement:new` | New announcement |

## ELO System

- Default rating: **1500**
- K-factor: **32**
- Upset bonus when lower-rated player wins by 100+ ELO difference
- Full history stored in `EloHistory` table
- Admin can reset seasonal ELO

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL |
| Realtime | Socket.IO |
| Auth | JWT (bcrypt passwords, guest tokens) |

## License

MIT — Built for local FIFA friend leagues. Scale to cloud when ready.
