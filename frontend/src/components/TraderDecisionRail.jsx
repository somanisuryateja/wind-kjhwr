import React, { useState } from 'react';
import { ShieldCheck, Zap, Calculator, AlertCircle, SunMedium, Moon, ArrowRight } from 'lucide-react';

export default function TraderDecisionRail({ tradingDecision, metrics, loading }) {
  const [consumerDemandMW, setConsumerDemandMW] = useState(24000);

  if (!tradingDecision || !metrics) return null;

  const {
    recommended_procurement_bias = 'NEUTRAL_UNCERTAINTY_HEDGE',
    volatility_index = 'MODERATE',
    suggested_hedge_mw = 0,
    rationale = ''
  } = tradingDecision;

  const {
    mae_mw = 0,
    mean_bias_mw = 0,
    peak_mae_mw = 0,
    offpeak_mae_mw = 0
  } = metrics;

  // Scenario Calculation:
  // Expected national wind generation baseline from the period (or ~14,500 MW typical Jan 2026 outturn)
  const estimatedWindMW = 14500;
  const netThermalNeed = Math.max(0, consumerDemandMW - estimatedWindMW);
  const calibratedBidMW = Math.max(
    0,
    netThermalNeed + (mean_bias_mw > 0 ? suggested_hedge_mw : -suggested_hedge_mw)
  );

  return (
    <div className="flex flex-col space-y-4">
      
      {/* 1. Volatility Regime & Operational Guidance Card */}
      <div className="bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm transition-colors">
        
        <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-textPrimary">
              Trading Desk Rail
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-textMuted">Volatility:</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              volatility_index === 'HIGH'
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : volatility_index === 'MODERATE'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}>
              {volatility_index}
            </span>
          </div>
        </div>

        {/* Strategy Bias */}
        <div className="mt-4">
          <div className="text-[11px] text-textMuted font-medium uppercase tracking-wider">
            Operational Skew
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-textPrimary font-mono">
              {recommended_procurement_bias.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-subtle text-textPrimary border border-borderSubtle">
              ±{suggested_hedge_mw.toLocaleString()} MW
            </span>
          </div>
          
          <p className="mt-2 text-xs text-textSecondary leading-relaxed bg-subtle/50 p-3 rounded-xl border border-borderSubtle/60">
            {rationale}
          </p>
          <div className="mt-1 text-[10px] text-textMuted italic">
            * Derived strictly from evaluated Elexon wind forecast error metrics.
          </div>
        </div>

        {/* Peak vs Off-Peak Delta */}
        <div className="mt-4 pt-3 border-t border-borderSubtle grid grid-cols-2 gap-2 text-xs">
          <div className="bg-subtle/40 p-2.5 rounded-lg border border-borderSubtle/60">
            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
              <SunMedium className="w-3.5 h-3.5" />
              <span>Peak Error</span>
            </div>
            <div className="text-sm font-bold font-mono text-textPrimary mt-0.5">
              {peak_mae_mw.toLocaleString()} MW
            </div>
            <div className="text-[10px] text-textMuted">SP 15–38 (High £)</div>
          </div>

          <div className="bg-subtle/40 p-2.5 rounded-lg border border-borderSubtle/60">
            <div className="flex items-center gap-1 text-[11px] text-blue-500 font-medium">
              <Moon className="w-3.5 h-3.5" />
              <span>Off-Peak Error</span>
            </div>
            <div className="text-sm font-bold font-mono text-textPrimary mt-0.5">
              {offpeak_mae_mw.toLocaleString()} MW
            </div>
            <div className="text-[10px] text-textMuted">Night / Base £</div>
          </div>
        </div>

      </div>

      {/* 2. Scenario Bid Sizing Calculator */}
      <div className="bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm transition-colors">
        
        <div className="flex items-center space-x-2 pb-3 border-b border-borderSubtle">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
              Scenario Bid Sizer
            </h3>
            <span className="text-[10px] text-textMuted block">
              Indicative Parameter Simulation
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label htmlFor="demandInput" className="text-textSecondary font-medium">
                Target Consumer Demand (MW):
              </label>
              <span className="text-[10px] text-textMuted font-mono">User Parameter</span>
            </div>
            <input
              id="demandInput"
              type="number"
              step="500"
              value={consumerDemandMW}
              onChange={(e) => setConsumerDemandMW(Number(e.target.value))}
              className="w-full bg-subtle border border-borderSubtle focus:border-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none transition-colors"
            />
          </div>

          {/* Derived Outputs */}
          <div className="p-3 rounded-xl bg-subtle/70 border border-borderSubtle space-y-2 text-xs font-mono">
            
            <div className="flex justify-between text-textSecondary">
              <span>Expected Wind Baseline:</span>
              <span className="text-textPrimary font-medium">~{estimatedWindMW.toLocaleString()} MW</span>
            </div>

            <div className="flex justify-between text-textSecondary">
              <span>Unhedged Thermal Need:</span>
              <span className="text-textPrimary font-medium">{netThermalNeed.toLocaleString()} MW</span>
            </div>

            <div className="pt-2 border-t border-borderSubtle flex justify-between items-center">
              <span className="font-bold text-textPrimary font-sans">
                Risk-Calibrated Bid:
              </span>
              <span className="text-base font-bold text-emerald-500 font-mono">
                {calibratedBidMW.toLocaleString()} MW
              </span>
            </div>

          </div>

          <p className="text-[10px] text-textMuted leading-relaxed">
            * Note: The portal evaluates national wind generation from Elexon BMRS. Consumer demand is a user-supplied scenario input to test procurement sizing.
          </p>

        </div>

      </div>

    </div>
  );
}
