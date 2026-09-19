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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
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
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-cyan-500/20 hover:border-cyan-500/40',
      topLine: 'bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
      valueText: 'text-slate-50',
      subText: 'text-cyan-400/90 font-medium',
    },
    emerald: {
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-emerald-500/20 hover:border-emerald-500/40',
      topLine: 'bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      valueText: 'text-emerald-300',
      subText: 'text-emerald-400/90 font-medium',
    },
    amber: {
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-amber-500/20 hover:border-amber-500/40',
      topLine: 'bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      valueText: 'text-slate-50',
      subText: 'text-amber-400/90 font-medium',
    },
    violet: {
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-violet-500/20 hover:border-violet-500/40',
      topLine: 'bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]',
      valueText: 'text-violet-300',
      subText: 'text-violet-400/90 font-medium',
    },
    rose: {
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-rose-500/20 hover:border-rose-500/40',
      topLine: 'bg-gradient-to-r from-rose-500/0 via-rose-400 to-rose-500/0',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      valueText: 'text-rose-300',
      subText: 'text-rose-400/90 font-medium',
    },
    slate: {
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 hover:border-slate-700',
      topLine: 'bg-gradient-to-r from-slate-700/0 via-slate-600 to-slate-700/0',
      iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
      valueText: 'text-slate-100',
      subText: 'text-slate-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`p-4 rounded-2xl border ${style.cardBg} backdrop-blur-xl shadow-lg relative overflow-hidden transition-all duration-200`}
    >
      {/* Subtle top edge glow */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] ${style.topLine}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 truncate">
            {label}
          </p>
          <p className={`text-xl sm:text-2xl font-black mt-1 tracking-tight ${style.valueText}`}>
            {value}
          </p>
          {subValue && (
            <p className={`text-[11px] mt-1 truncate ${style.subText}`}>
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
