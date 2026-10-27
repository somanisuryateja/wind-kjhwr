"""Forecast-vs-actual analysis. Error is always actual - forecast: negative means less wind than forecast."""
from bisect import bisect_right
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from math import floor, sqrt
from statistics import mean, quantiles

LEAD_BUCKETS = [(0, 4), (4, 8), (8, 12), (12, 24), (24, 36), (36, 48)]


def parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def midnight(day: date) -> datetime:
    return datetime(day.year, day.month, day.day, tzinfo=timezone.utc)


def days(start: date, end: date):
    for i in range((end - start).days + 1):
        yield start + timedelta(days=i)


def decision_cutoff(day: date, hour: int) -> str:
    """When the purchase for delivery `day` is made: `hour`:00 on the day before.
    January is GMT, so UK local time equals UTC here."""
    return iso(midnight(day) - timedelta(days=1) + timedelta(hours=hour))


def index_runs(forecasts: list[dict]) -> dict[str, tuple[list[str], list[float]]]:
    """target startTime -> (publish times sorted ascending, matching MW values)."""
    by_target = defaultdict(list)
    for f in forecasts:
        by_target[f["start_time"]].append((f["publish_time"], f["mw"]))
    index = {}
    for target, runs in by_target.items():
        runs.sort()
        index[target] = ([p for p, _ in runs], [mw for _, mw in runs])
    return index


def latest_before(runs, target: str, cutoff: str):
    """Most recent forecast for `target` published at or before `cutoff`, as (publish_time, mw), or None."""
    if target not in runs:
        return None
    published, values = runs[target]
    i = bisect_right(published, cutoff)
    return (published[i - 1], values[i - 1]) if i else None


def summarize(errors: list[float]) -> dict:
    if len(errors) < 2:
        return {"n": len(errors)}
    deciles = quantiles(errors, n=10, method="inclusive")
    return {
        "n": len(errors),
        "mae": mean(abs(e) for e in errors),
        "rmse": sqrt(mean(e * e for e in errors)),
        "bias": mean(errors),
        "p10": deciles[0],
        "p50": deciles[4],
        "p90": deciles[8],
        "share_below": sum(e < 0 for e in errors) / len(errors),  # hours with less wind than forecast
    }


def decision_errors(start: date, end: date, hour: int, actuals: dict, runs) -> list[float]:
    """Error of the forecast the desk had at decision time, for every hourly target in the range.
    WINDFOR is hourly, so we score at the hours it covers."""
    errors = []
    for day in days(start, end):
        cutoff = decision_cutoff(day, hour)
        for h in range(24):
            target = iso(midnight(day) + timedelta(hours=h))
            fc = latest_before(runs, target, cutoff)
            if fc and target in actuals:
                errors.append(actuals[target] - fc[1])
    return errors


def errors_by_lead_time(start: date, end: date, actuals: dict, forecasts: list[dict]) -> list[dict]:
    """Every forecast for a target in the range, grouped by how far ahead it was published."""
    lo, hi = iso(midnight(start)), iso(midnight(end + timedelta(days=1)))
    buckets = {b: [] for b in LEAD_BUCKETS}
    for f in forecasts:
        target = f["start_time"]
        if not (lo <= target < hi) or target not in actuals:
            continue
        lead = (parse(target) - parse(f["publish_time"])).total_seconds() / 3600
        for a, b in LEAD_BUCKETS:  # negative leads (published after the target) fall through
            if a <= lead < b:
                buckets[(a, b)].append(actuals[target] - f["mw"])
                break
    return [{"label": f"{a}–{b}h", **summarize(errs)} for (a, b), errs in buckets.items()]


def histogram(errors: list[float], width: int = 500) -> list[dict]:
    if not errors:
        return []
    counts = Counter(floor(e / width) * width for e in errors)
    return [{"from_mw": b, "count": counts[b]} for b in range(min(counts), max(counts) + width, width)]


def day_view(day: date, hour: int, actuals: dict, runs, band: dict) -> dict:
    """The forecast the desk saw at decision time for one delivery day, with actuals for hindsight.
    `band` (p10/p90 of past errors) turns the forecast into a likely range for the actual."""
    cutoff = decision_cutoff(day, hour)
    points, published = [], None
    for i in range(48):
        t = iso(midnight(day) + timedelta(minutes=30 * i))
        fc = latest_before(runs, t, cutoff) if i % 2 == 0 else None  # forecasts are hourly
        point = {"time": t, "actual_mw": actuals.get(t), "forecast_mw": None, "range_mw": None}
        if fc:
            published = max(published or fc[0], fc[0])
            point["forecast_mw"] = fc[1]
            if "p10" in band:
                point["range_mw"] = [max(0, fc[1] + band["p10"]), fc[1] + band["p90"]]
        points.append(point)
    return {"date": day.isoformat(), "decision_time": cutoff, "forecast_published": published, "points": points}
