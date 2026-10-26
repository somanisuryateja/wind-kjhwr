import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Clock, Compass, Activity, Info } from 'lucide-react';

export default function AuditAnalytics({ hourlyBreakdown, horizonMetrics, theme }) {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tickStroke = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4">
        <div>
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-textPrimary flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="hidden sm:inline">Quantitative Accuracy Audit & Lead-Time Decay</span>
            <span className="sm:hidden">Accuracy Audit & Lead-Time</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-textSecondary mt-0.5">
            <span className="hidden sm:inline">Secondary analytical evaluation: Diurnal settlement volatility and lead-time degradation curve.</span>
            <span className="sm:hidden">Diurnal volatility & forecast degradation analysis.</span>
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 self-start sm:self-auto">
          Statistical Audit Tier
        </span>
      </div>

      {/* 2-Column Spacious Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Diurnal Settlement Volatility (SP 1 to 48) */}
        <div className="bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-borderSubtle">
            <div>
              <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Diurnal Cycle: MAE & Bias Across 48 Settlement Periods</span>
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Evaluates diurnal ramp errors from Period 1 (00:00 GMT) to Period 48 (23:30 GMT).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-textSecondary text-[11px]">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                <span>MAE (MW)</span>
              </span>
              <span className="flex items-center gap-1.5 text-textSecondary text-[11px]">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                <span>Bias (MW)</span>
              </span>
            </div>
          </div>

          <div className="h-[200px] sm:h-[280px] w-full mt-3 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyBreakdown || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="time_label"
                  stroke={tickStroke}
                  fontSize={10}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke={tickStroke}
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}M`}
                />
                <ReferenceLine y={0} stroke={isDark ? '#4B5563' : '#CBD5E1'} />
                <Tooltip content={<DiurnalTooltip isDark={isDark} />} />
                <Bar dataKey="mae_mw" name="Mean Absolute Error" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="bias_mw" name="Mean Bias" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Lead-Time Degradation Curve (0-36 Hours) */}
        <div className="bg-surface border border-borderSubtle rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-borderSubtle">
            <div>
              <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-500" />
                <span>Lead-Time Horizon Degradation Curve</span>
              </h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Benchmark error progression from Day-Ahead auction submission (24-36h) to Intraday delivery (0-4h).
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 self-start sm:self-auto">
              Horizon Profile
            </span>
          </div>

          <div className="h-[160px] sm:h-[220px] w-full mt-3 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horizonMetrics || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="horizon_label" stroke={tickStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={tickStroke} fontSize={11} tickLine={false} tickFormatter={(v) => `${v}M`} />
                <Tooltip content={<HorizonTooltip isDark={isDark} />} />
                <Bar dataKey="mae_mw" name="Mean Absolute Error (MW)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Horizon Benchmark Pills */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {(horizonMetrics || []).map((h) => (
              <div key={h.horizon_label} className="bg-subtle/70 p-2 rounded-xl border border-borderSubtle">
                <div className="text-textSecondary text-[10px] truncate">{h.horizon_label}</div>
                <div className="font-mono font-bold text-textPrimary mt-0.5">{h.mae_mw} MW</div>
                <div className="text-[10px] text-purple-500">RMSE {h.rmse_mw} MW</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

function DiurnalTooltip({ active, payload, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className={`rounded-xl p-2.5 shadow-xl text-xs space-y-1 border ${
      isDark ? 'bg-[#0B0F17]/95 border-white/10 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className={`font-semibold pb-1 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        Settlement Period {d.settlement_period} ({d.time_label} GMT)
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">Avg Actual:</span>
        <span className="font-mono text-emerald-500 font-semibold">{d.avg_actual_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">Avg Forecast:</span>
        <span className="font-mono text-amber-500 font-semibold">{d.avg_forecast_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">Mean Absolute Error:</span>
        <span className="font-mono text-blue-500 font-semibold">{d.mae_mw?.toLocaleString()} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">Bias:</span>
        <span className="font-mono text-amber-500 font-semibold">{d.bias_mw > 0 ? `+${d.bias_mw}` : d.bias_mw} MW</span>
      </div>
    </div>
  );
}

function HorizonTooltip({ active, payload, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className={`rounded-xl p-2.5 shadow-xl text-xs space-y-1 border ${
      isDark ? 'bg-[#0B0F17]/95 border-white/10 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className={`font-semibold pb-1 font-mono border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        {d.horizon_label}
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">MAE:</span>
        <span className="font-mono text-purple-500 font-bold">{d.mae_mw} MW</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-textSecondary">RMSE:</span>
        <span className="font-mono text-textPrimary font-bold">{d.rmse_mw} MW</span>
      </div>
    </div>
  );
}
