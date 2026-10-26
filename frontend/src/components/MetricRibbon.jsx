import React from 'react';
import { Target, TrendingUp, Scale, AlertTriangle, SunMedium } from 'lucide-react';

export default function MetricRibbon({ metrics, loading }) {
  if (!metrics) return null;

  const {
    mae_mw = 0,
    rmse_mw = 0,
    mape_pct = 0,
    mean_bias_mw = 0,
    peak_mae_mw = 0,
    offpeak_mae_mw = 0,
    total_intervals = 0,
    overforecast_percentage = 0,
    underforecast_percentage = 0
  } = metrics;

  const isOverforecast = mean_bias_mw > 0;

  const cards = [
    {
      icon: <Target className="w-4 h-4 text-emerald-500" />,
      label: 'Mean Absolute Error',
      value: loading ? '...' : mae_mw.toLocaleString(),
      unit: 'MW',
      sub: `${total_intervals} settlement periods`,
      subColor: 'text-textMuted',
      valueColor: 'text-textPrimary'
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
      label: 'RMSE (Tail Volatility)',
      value: loading ? '...' : rmse_mw.toLocaleString(),
      unit: 'MW',
      sub: `${mae_mw > 0 ? (rmse_mw / mae_mw).toFixed(2) : '1.00'}x RMSE/MAE ratio`,
      subColor: 'text-blue-500',
      valueColor: 'text-textPrimary'
    },
    {
      icon: <Scale className="w-4 h-4 text-purple-500" />,
      label: 'Percentage Error',
      value: loading ? '...' : `${mape_pct.toFixed(1)}%`,
      unit: 'MAPE',
      sub: `${overforecast_percentage}% Over / ${underforecast_percentage}% Under`,
      subColor: 'text-textMuted',
      valueColor: 'text-textPrimary'
    },
    {
      icon: <AlertTriangle className={`w-4 h-4 ${isOverforecast ? 'text-amber-500' : 'text-blue-500'}`} />,
      label: 'Directional Bias (MBE)',
      value: loading ? '...' : `${isOverforecast ? '+' : ''}${mean_bias_mw.toLocaleString()}`,
      unit: 'MW',
      sub: isOverforecast ? 'Over-forecast (Shortfall Risk)' : 'Under-forecast (Surplus Risk)',
      subColor: isOverforecast ? 'text-amber-500' : 'text-blue-500',
      valueColor: isOverforecast ? 'text-amber-500' : 'text-blue-500'
    },
    {
      icon: <SunMedium className="w-4 h-4 text-amber-500" />,
      label: 'Peak vs Off-Peak MAE',
      value: loading ? '...' : `${peak_mae_mw.toLocaleString()}`,
      unit: `/ ${loading ? '...' : offpeak_mae_mw.toLocaleString()} MW`,
      sub: 'Peak: SP 15–38 (07:00–19:00)',
      subColor: 'text-textMuted',
      valueColor: 'text-textPrimary'
    }
  ];

  return (
    <section 
      aria-label="Executive Key Performance Indicators" 
      className="bg-surface border border-borderSubtle rounded-2xl p-4 sm:p-5 shadow-sm transition-colors"
    >
      {/* ═══ DESKTOP: Clean 5-column grid with subtle dividers (md+) ═══ */}
      <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 md:divide-x divide-borderSubtle">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`flex flex-col justify-center ${i > 0 ? 'md:pl-4 lg:pl-6' : ''}`}
          >
            <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
              {card.icon}
              <span className="truncate">{card.label}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${card.valueColor}`}>
                {card.value}
              </span>
              <span className="text-[11px] font-mono text-textMuted">{card.unit}</span>
            </div>
            <div className={`text-[11px] ${card.subColor} mt-0.5 truncate`}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MOBILE: Smooth horizontal scrollable ticker (<md) ═══ */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-subtle/70 rounded-xl p-3 border border-borderSubtle/60 shrink-0 w-[220px] snap-start flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-xs text-textSecondary font-medium">
                {card.icon}
                <span className="truncate">{card.label}</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono tracking-tight ${card.valueColor}`}>
                  {card.value}
                </span>
                <span className="text-[10px] font-mono text-textMuted">{card.unit}</span>
              </div>
              <div className={`text-[10px] ${card.subColor} mt-1 truncate`}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
