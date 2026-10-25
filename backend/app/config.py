import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

DEFAULT_START_DATE = "2026-01-01"
DEFAULT_END_DATE = "2026-01-08"  # Default 1-week institutional window (or full month up to 2026-01-31)
FULL_MONTH_START = "2026-01-01"
FULL_MONTH_END = "2026-01-31"

# Day-Ahead Gate Closure: 12:00 PM GMT on Day D-1
GATE_CLOSURE_HOUR_D_MINUS_1 = 12

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]
