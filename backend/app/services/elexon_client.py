import os
import json
import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from pathlib import Path
from ..config import FUELHH_ENDPOINT, WINDFOR_ENDPOINT, CACHE_DIR, GATE_CLOSURE_HOUR_D_MINUS_1

class ElexonClient:
    def __init__(self):
        self.cache_dir = CACHE_DIR
        self.client_timeout = 60.0

    def _get_cache_path(self, dataset: str, start_date: str, end_date: str) -> Path:
        clean_start = start_date.replace(":", "-")
        clean_end = end_date.replace(":", "-")
        return self.cache_dir / f"{dataset}_{clean_start}_{clean_end}.json"

    async def fetch_fuelhh_actuals(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch actual wind generation from FUELHH dataset.
        start_date and end_date in YYYY-MM-DD format.
        """
        cache_path = self._get_cache_path("FUELHH_WIND", start_date, end_date)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[CACHE READ ERROR] {e}, fetching fresh data...")

        # Elexon API streams expect publishDateTimeFrom / To or settlementDateFrom / To
        # Since FUELHH publishTime is within 1 hour of target time:
        params = {
            "publishDateTimeFrom": f"{start_date}T00:00:00Z",
            "publishDateTimeTo": f"{end_date}T23:59:59Z"
        }

        wind_records = []
        async with httpx.AsyncClient(timeout=self.client_timeout) as client:
            try:
                resp = await client.get(FUELHH_ENDPOINT, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    # Filter for WIND fuel type only
                    for item in data:
                        if item.get("fuelType", "").upper() == "WIND":
                            wind_records.append({
                                "start_time": item.get("startTime"),
                                "settlement_date": item.get("settlementDate"),
                                "settlement_period": item.get("settlementPeriod", 0),
                                "fuel_type": "WIND",
                                "generation": float(item.get("generation", 0.0))
                            })
                    
                    # Cache the filtered wind records
                    with open(cache_path, "w", encoding="utf-8") as f:
                        json.dump(wind_records, f)
                    return wind_records
                else:
                    print(f"[ELEXON API ERROR] FUELHH returned status {resp.status_code}: {resp.text[:200]}")
            except Exception as ex:
                print(f"[ELEXON FETCH EXCEPTION] FUELHH: {ex}")

        # If API call fails but cache exists or fallback needed, return empty list
        return wind_records

    async def fetch_windfor_forecasts(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch wind power forecasts from WINDFOR dataset.
        To capture Day-Ahead forecasts published up to 2 days prior to start_date,
        we expand the query window.
        """
        cache_path = self._get_cache_path("WINDFOR", start_date, end_date)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[CACHE READ ERROR] {e}, fetching fresh forecasts...")

        # Expanding publish window 48 hours prior to start_date to ensure we get day-ahead forecasts
        dt_start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc) - timedelta(days=2)
        params = {
            "publishDateTimeFrom": dt_start.strftime("%Y-%m-%dT00:00:00Z"),
            "publishDateTimeTo": f"{end_date}T23:59:59Z"
        }

        forecast_records = []
        async with httpx.AsyncClient(timeout=self.client_timeout) as client:
            try:
                resp = await client.get(WINDFOR_ENDPOINT, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        forecast_records.append({
                            "start_time": item.get("startTime"),
                            "publish_time": item.get("publishTime"),
                            "generation": float(item.get("generation", 0.0))
                        })

                    # Cache records
                    with open(cache_path, "w", encoding="utf-8") as f:
                        json.dump(forecast_records, f)
                    return forecast_records
                else:
                    print(f"[ELEXON API ERROR] WINDFOR returned status {resp.status_code}: {resp.text[:200]}")
            except Exception as ex:
                print(f"[ELEXON FETCH EXCEPTION] WINDFOR: {ex}")

        return forecast_records

    async def get_aligned_comparison_dataset(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Aligns actuals and forecasts by matching each half-hour delivery startTime:
        1. Identifies the Day-Ahead Gate Closure (12:00 GMT on D-1).
        2. Picks the latest forecast published before Gate Closure (Day-Ahead Forecast).
        3. Picks the latest forecast published before actual delivery (Intraday Forecast).
        4. Calculates quantitative errors.
        """
        actuals = await self.fetch_fuelhh_actuals(start_date, end_date)
        forecasts = await self.fetch_windfor_forecasts(start_date, end_date)

        # Index forecasts by target startTime -> list of forecasts
        forecast_map: Dict[str, List[Dict[str, Any]]] = {}
        for f in forecasts:
            st = f["start_time"]
            if st not in forecast_map:
                forecast_map[st] = []
            forecast_map[st].append(f)

        # Sort each forecast list by publish_time ascending
        for st in forecast_map:
            forecast_map[st].sort(key=lambda x: x["publish_time"])

        aligned_data = []

        # Sort actuals by start_time
        actuals.sort(key=lambda x: x["start_time"])

        for act in actuals:
            st_str = act["start_time"]
            act_gen = act["generation"]
            sp = act["settlement_period"]
            sdate = act["settlement_date"]

            try:
                # Target start datetime in UTC
                dt_target = datetime.fromisoformat(st_str.replace("Z", "+00:00"))
            except Exception:
                continue

            # Day-Ahead Gate Closure: (Target Date - 1 day) at 12:00:00 UTC
            gate_closure = datetime(
                dt_target.year, dt_target.month, dt_target.day,
                GATE_CLOSURE_HOUR_D_MINUS_1, 0, 0, tzinfo=timezone.utc
            ) - timedelta(days=1)
            gate_closure_str = gate_closure.strftime("%Y-%m-%dT%H:%M:%SZ")

            available_forecasts = forecast_map.get(st_str, [])

            # If no direct forecast exists for half-hour interval (e.g. 00:30:00Z), check prevailing hour (00:00:00Z)
            if not available_forecasts and ":30:00Z" in st_str:
                prevailing_hour_st = st_str.replace(":30:00Z", ":00:00Z")
                available_forecasts = forecast_map.get(prevailing_hour_st, [])

            day_ahead_fc = None
            latest_fc = None

            # Find latest forecast published on or before gate closure
            for fc in available_forecasts:
                pub_str = fc["publish_time"]
                if pub_str <= gate_closure_str:
                    day_ahead_fc = fc
                if pub_str <= st_str:
                    latest_fc = fc

            # Fallback if no forecast was published prior to 12:00 D-1, use earliest available
            if day_ahead_fc is None and available_forecasts:
                day_ahead_fc = available_forecasts[0]

            if latest_fc is None and available_forecasts:
                latest_fc = available_forecasts[-1]

            da_gen = day_ahead_fc["generation"] if day_ahead_fc else None
            da_pub = day_ahead_fc["publish_time"] if day_ahead_fc else None
            latest_gen = latest_fc["generation"] if latest_fc else None

            # Calculate error metrics
            error_mw = None
            abs_error_mw = None
            pct_error = None

            if da_gen is not None:
                error_mw = round(da_gen - act_gen, 2)
                abs_error_mw = round(abs(error_mw), 2)
                if act_gen > 0:
                    pct_error = round((abs_error_mw / act_gen) * 100, 2)
                else:
                    pct_error = 0.0

            # UK Market Peak Hours: Settlement periods 15 to 38 (07:00 to 19:00 GMT)
            is_peak = 15 <= sp <= 38

            aligned_data.append({
                "start_time": st_str,
                "settlement_date": sdate,
                "settlement_period": sp,
                "actual_mw": round(act_gen, 2),
                "day_ahead_forecast_mw": round(da_gen, 2) if da_gen is not None else None,
                "latest_forecast_mw": round(latest_gen, 2) if latest_gen is not None else None,
                "day_ahead_publish_time": da_pub,
                "error_mw": error_mw,
                "abs_error_mw": abs_error_mw,
                "pct_error": pct_error,
                "is_peak": is_peak
            })

        return aligned_data

elexon_service = ElexonClient()
