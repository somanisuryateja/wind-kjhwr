import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const FIRST_DAY = '2026-01-02';
export const LAST_DAY = '2026-02-01';

// Fetch JSON from the backend. No fallback data: if the API fails, the page says so.
// Pass a null path to skip the request (e.g. while an input is invalid).
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`${API_BASE}${path}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join('; ') : body.detail;
          throw new Error(detail || `Request failed (${res.status})`);
        }
        return body;
      })
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((err) => live && setState({ data: null, error: err.message, loading: false }));
    return () => {
      live = false;
    };
  }, [path]);

  return state;
}

export const mw = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-GB'));

export const signedMw = (v) => {
  if (v == null) return '–';
  const r = Math.round(v);
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toLocaleString('en-GB')}`;
};

// All times are UTC from the API; in January that is also UK time.
export const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const shiftDay = (isoDay, n) => {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const average = (xs) => {
  const v = xs.filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// Value that only updates after the input has been still for `ms`, so typing doesn't fire a request per key.
export function useDebounced(value, ms = 400) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

export const gwh = (mwh) => (mwh == null ? '–' : (mwh / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 }));
