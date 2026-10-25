import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Eye, EyeOff, Layers, BarChart2 } from 'lucide-react';

export default function TimeSeriesChart({ data, loading }) {
  const [showActual, setShowActual] = useState(true);
  const [showDayAhead, setShowDayAhead] = useState(true);
  const [showLatest, setShowLatest] = useState(true);
  const [showErrorBar, setShowErrorBar] = useState(false);

  if (loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 h-[440px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-mono">Loading high-resolution settlement time series...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 h-[440px] flex items-center justify-center text-gray-500 text-sm">
        No settlement intervals found for selected date window.
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((d) => {
    const timeParts = d.start_time.split('T');
    const dateStr = timeParts[0].slice(5); // MM-DD
    const timeStr = timeParts[1] ? timeParts[1].slice(0, 5) : `SP${d.settlement_period}`;
    return {
      ...d,
      label: `${dateStr} ${timeStr}`,
      displayTime: `${dateStr} SP${d.settlement_period}`,
    };
  });

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>National Wind Generation: Actual vs Day-Ahead Forecast</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Half-hourly resolution (30-min settlement intervals). Forecast matched against 12:00 GMT D-1 Gate Closure.
          </p>
        </div>

        {/* Series Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showActual
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Actual Outturn</span>
          </button>

          <button
            onClick={() => setShowDayAhead(!showDayAhead)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showDayAhead
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Day-Ahead (12:00 D-1)</span>
          </button>

          <button
            onClick={() => setShowLatest(!showLatest)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showLatest
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Intraday Latest</span>
          </button>

          <button
            onClick={() => setShowErrorBar(!showErrorBar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showErrorBar
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Residual Error</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[380px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />

            <XAxis
              dataKey="label"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              interval={Math.floor(formattedData.length / 8)}
            />

            <YAxis
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Actual Outturn Area */}
            {showActual && (
              <Area
                type="monotone"
                dataKey="actual_mw"
                name="Actual Generation"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualGradient)"
                dot={false}
              />
            )}

            {/* Day-Ahead Forecast Line */}
            {showDayAhead && (
              <Line
                type="monotone"
                dataKey="day_ahead_forecast_mw"
                name="Day-Ahead Forecast"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}

            {/* Latest Intraday Forecast Line */}
            {showLatest && (
              <Line
                type="monotone"
                dataKey="latest_forecast_mw"
                name="Intraday Latest"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}

            {/* Residual Error Bar */}
            {showErrorBar && (
              <Bar
                dataKey="error_mw"
                name="Error (Forecast - Actual)"
                fill="#3B82F6"
                opacity={0.6}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const error = data.error_mw;
  const isOver = error > 0;

  return (
    <div className="bg-[#0B0F17]/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[200px]">
      <div className="font-semibold text-gray-200 border-b border-gray-800 pb-1 flex justify-between items-center">
        <span>{data.settlement_date} SP {data.settlement_period}</span>
        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
          data.is_peak ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'
        }`}>
          {data.is_peak ? 'Peak Period' : 'Off-Peak'}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Actual Outturn:</span>
        <span className="font-mono font-semibold text-emerald-400">
          {data.actual_mw ? `${data.actual_mw.toLocaleString()} MW` : 'N/A'}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Day-Ahead (12:00 D-1):</span>
        <span className="font-mono font-semibold text-amber-400">
          {data.day_ahead_forecast_mw ? `${data.day_ahead_forecast_mw.toLocaleString()} MW` : 'N/A'}
        </span>
      </div>

      {data.latest_forecast_mw && (
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Intraday Latest:</span>
          <span className="font-mono font-semibold text-purple-400">
            {data.latest_forecast_mw.toLocaleString()} MW
          </span>
        </div>
      )}

      {error !== null && (
        <div className="pt-1 border-t border-gray-800/80 flex justify-between items-center">
          <span className="text-gray-400">Forecast Error:</span>
          <span className={`font-mono font-bold ${isOver ? 'text-amber-400' : 'text-blue-400'}`}>
            {isOver ? `+${error.toLocaleString()} MW (Over)` : `${error.toLocaleString()} MW (Under)`}
          </span>
        </div>
      )}

      {data.day_ahead_publish_time && (
        <div className="text-[10px] text-gray-500 pt-0.5 font-mono">
          Pub: {data.day_ahead_publish_time.replace('T', ' ').replace('Z', '')}
        </div>
      )}
    </div>
  );
}
