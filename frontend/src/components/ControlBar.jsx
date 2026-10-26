import React from 'react';
import { Calendar, Download, RefreshCw, Filter, Sparkles, Clock } from 'lucide-react';

export default function ControlBar({
  startDate,
  endDate,
  onDateChange,
  onExportCSV,
  loading,
  totalIntervals = 0,
}) {
  const presets = [
    { label: 'Jan 1–8', subtitle: 'Baseline Week', start: '2026-01-01', end: '2026-01-08' },
    { label: 'Jan 8–15', subtitle: 'Mid-Month', start: '2026-01-08', end: '2026-01-15' },
    { label: 'Jan 15–23', subtitle: 'Storm Isha', start: '2026-01-15', end: '2026-01-23' },
    { label: 'Full Jan 2026', subtitle: 'Full Month', start: '2026-01-01', end: '2026-01-31' },
  ];

  return (
    <section 
      aria-label="Market Horizon and Date Range Controls" 
      className="bg-surface border border-borderSubtle rounded-2xl p-4 sm:p-5 shadow-sm transition-colors"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Section Headline & Direct Visible Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-textPrimary tracking-tight">
                Evaluation Window & Settlement Horizon
              </h2>
            </div>
            <p className="text-xs text-textSecondary mt-1 flex items-center gap-2">
              <span>Gate-Closure Matched (12:00 PM GMT D-1)</span>
              {totalIntervals > 0 && (
                <>
                  <span className="text-textMuted">•</span>
                  <span className="font-mono text-emerald-500 font-medium">
                    {totalIntervals} Settlement Periods
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Direct Visible Date Inputs with Clear Labels */}
          <div className="flex items-center gap-2 bg-subtle p-2 rounded-xl border border-borderSubtle">
            <div className="flex flex-col">
              <label htmlFor="from-date-input" className="text-[10px] font-semibold uppercase tracking-wider text-textMuted px-1">
                From Date
              </label>
              <input
                id="from-date-input"
                type="date"
                value={startDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="bg-surface border border-borderSubtle focus:border-emerald-500 text-textPrimary font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer"
                aria-label="Start Date"
              />
            </div>

            <span className="text-textMuted text-xs font-semibold pt-4">→</span>

            <div className="flex flex-col">
              <label htmlFor="to-date-input" className="text-[10px] font-semibold uppercase tracking-wider text-textMuted px-1">
                To Date
              </label>
              <input
                id="to-date-input"
                type="date"
                value={endDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="bg-surface border border-borderSubtle focus:border-emerald-500 text-textPrimary font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer"
                aria-label="End Date"
              />
            </div>
          </div>
        </div>

        {/* Right: Presets & Action Tools */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-subtle p-1 rounded-xl border border-borderSubtle">
            {presets.map((preset) => {
              const isActive = startDate === preset.start && endDate === preset.end;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onDateChange(preset.start, preset.end)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all font-medium flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-surface text-emerald-500 shadow-sm font-semibold border border-borderSubtle'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-hover'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className={`text-[10px] hidden sm:inline ${isActive ? 'text-emerald-500/80' : 'text-textMuted'}`}>
                    ({preset.subtitle})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export Audit CSV Button */}
          <button
            type="button"
            onClick={onExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-subtle hover:bg-hover border border-borderSubtle text-xs font-semibold text-textPrimary transition-all shadow-sm disabled:opacity-50 hover:border-emerald-500/40"
            title="Download complete evaluated settlement dataset as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

        </div>

      </div>
    </section>
  );
}
