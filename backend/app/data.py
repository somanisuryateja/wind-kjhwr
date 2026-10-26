"""Wind actuals (FUELHH) and forecasts (WINDFOR) from Elexon BMRS, fetched once and cached as JSON."""
import json
from functools import lru_cache
from pathlib import Path

import httpx

API = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Purchase decisions made in January 2026 are for delivery days 2 Jan .. 1 Feb (bought the day before).
FIRST_DELIVERY_DAY = "2026-01-02"
LAST_DELIVERY_DAY = "2026-02-01"

# Enough forecast history for 48h lead times on the first delivery day, through the end of the last one.
FORECAST_PUBLISHED_FROM = "2025-12-31T00:00:00Z"
FORECAST_PUBLISHED_TO = "2026-02-01T23:59:59Z"


def _stream(dataset: str, params: dict) -> list[dict]:
    resp = httpx.get(f"{API}/{dataset}/stream", params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()


def _cached(name: str, fetch) -> list[dict]:
    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        DATA_DIR.mkdir(exist_ok=True)
        path.write_text(json.dumps(fetch()))
    return json.loads(path.read_text())


@lru_cache
def actuals() -> dict[str, float]:
    """Half-hourly national wind outturn in MW, keyed by startTime (UTC, e.g. '2026-01-02T00:30:00Z')."""
    rows = _cached("actuals", lambda: [
        {"start_time": r["startTime"], "mw": r["generation"]}
        for r in _stream("FUELHH", {
            "settlementDateFrom": FIRST_DELIVERY_DAY,
            "settlementDateTo": LAST_DELIVERY_DAY,
            "fuelType": "WIND",
        })
        if r["fuelType"] == "WIND"
    ])
    return {r["start_time"]: r["mw"] for r in rows}


@lru_cache
def forecasts() -> list[dict]:
    """Every hourly WINDFOR forecast: {start_time, publish_time, mw}."""
    return _cached("forecasts", lambda: [
        {"start_time": r["startTime"], "publish_time": r["publishTime"], "mw": r["generation"]}
        for r in _stream("WINDFOR", {
            "publishDateTimeFrom": FORECAST_PUBLISHED_FROM,
            "publishDateTimeTo": FORECAST_PUBLISHED_TO,
        })
    ])


if __name__ == "__main__":
    # Refresh: delete data/*.json, then run `python -m app.data`.
    print(len(actuals()), "half-hourly actuals,", len(forecasts()), "forecast rows")
