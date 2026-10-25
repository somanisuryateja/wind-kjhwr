import React from 'react';
import { SunMedium, Moon, AlertOctagon, ShieldAlert } from 'lucide-react';

export default function PeakComparison({ metrics }) {
  if (!metrics) return null;

  const {
    peak_mae_mw = 0,
    offpeak_mae_mw = 0,
    max_underforecast_mw = 0,
    max_overforecast_mw = 0
  } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      
      {/* Peak Hours (07:00-19:00 / Periods 15-38) */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Peak Hours MAE</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {peak_mae_mw.toLocaleString()} <span className="text-xs text-gray-400 font-normal">MW</span>
            </div>
            <div className="text-[10px] text-gray-500">SP 15–38 (07:00–19:00 GMT)</div>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          High £/MWh
        </span>
      </div>

      {/* Off-Peak Hours */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Off-Peak MAE</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {offpeak_mae_mw.toLocaleString()} <span className="text-xs text-gray-400 font-normal">MW</span>
            </div>
            <div className="text-[10px] text-gray-500">Overnight / Low Demand</div>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Base £/MWh
        </span>
      </div>

      {/* Max Shortfall Risk (Actual > Forecast) */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Max Underforecast Event</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {max_underforecast_mw.toLocaleString()} <span className="text-xs text-gray-400 font-normal">MW</span>
            </div>
            <div className="text-[10px] text-gray-500">Actual Outturn Surplus</div>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
          Spill Risk
        </span>
      </div>

      {/* Max Surplus Miss (Forecast > Actual) */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Max Overforecast Event</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {max_overforecast_mw.toLocaleString()} <span className="text-xs text-gray-400 font-normal">MW</span>
            </div>
            <div className="text-[10px] text-gray-500">System Shortfall Miss</div>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
          Cashout Buy
        </span>
      </div>

    </div>
  );
}
