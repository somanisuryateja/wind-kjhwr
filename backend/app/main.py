from datetime import date
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import analysis, data

app = FastAPI(title="UK Wind Forecast Monitor")
# Read-only public data; lets the frontend live on a different host if needed.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])

FIRST = date.fromisoformat(data.FIRST_DELIVERY_DAY)
LAST = date.fromisoformat(data.LAST_DELIVERY_DAY)
DecisionHour = Query(9, ge=0, le=23, description="Hour (UK time) on the day before delivery when the purchase is made")


@lru_cache
def runs():
    return analysis.index_runs(data.forecasts())


def delivery_day(value: str) -> date:
    try:
        day = date.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, f"Invalid date '{value}', expected YYYY-MM-DD.")
    if not FIRST <= day <= LAST:
        raise HTTPException(400, f"Date must be between {FIRST} and {LAST}.")
    return day


@lru_cache
def january_band(hour: int) -> dict:
    # ponytail: uses the whole window, so a day's own errors feed its band.
    # Switch to a trailing window (days before D-1 only) if this becomes a live tool.
    return analysis.summarize(analysis.decision_errors(FIRST, LAST, hour, data.actuals(), runs()))


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.get("/api/forecast")
def forecast(day: str = Query(..., alias="date", description="Delivery day, YYYY-MM-DD"), decision_hour: int = DecisionHour):
    """What the desk saw at decision time for one delivery day, plus a likely range and hindsight actuals."""
    band = january_band(decision_hour)
    view = analysis.day_view(delivery_day(day), decision_hour, data.actuals(), runs(), band)
    return {**view, "band": band}


@app.get("/api/plan")
def plan(
    day: str = Query(..., alias="date", description="Delivery day, YYYY-MM-DD"),
    decision_hour: int = DecisionHour,
    confidence: int = Query(90, description="Chance (50, 80 or 90 %) that actual wind is at least the planned amount"),
    demand_mw: float = Query(..., ge=0, le=100_000, description="Demand to cover, in MW (entered by the desk)"),
):
    """How much power to buy beyond wind for one delivery day, hour by hour."""
    if confidence not in analysis.CONFIDENCE_PERCENTILE:
        raise HTTPException(400, "Confidence must be 50, 80 or 90.")
    band = january_band(decision_hour)
    view = analysis.day_view(delivery_day(day), decision_hour, data.actuals(), runs(), band)
    result = analysis.purchase_plan(view, band, confidence, demand_mw)
    return {
        "date": view["date"],
        "decision_time": view["decision_time"],
        "forecast_published": view["forecast_published"],
        "confidence": confidence,
        "demand_mw": demand_mw,
        **result,
    }


@app.get("/api/accuracy")
def accuracy(start: str = data.FIRST_DELIVERY_DAY, end: str = data.LAST_DELIVERY_DAY, decision_hour: int = DecisionHour):
    first, last = delivery_day(start), delivery_day(end)
    if first > last:
        raise HTTPException(400, "Start date must be on or before end date.")
    errors = analysis.decision_errors(first, last, decision_hour, data.actuals(), runs())
    return {
        "summary": analysis.summarize(errors),
        "histogram": analysis.histogram(errors),
        "by_lead_time": analysis.errors_by_lead_time(first, last, data.actuals(), data.forecasts()),
    }
