import React, { useState, useEffect, useRef } from 'react';
import { Wind, Download, Calendar, Sun, Moon, Menu, X } from 'lucide-react';

export default function Header({
  startDate,
  endDate,
  onDateChange,
  onExportCSV,
  loading,
  dataSource,
  theme,
  onToggleTheme,
  onThemeChange
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  const presets = [
    { label: 'Jan 1–8 (Week 1)', start: '2026-01-01', end: '2026-01-08' },
    { label: 'Jan 8–15', start: '2026-01-08', end: '2026-01-15' },
    { label: 'Jan 15–23 (Storm Isha)', start: '2026-01-15', end: '2026-01-23' },
    { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  ];

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drawer when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  const handlePresetClick = (start, end) => {
    onDateChange(start, end);
    setMobileOpen(false);
  };

  return (
    <header
      ref={drawerRef}
      className="border-b border-borderSubtle bg-surface/90 backdrop-blur sticky top-0 z-40 transition-colors"
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">

        {/* ═══════ DESKTOP LAYOUT (≥1024px) — Unchanged ═══════ */}
        <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">

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
                    className={`px-2.5 py-1.5 rounded-md transition-all text-xs ${isActive
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
              <span>Export CSV</span>
            </button>

            {/* Institutional Segmented Theme Switcher */}
            <div 
              id="theme-toggle-container"
              className="flex items-center bg-subtle p-0.5 rounded-lg border border-borderSubtle text-xs"
              role="radiogroup"
              aria-label="Theme mode switcher"
            >
              <button
                id="theme-light-btn"
                type="button"
                onClick={() => (onThemeChange ? onThemeChange('light') : onToggleTheme())}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-surface text-amber-600 shadow-sm font-semibold border border-borderSubtle'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-hover'
                }`}
                title="Switch to Crisp Porcelain Light theme"
                aria-checked={theme === 'light'}
                role="radio"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-[11px]">Light</span>
              </button>

              <button
                id="theme-dark-btn"
                type="button"
                onClick={() => (onThemeChange ? onThemeChange('dark') : onToggleTheme())}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-surface text-blue-400 shadow-sm font-semibold border border-borderSubtle'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-hover'
                }`}
                title="Switch to Deep Obsidian Dark theme"
                aria-checked={theme === 'dark'}
                role="radio"
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[11px]">Dark</span>
              </button>
            </div>

            {/* Backwards-compatible single toggle button hidden or alias for automated scripts */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              className="sr-only"
              aria-label="Toggle Theme"
            >
              Toggle
            </button>

          </div>

        </div>

        {/* ═══════ MOBILE LAYOUT (<1024px) — Slim bar + Drawer ═══════ */}
        <div className="lg:hidden">

          {/* Slim Mobile Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                <Wind className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-textPrimary truncate">
                  UK Day-Ahead Trading Cockpit
                </h1>
                <p className="text-[10px] text-textSecondary flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-500 font-mono flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                    {dataSource || 'Elexon BMRS'}
                  </span>
                </p>
              </div>
            </div>

            {/* Hamburger / Close Toggle */}
            <div className="flex items-center gap-2">
              {/* Compact theme toggle always visible on mobile */}
              <button
                type="button"
                onClick={() => (onThemeChange ? onThemeChange(theme === 'dark' ? 'light' : 'dark') : onToggleTheme())}
                className="p-2 rounded-lg bg-subtle border border-borderSubtle text-textSecondary hover:text-textPrimary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg bg-subtle border border-borderSubtle text-textSecondary hover:text-textPrimary transition-colors"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Slide-Down Drawer Panel */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              mobileOpen ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-3 border-t border-borderSubtle space-y-3">

              {/* Quick Presets — 2x2 grid on mobile */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-1.5 px-0.5">
                  Quick Date Ranges
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((preset) => {
                    const isActive = startDate === preset.start && endDate === preset.end;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset.start, preset.end)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-center ${isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-semibold'
                            : 'bg-subtle text-textSecondary hover:text-textPrimary border border-borderSubtle hover:bg-hover'
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Range — Full Width */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-1.5 px-0.5">
                  Custom Range
                </div>
                <div className="flex items-center gap-2 bg-subtle px-3 py-2 rounded-lg border border-borderSubtle">
                  <Calendar className="w-3.5 h-3.5 text-textMuted shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    min="2026-01-01"
                    max="2026-01-31"
                    onChange={(e) => onDateChange(e.target.value, endDate)}
                    className="bg-transparent text-textPrimary focus:outline-none font-mono text-xs cursor-pointer flex-1 min-w-0"
                    aria-label="Start Date"
                  />
                  <span className="text-textMuted text-xs">→</span>
                  <input
                    type="date"
                    value={endDate}
                    min="2026-01-01"
                    max="2026-01-31"
                    onChange={(e) => onDateChange(startDate, e.target.value)}
                    className="bg-transparent text-textPrimary focus:outline-none font-mono text-xs cursor-pointer flex-1 min-w-0"
                    aria-label="End Date"
                  />
                </div>
              </div>

              {/* Export CSV — Full Width */}
              <button
                onClick={() => { onExportCSV(); setMobileOpen(false); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-subtle hover:bg-hover border border-borderSubtle text-xs font-medium text-textPrimary transition-colors disabled:opacity-50"
                title="Export matched settlement intervals to CSV"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Export Settlement Data (CSV)</span>
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Backwards-compatible single toggle button — always available for automated scripts */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={onToggleTheme}
        className="sr-only"
        aria-label="Toggle Theme"
      >
        Toggle
      </button>
    </header>
  );
}
