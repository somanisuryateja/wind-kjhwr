"""Run: python test_analysis.py (or pytest)."""
from datetime import date

from app import analysis as a


def test_decision_cutoff_is_day_before():
    assert a.decision_cutoff(date(2026, 1, 15), 9) == "2026-01-14T09:00:00Z"


def test_latest_before_ignores_later_runs():
    runs = a.index_runs([
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-14T07:30:00Z", "mw": 100},
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-14T04:30:00Z", "mw": 50},
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-14T09:30:00Z", "mw": 999},  # after cutoff
    ])
    assert a.latest_before(runs, "2026-01-15T10:00:00Z", "2026-01-14T09:00:00Z") == ("2026-01-14T07:30:00Z", 100)
    assert a.latest_before(runs, "2026-01-15T10:00:00Z", "2026-01-14T00:00:00Z") is None
    assert a.latest_before(runs, "2026-01-15T11:00:00Z", "2026-01-14T09:00:00Z") is None


def test_summarize():
    s = a.summarize([-200, 200, 0, 400])
    assert s["mae"] == 200 and s["bias"] == 100 and s["rmse"] == (240000 / 4) ** 0.5
    assert s["p10"] < s["p50"] < s["p90"]
    assert s["share_below"] == 0.25
    assert a.summarize([5]) == {"n": 1}


def test_lead_time_buckets_drop_forecasts_published_after_target():
    actuals = {"2026-01-15T10:00:00Z": 1000}
    forecasts = [
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-15T08:00:00Z", "mw": 900},  # 2h -> 0-4h
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-14T10:00:00Z", "mw": 700},  # 24h -> 24-36h
        {"start_time": "2026-01-15T10:00:00Z", "publish_time": "2026-01-15T11:00:00Z", "mw": 0},    # -1h -> dropped
    ]
    rows = {r["label"]: r for r in a.errors_by_lead_time(date(2026, 1, 15), date(2026, 1, 15), actuals, forecasts)}
    assert rows["0–4h"]["n"] == 1 and rows["24–36h"]["n"] == 1
    assert sum(r["n"] for r in rows.values()) == 2


def test_purchase_plan():
    view = {"points": [
        {"time": "T00", "forecast_mw": 10_000, "actual_mw": 7_000},
        {"time": "T00:30", "forecast_mw": None, "actual_mw": 7_100},  # half-hour, no forecast: skipped
        {"time": "T01", "forecast_mw": 1_000, "actual_mw": 2_000},
    ]}
    band = {"p10": -2_000, "p20": -1_000, "p50": -500}
    plan = a.purchase_plan(view, band, confidence=90, demand_mw=30_000)
    h0, h1 = plan["hours"]
    assert (h0["firm_wind_mw"], h0["buy_mw"], h0["shortfall_mw"]) == (8_000, 22_000, 1_000)
    assert (h1["firm_wind_mw"], h1["buy_mw"], h1["shortfall_mw"]) == (0, 30_000, 0)  # never plan negative wind
    assert plan["totals"]["buy_mwh"] == 52_000
    assert plan["totals"]["hours_short"] == 1 and plan["totals"]["shortfall_mwh"] == 1_000
    assert a.purchase_plan(view, band, confidence=50, demand_mw=0)["totals"]["buy_mwh"] == 0


def test_histogram_fills_empty_bins():
    assert a.histogram([-600, 10, 1100]) == [
        {"from_mw": -1000, "count": 1}, {"from_mw": -500, "count": 0}, {"from_mw": 0, "count": 1},
        {"from_mw": 500, "count": 0}, {"from_mw": 1000, "count": 1},
    ]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("all tests passed")
