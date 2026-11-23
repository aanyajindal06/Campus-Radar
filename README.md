# CampusRadar

Next.js frontend on Vercel; FastAPI and PostgreSQL on Render. Images are stored in PostgreSQL and QR PNGs are generated on demand, so no persistent filesystem disk is required for new uploads.

## 1. Render backend and database

Import `render.yaml` using **New > Blueprint**, repository `Mayank-Kumar13/deploy`, branch `main`. It creates `campusradar-api` and `campusradar-db`, connects their `DATABASE_URL`, generates a secret, and asks for `FRONTEND_URL`. Set that to your Vercel origin, e.g. `https://your-project.vercel.app`, without a path or trailing slash. If your Vercel project has not deployed yet, use its intended domain and correct it after deployment.

The Blueprint uses free plans for a demo. **Render free PostgreSQL expires after 30 days**; upgrade the database for longer use. Free web services also sleep when idle. See https://render.com/docs/free. Nothing is provisioned by committing this file.

For manual Web Service setup, first create a Render PostgreSQL database in the same region, then use:

| Setting | Value |
| --- | --- |
| Language | `Python 3` |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Environment variables:

```env
PYTHON_VERSION=3.12.8
ENVIRONMENT=production
DATABASE_URL=YOUR_RENDER_POSTGRES_INTERNAL_CONNECTION_URL
SECRET_KEY=YOUR_LONG_RANDOM_SECRET
FRONTEND_URL=https://YOUR-PROJECT.vercel.app
SEED_DEMO_DATA=true
MAX_UPLOAD_MB=5
MAX_IMAGES_PER_ITEM=5
```

Generate `SECRET_KEY` with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Never put secrets or `DATABASE_URL` in Vercel's public variables or Git. Production refuses a missing/default secret or a SQLite database. Tables are initialized at startup; `SEED_DEMO_DATA=true` creates demo records only on an empty database.

Optional `CORS_ORIGINS` accepts additional comma-separated origins. Optional `CORS_ORIGIN_REGEX` can allow specific preview domains; leave it empty unless needed. Use a narrowly scoped, anchored regex, not all Vercel domains.

Open `https://YOUR-API.onrender.com/health` and `/docs` after deployment. `/health` checks database connectivity.

## 2. Vercel frontend

Import the same repository and branch:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework | `Next.js` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | `22.x` |

Set this variable for Production and Preview, using the actual Render URL:

```env
NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com/api/v1
```

`frontend/vercel.json` contains the build settings and basic response headers. Production builds require an HTTPS backend URL. Redeploy Vercel after changing the public variable because Next.js bundles it at build time. Ensure Render's `FRONTEND_URL` matches the final frontend domain.

Verify login, report an item with an image, view its image and QR, and add a location as admin. Uploaded images are checked for actual supported image content, size and count. Default limits are five photos, five MB each; keep backend limits at five if using the current frontend defaults.

## Existing deployments

The new `stored_files` table is created automatically without deleting existing records. New photos use `/api/v1/files/...` and new QR codes use `/api/v1/qr/...`. Existing disk-based uploads still need their original files; this update does not recover or migrate files already lost from Render's ephemeral disk. Legacy `/static/...` routes remain supported while those files exist. Moving from SQLite to PostgreSQL starts a separate database; existing SQLite records are not automatically copied.

## Local development and verification

For local development, create `backend/.env` with `ENVIRONMENT=development`, `DATABASE_URL=sqlite:///./campusfind.db`, `FRONTEND_URL=http://localhost:3000`, and a generated `SECRET_KEY`. The `.env.example` files describe production settings, so do not copy their production environment flag for local SQLite use. In `backend`, run `pip install -r requirements.txt` and `uvicorn app.main:app --reload`. SQLite is available for local development. Backend loads `backend/.env` first, then a root `.env` without overwriting existing environment variables. The root `.env.example` is a reference, not a production env file.

In `frontend`, run `npm ci` and `npm run dev`; local API requests default to `http://localhost:8000/api/v1`. For a production build, set `NEXT_PUBLIC_API_URL` first. Example env files contain placeholders only.

Backend smoke test: in `backend`, install `pip install -r requirements-dev.txt`, then run `python tests/deployment_smoke.py`. It uses a temporary database to check CORS, login, uploads, QR serving, invalid-upload rejection and restart persistence. The same test can check an empty disposable PostgreSQL database by setting `TEST_DATABASE_URL`; never point it at production.

This retains the original demo logins, including staff/admin access. Use it as a demo; real public use requires a separate permissions and authentication review.
