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
        self.master_start = "2026-01-01"
        self.master_end = "2026-01-31"

    def _get_cache_path(self, dataset: str, start_date: str, end_date: str) -> Path:
        clean_start = start_date.replace(":", "-")
        clean_end = end_date.replace(":", "-")
        return self.cache_dir / f"{dataset}_{clean_start}_{clean_end}.json"

    async def fetch_fuelhh_actuals(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch actual wind generation from FUELHH dataset.
        start_date and end_date in YYYY-MM-DD format.
        """
        # 1. Check exact cache file
        cache_path = self._get_cache_path("FUELHH_WIND", start_date, end_date)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[CACHE READ ERROR] {e}, checking master cache...")

        # 2. Check if master full-month cache exists and can satisfy the date range
        master_cache_path = self._get_cache_path("FUELHH_WIND", self.master_start, self.master_end)
        if master_cache_path.exists() and self.master_start <= start_date and end_date <= self.master_end:
            try:
                with open(master_cache_path, "r", encoding="utf-8") as f:
                    master_data = json.load(f)
                sliced = [
                    item for item in master_data
                    if start_date <= item.get("settlement_date", "") <= end_date
                ]
                if sliced:
                    # Save sliced range into cache for fast future lookups
                    try:
                        with open(cache_path, "w", encoding="utf-8") as f:
                            json.dump(sliced, f)
                    except Exception:
                        pass
                    return sliced
            except Exception as e:
                print(f"[MASTER CACHE SLICE ERROR] {e}, falling back to live API...")

        # 3. Live API Fetch using exact settlementDateFrom & settlementDateTo
        params = {
            "settlementDateFrom": start_date,
            "settlementDateTo": end_date
        }

        wind_records = []
        async with httpx.AsyncClient(timeout=self.client_timeout) as client:
            try:
                resp = await client.get(FUELHH_ENDPOINT, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        sdate = item.get("settlementDate")
                        if (
                            item.get("fuelType", "").upper() == "WIND"
                            and sdate
                            and start_date <= sdate <= end_date
                        ):
                            wind_records.append({
                                "start_time": item.get("startTime"),
                                "settlement_date": sdate,
                                "settlement_period": item.get("settlementPeriod", 0),
                                "fuel_type": "WIND",
                                "generation": float(item.get("generation", 0.0))
                            })
                    
                    # Sort by start_time ascending
                    wind_records.sort(key=lambda x: x["start_time"])

                    # Cache the filtered wind records
                    if wind_records:
                        with open(cache_path, "w", encoding="utf-8") as f:
                            json.dump(wind_records, f)
                    return wind_records
                else:
                    print(f"[ELEXON API ERROR] FUELHH returned status {resp.status_code}: {resp.text[:200]}")
            except Exception as ex:
                print(f"[ELEXON FETCH EXCEPTION] FUELHH: {ex}")

        return wind_records

    async def fetch_windfor_forecasts(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch wind power forecasts from WINDFOR dataset.
        Captures Day-Ahead forecasts published prior to gate closure on Day D-1.
        """
        # 1. Check exact cache file
        cache_path = self._get_cache_path("WINDFOR", start_date, end_date)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[CACHE READ ERROR] {e}, checking master cache...")

        # 2. Check if master full-month cache exists and can satisfy the date range
        master_cache_path = self._get_cache_path("WINDFOR", self.master_start, self.master_end)
        if master_cache_path.exists() and self.master_start <= start_date and end_date <= self.master_end:
            try:
                with open(master_cache_path, "r", encoding="utf-8") as f:
                    master_data = json.load(f)
                
                # Delivery target window (start_date 00:00 to end_date 23:59)
                start_prefix = f"{start_date}T00:00:00Z"
                end_dt_next = datetime.fromisoformat(end_date) + timedelta(days=1)
                end_prefix = f"{end_dt_next.strftime('%Y-%m-%d')}T00:00:00Z"

                sliced = [
                    item for item in master_data
                    if start_prefix <= item.get("start_time", "") <= end_prefix
                ]
                if sliced:
                    try:
                        with open(cache_path, "w", encoding="utf-8") as f:
                            json.dump(sliced, f)
                    except Exception:
                        pass
                    return sliced
            except Exception as e:
                print(f"[MASTER CACHE WINDFOR SLICE ERROR] {e}, falling back to live API...")

        # 3. Live API Fetch: Expand publish window 48 hours prior to start_date
        dt_start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc) - timedelta(days=2)
        dt_end_next = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc) + timedelta(days=1)
        params = {
            "publishDateTimeFrom": dt_start.strftime("%Y-%m-%dT00:00:00Z"),
            "publishDateTimeTo": dt_end_next.strftime("%Y-%m-%dT02:00:00Z")
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

                    if forecast_records:
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
        1. Identifies the official Day-Ahead Gate Closure (12:00 PM GMT on Day D-1).
        2. Picks the latest forecast published on or before Gate Closure (Day-Ahead Forecast).
        3. Picks the latest forecast published on or before actual delivery (Intraday Latest).
        4. Calculates quantitative errors.
        """
        actuals = await self.fetch_fuelhh_actuals(start_date, end_date)
        forecasts = await self.fetch_windfor_forecasts(start_date, end_date)

        # Index forecasts by target startTime -> list of forecasts
        forecast_map: Dict[str, List[Dict[str, Any]]] = {}
        for f in forecasts:
            st = f.get("start_time")
            if st:
                if st not in forecast_map:
                    forecast_map[st] = []
                forecast_map[st].append(f)

        # Sort each forecast list by publish_time ascending
        for st in forecast_map:
            forecast_map[st].sort(key=lambda x: x["publish_time"])

        aligned_data = []

        # Sort actuals chronologically by start_time
        actuals.sort(key=lambda x: x["start_time"])

        for act in actuals:
            sdate = act.get("settlement_date")
            # Strict settlement date filtering: ensure no boundary bleed-over
            if not sdate or sdate < start_date or sdate > end_date:
                continue

            st_str = act.get("start_time")
            if not st_str:
                continue

            act_gen_raw = act.get("generation")
            if act_gen_raw is None:
                continue
            act_gen = float(act_gen_raw)
            sp = int(act.get("settlement_period", 0))

            # Day-Ahead Gate Closure: 12:00:00 UTC on Day D-1 (the day before sdate)
            try:
                sdate_dt = datetime.strptime(sdate, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                gate_closure = sdate_dt - timedelta(days=1) + timedelta(hours=GATE_CLOSURE_HOUR_D_MINUS_1)
                gate_closure_str = gate_closure.strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                continue

            available_forecasts = forecast_map.get(st_str, [])

            # WINDFOR publishes on clock hourly boundaries (:00:00Z).
            # If no direct forecast exists for :30:00Z interval, use the prevailing hour (:00:00Z).
            if not available_forecasts and ":30:00Z" in st_str:
                prevailing_hour_st = st_str.replace(":30:00Z", ":00:00Z")
                available_forecasts = forecast_map.get(prevailing_hour_st, [])

            day_ahead_fc = None
            latest_fc = None

            # Find latest forecast published strictly on or before gate closure (12:00 D-1)
            # and latest forecast published strictly on or before delivery startTime
            for fc in available_forecasts:
                pub_str = fc.get("publish_time", "")
                if pub_str <= gate_closure_str:
                    day_ahead_fc = fc
                if pub_str <= st_str:
                    latest_fc = fc

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
