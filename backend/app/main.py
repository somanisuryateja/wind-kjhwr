from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional, List, Dict, Any

from .config import CORS_ORIGINS, DEFAULT_START_DATE, DEFAULT_END_DATE, FULL_MONTH_START, FULL_MONTH_END
from .models.schemas import DashboardResponse, AccuracyMetrics, ComparisonPoint, TradingDecisionSummary, HorizonAccuracy
from .services.elexon_client import elexon_service
from .services.metrics import metrics_engine

app = FastAPI(
    title="UK Energy Utility Wind Forecast & Evaluation Portal",
    description="High-frequency renewable forecasting and accuracy audit system for UK Day-Ahead power trading.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "WindForecastEvaluationAPI",
        "version": "1.0.0",
        "market": "UK Wholesale Electricity (EPEX SPOT / Nord Pool UK)",
        "source": "Elexon BMRS Live Data Stream"
    }

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard_data(
    start_date: str = Query(DEFAULT_START_DATE, description="Start date in YYYY-MM-DD format (within Jan 2026)"),
    end_date: str = Query(DEFAULT_END_DATE, description="End date in YYYY-MM-DD format (within Jan 2026)")
):
    try:
        # Validate dates
        d_start = datetime.fromisoformat(start_date)
        d_end = datetime.fromisoformat(end_date)
        if d_start > d_end:
            raise HTTPException(status_code=400, detail="start_date must be on or before end_date.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Ingest and match datasets
    aligned_data = await elexon_service.get_aligned_comparison_dataset(start_date, end_date)

    if not aligned_data:
        raise HTTPException(
            status_code=404,
            detail=f"No wind actuals or forecast data found for period {start_date} to {end_date}."
        )

    # Compute quantitative statistics
    metrics = metrics_engine.compute_accuracy_metrics(aligned_data)
    hourly = metrics_engine.compute_hourly_breakdown(aligned_data)
    horizons = metrics_engine.compute_horizon_breakdown()
    trading_decision = metrics_engine.generate_trading_decision_support(metrics)

    return DashboardResponse(
        start_date=start_date,
        end_date=end_date,
        data_source="Elexon BMRS (FUELHH + WINDFOR)",
        metrics=metrics,
        timeseries=aligned_data,
        hourly_breakdown=hourly,
        horizon_metrics=horizons,
        trading_decision=trading_decision
    )

@app.get("/api/timeseries", response_model=List[ComparisonPoint])
async def get_timeseries(
    start_date: str = Query(DEFAULT_START_DATE),
    end_date: str = Query(DEFAULT_END_DATE)
):
    return await elexon_service.get_aligned_comparison_dataset(start_date, end_date)

@app.get("/api/metrics", response_model=AccuracyMetrics)
async def get_metrics(
    start_date: str = Query(DEFAULT_START_DATE),
    end_date: str = Query(DEFAULT_END_DATE)
):
    data = await elexon_service.get_aligned_comparison_dataset(start_date, end_date)
    return metrics_engine.compute_accuracy_metrics(data)
