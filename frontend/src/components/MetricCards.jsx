import React from 'react';
import { TrendingUp, AlertTriangle, Scale, Target, SunMedium, Moon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCards({ metrics, loading }) {
  if (!metrics) return null;

  const {
    mae_mw = 0,
    rmse_mw = 0,
    mape_pct = 0,
    mean_bias_mw = 0,
    peak_mae_mw = 0,
    offpeak_mae_mw = 0,
    max_underforecast_mw = 0,
    max_overforecast_mw = 0,
    overforecast_percentage = 0,
    underforecast_percentage = 0,
    total_intervals = 0
  } = metrics;

  const isOverforecastBias = mean_bias_mw > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. MAE Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 relative overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Mean Absolute Error (MAE)</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
            {total_intervals} Periods
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {loading ? '...' : mae_mw.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-gray-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between border-t border-gray-800/80 pt-2">
          <span>Avg volume mismatch</span>
          <span className="text-emerald-400 font-mono font-medium">
            ±{((mae_mw / 15000) * 100).toFixed(1)}% Grid Cap
          </span>
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 relative overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Root Mean Square (RMSE)</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
            Volatility Index
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {loading ? '...' : rmse_mw.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-gray-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between border-t border-gray-800/80 pt-2">
          <span>RMSE / MAE Ratio</span>
          <span className="text-blue-400 font-mono font-medium">
            {mae_mw > 0 ? (rmse_mw / mae_mw).toFixed(2) : '1.00'}x (Tail Risk)
          </span>
        </div>
      </div>

      {/* 3. MAPE Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 relative overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Percentage Error (MAPE)</span>
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            mape_pct < 15 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {mape_pct < 15 ? 'Institutional Grade' : 'High Variance'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {loading ? '...' : mape_pct.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">of actual outturn</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between border-t border-gray-800/80 pt-2">
          <span>Directional Split</span>
          <span className="font-mono text-xs text-gray-300">
            {overforecast_percentage}% Over / {underforecast_percentage}% Under
          </span>
        </div>
      </div>

      {/* 4. Mean Bias Error (MBE) Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 relative overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${isOverforecastBias ? 'text-amber-400' : 'text-blue-400'}`} />
            <span>Mean Bias (MBE)</span>
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            isOverforecastBias
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {isOverforecastBias ? 'Overforecast Bias' : 'Underforecast Bias'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold font-mono ${
            isOverforecastBias ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {loading ? '...' : `${isOverforecastBias ? '+' : ''}${mean_bias_mw.toLocaleString()}`}
          </span>
          <span className="text-xs font-mono text-gray-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between border-t border-gray-800/80 pt-2">
          <span>Trading Impact</span>
          <span className={`font-mono text-xs font-semibold ${isOverforecastBias ? 'text-amber-400' : 'text-blue-400'}`}>
            {isOverforecastBias ? 'Shortfall / Buy Risk' : 'Surplus / Sell Risk'}
          </span>
        </div>
      </div>

    </div>
  );
}
