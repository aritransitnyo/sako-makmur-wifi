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
  Radio,
  Clock,
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

  // Stacked OPEX percentages
  const starlinkPct = totalOpex > 0 ? ((settings.starlink_cost / totalOpex) * 100).toFixed(0) : '0';
  const nodePowerPct = totalOpex > 0 ? ((settings.node_power_cost / totalOpex) * 100).toFixed(0) : '0';
  const operatorPct = totalOpex > 0 ? ((settings.operator_salary / totalOpex) * 100).toFixed(0) : '0';
  const reservePct = totalOpex > 0 ? ((reserveFund / totalOpex) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Node Health Banner with Starlink indicator */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-200">Starlink Standard Node</p>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hybrid FO • Latency ~28ms • Uptime 99.8%
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">User Aktif</p>
            <p className="text-lg font-black text-cyan-400">{activeCount} / {subscribers.length}</p>
          </div>
        </div>
      </div>

      {/* KPI 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Omzet Kotor Bulanan"
          value={formatRupiah(totalOmzet)}
          subValue={`${activeCount} Pelanggan Terdaftar`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="cyan"
        />
        <MetricCard
          label="Laba Bersih (Net)"
          value={formatRupiah(netProfit)}
          subValue={`Margin: ${profitMargin}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Total Beban OPEX"
          value={formatRupiah(totalOpex)}
          subValue="Starlink + Node + Ops"
          icon={<Zap className="w-5 h-5" />}
          variant="amber"
        />
        <MetricCard
          label="Estimasi BEP"
          value={`${bepMonths} Bln`}
          subValue={`CAPEX: ${formatRupiah(totalCapexSpent)}`}
          icon={<Server className="w-5 h-5" />}
          variant="violet"
        />
      </div>

      {/* Visual OPEX Stacked Allocation */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            Alokasi Biaya OPEX Bulanan
          </h3>
          <span className="text-[11px] font-bold text-amber-400">
            {formatRupiah(totalOpex)}
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
          <div
            className="bg-cyan-500 rounded-l-full transition-all duration-500"
            style={{ width: `${starlinkPct}%` }}
            title={`Starlink: ${starlinkPct}%`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${nodePowerPct}%` }}
            title={`Listrik: ${nodePowerPct}%`}
          />
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${operatorPct}%` }}
            title={`Gaji Operator: ${operatorPct}%`}
          />
          <div
            className="bg-emerald-500 rounded-r-full transition-all duration-500"
            style={{ width: `${reservePct}%` }}
            title={`Dana Cadangan: ${reservePct}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Starlink
            </span>
            <span className="font-semibold">{formatRupiah(settings.starlink_cost)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Listrik Node
            </span>
            <span className="font-semibold">{formatRupiah(settings.node_power_cost)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Gaji Operator
            </span>
            <span className="font-semibold">{formatRupiah(settings.operator_salary)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Dana Cadangan ({settings.reserve_fund_pct}%)
            </span>
            <span className="font-semibold text-emerald-400">{formatRupiah(reserveFund)}</span>
          </div>
        </div>
      </div>

      {/* Dividen Investor Section */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Dividen Investor Bulan Berjalan
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Distribusi proporsional dari Laba Bersih ({formatRupiah(netProfit)})
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('investors')}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-800/40"
          >
            Detail <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {investorDividends.map((inv) => (
            <div
              key={inv.id}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-100">{inv.name}</p>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {inv.share_percentage}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{inv.role}</p>
              </div>

              <div className="text-right">
                <p className="font-black text-sm text-emerald-400">
                  {formatRupiah(inv.dividend)}
                </p>
                <p className="text-[10px] text-slate-500">Estimasi Dividen</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateTab('subscribers')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
            <Users className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Data Pelanggan</p>
          <p className="text-base font-bold text-slate-100">{subscribers.length} User</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            {activeCount} Aktif • {subscribers.length - activeCount} Isolir
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('capex')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-violet-400">
            <Server className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Belanja Modal</p>
          <p className="text-base font-bold text-slate-100">{formatRupiah(totalCapexSpent)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Dari {formatRupiah(totalCapitalInvested)} Modal
          </p>
        </button>
      </div>
    </div>
  );
};
