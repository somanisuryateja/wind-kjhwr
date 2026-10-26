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
  Tooltip
} from 'recharts';
import { BarChart2, Eye } from 'lucide-react';
import MetricRibbon from './MetricRibbon';

export default function TimeSeriesChart({ data, metrics, loading, theme }) {
  const [showActual, setShowActual] = useState(true);
  const [showDayAhead, setShowDayAhead] = useState(true);
  const [showLatest, setShowLatest] = useState(true);
  const [showErrorBar, setShowErrorBar] = useState(false);

  if (loading) {
    return (
      <div className="bg-surface border border-borderSubtle rounded-2xl h-[360px] sm:h-[560px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-textSecondary font-mono">Loading settlement interval time series from Elexon BMRS...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-borderSubtle rounded-2xl h-[360px] sm:h-[560px] flex items-center justify-center text-textMuted text-sm">
        No settlement intervals found for selected date window.
      </div>
    );
  }

  // Format records for chart
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

  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tickStroke = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="bg-surface border border-borderSubtle rounded-2xl shadow-sm overflow-hidden transition-colors">
      
      {/* 1. Integrated Metric Ribbon at top of Hero Container */}
      <MetricRibbon metrics={metrics} loading={loading} />

      {/* 2. Chart Header & Controls */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-borderSubtle/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-textPrimary tracking-tight truncate">
              <span className="hidden sm:inline">National Wind Power Generation: Actual Outturn vs Day-Ahead Forecast</span>
              <span className="sm:hidden">Wind Generation vs Forecast</span>
            </h2>
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              30-Min Resolution
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-textSecondary mt-0.5 truncate">
            <span className="hidden sm:inline">Forecast matched against official 12:00 PM GMT D-1 Gate Closure. Intraday line captures weather updates.</span>
            <span className="sm:hidden">12:00 PM D-1 Gate Closure • 30-min intervals</span>
          </p>
        </div>

        {/* Series Toggles */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border transition-all text-xs ${
              showActual
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold'
                : 'bg-subtle text-textMuted border-borderSubtle'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="hidden sm:inline">Actual Outturn</span>
            <span className="sm:hidden">Actual</span>
          </button>

          <button
            onClick={() => setShowDayAhead(!showDayAhead)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border transition-all text-xs ${
              showDayAhead
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold'
                : 'bg-subtle text-textMuted border-borderSubtle'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span className="hidden sm:inline">Day-Ahead (12:00 D-1)</span>
            <span className="sm:hidden">D-1</span>
          </button>

          <button
            onClick={() => setShowLatest(!showLatest)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border transition-all text-xs ${
              showLatest
                ? 'bg-purple-500/10 text-purple-500 border-purple-500/30 font-semibold'
                : 'bg-subtle text-textMuted border-borderSubtle'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <span className="hidden sm:inline">Intraday Latest</span>
            <span className="sm:hidden">Latest</span>
          </button>

          <button
            onClick={() => setShowErrorBar(!showErrorBar)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border transition-all text-xs ${
              showErrorBar
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold'
                : 'bg-subtle text-textMuted border-borderSubtle'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Residual Error</span>
            <span className="sm:hidden">Error</span>
          </button>
        </div>
      </div>

      {/* 3. Hero Visualizer Canvas */}
      <div className="h-[280px] sm:h-[460px] md:h-[480px] w-full px-1 sm:px-4 py-3 sm:py-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={isDark ? 0.28 : 0.20} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

            <XAxis
              dataKey="label"
              stroke={tickStroke}
              fontSize={11}
              tickLine={false}
              interval={Math.max(1, Math.floor(formattedData.length / 8))}
            />

            <YAxis
              stroke={tickStroke}
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
            />

            <Tooltip content={<CustomChartTooltip isDark={isDark} />} />

            {/* Actual Outturn Area */}
            {showActual && (
              <Area
                type="monotone"
                dataKey="actual_mw"
                name="Actual Generation"
                stroke="#10B981"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#actualGradient)"
                dot={false}
                isAnimationActive={formattedData.length < 500}
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
                isAnimationActive={formattedData.length < 500}
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
                isAnimationActive={formattedData.length < 500}
              />
            )}

            {/* Residual Error Bar */}
            {showErrorBar && (
              <Bar
                dataKey="error_mw"
                name="Error (Forecast - Actual)"
                fill="#3B82F6"
                opacity={0.5}
                isAnimationActive={formattedData.length < 500}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

function CustomChartTooltip({ active, payload, isDark }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const error = data.error_mw;
  const isOver = error > 0;

  return (
    <div className={`rounded-xl p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[210px] border ${
      isDark 
        ? 'bg-[#0B0F17]/95 border-white/10 text-slate-200' 
        : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className={`font-semibold pb-1.5 flex justify-between items-center border-b ${
        isDark ? 'border-white/10' : 'border-slate-100'
      }`}>
        <span>{data.settlement_date} • SP {data.settlement_period}</span>
        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
          data.is_peak ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
        }`}>
          {data.is_peak ? 'Peak Period' : 'Off-Peak'}
        </span>
      </div>

      <div className="flex justify-between items-center pt-0.5">
        <span className="text-textSecondary">Actual Outturn:</span>
        <span className="font-mono font-bold text-emerald-500">
          {data.actual_mw ? `${data.actual_mw.toLocaleString()} MW` : 'N/A'}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-textSecondary">Day-Ahead (12:00 D-1):</span>
        <span className="font-mono font-bold text-amber-500">
          {data.day_ahead_forecast_mw ? `${data.day_ahead_forecast_mw.toLocaleString()} MW` : 'N/A'}
        </span>
      </div>

      {data.latest_forecast_mw && (
        <div className="flex justify-between items-center">
          <span className="text-textSecondary">Intraday Latest:</span>
          <span className="font-mono font-bold text-purple-500">
            {data.latest_forecast_mw.toLocaleString()} MW
          </span>
        </div>
      )}

      {error !== null && (
        <div className={`pt-1.5 border-t flex justify-between items-center ${
          isDark ? 'border-white/10' : 'border-slate-100'
        }`}>
          <span className="text-textSecondary">Deviation:</span>
          <span className={`font-mono font-bold ${isOver ? 'text-amber-500' : 'text-blue-500'}`}>
            {isOver ? `+${error.toLocaleString()} MW (Over)` : `${error.toLocaleString()} MW (Under)`}
          </span>
        </div>
      )}

      {data.day_ahead_publish_time && (
        <div className="text-[10px] text-textMuted pt-0.5 font-mono">
          Pub: {data.day_ahead_publish_time.replace('T', ' ').replace('Z', '')}
        </div>
      )}
    </div>
  );
}
