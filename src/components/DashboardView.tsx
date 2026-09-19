import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Server,
  Zap,
  ArrowUpRight,
  PieChart,
  Radio,
  Edit3,
  X,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard, formatRupiah } from './MetricCard';
import { BusinessSettings, Investor, Subscriber, CapexItem } from '../types';
import { calculateFinancials } from '../lib/financialCalculations';

interface DashboardViewProps {
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  capexItems: CapexItem[];
  onNavigateTab: (tab: any) => void;
  onUpdateSettings: (settings: BusinessSettings) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  investors,
  subscribers,
  capexItems,
  onNavigateTab,
  onUpdateSettings,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [starlinkCost, setStarlinkCost] = useState(settings.starlink_cost);
  const [nodePowerCost, setNodePowerCost] = useState(settings.node_power_cost);
  const [operatorSalary, setOperatorSalary] = useState(settings.operator_salary);
  const [collectorFee, setCollectorFee] = useState(settings.collector_fee_per_user ?? 5000);
  const [marketingFee, setMarketingFee] = useState(settings.marketing_fee_monthly ?? 250000);
  const [reservePct, setReservePct] = useState(settings.reserve_fund_pct);

  // Unified financial calculations
  const fin = calculateFinancials(subscribers, settings, investors, capexItems);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      starlink_cost: Number(starlinkCost) || 0,
      node_power_cost: Number(nodePowerCost) || 0,
      operator_salary: Number(operatorSalary) || 0,
      collector_fee_per_user: Number(collectorFee) || 0,
      marketing_fee_monthly: Number(marketingFee) || 0,
      reserve_fund_pct: Number(reservePct) || 0,
    });
    setShowSettingsModal(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-28 page-transition">
      {/* Node Health Banner with Starlink indicator */}
      <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-slate-200 truncate">Starlink Standard Node</p>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Hybrid FO • Latency ~28ms • Uptime 99.8%
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">User Aktif</p>
            <p className="text-base sm:text-lg font-black text-cyan-400">
              {fin.activeCount} <span className="text-xs font-medium text-slate-400">/ {subscribers.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <MetricCard
          label="Omzet Kas Masuk"
          value={formatRupiah(fin.totalOmzet)}
          subValue={`${fin.paidCount}/${fin.activeCount} Lunas • Potensi ${formatRupiah(fin.totalPotensiOmzet)}`}
          icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="cyan"
          badge={fin.unpaidCount > 0 ? `${fin.unpaidCount} Belum` : '100% Lunas'}
        />
        <MetricCard
          label="Laba Bersih (Net)"
          value={formatRupiah(fin.netProfit)}
          subValue={`Margin: ${fin.profitMargin}% dari Kas`}
          icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Total Beban OPEX"
          value={formatRupiah(fin.totalOpex)}
          subValue="Starlink+Ops+Komisi+Cadangan"
          icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="amber"
        />
        <MetricCard
          label="Estimasi BEP"
          value={`${fin.bepMonths} Bln`}
          subValue={`CAPEX: ${formatRupiah(fin.totalCapexSpent)}`}
          icon={<Server className="w-4 h-4 sm:w-5 sm:h-5" />}
          variant="violet"
        />
      </div>

      {/* Visual OPEX Stacked Allocation */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider truncate">
            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            Alokasi Biaya OPEX &amp; Komisi
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-[11px] font-bold text-amber-400">
              {formatRupiah(fin.totalOpex)}
            </span>
            <button
              onClick={() => {
                setStarlinkCost(settings.starlink_cost);
                setNodePowerCost(settings.node_power_cost);
                setOperatorSalary(settings.operator_salary);
                setCollectorFee(settings.collector_fee_per_user ?? 5000);
                setMarketingFee(settings.marketing_fee_monthly ?? 250000);
                setReservePct(settings.reserve_fund_pct);
                setShowSettingsModal(true);
              }}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Edit Parameter Biaya OPEX"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
          <div
            className="bg-cyan-500 rounded-l-full transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.starlinkPct}%` }}
            title={`Starlink: ${fin.opexBreakdown.starlinkPct}%`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.nodePowerPct}%` }}
            title={`Listrik: ${fin.opexBreakdown.nodePowerPct}%`}
          />
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.operatorPct}%` }}
            title={`Gaji Operator: ${fin.opexBreakdown.operatorPct}%`}
          />
          <div
            className="bg-purple-500 transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.collectorPct}%` }}
            title={`Jasa Tagih: ${fin.opexBreakdown.collectorPct}%`}
          />
          <div
            className="bg-pink-500 transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.marketingPct}%` }}
            title={`Marketing: ${fin.opexBreakdown.marketingPct}%`}
          />
          <div
            className="bg-emerald-500 rounded-r-full transition-all duration-500"
            style={{ width: `${fin.opexBreakdown.reservePct}%` }}
            title={`Dana Cadangan: ${fin.opexBreakdown.reservePct}%`}
          />
        </div>

        {/* Legend Grid (Responsive 2-col with compact text) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px] pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
              Starlink
            </span>
            <span className="font-semibold">{formatRupiah(fin.starlinkCost)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              Listrik Node
            </span>
            <span className="font-semibold">{formatRupiah(fin.nodePowerCost)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              Gaji Operator
            </span>
            <span className="font-semibold">{formatRupiah(fin.operatorSalary)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              Jasa Tagih ({fin.paidCount}x5rb)
            </span>
            <span className="font-semibold text-purple-300">{formatRupiah(fin.totalCollectorFee)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
              Jasa Marketing
            </span>
            <span className="font-semibold">{formatRupiah(fin.marketingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              Dana Cadangan ({fin.reserveFundPct}%)
            </span>
            <span className="font-semibold text-emerald-400">{formatRupiah(fin.reserveFundAmount)}</span>
          </div>
        </div>
      </div>

      {/* Dividen Investor Section */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider truncate">
              <PieChart className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Dividen Investor Bulan Berjalan
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              Distribusi proporsional dari Laba Bersih ({formatRupiah(fin.netProfit)})
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('investors')}
            className="text-[10px] sm:text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-800/40 flex-shrink-0"
          >
            Detail <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {fin.investorDividends.map((inv) => (
            <div
              key={inv.id}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-100 text-xs truncate">{inv.name}</p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
                    {inv.share_percentage}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{inv.role}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-black text-xs sm:text-sm text-emerald-400">
                  {formatRupiah(inv.dividendAmount)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500">Estimasi Dividen</p>
              </div>
            </div>
          ))}

          {fin.investorDividends.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs">
              Belum ada investor terdaftar
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={() => onNavigateTab('subscribers')}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-medium">Data Pelanggan</p>
          <p className="text-sm sm:text-base font-bold text-slate-100">{subscribers.length} User</p>
          <p className="text-[9px] sm:text-[10px] text-emerald-400 mt-0.5 truncate">
            {fin.activeCount} Aktif • {subscribers.length - fin.activeCount} Isolir
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('capex')}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-violet-400">
            <Server className="w-4 h-4 sm:w-5 sm:h-5" />
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-medium">Belanja Modal</p>
          <p className="text-sm sm:text-base font-bold text-slate-100 truncate">{formatRupiah(fin.totalCapexSpent)}</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
            Dari {formatRupiah(fin.totalCapital)} Modal
          </p>
        </button>
      </div>

      {/* Parameter Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Parameter Biaya Operasional (OPEX)
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Biaya Starlink Bulanan (Rp)</label>
                <input
                  type="number"
                  value={starlinkCost}
                  onChange={(e) => setStarlinkCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Biaya Listrik Node Bulanan (Rp)</label>
                <input
                  type="number"
                  value={nodePowerCost}
                  onChange={(e) => setNodePowerCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Gaji Operator &amp; Maintenance (Rp)</label>
                <input
                  type="number"
                  value={operatorSalary}
                  onChange={(e) => setOperatorSalary(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Jasa Tagih per Pelanggan (Rp)</label>
                <input
                  type="number"
                  value={collectorFee}
                  onChange={(e) => setCollectorFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-[10px] text-slate-500">Default: Rp 5.000 per user yang lunas bayar</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Beban Komisi Marketing Rutin (Rp)</label>
                <input
                  type="number"
                  value={marketingFee}
                  onChange={(e) => setMarketingFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-[10px] text-slate-500">Default: Rp 250.000 / bulan</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Dana Cadangan Operasional (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={reservePct}
                  onChange={(e) => setReservePct(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-[10px] text-slate-500">Default: 10% dari omzet kas masuk</p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
