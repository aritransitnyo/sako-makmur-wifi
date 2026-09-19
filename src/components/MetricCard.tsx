import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
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
}) => {
  const variantStyles = {
    cyan: {
      bg: 'from-cyan-950/40 to-slate-900/60',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
    },
    emerald: {
      bg: 'from-emerald-950/40 to-slate-900/60',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
    amber: {
      bg: 'from-amber-950/40 to-slate-900/60',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
    violet: {
      bg: 'from-violet-950/40 to-slate-900/60',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/10 text-violet-400',
    },
    rose: {
      bg: 'from-rose-950/40 to-slate-900/60',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400',
    },
    slate: {
      bg: 'from-slate-800/40 to-slate-900/60',
      border: 'border-slate-700/40',
      text: 'text-slate-200',
      iconBg: 'bg-slate-700/20 text-slate-300',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border} shadow-sm backdrop-blur-sm relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
          <p className="text-xl font-bold text-slate-100 mt-1 tracking-tight">{value}</p>
          {subValue && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>{icon}</div>
      </div>
    </div>
  );
};
