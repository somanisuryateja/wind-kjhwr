from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ActualDataPoint(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    fuel_type: str
    generation: float

class ForecastDataPoint(BaseModel):
    start_time: str
    publish_time: str
    generation: float

class ComparisonPoint(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: Optional[float] = None
    day_ahead_forecast_mw: Optional[float] = None
    latest_forecast_mw: Optional[float] = None
    day_ahead_publish_time: Optional[str] = None
    error_mw: Optional[float] = None          # Forecast - Actual
    abs_error_mw: Optional[float] = None      # |Forecast - Actual|
    pct_error: Optional[float] = None          # (|Forecast - Actual| / Actual) * 100
    is_peak: bool = False                     # Periods 15 to 38 (07:00 to 19:00)

class AccuracyMetrics(BaseModel):
    total_intervals: int
    mae_mw: float = Field(..., description="Mean Absolute Error in MW")
    rmse_mw: float = Field(..., description="Root Mean Square Error in MW")
    mape_pct: float = Field(..., description="Mean Absolute Percentage Error in %")
    mean_bias_mw: float = Field(..., description="Mean Bias Error in MW (positive = overforecast, negative = underforecast)")
    peak_mae_mw: float = Field(..., description="MAE during peak demand hours (Periods 15-38)")
    offpeak_mae_mw: float = Field(..., description="MAE during off-peak hours")
    max_underforecast_mw: float = Field(..., description="Worst-case shortfall (Actual > Forecast)")
    max_overforecast_mw: float = Field(..., description="Worst-case surplus (Forecast > Actual)")
    overforecast_percentage: float = Field(..., description="Percentage of intervals where Forecast > Actual")
    underforecast_percentage: float = Field(..., description="Percentage of intervals where Forecast < Actual")

class HorizonAccuracy(BaseModel):
    horizon_label: str       # e.g., "0-4 hrs (Intraday)", "4-12 hrs", "12-24 hrs", "24-36 hrs (Day-Ahead)"
    mae_mw: float
    rmse_mw: float
    sample_count: int

class TradingDecisionSummary(BaseModel):
    recommended_procurement_bias: str  # "ADD_SAFETY_BUFFER", "TRIM_PROCUREMENT", "NEUTRAL"
    volatility_index: str               # "HIGH", "MODERATE", "LOW"
    suggested_hedge_mw: float
    rationale: str

class DashboardResponse(BaseModel):
    start_date: str
    end_date: str
    data_source: str
    metrics: AccuracyMetrics
    timeseries: List[ComparisonPoint]
    hourly_breakdown: List[Dict[str, Any]]
    horizon_metrics: List[HorizonAccuracy]
    trading_decision: TradingDecisionSummary
