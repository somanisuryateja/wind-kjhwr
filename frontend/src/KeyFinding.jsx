import { AlertTriangle } from 'lucide-react';
import { mw, useApi } from './lib';
import { InfoTip } from './ui';

// The one thing a buyer should take away, computed from the full period at the chosen decision time.
export default function KeyFinding({ decisionHour }) {
  const { data } = useApi(`/accuracy?decision_hour=${decisionHour}`);
  const s = data?.summary;
  if (s?.bias == null) return null;

  const tooHigh = s.bias < 0;
  const share = Math.round((tooHigh ? s.share_below : 1 - s.share_below) * 100);

  return (
    <section className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white shadow-sm">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle size={22} aria-hidden />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Key finding</div>
            <p className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
              The wind forecast ran <span className="text-amber-600">{mw(Math.abs(s.bias))} MW too {tooHigh ? 'high' : 'low'}</span> on average
            </p>
            <p className="mt-2 text-slate-600">
              Actual wind was {tooHigh ? 'below' : 'above'} forecast in <b>{share}%</b> of hours.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center">
          <Fact label="Typical hour" value={`${mw(Math.abs(s.p50))} MW`} note={`${s.p50 < 0 ? 'less' : 'more'} wind`} info="Median error: in a normal hour, actual wind differed from the forecast by this much." />
          <Fact label="9-in-10 cover" value={`${mw(Math.abs(s.p10))} MW`} note="below forecast" info="Plan on this much less wind than forecast to be covered in 9 of 10 hours." />
          <Fact label="Hours scored" value={s.n.toLocaleString('en-GB')} note="2 Jan – 1 Feb 2026" />
        </dl>
      </div>
    </section>
  );
}

function Fact({ label, value, note, info }) {
  return (
    <div className="rounded-lg bg-white/80 px-2 py-3 ring-1 ring-slate-200">
      <dt className="flex items-center justify-center gap-1 text-xs text-slate-500">
        {label} {info && <InfoTip text={info} />}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{value}</dd>
      <dd className="text-xs text-slate-500">{note}</dd>
    </div>
  );
}
