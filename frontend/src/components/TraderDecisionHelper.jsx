import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Zap, Calculator, ArrowRight } from 'lucide-react';

export default function TraderDecisionHelper({ tradingDecision, metrics }) {
  if (!tradingDecision || !metrics) return null;

  const [consumerDemandMW, setConsumerDemandMW] = useState(24000);

  const {
    recommended_procurement_bias = 'BALANCED_DAY_AHEAD_BIDDING',
    volatility_index = 'MODERATE',
    suggested_hedge_mw = 0,
    rationale = ''
  } = tradingDecision;

  const mae = metrics.mae_mw || 0;
  const bias = metrics.mean_bias_mw || 0;

  // Real-time Day-Ahead Procurement Calculation
  const avgForecastMW = 14500; // Baseline average national wind
  const netUnhedgedProcurement = Math.max(0, consumerDemandMW - avgForecastMW);
  const calibratedProcurement = Math.max(0, netUnhedgedProcurement + (bias > 0 ? suggested_hedge_mw : -suggested_hedge_mw));

  return (
    <div className="bg-gradient-to-br from-[#111827] via-[#111827] to-[#151D2F] border border-gray-800 rounded-xl p-5 shadow-sm">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Day-Ahead Trading Decision Engine & Risk Calibration</span>
            </h3>
            <p className="text-xs text-gray-400">
              Quantified error calibration for wholesale power auction bid sizing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Volatility Regime:</span>
          <span className={`px-2 py-0.5 rounded font-mono font-bold ${
            volatility_index === 'HIGH'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : volatility_index === 'MODERATE'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {volatility_index}
          </span>
        </div>
      </div>

      {/* Rationale & Actionable Guidance */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Desk Recommendation */}
        <div className="lg:col-span-2 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Operational Guidance</span>
          </div>
          <div className="mt-1 text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>{recommended_procurement_bias.replace(/_/g, ' ')}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
              Target Hedge: ±{suggested_hedge_mw} MW
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-300 leading-relaxed font-sans">
            {rationale}
          </p>
        </div>

        {/* Live Bid Calibrator */}
        <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Bid Sizing</span>
            </div>
            
            <div className="mt-2">
              <label className="text-[11px] text-gray-400 block mb-1">
                Consumer Demand Target (MW):
              </label>
              <input
                type="number"
                step="500"
                value={consumerDemandMW}
                onChange={(e) => setConsumerDemandMW(Number(e.target.value))}
                className="w-full bg-[#0B0F17] border border-gray-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800 text-xs space-y-1 font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Unhedged Thermal Need:</span>
              <span>{netUnhedgedProcurement.toLocaleString()} MW</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-400">
              <span>Risk-Calibrated Bid:</span>
              <span>{calibratedProcurement.toLocaleString()} MW</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
