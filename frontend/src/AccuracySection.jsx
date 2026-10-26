import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Stat, Status } from './ui';
import { FIRST_DAY, LAST_DAY, mw, signedMw, useApi } from './lib';

const axis = { tick: { fontSize: 12, fill: '#64748b' }, tickLine: false };

export default function AccuracySection({ decisionHour }) {
  const [start, setStart] = useState(FIRST_DAY);
  const [end, setEnd] = useState(LAST_DAY);
  const { data, loading, error } = useApi(`/accuracy?start=${start}&end=${end}&decision_hour=${decisionHour}`);
  const s = data?.summary;

  return (
    <Card
      title="Forecast accuracy"
      description="How far actual wind landed from the forecast available at decision time. Error = actual − forecast, so a negative error means less wind than forecast and more power to buy."
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-600">Delivery days</span>
        <DateInput value={start} onChange={setStart} label="From" />
        <span className="text-slate-400">to</span>
        <DateInput value={end} onChange={setEnd} label="To" />
        {(start !== FIRST_DAY || end !== LAST_DAY) && (
          <button
            type="button"
            onClick={() => {
              setStart(FIRST_DAY);
              setEnd(LAST_DAY);
            }}
            className="text-blue-700 hover:underline"
          >
            Reset to full period
          </button>
        )}
      </div>

      <Status loading={loading && !data} error={error} />

      {s?.mae != null && (
        <div className={loading ? 'opacity-60' : ''}>
          <p className="mt-4 text-sm text-slate-700">
            In 8 of 10 hours, actual wind was between <b>{signedMw(s.p10)} MW</b> and <b>{signedMw(s.p90)} MW</b> of the
            forecast ({s.n.toLocaleString('en-GB')} hours scored).
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Typical error (MAE)" value={`${mw(s.mae)} MW`} note="Average size of the miss" />
            <Stat
              label="Bias"
              value={`${signedMw(s.bias)} MW`}
              note={s.bias < 0 ? 'Forecast too high on average' : 'Forecast too low on average'}
            />
            <Stat label="Median error" value={`${signedMw(s.p50)} MW`} note="Half of hours above, half below" />
            <Stat label="RMSE" value={`${mw(s.rmse)} MW`} note="Weights big misses more" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-medium">Error by forecast lead time</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                All forecast runs, grouped by how long before delivery they were published.
              </p>
              <div className="mt-3 flex gap-5 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-blue-600" /> Typical error (MAE)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-amber-500" /> Bias
                </span>
              </div>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_lead_time} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" {...axis} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tickFormatter={signedMw} width={56} axisLine={false} {...axis} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Tooltip content={<LeadTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="mae" fill="#2563eb" isAnimationActive={false} />
                    <Bar dataKey="bias" fill="#f59e0b" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="font-medium">How often each error size happened</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                Hours by error, in 500 MW steps. Left of zero: less wind than forecast.
              </p>
              <div className="mt-3 flex gap-5 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-amber-500" /> Less wind than forecast
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-blue-600" /> More wind than forecast
                </span>
              </div>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={1}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="from_mw" tickFormatter={(v) => signedMw(v)} {...axis} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis allowDecimals={false} width={40} axisLine={false} {...axis} />
                    <Tooltip content={<BinTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" isAnimationActive={false}>
                      {data.histogram.map((b) => (
                        <Cell key={b.from_mw} fill={b.from_mw < 0 ? '#f59e0b' : '#2563eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            WINDFOR forecasts are hourly, so accuracy is scored on the hour. Forecasts published after their target time
            are excluded.
          </p>
        </div>
      )}
    </Card>
  );
}

function DateInput({ value, onChange, label }) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      min={FIRST_DAY}
      max={LAST_DAY}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className="rounded-md border border-slate-300 px-2 py-1.5"
    />
  );
}

function LeadTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">Published {r.label} ahead</div>
      <div>Typical error {mw(r.mae)} MW</div>
      <div>Bias {signedMw(r.bias)} MW</div>
      <div className="text-slate-600">
        8 in 10 within {signedMw(r.p10)} to {signedMw(r.p90)} MW
      </div>
      <div className="text-slate-500">{r.n.toLocaleString('en-GB')} forecasts</div>
    </div>
  );
}

function BinTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      {signedMw(b.from_mw)} to {signedMw(b.from_mw + 500)} MW: <b>{b.count}</b> hours
    </div>
  );
}
