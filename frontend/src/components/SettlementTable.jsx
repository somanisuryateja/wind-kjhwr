import React, { useState, useMemo } from 'react';
import { Table, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function SettlementTable({ timeseries, theme }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('ALL'); // 'ALL' | 'PEAK' | 'OFF_PEAK'
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter & Search
  const filteredData = useMemo(() => {
    if (!timeseries) return [];

    return timeseries.filter((item) => {
      // Regime filter
      if (regimeFilter === 'PEAK' && !item.is_peak) return false;
      if (regimeFilter === 'OFF_PEAK' && item.is_peak) return false;

      // Search term (matches date, start_time, or settlement period)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDate = item.settlement_date?.toLowerCase().includes(query);
        const matchesTime = item.start_time?.toLowerCase().includes(query);
        const matchesSP = `sp ${item.settlement_period}`.includes(query) || `${item.settlement_period}` === query;
        return matchesDate || matchesTime || matchesSP;
      }

      return true;
    });
  }, [timeseries, searchTerm, regimeFilter]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) valA = -Infinity;
      if (valB === null || valB === undefined) valB = -Infinity;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  if (!timeseries || timeseries.length === 0) return null;

  return (
    <div className="bg-surface border border-borderSubtle rounded-2xl shadow-sm overflow-hidden transition-colors">
      
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-borderSubtle">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-500" />
                <span>Settlement Period Audit Ledger</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-textSecondary border border-borderSubtle">
                {filteredData.length} Intervals
              </span>
            </div>
            <p className="text-xs text-textSecondary mt-0.5 hidden sm:block">
              Half-hourly granular ledger comparing actual generation against gate-closure forecasts.
            </p>
          </div>

          {/* Search & Regime Filter */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Regime Switcher */}
            <div className="flex items-center bg-subtle p-0.5 rounded-lg border border-borderSubtle text-xs">
              <button
                onClick={() => { setRegimeFilter('ALL'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  regimeFilter === 'ALL'
                    ? 'bg-surface text-textPrimary shadow-sm font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                All Periods
              </button>
              <button
                onClick={() => { setRegimeFilter('PEAK'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  regimeFilter === 'PEAK'
                    ? 'bg-surface text-amber-500 shadow-sm font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Peak Only
              </button>
              <button
                onClick={() => { setRegimeFilter('OFF_PEAK'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  regimeFilter === 'OFF_PEAK'
                    ? 'bg-surface text-blue-500 shadow-sm font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Off-Peak
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date or SP..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-subtle border border-borderSubtle focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-colors w-40 sm:w-48"
              />
            </div>

          </div>
        </div>
      </div>

      {/* ═══ DESKTOP: Standard Table Layout (lg+) ═══ */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-subtle/60 text-textSecondary border-b border-borderSubtle text-[11px] font-semibold uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('start_time')}
                className="py-3 px-4 cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center gap-1">
                  <span>Target Time (GMT)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('settlement_period')}
                className="py-3 px-4 cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center gap-1">
                  <span>Period</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Market Regime</th>
              <th
                onClick={() => handleSort('actual_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Actual Outturn</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('day_ahead_forecast_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Day-Ahead (12:00 D-1)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('error_mw')}
                className="py-3 px-4 text-right cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Deviation (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('pct_error')}
                className="py-3 px-4 text-right cursor-pointer hover:text-textPrimary"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Error %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-borderSubtle/60 font-mono">
            {paginatedData.map((row, idx) => {
              const isOver = row.error_mw > 0;
              const formattedTime = row.start_time.replace('T', ' ').replace(':00Z', '');

              return (
                <tr
                  key={`${row.start_time}-${row.settlement_period}`}
                  className="hover:bg-hover/40 transition-colors"
                >
                  <td className="py-2.5 px-4 text-textPrimary">
                    {formattedTime}
                  </td>
                  <td className="py-2.5 px-4 text-textSecondary font-sans">
                    SP {row.settlement_period}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      row.is_peak
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-slate-500/10 text-textMuted border border-borderSubtle'
                    }`}>
                      {row.is_peak ? 'Peak (07:00–19:00)' : 'Off-Peak'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-500">
                    {row.actual_mw ? `${row.actual_mw.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-500">
                    {row.day_ahead_forecast_mw ? `${row.day_ahead_forecast_mw.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {row.error_mw !== null ? (
                      <span className={`font-bold ${isOver ? 'text-amber-500' : 'text-blue-500'}`}>
                        {isOver ? `+${row.error_mw.toLocaleString()}` : row.error_mw.toLocaleString()} MW
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right text-textSecondary">
                    {row.pct_error !== null ? `${row.pct_error.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ MOBILE: Card-Based View (<lg) ═══ */}
      <div className="lg:hidden divide-y divide-borderSubtle/60">
        {paginatedData.map((row) => {
          const isOver = row.error_mw > 0;
          const formattedTime = row.start_time.replace('T', ' ').replace(':00Z', '');

          return (
            <div
              key={`mobile-${row.start_time}-${row.settlement_period}`}
              className="px-4 py-3 hover:bg-hover/30 transition-colors"
            >
              {/* Row 1: Date/Time + Period + Regime Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-textPrimary font-semibold truncate">
                    {formattedTime}
                  </span>
                  <span className="text-xs text-textSecondary shrink-0">
                    SP {row.settlement_period}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  row.is_peak
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-slate-500/10 text-textMuted border border-borderSubtle'
                }`}>
                  {row.is_peak ? 'Peak' : 'Off-Peak'}
                </span>
              </div>

              {/* Row 2: Actual vs Forecast — side by side */}
              <div className="grid grid-cols-2 gap-3 mb-1.5">
                <div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider mb-0.5">Actual</div>
                  <div className="text-sm font-bold font-mono text-emerald-500">
                    {row.actual_mw ? `${row.actual_mw.toLocaleString()} MW` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider mb-0.5">Forecast (D-1)</div>
                  <div className="text-sm font-bold font-mono text-amber-500">
                    {row.day_ahead_forecast_mw ? `${row.day_ahead_forecast_mw.toLocaleString()} MW` : '—'}
                  </div>
                </div>
              </div>

              {/* Row 3: Deviation + Error % */}
              <div className="flex items-center justify-between bg-subtle/50 rounded-lg px-2.5 py-1.5 -mx-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-textMuted">Deviation:</span>
                  {row.error_mw !== null ? (
                    <span className={`text-xs font-bold font-mono ${isOver ? 'text-amber-500' : 'text-blue-500'}`}>
                      {isOver ? `+${row.error_mw.toLocaleString()}` : row.error_mw.toLocaleString()} MW
                    </span>
                  ) : <span className="text-xs text-textMuted">—</span>}
                </div>
                <span className="text-xs font-mono text-textSecondary">
                  {row.pct_error !== null ? `${row.pct_error.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-borderSubtle flex items-center justify-between text-xs text-textSecondary font-sans">
        <div>
          <span className="hidden sm:inline">Showing </span>
          <span className="font-mono text-textPrimary font-semibold">{(currentPage - 1) * pageSize + 1}</span>
          <span className="hidden sm:inline"> to</span>
          <span className="sm:hidden">–</span>
          {' '}
          <span className="font-mono text-textPrimary font-semibold">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </span>{' '}
          <span className="hidden sm:inline">of </span>
          <span className="sm:hidden">/ </span>
          <span className="font-mono text-textPrimary font-semibold">{filteredData.length}</span>
          <span className="hidden sm:inline"> intervals</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-borderSubtle hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-textPrimary" />
          </button>
          <span className="font-mono text-textPrimary text-xs px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-borderSubtle hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-textPrimary" />
          </button>
        </div>
      </div>

    </div>
  );
}
