import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
  badge?: string;
}

export const formatRupiah = (num: number): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.round(num));
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'cyan',
  badge,
}) => {
  const variantStyles = {
    cyan: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-cyan-500/25 hover:border-cyan-500/40',
      topLine: 'bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
      valueText: 'text-slate-50',
      subText: 'text-cyan-400/90 font-medium',
    },
    emerald: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-emerald-500/25 hover:border-emerald-500/40',
      topLine: 'bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      valueText: 'text-emerald-300',
      subText: 'text-emerald-400/90 font-medium',
    },
    amber: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-amber-500/25 hover:border-amber-500/40',
      topLine: 'bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      valueText: 'text-slate-50',
      subText: 'text-amber-400/90 font-medium',
    },
    violet: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-violet-500/25 hover:border-violet-500/40',
      topLine: 'bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0',
      iconBg: 'bg-violet-500/15 text-violet-400 border border-violet-500/25 shadow-[0_0_12px_rgba(139,92,246,0.15)]',
      valueText: 'text-violet-300',
      subText: 'text-violet-400/90 font-medium',
    },
    rose: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-rose-500/25 hover:border-rose-500/40',
      topLine: 'bg-gradient-to-r from-rose-500/0 via-rose-400 to-rose-500/0',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      valueText: 'text-rose-300',
      subText: 'text-rose-400/90 font-medium',
    },
    slate: {
      cardBg: 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-slate-800 hover:border-slate-700',
      topLine: 'bg-gradient-to-r from-slate-700/0 via-slate-600 to-slate-700/0',
      iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
      valueText: 'text-slate-100',
      subText: 'text-slate-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.cyan;
  const valueStr = String(value);

  // Auto scale font size if value is very long (e.g. Rp 25.385.000)
  const isLongValue = valueStr.length > 11;

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border ${style.cardBg} backdrop-blur-xl shadow-lg relative overflow-hidden transition-all duration-200`}
    >
      {/* Subtle top edge glow */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] ${style.topLine}`} />

      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 truncate">
              {label}
            </p>
            {badge && (
              <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/25 flex-shrink-0">
                {badge}
              </span>
            )}
          </div>

          <p
            title={valueStr}
            className={`font-black mt-1 tracking-tight truncate leading-tight ${
              isLongValue ? 'text-base sm:text-lg md:text-xl' : 'text-lg sm:text-xl md:text-2xl'
            } ${style.valueText}`}
          >
            {value}
          </p>

          {subValue && (
            <p
              title={subValue}
              className={`text-[10px] sm:text-[11px] mt-1 truncate leading-tight ${style.subText}`}
            >
              {subValue}
            </p>
          )}
        </div>

        <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
