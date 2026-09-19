import React, { useState } from 'react';
import { Sliders, RefreshCw, TrendingUp, DollarSign, Calculator, AlertTriangle } from 'lucide-react';
import { BusinessSettings, Investor, CapexItem } from '../types';
import { formatRupiah, MetricCard } from './MetricCard';

interface SimulatorViewProps {
  settings: BusinessSettings;
  investors: Investor[];
  capexItems: CapexItem[];
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  settings,
  investors,
  capexItems,
}) => {
  // Simulator Sliders
  const [userCount, setUserCount] = useState<number>(35);
  const [arpu, setArpu] = useState<number>(150000);
  const [starlinkCost, setStarlinkCost] = useState<number>(settings.starlink_cost || 850000);
  const [nodePowerCost, setNodePowerCost] = useState<number>(settings.node_power_cost || 300000);
  const [operatorSalary, setOperatorSalary] = useState<number>(settings.operator_salary || 1000000);
  const [collectorFeePerUser, setCollectorFeePerUser] = useState<number>(settings.collector_fee_per_user ?? 5000);
  const [marketingFee, setMarketingFee] = useState<number>(settings.marketing_fee_monthly ?? 250000);
  const [reservePct, setReservePct] = useState<number>(settings.reserve_fund_pct || 10.0);

  // Live Calculations according to PRD
  const totalOmzet = userCount * arpu;
  const totalCollectorFee = userCount * collectorFeePerUser;
  const reserveFund = totalOmzet * (reservePct / 100);
  const totalOpex = starlinkCost + nodePowerCost + operatorSalary + totalCollectorFee + marketingFee + reserveFund;
  const netProfit = Math.max(0, totalOmzet - totalOpex);
  const profitMargin = totalOmzet > 0 ? ((netProfit / totalOmzet) * 100).toFixed(1) : '0';

  const totalCapex = capexItems.reduce((sum, item) => sum + item.total_price, 0);
  const bepMonths = netProfit > 0 ? (totalCapex / netProfit).toFixed(1) : (totalCapex <= 0 ? '0.0' : '∞');

  const handleReset = () => {
    setUserCount(35);
    setArpu(150000);
    setStarlinkCost(settings.starlink_cost || 850000);
    setNodePowerCost(settings.node_power_cost || 300000);
    setOperatorSalary(settings.operator_salary || 1000000);
    setCollectorFeePerUser(settings.collector_fee_per_user ?? 5000);
    setMarketingFee(settings.marketing_fee_monthly ?? 250000);
    setReservePct(settings.reserve_fund_pct || 10.0);
  };

  return (
    <div className="space-y-5 pb-24 page-transition">
      {/* Simulator Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900 border border-cyan-500/20 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            Simulator Finansial & Proyeksi BEP
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Eksperimen skenario jumlah user, ARPU, dan biaya operasional
          </p>
        </div>
        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
          title="Reset ke Standar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Live Result Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Simulasi Omzet Kotor"
          value={formatRupiah(totalOmzet)}
          subValue={`${userCount} User @ ${formatRupiah(arpu)}`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="cyan"
        />
        <MetricCard
          label="Simulasi Laba Bersih"
          value={formatRupiah(netProfit)}
          subValue={`Margin: ${profitMargin}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
        />
      </div>

      {/* Sliders Box */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-200">Parameter Simulasi Interaktif</h3>

        {/* User Count Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Target Pelanggan Aktif:</span>
            <span className="text-cyan-400 font-bold text-sm">{userCount} Pelanggan</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            step="1"
            value={userCount}
            onChange={(e) => setUserCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5 User</span>
            <span>75 User</span>
            <span>150 User</span>
          </div>
        </div>

        {/* ARPU Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Tarif Rata-rata Bulanan (ARPU):</span>
            <span className="text-cyan-400 font-bold text-sm">{formatRupiah(arpu)}</span>
          </div>
          <input
            type="range"
            min="75000"
            max="250000"
            step="5000"
            value={arpu}
            onChange={(e) => setArpu(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Rp 75.000</span>
            <span>Rp 150.000</span>
            <span>Rp 250.000</span>
          </div>
        </div>

        {/* Starlink Cost Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Biaya Langganan Starlink:</span>
            <span className="text-amber-400 font-bold">{formatRupiah(starlinkCost)}</span>
          </div>
          <input
            type="range"
            min="750000"
            max="2000000"
            step="50000"
            value={starlinkCost}
            onChange={(e) => setStarlinkCost(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Node Power Cost Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Biaya Listrik Node:</span>
            <span className="text-amber-400 font-bold">{formatRupiah(nodePowerCost)}</span>
          </div>
          <input
            type="range"
            min="100000"
            max="1000000"
            step="50000"
            value={nodePowerCost}
            onChange={(e) => setNodePowerCost(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Operator Salary Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Gaji Operator:</span>
            <span className="text-amber-400 font-bold">{formatRupiah(operatorSalary)}</span>
          </div>
          <input
            type="range"
            min="500000"
            max="3000000"
            step="100000"
            value={operatorSalary}
            onChange={(e) => setOperatorSalary(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Dana Cadangan Pct */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Alokasi Dana Cadangan (% dari Omzet):</span>
            <span className="text-emerald-400 font-bold">{reservePct}% ({formatRupiah(reserveFund)})</span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={reservePct}
            onChange={(e) => setReservePct(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* BEP Projections Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-violet-950/30 border border-violet-500/20 space-y-3">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Proyeksi Titik Impas (BEP Skenario Ini)
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <p className="text-slate-400">Total CAPEX Belanja</p>
            <p className="text-base font-bold text-slate-200 mt-1">{formatRupiah(totalCapex)}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <p className="text-slate-400">Waktu Balik Modal</p>
            <p className="text-base font-bold text-violet-400 mt-1">{bepMonths} Bulan</p>
          </div>
        </div>
        {netProfit === 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Perhatian: Pada skenario ini omzet belum menutup seluruh OPEX (Break-even belum tercapai).
            </span>
          </div>
        )}
      </div>

      {/* Projected Dividend Distribution under Simulation */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-100">
          Proyeksi Dividen Investor (Skenario Simulasi)
        </h3>
        <div className="divide-y divide-slate-800">
          {investors.map((inv) => {
            const simulatedDividend = (netProfit * inv.share_percentage) / 100;
            return (
              <div key={inv.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-200">{inv.name}</p>
                  <p className="text-slate-500 text-[11px]">Porsi: {inv.share_percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{formatRupiah(simulatedDividend)}</p>
                  <p className="text-[10px] text-slate-500">/ bulan</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
