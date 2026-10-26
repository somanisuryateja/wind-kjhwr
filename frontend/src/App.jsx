import { useState } from 'react';
import ForecastSection from './ForecastSection';
import AccuracySection from './AccuracySection';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function App() {
  const [decisionHour, setDecisionHour] = useState(9);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">UK Wind Forecast Monitor</h1>
            <p className="mt-1 text-sm text-slate-500">
              National wind generation from Elexon BMRS, for day-ahead purchases made in January 2026
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Purchase decision at
            <select
              value={decisionHour}
              onChange={(e) => setDecisionHour(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            the day before delivery
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <ForecastSection decisionHour={decisionHour} />
        <AccuracySection decisionHour={decisionHour} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
        Data: Elexon BMRS FUELHH (actual wind, half-hourly) and WINDFOR (wind forecast, hourly). Times are UK time (GMT).
      </footer>
    </div>
  );
}
