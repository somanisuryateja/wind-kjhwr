# ⚡ UK Energy Utility Wind Power Forecast & Accuracy Evaluation Portal

> **Domain:** UK Wholesale Day-Ahead Electricity Market (EPEX SPOT / Nord Pool UK)  
> **Target Scope:** National Wind Generation Actuals vs Day-Ahead Forecasts (January 2026)  
> **Data Provider:** Official Public Elexon BMRS API (`FUELHH` + `WINDFOR`)  
> **Tech Stack:** React 18 (Vite, Tailwind CSS, Recharts) + Python 3.12 (FastAPI, Pandas, NumPy) + Docker  

---

## 📌 Executive Summary & Problem Setting

In the UK wholesale power market, energy utilities must purchase electricity one day prior to delivery at the **Day-Ahead Auction gate closure (12:00 PM GMT on Day D-1)**. 

Because wind generation is weather-dependent and highly volatile, utilities face substantial cashout penalties in the real-time Balancing Mechanism (BM) if their wind generation deviates from expectations:
* **Over-forecasting ($Forecast > Actual$):** The utility under-procures thermal power and faces punitive System Buy Prices to cover the deficit.
* **Under-forecasting ($Forecast < Actual$):** The utility over-procures thermal power and must sell excess power at distressed System Sell Prices.

This portal provides UK trading desks with:
1. **Forecast Transparency:** Immediate visibility into national wind generation forecasts matched strictly against the Day-Ahead Gate Closure threshold.
2. **Quantitative Accuracy Evaluation:** Continuous auditing of Mean Absolute Error (MAE), Root Mean Square Error (RMSE), Mean Absolute Percentage Error (MAPE), and Mean Bias Error (MBE).
3. **Operational Risk Calibration:** Diurnal settlement period volatility breakdown (Periods 1–48), Peak vs Off-Peak hours (07:00–19:00 GMT), and dynamic trade bid sizing.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    REACT 18 FRONTEND (Vite)                 │
│  - Time-Series Visualizer (Actuals vs Day-Ahead vs Latest)  │
│  - Quantitative Accuracy Scorecards (MAE, RMSE, MAPE, Bias) │
│  - Peak / Off-Peak Partitioning (SP 15–38)                  │
│  - Diurnal Settlement Period Error Breakdown                │
│  - Trader Decision Engine & Live Bid Sizer                  │
│  - CSV Data Export for Quantitative Trading Teams           │
└──────────────────────────────▲──────────────────────────────┘
                               │ JSON REST API (Port 8000)
┌──────────────────────────────▼──────────────────────────────┐
│                    FASTAPI PYTHON BACKEND                   │
│  - /api/dashboard : Full analytical payload & timeseries    │
│  - /api/metrics   : Vectorized NumPy / Pandas metrics       │
│  - /api/timeseries: Raw aligned half-hourly dataset         │
│  - File Cache     : Fast JSON/SQLite cache for resilience   │
└──────────────────────────────▲──────────────────────────────┘
                               │ Async HTTP Streams
┌──────────────────────────────▼──────────────────────────────┐
│                 PUBLIC ELEXON BMRS API                      │
│  - FUELHH Stream : Actual wind outturn (fuelType = "WIND")  │
│  - WINDFOR Stream: National wind forecasts by publish time   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI server, endpoints, and CORS
│   │   ├── config.py            # Endpoints, January 2026 dates, cache config
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py       # Pydantic v2 data models & validation
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── elexon_client.py # Elexon BMRS API ingestor & Day-Ahead matcher
│   │       └── metrics.py       # Vectorized MAE, RMSE, MAPE & Bias engine
│   ├── data/
│   │   └── cache/               # Offline JSON cache for high performance
│   ├── Dockerfile               # Production container for backend
│   ├── requirements.txt         # FastAPI, Pandas, NumPy, Uvicorn, HTTPX
│   └── test_pipeline.py         # End-to-end integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx               # Brand, presets, date filters & CSV export
│   │   │   ├── MetricCards.jsx          # Institutional MAE, RMSE, MAPE, Bias cards
│   │   │   ├── PeakComparison.jsx       # Peak vs Off-Peak & extreme deviation stats
│   │   │   ├── TimeSeriesChart.jsx      # Recharts interactive half-hourly visualizer
│   │   │   ├── DiurnalErrorChart.jsx    # Error profile across 48 settlement periods
│   │   │   ├── HorizonChart.jsx         # Lead-time degradation curve (0h to 36h)
│   │   │   └── TraderDecisionHelper.jsx # Live bid sizing calculator
│   │   ├── services/
│   │   │   └── api.js                   # Client HTTP fetcher with graceful fallback
│   │   ├── App.jsx                      # Main dashboard & Tech Lead review views
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile                       # Multi-stage production Nginx container
│   ├── nginx.conf                       # Nginx reverse proxy configuration
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml           # Unified multi-container orchestration
└── README.md                    # System documentation & AI disclosure
```

---

## 🧮 Mathematical Error Metrics Formulation

For $N$ settlement periods with Actual generation $A_i$ and Day-Ahead Forecast $F_i$:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |F_i - A_i|$$
   *Measures the average unhedged volume exposure (in MW).*

2. **Root Mean Square Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$
   *Penalizes extreme forecast drops and ramp outliers that cause severe cashout spikes.*

3. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100\%}{N} \sum_{i=1}^{N} \frac{|F_i - A_i|}{A_i} \quad (\text{for } A_i > 50\text{ MW})$$

4. **Mean Bias Error (MBE):**
   $$\text{MBE} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$
   *Positive ($>0$) = Systematic Over-forecasting (Shortfall / System Buy Risk).*  
   *Negative ($<0$) = Systematic Under-forecasting (Surplus / Spill Risk).*

5. **Day-Ahead Gate Closure Matching Rule:**
   $$\text{DayAheadForecast}(t) = \max_{\text{publishTime} \le \text{GateClosure}} \left( \text{WINDFOR}(t, \text{publishTime}) \right)$$
   *Where $\text{GateClosure} = \text{TargetDeliveryDate} - 1 \text{ day at 12:00:00 GMT}$.*

---

## 🚀 How to Run the Application

### Option A: Using Docker Compose (Recommended - 1 Command)
```bash
# Clone the repository
git clone <repo-url>
cd wind-forecast-utility-app

# Build and launch both containers
docker-compose up --build
```
* **Frontend Dashboard:** `http://localhost:3000`
* **FastAPI Swagger Docs:** `http://localhost:8000/docs`

---

### Option B: Running Locally (Development Mode)

#### 1. Start the FastAPI Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend runs on `http://localhost:8000`.*

#### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automated API proxy.*

---

## 🤖 AI Tools Disclosure

As explicitly permitted and requested in the challenge brief, AI development tools (including Cursor, Claude, Antigravity Agent, and ChatGPT) were utilized to assist with:
* Accelerating boilerplate UI scaffolding (Tailwind CSS and Recharts configurations).
* Generating mathematical docstrings for statistical formulations.
* Assisting with Dockerfile multi-stage build patterns and Nginx proxy configs.
* All domain logic, Elexon BMRS API integration, gate closure timestamp alignment algorithms, and quantitative trading models were specifically designed, verified, and audited for the UK power wholesale market context.
