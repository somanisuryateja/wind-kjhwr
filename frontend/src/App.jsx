import { useState } from 'react';
import { Clock, Wind } from 'lucide-react';
import ForecastSection from './ForecastSection';
import AccuracySection from './AccuracySection';
import KeyFinding from './KeyFinding';
import PlanSection from './PlanSection';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function App() {
  const [decisionHour, setDecisionHour] = useState(9);
  const [day, setDay] = useState('2026-01-15');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/30">
              <Wind size={24} aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">UK Wind Forecast Monitor</h1>
              <p className="text-sm text-slate-300">Day-ahead buying support · National wind · Elexon BMRS</p>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm ring-1 ring-white/15">
            <Clock size={18} className="text-sky-300" aria-hidden />
            <span className="whitespace-nowrap text-slate-200">Buy at</span>
            <select
              value={decisionHour}
              onChange={(e) => setDecisionHour(Number(e.target.value))}
              className="rounded-md border-0 bg-white px-2 py-1 font-medium text-slate-900"
              aria-label="Purchase decision time"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span className="text-slate-200">the day before delivery</span>
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <PlanSection day={day} setDay={setDay} decisionHour={decisionHour} />
        <KeyFinding decisionHour={decisionHour} />
        <ForecastSection day={day} decisionHour={decisionHour} />
        <AccuracySection decisionHour={decisionHour} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
        Data: Elexon BMRS FUELHH (actual wind, half-hourly) and WINDFOR (wind forecast, hourly). Purchase decisions made in
        January 2026. Times are UK time (GMT).
      </footer>
    </div>
  );
}
