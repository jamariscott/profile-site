# CLAUDE.md — Working agreement & project context

## Working agreement (read first)

**Always ask if I'm ready before you execute anything — unless I've already said to go ahead.**
Before running commands, editing files, committing, deploying, or any other action, confirm with me first and wait for a clear "yes." Planning, explaining, reading, and proposing are fine without asking; *taking action* needs a go-ahead. If I've explicitly told you to proceed (e.g. "just do it," "go ahead and build X"), you don't need to re-ask for that task.

## What this project is

TimezofToday is becoming a **profile-platform engine** — one system that powers many kinds of profiles, where a "skin" is a **profession** (music, engineer, photographer, …). The music site is profession #1, not a separate build. Direction confirmed: one shared engine, multiple skins; **path-based** routing (`timezoftoday.com/...`, no extra domains); public profiles at `/u/username`; one account can hold multiple professions; profiles public by default with a private toggle. See `PLATFORM_ROADMAP.md` for the full vision and phases.

## Stack & deploys

- **Frontend:** React + TypeScript + Vite. Hosted on **Vercel** (timezoftoday.com). Auto-deploys on push to `main`.
- **Backend:** FastAPI. Hosted on **Render** (`profile-site-1-1bbw.onrender.com`). Auto-deploys on push to `main`.
- **Database:** PostgreSQL on Render (owned by the client's Render account).
- Repo: `github.com/jamariscott/profile-site`, branch `main`.

## Important operational notes

- **No migrations on deploy.** Render's start command only runs uvicorn — it does NOT run Alembic. Tables and new columns are provisioned at startup in `backend/main.py` via `Base.metadata.create_all` + `ensure_columns()` (idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Add any new column there.
- **Startup is hardened**: DB init is wrapped in try/except so a database problem logs a warning instead of crash-looping the deploy.
- **Auth:** JWT tokens (HS256). Set `JWT_SECRET` in Render env. Roles: `admin` | `member`. Frontend session lives in `frontend/src/lib/auth.ts` (token only, never the password).
- **There is a duplicate `profile-site` Render service** that fails on deploy — it's an unused leftover; ignore its red X (client will retire it).
- The sandbox file mount can serve **stale copies** of recently-edited files; trust the host (Read tool / the user's machine), and verify builds on the host.

## Build / verify commands

- Frontend build (the key check): `cd frontend && npm run build`
- Backend syntax (if Python available): `python -m py_compile main.py auth.py models.py database.py`
