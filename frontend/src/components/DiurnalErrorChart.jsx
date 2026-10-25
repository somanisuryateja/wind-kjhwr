import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Clock, Info } from 'lucide-react';

export default function DiurnalErrorChart({ hourlyBreakdown }) {
  if (!hourlyBreakdown || hourlyBreakdown.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Diurnal Volatility Cycle: MAE & Bias Across 48 Settlement Periods</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Evaluates intraday forecast uncertainty from Period 1 (00:00) to Period 48 (23:30).
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
            <span>MAE (MW)</span>
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Mean Bias (MW)</span>
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="time_label"
              stroke="#6B7280"
              fontSize={10}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${v}M`}
            />
            <ReferenceLine y={0} stroke="#4B5563" />
            <Tooltip content={<DiurnalTooltip />} />
            <Bar dataKey="mae_mw" name="Mean Absolute Error" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bias_mw" name="Mean Bias" fill="#F59E0B" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DiurnalTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-[#0B0F17]/95 border border-gray-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-gray-200 border-b border-gray-800 pb-1">
        Settlement Period {d.settlement_period} ({d.time_label} GMT)
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Avg Actual:</span>
        <span className="font-mono text-emerald-400 font-medium">{d.avg_actual_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Avg Forecast:</span>
        <span className="font-mono text-amber-400 font-medium">{d.avg_forecast_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Mean Abs Error:</span>
        <span className="font-mono text-blue-400 font-medium">{d.mae_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Bias:</span>
        <span className="font-mono text-amber-300 font-medium">{d.bias_mw > 0 ? `+${d.bias_mw}` : d.bias_mw} MW</span>
      </div>
    </div>
  );
}
