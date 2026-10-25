import React from 'react';
import { Wind, Activity, Download, Calendar, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ 
  startDate, 
  endDate, 
  onDateChange, 
  onExportCSV, 
  loading, 
  dataSource 
}) {
  const presets = [
    { label: 'Jan 1–8 (Week 1)', start: '2026-01-01', end: '2026-01-08' },
    { label: 'Jan 8–15 (Mid Month)', start: '2026-01-08', end: '2026-01-15' },
    { label: 'Jan 15–23 (High Volatility)', start: '2026-01-15', end: '2026-01-23' },
    { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  ];

  return (
    <header className="border-b border-gray-800 bg-[#0E131F]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Market Identity */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 text-emerald-400">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  UK Day-Ahead Energy Trading Portal
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  EPEX / NordPool UK
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span>National Wind Generation Forecast vs Outturn Accuracy</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {dataSource || 'Elexon BMRS Stream'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Presets & Date Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-gray-900/80 p-1 rounded-lg border border-gray-800 text-xs font-medium">
              {presets.map((preset) => {
                const isActive = startDate === preset.start && endDate === preset.end;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onDateChange(preset.start, preset.end)}
                    className={`px-2.5 py-1.5 rounded-md transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range */}
            <div className="flex items-center space-x-2 bg-gray-900/80 px-2.5 py-1.5 rounded-lg border border-gray-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="bg-transparent text-gray-200 focus:outline-none font-mono text-xs cursor-pointer"
              />
              <span className="text-gray-500">→</span>
              <input
                type="date"
                value={endDate}
                min="2026-01-01"
                max="2026-01-31"
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none font-mono text-xs cursor-pointer"
              />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={onExportCSV}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-xs font-medium text-gray-200 transition-colors shadow-sm disabled:opacity-50"
              title="Export matched settlement intervals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
