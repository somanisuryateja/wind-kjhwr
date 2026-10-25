import sys
import unittest
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.elexon_client import elexon_service
from app.services.metrics import metrics_engine
from app.models.schemas import AccuracyMetrics

class TestWindForecastPipeline(unittest.TestCase):

    def test_forecast_cutoff_selection(self):
        """
        Gate Closure Rule: 12:00 PM GMT on Day D-1.
        For delivery target 2026-01-02T14:00:00Z, Gate Closure is 2026-01-01T12:00:00Z.
        A forecast published at 11:30:00Z must be accepted.
        A forecast published at 12:30:00Z must NOT be accepted as Day-Ahead.
        """
        target_delivery = "2026-01-02T14:00:00Z"
        dt_target = datetime.fromisoformat(target_delivery.replace("Z", "+00:00"))
        gate_closure = datetime(
            dt_target.year, dt_target.month, dt_target.day,
            12, 0, 0, tzinfo=timezone.utc
        ) - timedelta(days=1)
        gate_closure_str = gate_closure.strftime("%Y-%m-%dT%H:%M:%SZ")

        self.assertEqual(gate_closure_str, "2026-01-01T12:00:00Z")

        sample_forecasts = [
            {"publish_time": "2026-01-01T06:00:00Z", "generation": 12000.0},
            {"publish_time": "2026-01-01T11:45:00Z", "generation": 13500.0},  # Valid Day-Ahead
            {"publish_time": "2026-01-01T12:15:00Z", "generation": 14200.0},  # Post Gate Closure (Intraday only)
            {"publish_time": "2026-01-02T10:00:00Z", "generation": 15000.0},  # Near-delivery
        ]

        day_ahead_fc = None
        for fc in sample_forecasts:
            if fc["publish_time"] <= gate_closure_str:
                day_ahead_fc = fc

        self.assertIsNotNone(day_ahead_fc)
        self.assertEqual(day_ahead_fc["publish_time"], "2026-01-01T11:45:00Z")
        self.assertEqual(day_ahead_fc["generation"], 13500.0)

    def test_accuracy_metrics_calculation(self):
        """
        Verify mathematical formulation of MAE, RMSE, MAPE, and Mean Bias.
        """
        sample_data = [
            {"actual_mw": 1000.0, "day_ahead_forecast_mw": 1200.0, "is_peak": True},  # Err: +200, Abs: 200, Pct: 20%
            {"actual_mw": 2000.0, "day_ahead_forecast_mw": 1800.0, "is_peak": True},  # Err: -200, Abs: 200, Pct: 10%
            {"actual_mw": 1500.0, "day_ahead_forecast_mw": 1500.0, "is_peak": False}, # Err: 0,    Abs: 0,   Pct: 0%
            {"actual_mw": 3000.0, "day_ahead_forecast_mw": 3400.0, "is_peak": False}, # Err: +400, Abs: 400, Pct: 13.33%
        ]

        metrics = metrics_engine.compute_accuracy_metrics(sample_data)

        # Expected:
        # Errors: [200, -200, 0, 400]
        # Abs Errors: [200, 200, 0, 400] -> Mean = 200.0
        # Squared Errors: [40000, 40000, 0, 160000] -> Mean = 60000 -> Sqrt = 244.95
        # Mean Bias: (200 - 200 + 0 + 400) / 4 = 100.0
        self.assertEqual(metrics.total_intervals, 4)
        self.assertEqual(metrics.mae_mw, 200.0)
        self.assertAlmostEqual(metrics.rmse_mw, 244.95, places=2)
        self.assertEqual(metrics.mean_bias_mw, 100.0)
        self.assertEqual(metrics.overforecast_percentage, 50.0)
        self.assertEqual(metrics.underforecast_percentage, 25.0)

    def test_missing_data_and_null_handling(self):
        """
        Verify graceful degradation when data points contain None/null or empty values.
        """
        corrupted_data = [
            {"actual_mw": None, "day_ahead_forecast_mw": 1200.0, "is_peak": True},
            {"actual_mw": 1000.0, "day_ahead_forecast_mw": None, "is_peak": True},
            {"actual_mw": 0.0, "day_ahead_forecast_mw": 100.0, "is_peak": False},
        ]

        metrics = metrics_engine.compute_accuracy_metrics(corrupted_data)
        # Only the 3rd point has both valid actual and forecast
        self.assertEqual(metrics.total_intervals, 1)
        self.assertEqual(metrics.mae_mw, 100.0)

    def test_actual_elexon_coverage_and_date_boundaries(self):
        """
        Live data test: Fetch 2026-01-01 to 2026-01-03.
        Verify that:
        1. All intervals strictly fall inside [2026-01-01, 2026-01-03].
        2. Exactly 3 days * 48 periods = 144 periods expected.
        3. Reports actual observations count and percentage coverage.
        """
        async def fetch():
            return await elexon_service.get_aligned_comparison_dataset("2026-01-01", "2026-01-03")

        data = asyncio.run(fetch())
        expected_periods = 3 * 48  # 144 periods for 3 full days
        actual_count = len(data)

        self.assertGreater(actual_count, 0)
        
        # Verify strict boundary enforcement
        for row in data:
            self.assertTrue("2026-01-01" <= row["settlement_date"] <= "2026-01-03")

        matched_count = sum(1 for r in data if r["day_ahead_forecast_mw"] is not None)
        coverage_pct = (matched_count / actual_count) * 100.0 if actual_count > 0 else 0

        print(f"\n[COVERAGE REPORT] Jan 1-3, 2026:")
        print(f"  Expected Settlement Periods: {expected_periods}")
        print(f"  Actual Outturn Records: {actual_count}")
        print(f"  Matched Day-Ahead Forecasts: {matched_count}")
        print(f"  Actual Coverage: {coverage_pct:.1f}%")

        self.assertEqual(actual_count, expected_periods)
        self.assertEqual(matched_count, expected_periods)

if __name__ == "__main__":
    unittest.main()
