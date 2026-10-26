export function Card({ title, description, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note }) {
  return (
    <div className="rounded-md bg-slate-50 px-4 py-3">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-0.5 text-sm text-slate-500">{note}</div>}
    </div>
  );
}

export function Status({ loading, error }) {
  if (error) return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;
  return null;
}
