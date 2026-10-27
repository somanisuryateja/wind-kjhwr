# UK Wind Forecast Monitor

A small web app for a UK utility's day-ahead power desk. Pick a delivery day and how sure you want to be, and it tells you **how much power to buy beyond wind**, hour by hour, using Elexon BMRS national wind data. Behind that plan it answers two questions:

1. **What wind forecast did we have when we had to buy?** For any delivery day, it shows the latest forecast available at the purchase decision time (default 09:00 the day before), a likely range for the actual outturn, and the actual outturn afterwards.
2. **How accurate is that forecast?** It shows the error of the decision-time forecast (MAE, bias, median, RMSE, 10th/90th percentiles), how error changes with forecast lead time, and how errors are distributed.

**Live app:** https://wind.suryadeals.com

**Hosting note:** the brief suggests Vercel or Heroku. I hosted it on my own Oracle Cloud VM instead (nginx serving the React build, FastAPI under systemd, HTTPS via Let's Encrypt). It deploys the same way a PaaS would: every push to `main` runs a GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that builds the frontend, syncs the backend, restarts the service and then smoke-tests the live API. Docker Compose is still included for running everything locally.

Stack: React 18 + Vite 8 + Tailwind + Recharts (frontend), Python 3.12 + FastAPI (backend), Docker Compose.

## Run it

**Docker**

```bash
docker-compose up --build
```

Frontend: http://localhost:3000. API docs: http://localhost:8000/docs.

**Without Docker**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to port 8000. To point the frontend at a different API, set `VITE_API_URL` (for example `https://my-api.example.com/api`).

**Tests**

```bash
cd backend
python test_analysis.py
```

## Files

```text
backend/
  app/data.py          Fetches FUELHH (wind actuals) and WINDFOR (wind forecasts) from Elexon once, caches to data/*.json
  app/analysis.py      Pure functions: decision-time forecast lookup, error summary, lead-time buckets, histogram
  app/main.py          FastAPI routes: /api/forecast, /api/accuracy, /api/health
  data/actuals.json    Cached half-hourly wind outturn, delivery days 2 Jan to 1 Feb 2026
  data/forecasts.json  Cached hourly wind forecasts published 31 Dec 2025 to 1 Feb 2026
  test_analysis.py     Unit tests for the analysis functions
  Dockerfile
frontend/
  src/App.jsx              Page layout, header and the shared decision-time setting
  src/PlanSection.jsx      Step 1: date, confidence and demand in; MW to buy, hourly chart and CSV out
  src/KeyFinding.jsx       Headline banner: the forecast's average bias, computed live
  src/ForecastSection.jsx  Step 2: the forecast behind the plan
  src/AccuracySection.jsx  Step 3: forecast accuracy
  src/ui.jsx               Card, Stat and Status building blocks
  src/lib.js               API hook and number/date formatting
  nginx/security.conf      Security headers, hidden-file blocking (used on the server and in Docker)
  nginx/rate-limit.conf    Per-IP API rate limit (10 requests/s, burst 20)
  nginx/default.conf       Docker-only nginx site: static build plus /api proxy
  Dockerfile               Builds the app, serves it with unprivileged nginx on port 8080
.github/workflows/deploy.yml  Test, deploy to the Oracle VM, then smoke-test the live site
docker-compose.yml
```

To refresh the data, delete `backend/data/*.json` and run `python -m app.data` from `backend/`.

## How the analysis works

- **Which data.** The brief limits us to purchase decisions made in January 2026. Power is bought the day before delivery, so that covers **delivery days 2 Jan to 1 Feb 2026**. Actuals come from FUELHH (`fuelType = WIND`), and forecasts from WINDFOR.
- **Decision-time forecast.** For delivery day D and decision hour H, each target hour uses the most recent WINDFOR forecast published at or before H:00 on D-1. H is a setting in the UI (default 09:00) because the right value depends on which auction the desk trades. January is GMT, so UK time equals UTC.
- **Error.** Error = actual − forecast. Negative means less wind than forecast, so more power to buy. WINDFOR is hourly, so errors are scored at the 744 hourly points. Forecasts published after their target time (about 4,000 rows in the raw feed) are excluded.
- **Likely range.** The shaded band in Step 2 is the forecast plus the 10th and 90th percentile of January's decision-time errors. It uses the whole period, so a day's own errors count toward its band. For a live tool, switch to a trailing window.
- **Purchase plan.** Wind you can count on = forecast + the error percentile for the chosen confidence (50% uses the median error, 80% the 20th percentile, 90% the 10th percentile). Power to buy = demand − wind you can count on, per hour. Demand is a number the desk enters, because the brief allows no data beyond Elexon wind; it is held flat across the day. The "How it turned out" card replays the plan against actual wind in hindsight.
- **Lead time.** Every forecast run (not only the decision-time one) is grouped by hours between publish time and target time: 0–4, 4–8, 8–12, 12–24, 24–36 and 36–48h.

### What the data shows (09:00 decision time, full period)

- Typical error (MAE) is about 2,000 MW. In 8 of 10 hours, actual wind was between about 4,150 MW below and 430 MW above the forecast.
- The forecast is **biased high by about 1,750 MW**, and the bias barely shrinks at short lead times (still about 1,430 MW at 0–4h, against 1,900 MW at 36–48h). That points to a systematic gap between what WINDFOR forecasts and what FUELHH meters, for example curtailed wind, rather than weather uncertainty. For buying, this means the raw forecast overstates the wind you can count on.

## Security and production setup

- **Read-only public data, no logins.** The API only answers GET requests about public Elexon data, so there is no user data to protect.
- **Input validation.** Dates and decision hours are checked; anything else gets a 400/422 with a readable message.
- **HTTPS** with a Let's Encrypt certificate, and HTTP redirects to HTTPS.
- **Security headers** (HSTS, Content-Security-Policy, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy), with the nginx version hidden and `/.env`-style paths returning 404.
- **Rate limit** of 10 API requests per second per IP (burst 20); excess requests get 429.
- **Pinned dependencies:** exact Python versions in `requirements.txt`, and `package-lock.json` with `npm ci`. CI fails on any high-severity `npm audit` finding.
- **Containers run as non-root users.**
- **CI/CD:** every push runs the tests and a production build first. Deploy only happens if they pass. The deploy checks the server's SSH host key, applies the nginx config with an automatic rollback if `nginx -t` fails, and a final job checks the live API and the security headers.

## API

| Endpoint | Params | Returns |
| --- | --- | --- |
| `GET /api/forecast` | `date` (YYYY-MM-DD), `decision_hour` (0–23, default 9) | 48 half-hour points with forecast, likely range and actual, plus the forecast publish time |
| `GET /api/plan` | `date`, `decision_hour`, `confidence` (50/80/90, default 90), `demand_mw` (0–100,000) | Hourly plan (forecast, wind counted on, MW to buy, actual, shortfall) and day totals |
| `GET /api/accuracy` | `start`, `end`, `decision_hour` | Error summary, histogram (500 MW bins), errors by lead time |
| `GET /api/health` | | `{"status": "healthy"}` |

Dates outside 2 Jan to 1 Feb 2026 return a 400 with a clear message. The frontend shows API errors as they are; it never substitutes sample data.

## AI tools

AI coding assistants (Claude Code, Cursor, Antigravity, ChatGPT) were used throughout this project, for code, analysis and documentation.
