import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

const TONES = {
  blue: { bar: 'bg-blue-600', icon: 'bg-blue-50 text-blue-600', value: 'text-slate-900' },
  sky: { bar: 'bg-sky-400', icon: 'bg-sky-50 text-sky-600', value: 'text-slate-900' },
  slate: { bar: 'bg-slate-700', icon: 'bg-slate-100 text-slate-700', value: 'text-slate-900' },
  violet: { bar: 'bg-violet-500', icon: 'bg-violet-50 text-violet-600', value: 'text-slate-900' },
  amber: { bar: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600', value: 'text-amber-700' },
};

// Small "i" that shows an explanation on hover, tap or keyboard focus.
// Positioned on open and kept inside the screen, so it never causes sideways scrolling.
export function InfoTip({ text }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!pos) return;
    const hide = () => setPos(null);
    window.addEventListener('scroll', hide, { once: true });
    return () => window.removeEventListener('scroll', hide);
  }, [pos]);

  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const above = r.top > 140;
    setPos({ left, width, top: above ? r.top - 8 : r.bottom + 8, above });
  };

  return (
    <span className="inline-flex align-middle">
      <button
        type="button"
        aria-label={`More info: ${text}`}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        className="rounded-full text-slate-400 hover:text-slate-700 focus:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <Info size={15} aria-hidden />
      </button>
      {pos && (
        <span
          aria-hidden
          style={{ left: pos.left, top: pos.top, width: pos.width, transform: pos.above ? 'translateY(-100%)' : undefined }}
          className="pointer-events-none fixed z-50 rounded-md bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function Card({ step, icon: Icon, title, info, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
          {Icon ? <Icon size={20} aria-hidden /> : step}
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Step {step}</div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold leading-snug">
            {title} {info && <InfoTip text={info} />}
          </h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note, info, icon: Icon, tone = 'slate' }) {
  const t = TONES[tone];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${t.bar}`} aria-hidden />
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${t.icon}`}>
            <Icon size={16} aria-hidden />
          </span>
        )}
        {label}
        {info && <InfoTip text={info} />}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${t.value}`}>{value}</div>
      {note && <div className="mt-0.5 text-sm text-slate-500">{note}</div>}
    </div>
  );
}

export function Status({ loading, error }) {
  if (error) return <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;
  return null;
}
