import React from 'react';
import { Wind, Download, Calendar, Sun, Moon } from 'lucide-react';

export default function Header({ 
  startDate, 
  endDate, 
  onDateChange, 
  onExportCSV, 
  loading, 
  dataSource,
  theme,
  onToggleTheme
}) {
  const presets = [
    { label: 'Jan 1–8 (Week 1)', start: '2026-01-01', end: '2026-01-08' },
    { label: 'Jan 8–15', start: '2026-01-08', end: '2026-01-15' },
    { label: 'Jan 15–23 (Storm Isha)', start: '2026-01-15', end: '2026-01-23' },
    { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  ];

  return (
    <header className="border-b border-borderSubtle bg-surface/90 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Market Context */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-textPrimary flex items-center gap-2">
                  UK Day-Ahead Energy Trading Cockpit
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-mono border border-blue-500/20">
                  EPEX / NordPool UK
                </span>
              </div>
              <p className="text-xs text-textSecondary flex items-center gap-2 mt-0.5">
                <span>National Wind Generation Outturn vs Gate-Closure Forecast</span>
                <span className="text-textMuted">•</span>
                <span className="text-emerald-500 font-mono text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {dataSource || 'Elexon BMRS Stream'}
                </span>
              </p>
            </div>
          </div>

          {/* Controls: Presets, Dates, CSV Export, Theme Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Quick Presets */}
            <div className="flex items-center bg-subtle p-0.5 rounded-lg border border-borderSubtle text-xs font-medium">
              {presets.map((preset) => {
                const isActive = startDate === preset.start && endDate === preset.end;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onDateChange(preset.start, preset.end)}
                    className={`px-2.5 py-1.5 rounded-md transition-all text-xs ${
                      isActive
                        ? 'bg-surface text-emerald-500 shadow-sm font-semibold border border-borderSubtle'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-hover'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Picker */}
            <div className="flex items-center space-x-1.5 bg-subtle px-2.5 py-1.5 rounded-lg border border-borderSubtle text-xs">
              <Calendar className="w-3.5 h-3.5 text-textMuted" />
              <input
                type="date"
                value={startDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="bg-transparent text-textPrimary focus:outline-none font-mono text-xs cursor-pointer"
                aria-label="Start Date"
              />
              <span className="text-textMuted">→</span>
              <input
                type="date"
                value={endDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="bg-transparent text-textPrimary focus:outline-none font-mono text-xs cursor-pointer"
                aria-label="End Date"
              />
            </div>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-hover border border-borderSubtle text-xs font-medium text-textPrimary transition-colors shadow-sm disabled:opacity-50"
              title="Export matched settlement intervals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-subtle hover:bg-hover border border-borderSubtle text-textSecondary hover:text-textPrimary transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Porcelain Light' : 'Obsidian Dark'} Theme`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
