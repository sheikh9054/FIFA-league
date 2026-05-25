# Deploy to Vercel (Frontend) + Render (API)

Vercel hosts the **Next.js frontend**. The **Express API** (database + Socket.IO) runs on **Render** because Vercel serverless cannot run a persistent Node/Express server.

```
┌─────────────────┐      HTTPS       ┌──────────────────┐      ┌─────────────┐
│  Vercel         │  ──────────────► │  Render          │ ──►│  Supabase   │
│  Next.js UI     │   REST + Socket  │  Express API     │    │  PostgreSQL │
└─────────────────┘                  └──────────────────┘      └─────────────┘
```

---

## Step 1: Database (Supabase — free)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Open **Project Settings → Database**
3. Copy the **URI** connection string (use the **pooler** URL for serverless/production)
4. Save it — you'll use it as `DATABASE_URL`

Example:
```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Step 2: Deploy API to Render

1. Push this project to **GitHub**
2. Go to [render.com](https://render.com) → **New → Blueprint** (or Web Service)
3. Connect your repo
4. Use the included `render.yaml` or configure manually:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| **Start Command** | `npm run start` |

5. Add **Environment Variables**:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Supabase connection string |
| `JWT_SECRET` | Long random string |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` (set after Step 3) |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |

6. After deploy, run seed once (Render Shell or locally against Supabase):
   ```bash
   cd backend
   DATABASE_URL="your-supabase-url" npm run db:seed
   ```
7. Copy your Render URL, e.g. `https://fifa-league-api.onrender.com`

> **Note:** Free Render services spin down after inactivity. First request may take ~30s.

---

## Step 3: Deploy Frontend to Vercel

### Option A: Vercel Dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (default) |

4. Add **Environment Variables**:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://fifa-league-api.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://fifa-league-api.onrender.com` |
| `NEXT_PUBLIC_DEFAULT_LEAGUE_ID` | `seed-league-1` |

5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel
```

Follow prompts, then add env vars in the Vercel dashboard.

---

## Step 4: Connect frontend ↔ API

1. Copy your Vercel URL: `https://your-app.vercel.app`
2. In **Render** → your API service → **Environment**:
   - Set `FRONTEND_URL` = `https://your-app.vercel.app`
3. Redeploy the API (or it may auto-redeploy)
4. **Redeploy** Vercel if you changed env vars

---

## Step 5: Verify

- Open `https://your-app.vercel.app/dashboard`
- API health: `https://fifa-league-api.onrender.com/health`
- Login: `admin@fifaleague.local` / `admin123` (after seeding)

---

## Local development (unchanged)

Use SQLite locally — in `backend/prisma/schema.prisma` change:

```prisma
provider = "sqlite"
```

And in `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
```

For production/Vercel, use `provider = "postgresql"` and Supabase URL.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Failed to fetch** on Vercel | Check `NEXT_PUBLIC_API_URL` points to Render URL (with `https://`) |
| **CORS error** | Set `FRONTEND_URL` on Render to your exact Vercel URL |
| **Empty dashboard** | Run `npm run db:seed` against Supabase `DATABASE_URL` |
| **Slow first load** | Render free tier cold start — normal |
| **Socket not connecting** | Ensure `NEXT_PUBLIC_SOCKET_URL` matches API URL |

---

## Optional: Vercel-only (frontend preview)

To preview UI without API, deploy frontend only — pages will show errors until the API is deployed.

---

## Custom domain

- **Vercel:** Project → Settings → Domains
- **Render:** Service → Settings → Custom Domain
- Update `FRONTEND_URL` and `NEXT_PUBLIC_*` URLs accordingly
