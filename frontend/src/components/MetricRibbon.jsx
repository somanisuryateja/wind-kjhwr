import React from 'react';
import { Target, TrendingUp, Scale, AlertTriangle, SunMedium } from 'lucide-react';

export default function MetricRibbon({ metrics, loading }) {
  if (!metrics) return null;

  const {
    mae_mw = 0,
    rmse_mw = 0,
    mape_pct = 0,
    mean_bias_mw = 0,
    peak_mae_mw = 0,
    offpeak_mae_mw = 0,
    total_intervals = 0,
    overforecast_percentage = 0,
    underforecast_percentage = 0
  } = metrics;

  const isOverforecast = mean_bias_mw > 0;

  return (
    <div className="bg-subtle/70 border-b border-borderSubtle px-4 sm:px-6 py-3 transition-colors">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 divide-y md:divide-y-0 md:divide-x divide-borderSubtle">
        
        {/* 1. MAE */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mean Absolute Error</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-textPrimary tracking-tight">
              {loading ? '...' : mae_mw.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-textMuted">MW</span>
          </div>
          <div className="text-[11px] text-textMuted mt-0.5">
            {total_intervals} settlement periods
          </div>
        </div>

        {/* 2. RMSE & Volatility */}
        <div className="flex flex-col justify-center md:pl-4 lg:pl-6 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>RMSE (Tail Volatility)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-textPrimary tracking-tight">
              {loading ? '...' : rmse_mw.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-textMuted">MW</span>
          </div>
          <div className="text-[11px] text-blue-500 font-medium mt-0.5">
            {mae_mw > 0 ? (rmse_mw / mae_mw).toFixed(2) : '1.00'}x RMSE/MAE ratio
          </div>
        </div>

        {/* 3. MAPE */}
        <div className="flex flex-col justify-center md:pl-4 lg:pl-6 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
            <Scale className="w-3.5 h-3.5 text-purple-500" />
            <span>Percentage Error</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-textPrimary tracking-tight">
              {loading ? '...' : `${mape_pct.toFixed(1)}%`}
            </span>
            <span className="text-[11px] text-textMuted">MAPE</span>
          </div>
          <div className="text-[11px] text-textMuted mt-0.5">
            {overforecast_percentage}% Over / {underforecast_percentage}% Under
          </div>
        </div>

        {/* 4. Mean Bias Error */}
        <div className="flex flex-col justify-center md:pl-4 lg:pl-6 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
            <AlertTriangle className={`w-3.5 h-3.5 ${isOverforecast ? 'text-amber-500' : 'text-blue-500'}`} />
            <span>Directional Bias (MBE)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
              isOverforecast ? 'text-amber-500' : 'text-blue-500'
            }`}>
              {loading ? '...' : `${isOverforecast ? '+' : ''}${mean_bias_mw.toLocaleString()}`}
            </span>
            <span className="text-[11px] font-mono text-textMuted">MW</span>
          </div>
          <div className={`text-[11px] font-medium mt-0.5 ${isOverforecast ? 'text-amber-500' : 'text-blue-500'}`}>
            {isOverforecast ? 'Over-forecast (Shortfall Risk)' : 'Under-forecast (Surplus Risk)'}
          </div>
        </div>

        {/* 5. Peak vs Off-Peak */}
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center md:pl-4 lg:pl-6 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
            <SunMedium className="w-3.5 h-3.5 text-amber-500" />
            <span>Peak vs Off-Peak MAE</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold font-mono text-textPrimary">
              {loading ? '...' : `${peak_mae_mw.toLocaleString()} MW`}
            </span>
            <span className="text-xs text-textMuted font-mono">
              / {loading ? '...' : `${offpeak_mae_mw.toLocaleString()} MW`}
            </span>
          </div>
          <div className="text-[11px] text-textMuted mt-0.5">
            Peak: SP 15–38 (07:00–19:00 GMT)
          </div>
        </div>

      </div>
    </div>
  );
}
