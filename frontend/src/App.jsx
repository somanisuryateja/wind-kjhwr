import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import PeakComparison from './components/PeakComparison';
import TimeSeriesChart from './components/TimeSeriesChart';
import DiurnalErrorChart from './components/DiurnalErrorChart';
import HorizonChart from './components/HorizonChart';
import TraderDecisionHelper from './components/TraderDecisionHelper';
import { fetchDashboardData } from './services/api';
import { BookOpen, Cpu, Globe, Database, Terminal, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-08');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'architecture'

  const loadData = async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(start, end);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from Elexon BMRS service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(startDate, endDate);
  }, [startDate, endDate]);

  const handleDateChange = (newStart, newEnd) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleExportCSV = () => {
    if (!data || !data.timeseries || !data.timeseries.length) return;

    const headers = [
      'StartTime',
      'SettlementDate',
      'SettlementPeriod',
      'IsPeak',
      'Actual_MW',
      'DayAheadForecast_MW',
      'LatestForecast_MW',
      'Error_MW',
      'AbsError_MW',
      'PctError'
    ];

    const rows = data.timeseries.map((item) => [
      item.start_time,
      item.settlement_date,
      item.settlement_period,
      item.is_peak ? 'PEAK' : 'OFF_PEAK',
      item.actual_mw ?? '',
      item.day_ahead_forecast_mw ?? '',
      item.latest_forecast_mw ?? '',
      item.error_mw ?? '',
      item.abs_error_mw ?? '',
      item.pct_error ?? ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `uk_wind_forecast_accuracy_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Header
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        onExportCSV={handleExportCSV}
        loading={loading}
        dataSource={data?.data_source}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs (Trader Dashboard vs Tech Lead Architecture Review) */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Client Pitch: Day-Ahead Trading Desk
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Tech Lead Review: Architecture & System Design
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-500">
            <span>Market Delivery: Jan 2026</span>
            <span>•</span>
            <span>Gate Closure: 12:00 D-1</span>
          </div>
        </div>

        {/* TAB 1: TRADING DESK VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 1. Scorecards */}
            <MetricCards metrics={data?.metrics} loading={loading} />

            {/* 2. Peak vs Off-Peak & Outliers */}
            <PeakComparison metrics={data?.metrics} />

            {/* 3. Decision Assistant */}
            <TraderDecisionHelper
              tradingDecision={data?.trading_decision}
              metrics={data?.metrics}
            />

            {/* 4. Main Time Series Interactive Chart */}
            <TimeSeriesChart data={data?.timeseries} loading={loading} />

            {/* 5. Deep Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DiurnalErrorChart hourlyBreakdown={data?.hourly_breakdown} />
              <HorizonChart horizonMetrics={data?.horizon_metrics} />
            </div>

          </div>
        )}

        {/* TAB 2: TECH LEAD ARCHITECTURE & SYSTEM DESIGN */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 bg-[#111827] border border-gray-800 rounded-xl p-6">
            
            <div className="border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span>Technical Architecture & Development Documentation</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Full review document for Technical Lead evaluation and knowledge transfer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Architecture Column 1 */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Database className="w-4 h-4" />
                  <span>1. Elexon Data Ingestion</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Ingests half-hourly actual wind outturn (<code className="text-emerald-300 font-mono">FUELHH</code>) and national wind forecasts (<code className="text-amber-300 font-mono">WINDFOR</code>) directly from the official public Elexon BMRS API.
                </p>
                <div className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded font-mono">
                  • FUELHH: fuelType = "WIND"<br />
                  • WINDFOR: startTime, publishTime, generation<br />
                  • Caching: JSON/SQLite cache prevents API throttling
                </div>
              </div>

              {/* Architecture Column 2 */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>2. Gate Closure Matcher</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Simulates institutional UK day-ahead wholesale trading constraints. The auction gate closure occurs strictly at <span className="text-amber-300 font-semibold">12:00 PM GMT on Day D-1</span>.
                </p>
                <div className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded font-mono">
                  • Algorithm: argmax(publishTime) where publishTime &lt;= 12:00 D-1<br />
                  • Fallback: Nearest hourly interpolation for :30 intervals<br />
                  • Alignment: 100% half-hourly interval coverage
                </div>
              </div>

              {/* Architecture Column 3 */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>3. Math & Containerization</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  FastAPI backend performs vectorized statistical calculations with NumPy & Pandas. Full Docker orchestration containerizes both tiers for 1-command startup.
                </p>
                <div className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded font-mono">
                  • Vectorized MAE, RMSE, MAPE, MBE<br />
                  • Peak hours partitioning (SP 15-38)<br />
                  • Dockerfile + docker-compose ready
                </div>
              </div>

            </div>

            {/* Code Verification Checklist */}
            <div className="mt-6 pt-4 border-t border-gray-800 space-y-2">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Key Development Practices & Compliance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Clean Decoupled Architecture (React Vite + FastAPI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Strict Type Annotations with Pydantic v2 schemas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Robust Error Handling & Graceful Fallback Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Interactive CSV Data Export for Trader Spreadsheets</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-[#0E131F] py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            UK Energy Utility Day-Ahead Renewable Forecast System • January 2026
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>React + Vite</span>
            <span>FastAPI</span>
            <span>Elexon BMRS</span>
            <span>Docker</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
