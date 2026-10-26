import React, { useState, useMemo } from 'react';
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
import { BarChart2, Eye, TrendingUp, Sliders, Layers } from 'lucide-react';

export default function TimeSeriesChart({ data, loading, theme }) {
  const [showActual, setShowActual] = useState(true);
  const [showDayAhead, setShowDayAhead] = useState(true);
  const [showLatest, setShowLatest] = useState(false);
  const [showErrorBar, setShowErrorBar] = useState(false);
  const [resolution, setResolution] = useState('30m'); // '30m' | '2h' | 'daily'
  const [hoveredRecord, setHoveredRecord] = useState(null);

  // Compute processed data based on resolution
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (resolution === '30m') {
      return data.map((d) => {
        const timeParts = d.start_time.split('T');
        const dateStr = timeParts[0].slice(5); // MM-DD
        const timeStr = timeParts[1] ? timeParts[1].slice(0, 5) : `SP${d.settlement_period}`;
        return {
          ...d,
          label: `${dateStr} ${timeStr}`,
          displayDate: timeParts[0],
          displayTime: timeStr,
          sp: d.settlement_period,
        };
      });
    }

    if (resolution === '2h') {
      // Aggregate into 2-hour blocks (4 settlement periods each)
      const blocks = [];
      const blockSize = 4;
      for (let i = 0; i < data.length; i += blockSize) {
        const chunk = data.slice(i, i + blockSize);
        if (chunk.length === 0) continue;

        const avgActual = Math.round(
          chunk.reduce((sum, item) => sum + (item.actual_mw || 0), 0) / chunk.length
        );
        const avgForecast = Math.round(
          chunk.reduce((sum, item) => sum + (item.day_ahead_forecast_mw || 0), 0) / chunk.length
        );
        const avgError = Math.round(avgForecast - avgActual);
        const timeParts = chunk[0].start_time.split('T');
        const dateStr = timeParts[0].slice(5);
        const timeStr = timeParts[1] ? timeParts[1].slice(0, 5) : '';

        blocks.push({
          start_time: chunk[0].start_time,
          label: `${dateStr} ${timeStr}`,
          displayDate: timeParts[0],
          displayTime: `${timeStr} (2h avg)`,
          sp: `${chunk[0].settlement_period}–${chunk[chunk.length - 1].settlement_period}`,
          actual_mw: avgActual,
          day_ahead_forecast_mw: avgForecast,
          error_mw: avgError,
          pct_error: avgActual > 0 ? (Math.abs(avgError) / avgActual) * 100 : 0,
        });
      }
      return blocks;
    }

    if (resolution === 'daily') {
      // Aggregate into daily averages
      const dailyMap = {};
      data.forEach((d) => {
        const date = d.start_time.split('T')[0];
        if (!dailyMap[date]) dailyMap[date] = [];
        dailyMap[date].push(d);
      });

      return Object.keys(dailyMap).sort().map((date) => {
        const chunk = dailyMap[date];
        const avgActual = Math.round(
          chunk.reduce((sum, item) => sum + (item.actual_mw || 0), 0) / chunk.length
        );
        const avgForecast = Math.round(
          chunk.reduce((sum, item) => sum + (item.day_ahead_forecast_mw || 0), 0) / chunk.length
        );
        const avgError = Math.round(avgForecast - avgActual);

        return {
          start_time: `${date}T00:00:00Z`,
          label: date.slice(5),
          displayDate: date,
          displayTime: 'Full Day Avg',
          sp: 'All SPs',
          actual_mw: avgActual,
          day_ahead_forecast_mw: avgForecast,
          error_mw: avgError,
          pct_error: avgActual > 0 ? (Math.abs(avgError) / avgActual) * 100 : 0,
        };
      });
    }

    return [];
  }, [data, resolution]);

  if (loading) {
    return (
      <div className="bg-surface border border-borderSubtle rounded-2xl h-[380px] sm:h-[520px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-textSecondary font-mono">Loading settlement interval time series from Elexon BMRS...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-borderSubtle rounded-2xl h-[380px] sm:h-[520px] flex items-center justify-center text-textMuted text-sm">
        No settlement intervals found for selected date window.
      </div>
    );
  }

  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tickStroke = isDark ? '#64748B' : '#94A3B8';

  // Default readout when not hovering
  const activeDisplay = hoveredRecord || (chartData.length > 0 ? chartData[chartData.length - 1] : null);

  return (
    <div className="bg-surface border border-borderSubtle rounded-2xl shadow-sm overflow-hidden transition-colors">
      
      {/* 1. Header Bar: Title, Granularity Switcher, Series Toggles */}
      <div className="p-4 sm:p-5 border-b border-borderSubtle space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-textPrimary tracking-tight flex items-center gap-2">
              <span>National Wind Power Generation vs Gate-Closure Forecast</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Matched against 12:00 PM GMT D-1 Auction Gate Closure constraint.
            </p>
          </div>

          {/* Granularity Switcher (Essential for Clean Mobile Viewing) */}
          <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-borderSubtle text-xs self-start sm:self-auto">
            <span className="text-[10px] uppercase font-semibold text-textMuted px-2 hidden sm:inline">
              Resolution:
            </span>
            <button
              type="button"
              onClick={() => setResolution('30m')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                resolution === '30m'
                  ? 'bg-surface text-emerald-500 shadow-sm font-semibold border border-borderSubtle'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              30m SP
            </button>
            <button
              type="button"
              onClick={() => setResolution('2h')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                resolution === '2h'
                  ? 'bg-surface text-emerald-500 shadow-sm font-semibold border border-borderSubtle'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
              title="Smoothed 2-Hour blocks — clean and easy to read on mobile"
            >
              2h Smoothed
            </button>
            <button
              type="button"
              onClick={() => setResolution('daily')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                resolution === 'daily'
                  ? 'bg-surface text-emerald-500 shadow-sm font-semibold border border-borderSubtle'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
              title="Daily aggregations for macro trend analysis"
            >
              Daily
            </button>
          </div>
        </div>

        {/* Series Toggles & Readout Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-borderSubtle/60 text-xs">
          
          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowActual(!showActual)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                showActual
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold'
                  : 'bg-subtle text-textMuted border-borderSubtle'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Actual Outturn</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDayAhead(!showDayAhead)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                showDayAhead
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold'
                  : 'bg-subtle text-textMuted border-borderSubtle'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Day-Ahead (12:00 D-1)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowErrorBar(!showErrorBar)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                showErrorBar
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold'
                  : 'bg-subtle text-textMuted border-borderSubtle'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Residual Error</span>
            </button>
          </div>

          {/* Active Hover / Scrub Readout Pill (TradingView / Bloomberg Style) */}
          {activeDisplay && (
            <div className="flex items-center gap-3 font-mono text-[11px] bg-subtle px-3 py-1 rounded-lg border border-borderSubtle text-textSecondary overflow-x-auto">
              <span className="font-semibold text-textPrimary">
                {activeDisplay.displayDate} {activeDisplay.displayTime}
              </span>
              <span className="text-emerald-500 font-bold">
                Act: {activeDisplay.actual_mw?.toLocaleString()} MW
              </span>
              <span className="text-amber-500 font-bold">
                Fcast: {activeDisplay.day_ahead_forecast_mw?.toLocaleString()} MW
              </span>
              <span className={activeDisplay.error_mw > 0 ? 'text-amber-500 font-bold' : 'text-blue-500 font-bold'}>
                Var: {activeDisplay.error_mw > 0 ? `+${activeDisplay.error_mw?.toLocaleString()}` : activeDisplay.error_mw?.toLocaleString()} MW
              </span>
            </div>
          )}

        </div>

      </div>

      {/* 2. Chart Canvas */}
      <div className="h-[280px] sm:h-[420px] md:h-[460px] w-full px-2 sm:px-5 py-3 sm:py-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setHoveredRecord(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredRecord(null)}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={isDark ? 0.25 : 0.18} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

            <XAxis
              dataKey="label"
              stroke={tickStroke}
              fontSize={11}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 6))}
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
                isAnimationActive={chartData.length < 500}
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
                isAnimationActive={chartData.length < 500}
              />
            )}

            {/* Residual Error Bar */}
            {showErrorBar && (
              <Bar
                dataKey="error_mw"
                name="Residual Error (Forecast - Actual)"
                fill="#3B82F6"
                opacity={0.4}
                isAnimationActive={chartData.length < 500}
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
      <div className="font-mono font-semibold text-textPrimary border-b border-borderSubtle pb-1 flex justify-between items-center">
        <span>{data.displayDate}</span>
        <span className="text-[10px] text-textMuted">{data.displayTime}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-textSecondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Actual:
          </span>
          <span className="font-mono font-bold text-emerald-500">
            {data.actual_mw ? `${data.actual_mw.toLocaleString()} MW` : '—'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-textSecondary">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Day-Ahead (D-1):
          </span>
          <span className="font-mono font-bold text-amber-500">
            {data.day_ahead_forecast_mw ? `${data.day_ahead_forecast_mw.toLocaleString()} MW` : '—'}
          </span>
        </div>

        {error !== null && error !== undefined && (
          <div className="flex justify-between items-center pt-1 border-t border-borderSubtle/60">
            <span className="text-textSecondary">Variance:</span>
            <span className={`font-mono font-bold ${isOver ? 'text-amber-500' : 'text-blue-500'}`}>
              {isOver ? `+${error.toLocaleString()}` : error.toLocaleString()} MW ({data.pct_error?.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
