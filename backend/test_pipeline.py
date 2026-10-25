import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.elexon_client import elexon_service
from app.services.metrics import metrics_engine

async def main():
    print("[TEST] Initiating live Elexon BMRS ingestion for January 2026 (2026-01-01 to 2026-01-03)...")
    data = await elexon_service.get_aligned_comparison_dataset("2026-01-01", "2026-01-03")
    print(f"[SUCCESS] Ingested & aligned {len(data)} settlement periods!")
    if data:
        print("\n--- Sample Half-Hour Record ---")
        print(f"  Start Time: {data[0]['start_time']}")
        print(f"  Actual Wind Generation: {data[0]['actual_mw']} MW")
        print(f"  Day-Ahead Forecast: {data[0]['day_ahead_forecast_mw']} MW")
        print(f"  Publish Time: {data[0]['day_ahead_publish_time']}")
        print(f"  Absolute Error: {data[0]['abs_error_mw']} MW")

        metrics = metrics_engine.compute_accuracy_metrics(data)
        print("\n--- Statistical Accuracy Metrics ---")
        print(f"  MAE: {metrics.mae_mw} MW")
        print(f"  RMSE: {metrics.rmse_mw} MW")
        print(f"  MAPE: {metrics.mape_pct} %")
        print(f"  Mean Bias Error: {metrics.mean_bias_mw} MW")
        print(f"  Peak MAE: {metrics.peak_mae_mw} MW")
        print(f"  Off-Peak MAE: {metrics.offpeak_mae_mw} MW")
        print(f"  Overforecast %: {metrics.overforecast_percentage}%")
        print(f"  Underforecast %: {metrics.underforecast_percentage}%")

if __name__ == "__main__":
    asyncio.run(main())
