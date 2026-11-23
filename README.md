# CampusRadar

Next.js frontend on Vercel and FastAPI backend on Render.

## 1. Deploy the backend on Render

Connect `Mayank-Kumar13/deploy`, branch `main`. Create a **Python 3 Web Service**:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Python version environment variable | `PYTHON_VERSION=3.12.8` |

Environment variables:

- `SECRET_KEY`: a long random secret. Generate locally with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Never put it in the frontend or commit it.
- `CORS_ORIGINS`: the exact Vercel frontend origin, e.g. `https://your-project.vercel.app`. No path. Multiple allowed origins may be comma-separated. Preview deployments must be explicitly added if used.

### Keep database records and uploaded files after deploys

The included `render.yaml` can also be imported as a Render Blueprint. It specifies a **paid Starter service plus a persistent disk**, generates `SECRET_KEY`, and asks for `CORS_ORIGINS`. It does not create resources by itself.

For the same persistent setup when creating the service manually, attach a disk at `/var/data` and set:

```env
DATABASE_URL=sqlite:////var/data/campusfind.db
UPLOAD_DIR=/var/data/uploads
QR_DIR=/var/data/qrcodes
```

Render's free web service has no persistent disk. You can omit these three variables for a temporary demo, but SQLite records, uploads, and generated QR files can disappear on restart/redeploy. A PostgreSQL `DATABASE_URL` is supported too; file uploads still require persistent storage.

After deployment, open `https://YOUR-BACKEND.onrender.com/health` and `/docs`. Startup initializes tables and demo records. The existing demo login includes admin/staff access; this project remains an evaluation/demo app, not a hardened public production service.

## 2. Deploy the frontend on Vercel

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | `frontend` |
| Framework Preset | `Next.js` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | `22.x` |

Add this environment variable for Production and Preview, replacing the placeholder with the actual Render service URL:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com/api/v1
```

`frontend/vercel.json` includes the build settings. Production builds require an HTTPS API URL and fail with a clear message if it is missing. `NEXT_PUBLIC_API_URL` is bundled into the browser at build time: redeploy after changing it.

If the final Vercel domain differs from the origin entered in Render, update Render's `CORS_ORIGINS` to match it. Verify login, reporting an item with an image, viewing its QR code, and adding a location as an admin.

## Local development

Copy `backend/.env.example` to `backend/.env` and set a local secret. In `backend`, run `pip install -r requirements.txt` and `uvicorn app.main:app --reload`.

In `frontend`, run `npm ci` and `npm run dev`. Development uses `http://localhost:8000/api/v1` if no frontend environment variable is set. For a production build, set `NEXT_PUBLIC_API_URL` first. `frontend/.env.example` lists its format.

Backend deployment smoke test: in `backend`, install `pip install -r requirements-dev.txt`, then run `python tests/deployment_smoke.py`. It uses a temporary database and upload directory to check CORS, login, admin actions, uploaded files, QR serving, and persistence across app restarts.
