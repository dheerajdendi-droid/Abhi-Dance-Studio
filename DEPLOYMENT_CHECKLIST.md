# Deployment Checklist — Abhi's Dance Studio

> Full command-by-command reference lives in [README.md](README.md). This is the go/no-go checklist for taking it live.

## Quick answers

| Question | Answer |
|---|---|
| Needs a backend? | **Yes.** Express server (`server/`) — also serves the built React client in production (one service, not split hosting). |
| Needs a database? | **Yes.** PostgreSQL — holds all app data (students, classes, attendance, billing, outgoings) *and* login sessions. |
| Needs env vars? | **Yes, 3:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`. All three are auto-populated by the Render Blueprint below — nothing to type in by hand. |
| Needs authentication? | **Yes, but self-contained.** No accounts, no OAuth. First visit to the live app prompts to set a 4–6 digit PIN; that PIN plus a session cookie (httpOnly, secure in production, 30-day expiry) is the only gate. |

## Files already in place — nothing new to create

- `render.yaml` — Render Blueprint, provisions a free Postgres DB + free Node web service from one file
- `migrations/001_init.sql`, `002_outgoings.sql`, `run.js` — run automatically on every deploy
- `.env.example` — shape of the local env vars; **not** used in production, Render injects real values
- Root `package.json` (npm workspaces: `client` + `server`) — one `npm install` covers both
- `client/vite.config.js` — PWA manifest already wired (`vite-plugin-pwa`), so the deployed app supports "Add to Home Screen"

## Checklist

### 1. Push to GitHub (required — Render deploys from git, not local files)
- [ ] No git remote is configured yet (`git remote -v` is currently empty)
- [ ] Create an empty GitHub repo
- [ ] `git remote add origin <your-repo-url>`
- [ ] `git push -u origin master`

### 2. Deploy via Render Blueprint
- [ ] Render dashboard → New → Blueprint → connect the GitHub repo
- [ ] Confirm Render picks up `render.yaml` (1 database + 1 web service)
- [ ] First deploy runs `npm install && npm run build`, then `npm run migrate && npm start`

### 3. First-run setup
- [ ] Visit the live `*.onrender.com` URL
- [ ] Set the PIN when prompted — this becomes Abhi's login going forward
- [ ] Confirm students, attendance, and billing pages all load against the fresh database

### 4. Free-tier trade-offs — confirm these are acceptable before relying on this for real data
- [ ] **Cold starts:** the free web service spins down after ~15 min idle; the next request takes 30–50s to wake it up
- [ ] **Database expiry:** Render deletes free Postgres databases automatically after 30 days. If this is meant to hold Abhi's real, ongoing data (not a demo), upgrade the database to a paid plan (Starter, ~$6–7/mo) *before* real use — otherwise the data silently disappears after a month

### 5. Ongoing
- [ ] Every push to the connected branch auto-redeploys (migrations re-run automatically)
- [ ] Take periodic backups: `npm run backup` (writes to `backups/`, gitignored — contains real student PII, never commit it)

## Recommendation: simplest safe way to give Abhi real-time access

Using what's already configured in this repo:

1. **Push to GitHub, deploy via the existing Render Blueprint.** That's a single persistent HTTPS URL — no VPN, no port-forwarding, no local machine needing to stay on.
2. **HTTPS is required, not optional** — the session cookie is marked `secure` in production (`server/index.js`), so login will silently fail over plain HTTP. Render's free tier serves HTTPS by default, so this is already satisfied.
3. **Send Abhi the URL once.** She sets her own PIN on first visit; that PIN is her permanent login — no email/password to manage or reset.
4. **On her phone**, she can "Add to Home Screen" from the browser share menu — the PWA manifest is already set up, so it behaves like a native app icon rather than a bookmark.
5. **Before treating this as her real day-to-day tool**, upgrade the free Postgres plan (see §4) — the free-tier auto-deletion after 30 days would otherwise silently wipe her attendance and billing history.
