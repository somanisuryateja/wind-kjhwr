import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarClock, CheckCircle2, MoveVertical, Wind } from 'lucide-react';
import { Card, Stat, Status } from './ui';
import { average, dayLabel, hhmm, mw, useApi } from './lib';

const axis = { tick: { fontSize: 12, fill: '#64748b' }, tickLine: false };

export default function ForecastSection({ day, decisionHour }) {
  const { data, loading, error } = useApi(`/forecast?date=${day}&decision_hour=${decisionHour}`);

  const points = data?.points ?? [];
  const low = average(points.map((p) => p.range_mw?.[0]));
  const high = average(points.map((p) => p.range_mw?.[1]));

  return (
    <Card
      step={2}
      icon={CalendarClock}
      title="The forecast behind the plan"
      description="The latest wind forecast the desk had when buying for this delivery day, its likely range, and the actual outturn afterwards."
    >
      <Status loading={loading && !data} error={error} />

      {data && (
        <div className={loading ? 'opacity-60' : ''}>
          <p className="text-sm text-slate-700">
            {data.forecast_published ? (
              <>
                For <b>{dayLabel(data.date)}</b>, the latest forecast at <b>{hhmm(data.decision_time)}</b> on{' '}
                {dayLabel(data.decision_time)} was published at <b>{hhmm(data.forecast_published)}</b>.
              </>
            ) : (
              'No forecast had been published by the decision time for this day.'
            )}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat
              label="Forecast, daily average"
              value={`${mw(average(points.map((p) => p.forecast_mw)))} MW`}
              note="What the desk saw when buying"
              icon={Wind}
              tone="blue"
            />
            <Stat
              label="Likely actual, daily average"
              value={`${mw(low)} – ${mw(high)} MW`}
              note="8 in 10 hours, based on January's errors"
              icon={MoveVertical}
              tone="sky"
            />
            <Stat
              label="Actual, daily average"
              value={`${mw(average(points.map((p) => p.actual_mw)))} MW`}
              note="Known only after delivery"
              icon={CheckCircle2}
              tone="slate"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <Key className="h-0.5 w-5 bg-blue-600" label="Forecast at decision time" />
            <Key className="h-3 w-5 rounded-sm bg-blue-100" label="Likely range (10th–90th percentile)" />
            <Key className="h-0 w-5 border-t-2 border-dashed border-slate-800" label="Actual" />
          </div>

          <div className="mt-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tickFormatter={hhmm} interval={5} {...axis} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tickFormatter={mw} width={56} axisLine={false} {...axis} unit="" />
                <Tooltip content={<PointTooltip />} />
                <Area dataKey="range_mw" stroke="none" fill="#dbeafe" connectNulls isAnimationActive={false} />
                <Line dataKey="forecast_mw" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                <Line dataKey="actual_mw" stroke="#1e293b" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">MW, UK time. Forecasts are hourly; actuals are half-hourly.</p>
        </div>
      )}
    </Card>
  );
}

function Key({ className, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={className} />
      {label}
    </span>
  );
}

function PointTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">{hhmm(p.time)}</div>
      {p.forecast_mw != null && <div className="text-blue-700">Forecast {mw(p.forecast_mw)} MW</div>}
      {p.range_mw && (
        <div className="text-slate-600">
          Likely {mw(p.range_mw[0])} – {mw(p.range_mw[1])} MW
        </div>
      )}
      <div>Actual {mw(p.actual_mw)} MW</div>
    </div>
  );
}
