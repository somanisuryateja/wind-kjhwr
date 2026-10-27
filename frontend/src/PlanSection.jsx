import { useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, ShoppingCart, TriangleAlert, Wind } from 'lucide-react';
import { Status } from './ui';
import { FIRST_DAY, LAST_DAY, dayLabel, gwh, hhmm, mw, shiftDay, useApi, useDebounced } from './lib';

const CONFIDENCE = [
  { value: 50, label: '50%', hint: 'Typical' },
  { value: 80, label: '80%', hint: 'Careful' },
  { value: 90, label: '90%', hint: 'Safe' },
];
const MAX_DEMAND = 100_000;
const axis = { tick: { fontSize: 12, fill: '#64748b' }, tickLine: false };

export default function PlanSection({ day, setDay, decisionHour }) {
  const [confidence, setConfidence] = useState(90);
  const [demandText, setDemandText] = useState('30000');
  const demand = useDebounced(demandText);
  const demandMw = Number(demand);
  const demandOk = demand.trim() !== '' && Number.isFinite(demandMw) && demandMw >= 0 && demandMw <= MAX_DEMAND;

  const { data, loading, error } = useApi(
    demandOk ? `/plan?date=${day}&decision_hour=${decisionHour}&confidence=${confidence}&demand_mw=${demandMw}` : null,
  );
  const t = data?.totals;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-amber-500" />
      <div className="p-5 sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Step 1 · Plan your purchase</div>
        <h2 className="mt-1 text-2xl font-semibold">How much power should you buy?</h2>
        <p className="mt-1 text-slate-600">
          Pick a delivery day and how sure you want to be. The plan uses the wind forecast you would have had at decision
          time, adjusted by how far off it has been.
        </p>

        {/* Inputs */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Field label="Delivery day">
            <div className="flex items-center gap-2">
              <IconButton label="Previous day" disabled={day <= FIRST_DAY} onClick={() => setDay(shiftDay(day, -1))}>
                <ChevronLeft size={18} aria-hidden />
              </IconButton>
              <input
                type="date"
                value={day}
                min={FIRST_DAY}
                max={LAST_DAY}
                onChange={(e) => e.target.value && setDay(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-medium"
                aria-label="Delivery day"
              />
              <IconButton label="Next day" disabled={day >= LAST_DAY} onClick={() => setDay(shiftDay(day, 1))}>
                <ChevronRight size={18} aria-hidden />
              </IconButton>
            </div>
          </Field>

          <Field label="How sure do you want to be?">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Confidence">
              {CONFIDENCE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={confidence === c.value}
                  onClick={() => setConfidence(c.value)}
                  className={`rounded-md px-2 py-1.5 text-center transition ${
                    confidence === c.value ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="block">{c.label}</span>
                  <span className="block text-xs font-normal text-slate-500">{c.hint}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Demand to cover (MW)" hint="Example figure. Enter your own demand forecast.">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_DEMAND}
              step={500}
              value={demandText}
              onChange={(e) => setDemandText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-medium tabular-nums"
              aria-label="Demand to cover in MW"
            />
          </Field>
        </div>

        {!demandOk && (
          <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Enter a demand between 0 and {MAX_DEMAND.toLocaleString('en-GB')} MW.
          </p>
        )}
        <Status loading={loading && !data} error={error} />

        {data && t.hours_planned > 0 && (
          <div className={loading ? 'opacity-60 transition' : 'transition'}>
            {/* Answer */}
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white shadow-lg">
                <div className="flex items-center gap-2 text-sm text-sky-200">
                  <ShoppingCart size={18} aria-hidden /> Buy from the market
                </div>
                <div className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">{mw(t.avg_buy_mw)} MW</div>
                <div className="mt-1 text-sm text-slate-300">
                  average per hour · <b className="text-white">{gwh(t.buy_mwh)} GWh</b> for {dayLabel(data.date)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Wind size={18} className="text-sky-600" aria-hidden /> Wind you can count on
                </div>
                <div className="mt-2 text-3xl font-semibold tabular-nums">{mw(t.avg_firm_wind_mw)} MW</div>
                <div className="mt-1 text-sm text-slate-500">
                  {confidence}% sure · forecast said {mw(t.avg_forecast_mw)} MW
                </div>
              </div>

              <Outcome totals={t} />
            </div>

            {/* Hour by hour */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                <Swatch className="bg-sky-300" label="Wind you can count on" />
                <Swatch className="bg-amber-400" label="Power to buy" />
                <span className="flex items-center gap-2">
                  <span className="w-5 border-t-2 border-dashed border-slate-800" /> Actual wind (hindsight)
                </span>
              </div>
              <button
                type="button"
                onClick={() => downloadCsv(data)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
              >
                <Download size={16} aria-hidden /> Hourly plan (CSV)
              </button>
            </div>

            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.hours} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" tickFormatter={hhmm} interval={2} {...axis} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tickFormatter={mw} width={60} axisLine={false} {...axis} />
                  <Tooltip content={<HourTooltip />} />
                  <Area type="stepAfter" dataKey="firm_wind_mw" stackId="plan" stroke="#0284c7" fill="#7dd3fc" isAnimationActive={false} />
                  <Area type="stepAfter" dataKey="buy_mw" stackId="plan" stroke="#d97706" fill="#fbbf24" isAnimationActive={false} />
                  <Line type="stepAfter" dataKey="actual_mw" stroke="#1e293b" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Forecast used: published <b>{hhmm(data.forecast_published)}</b> on {dayLabel(data.forecast_published)}, the
              latest available at {hhmm(data.decision_time)} on {dayLabel(data.decision_time)}. Demand is held flat across
              the day.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Outcome({ totals: t }) {
  const covered = t.hours_short === 0;
  return (
    <div className={`rounded-xl border p-5 ${covered ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
      <div className={`flex items-center gap-2 text-sm ${covered ? 'text-emerald-700' : 'text-rose-700'}`}>
        {covered ? <CheckCircle2 size={18} aria-hidden /> : <TriangleAlert size={18} aria-hidden />} How this plan turned out
      </div>
      <div className="mt-2 text-3xl font-semibold">
        {covered ? 'Fully covered' : `Short ${t.hours_short} of ${t.hours_planned} h`}
      </div>
      <div className="mt-1 text-sm text-slate-600">
        {covered
          ? `Actual wind met the plan in all ${t.hours_planned} hours`
          : `${mw(t.shortfall_mwh)} MWh had to be bought at short notice`}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function IconButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}

function Swatch({ className, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${className}`} /> {label}
    </span>
  );
}

function HourTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const h = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">{hhmm(h.time)}</div>
      <div className="text-amber-700">Buy {mw(h.buy_mw)} MW</div>
      <div className="text-sky-700">Wind counted on {mw(h.firm_wind_mw)} MW</div>
      <div className="text-slate-500">Forecast {mw(h.forecast_mw)} MW</div>
      <div>Actual wind {mw(h.actual_mw)} MW</div>
      {h.shortfall_mw > 0 && <div className="text-rose-700">Short {mw(h.shortfall_mw)} MW</div>}
    </div>
  );
}

function downloadCsv(plan) {
  const rows = [
    ['hour_start_utc', 'forecast_mw', 'wind_counted_on_mw', 'buy_mw', 'actual_wind_mw', 'shortfall_mw'],
    ...plan.hours.map((h) => [h.time, h.forecast_mw, h.firm_wind_mw, h.buy_mw, h.actual_mw ?? '', h.shortfall_mw ?? ''].map((v) =>
      typeof v === 'number' ? Math.round(v) : v,
    )),
  ];
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `wind-plan-${plan.date}-${plan.confidence}pct.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
