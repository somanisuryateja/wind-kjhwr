import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Compass, Zap } from 'lucide-react';

export default function HorizonChart({ horizonMetrics }) {
  if (!horizonMetrics || horizonMetrics.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Lead-Time Degradation Curve (Horizon Accuracy)</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Error progression from 24–36h Day-Ahead submission window to 0–4h Intraday delivery.
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
          Decay Profile
        </span>
      </div>

      <div className="h-[240px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={horizonMetrics} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="horizon_label" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} MW`} />
            <Tooltip content={<HorizonTooltip />} />
            <Bar dataKey="mae_mw" name="Mean Absolute Error (MW)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {horizonMetrics.map((h) => (
          <div key={h.horizon_label} className="bg-gray-900/60 p-2 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-[10px] truncate">{h.horizon_label}</div>
            <div className="font-mono font-bold text-white mt-0.5">{h.mae_mw} MW</div>
            <div className="text-[10px] text-purple-400">RMSE {h.rmse_mw} MW</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizonTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-[#0B0F17]/95 border border-gray-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-gray-200 border-b border-gray-800 pb-1 font-mono">
        {d.horizon_label}
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">MAE:</span>
        <span className="font-mono text-purple-300 font-semibold">{d.mae_mw} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">RMSE:</span>
        <span className="font-mono text-gray-300 font-semibold">{d.rmse_mw} MW</span>
      </div>
    </div>
  );
}
