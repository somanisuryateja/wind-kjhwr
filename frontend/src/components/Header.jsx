import React from 'react';
import { Wind, Sun, Moon, ShieldCheck, Activity } from 'lucide-react';

export default function Header({
  dataSource,
  theme,
  onToggleTheme,
  onThemeChange
}) {
  return (
    <header className="border-b border-borderSubtle bg-surface/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand & Market Context */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-textPrimary truncate">
                UK Day-Ahead Energy Trading Cockpit
              </h1>
              <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-mono border border-blue-500/20">
                EPEX / NordPool UK
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-textSecondary flex items-center gap-2 mt-0.5 truncate">
              <span className="hidden sm:inline">National Wind Generation Outturn vs Gate-Closure Forecast</span>
              <span className="text-textMuted hidden sm:inline">•</span>
              <span className="text-emerald-500 font-mono text-[11px] flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {dataSource || 'Elexon BMRS Live Stream'}
              </span>
            </p>
          </div>
        </div>

        {/* Right Utility: Institutional Theme Switcher & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* Live Stream Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-subtle border border-borderSubtle text-[11px] text-textSecondary">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono">Half-Hourly (30m SP)</span>
          </div>

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
              <span className="font-mono text-[11px] hidden sm:inline">Light</span>
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
              <span className="font-mono text-[11px] hidden sm:inline">Dark</span>
            </button>
          </div>

          {/* Backwards-compatible single toggle button for automated test scripts */}
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
    </header>
  );
}
