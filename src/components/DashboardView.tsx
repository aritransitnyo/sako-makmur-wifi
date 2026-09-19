import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Server,
  Zap,
  Activity,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { MetricCard, formatRupiah } from './MetricCard';
import { BusinessSettings, Investor, Subscriber, CapexItem } from '../types';

interface DashboardViewProps {
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  capexItems: CapexItem[];
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  investors,
  subscribers,
  capexItems,
  onNavigateTab,
}) => {
  // Financial Calculations according to PRD formulas
  const activeSubscribers = subscribers.filter((s) => s.status === 'active');
  const activeCount = activeSubscribers.length;
  
  // Real gross revenue from active users
  const totalOmzet = activeSubscribers.reduce(
    (sum, s) => sum + (s.package_price || 125000),
    0
  );

  const reserveFund = totalOmzet * (settings.reserve_fund_pct / 100);
  const totalOpex =
    settings.starlink_cost +
    settings.node_power_cost +
    settings.operator_salary +
    reserveFund;

  const netProfit = Math.max(0, totalOmzet - totalOpex);
  const profitMargin = totalOmzet > 0 ? ((netProfit / totalOmzet) * 100).toFixed(1) : '0';

  // CAPEX calculations
  const totalCapexSpent = capexItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalCapitalInvested = investors.reduce(
    (sum, inv) => sum + inv.capital_invested,
    0
  );

  // BEP Calculation (Bulan)
  const bepMonths =
    netProfit > 0 ? (totalCapexSpent / netProfit).toFixed(1) : '∞';

  // Investor dividend distribution
  const investorDividends = investors.map((inv) => ({
    ...inv,
    dividend: (netProfit * inv.share_percentage) / 100,
  }));

  return (
    <div className="space-y-6 pb-24 page-transition">
      {/* Top Banner Status */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-900/30 via-slate-900 to-cyan-900/20 border border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Kondisi Operasional Node</p>
            <p className="text-sm font-semibold text-slate-200">
              Starlink High-Speed • Hybrid Fiber Online
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ● Normal 99.8%
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Omzet Kotor Bulanan"
          value={formatRupiah(totalOmzet)}
          subValue={`${activeCount} Pelanggan Aktif`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="cyan"
        />
        <MetricCard
          label="Laba Bersih (Net Profit)"
          value={formatRupiah(netProfit)}
          subValue={`Margin: ${profitMargin}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Total Biaya OPEX"
          value={formatRupiah(totalOpex)}
          subValue="Starlink + Ops + Cadangan"
          icon={<Zap className="w-5 h-5" />}
          variant="amber"
        />
        <MetricCard
          label="Estimasi Titik Impas (BEP)"
          value={`${bepMonths} Bulan`}
          subValue={`CAPEX: ${formatRupiah(totalCapexSpent)}`}
          icon={<Server className="w-5 h-5" />}
          variant="violet"
        />
      </div>

      {/* OPEX Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Rincian Beban Operasional (OPEX)
          </h3>
          <span className="text-xs text-slate-400">Formula Resmi</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">1. Langganan Starlink Standard</span>
            <span className="font-semibold text-slate-200">
              {formatRupiah(settings.starlink_cost)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">2. Listrik & Node Power</span>
            <span className="font-semibold text-slate-200">
              {formatRupiah(settings.node_power_cost)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">3. Gaji Operator Jaringan</span>
            <span className="font-semibold text-slate-200">
              {formatRupiah(settings.operator_salary)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1 text-slate-400">
              <span>4. Dana Cadangan / Maintenance</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                {settings.reserve_fund_pct}%
              </span>
            </div>
            <span className="font-semibold text-amber-400">
              {formatRupiah(reserveFund)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 text-sm font-bold">
            <span className="text-slate-300">Total OPEX Bulanan</span>
            <span className="text-amber-400">{formatRupiah(totalOpex)}</span>
          </div>
        </div>
      </div>

      {/* Dividen Investor Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Pembagian Dividen Investor Bulan Ini
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dihitung otomatis berdasarkan porsi saham dari Laba Bersih
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('investors')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
          >
            Kelola <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {investorDividends.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200">{inv.name}</p>
                <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {inv.role}
                  </span>
                  <span>Saham: {inv.share_percentage}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-emerald-400">
                  {formatRupiah(inv.dividend)}
                </p>
                <p className="text-[10px] text-slate-500">Estimasi Dividen</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateTab('subscribers')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
            <Users className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Total Pelanggan</p>
          <p className="text-lg font-bold text-slate-100">{subscribers.length} User</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            {activeCount} Aktif • {subscribers.length - activeCount} Isolir
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('capex')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
            <Server className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Modal Belanja (CAPEX)</p>
          <p className="text-lg font-bold text-slate-100">{formatRupiah(totalCapexSpent)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dari {formatRupiah(totalCapitalInvested)} Modal
          </p>
        </button>
      </div>
    </div>
  );
};
