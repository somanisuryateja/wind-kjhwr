const TONES = {
  blue: { bar: 'bg-blue-600', icon: 'bg-blue-50 text-blue-600', value: 'text-slate-900' },
  sky: { bar: 'bg-sky-400', icon: 'bg-sky-50 text-sky-600', value: 'text-slate-900' },
  slate: { bar: 'bg-slate-700', icon: 'bg-slate-100 text-slate-700', value: 'text-slate-900' },
  violet: { bar: 'bg-violet-500', icon: 'bg-violet-50 text-violet-600', value: 'text-slate-900' },
  amber: { bar: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600', value: 'text-amber-700' },
};

export function Card({ step, icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
          {Icon ? <Icon size={20} aria-hidden /> : step}
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Step {step}</div>
          <h2 className="text-lg font-semibold leading-snug">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note, icon: Icon, tone = 'slate' }) {
  const t = TONES[tone];
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} aria-hidden />
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${t.icon}`}>
            <Icon size={16} aria-hidden />
          </span>
        )}
        {label}
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
