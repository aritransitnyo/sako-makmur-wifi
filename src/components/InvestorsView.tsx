import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  Shield,
  UserCheck,
  Percent,
  Edit3,
  History,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Hourglass,
  BadgeCheck,
  Layers,
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Wallet,
  Zap,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Investor, MonthlyClosing } from '../types';
import { formatRupiah } from './MetricCard';
import { ConfirmModal } from './ConfirmModal';

interface InvestorsViewProps {
  investors: Investor[];
  closings: MonthlyClosing[];
  netProfit: number;
  totalCapexSpent?: number;
  onAddInvestor: (inv: Omit<Investor, 'id'>) => void;
  onUpdateInvestor: (inv: Investor) => void;
  onDeleteInvestor: (id: string) => void;
  onOpenClosingModal: () => void;
  onOpenPrintModal: () => void;
}

export const calculateContractProgress = (joinDateStr?: string, totalMonths: number = 12) => {
  const safeMonths = Math.max(1, Number(totalMonths) || 12);
  let start = new Date('2026-09-01');
  if (joinDateStr) {
    const parsed = new Date(joinDateStr);
    if (!isNaN(parsed.getTime())) {
      start = parsed;
    }
  }
  const now = new Date();

  let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() >= start.getDate()) {
    monthsPassed += 1;
  }
  monthsPassed = Math.max(1, monthsPassed);
  const clampedMonths = Math.min(safeMonths, monthsPassed);
  const percent = Math.min(100, Math.round((clampedMonths / safeMonths) * 100));
  const remaining = Math.max(0, safeMonths - monthsPassed);

  const end = new Date(start);
  end.setMonth(end.getMonth() + safeMonths);
  const endStr = end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  const startStr = start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

  return { monthsPassed: clampedMonths, totalMonths: safeMonths, percent, remaining, startStr, endStr };
};

export const InvestorsView: React.FC<InvestorsViewProps> = ({
  investors,
  closings,
  netProfit,
  totalCapexSpent = 25385000,
  onAddInvestor,
  onUpdateInvestor,
  onDeleteInvestor,
  onOpenClosingModal,
  onOpenPrintModal,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [investorToDelete, setInvestorToDelete] = useState<Investor | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<'Managing Owner' | 'Investor'>('Investor');
  const [capitalInvested, setCapitalInvested] = useState(0);
  const [sharePercentage, setSharePercentage] = useState(0);
  const [joinDate, setJoinDate] = useState('2026-09-01');
  const [contractMonths, setContractMonths] = useState(12);

  const totalCapital = investors.reduce((sum, inv) => sum + inv.capital_invested, 0);
  const totalShares = investors.reduce((sum, inv) => sum + inv.share_percentage, 0);

  // Helper to calculate total historical dividends from closed books
  const getInvestorHistoricalDividends = (investorId: string, investorName: string) => {
    let sum = 0;
    closings.forEach((c) => {
      if (Array.isArray(c.investor_dividends)) {
        const item = c.investor_dividends.find(
          (d) => d.investor_id === investorId || d.name?.toLowerCase() === investorName?.toLowerCase()
        );
        if (item) {
          sum += Number(item.dividend_amount) || 0;
        }
      }
    });
    return sum;
  };

  const totalHistoricalDividends = closings.reduce((sum, c) => {
    if (Array.isArray(c.investor_dividends)) {
      return (
        sum +
        c.investor_dividends.reduce((sub, d) => sub + (Number(d.dividend_amount) || 0), 0)
      );
    }
    return sum;
  }, 0);

  const totalConsortiumEarnings = totalHistoricalDividends + netProfit;
  const overallPaybackPercent =
    totalCapital > 0
      ? Math.min(100, Number(((totalConsortiumEarnings / totalCapital) * 100).toFixed(1)))
      : 0;
  const overallBepMonths =
    netProfit > 0
      ? (Math.max(0, totalCapital - totalConsortiumEarnings) / netProfit).toFixed(1)
      : '∞';

  const handleOpenAdd = () => {
    setEditingInvestor(null);
    setName('');
    setRole('Investor');
    setCapitalInvested(0);
    setSharePercentage(0);
    setJoinDate(new Date().toISOString().split('T')[0]);
    setContractMonths(12);
    setShowModal(true);
  };

  const handleOpenEdit = (inv: Investor) => {
    setEditingInvestor(inv);
    setName(inv.name);
    setRole(inv.role);
    setCapitalInvested(inv.capital_invested);
    setSharePercentage(inv.share_percentage);
    setJoinDate(inv.join_date || '2026-09-01');
    setContractMonths(inv.contract_months || 12);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sharePercentage <= 0) return;

    if (editingInvestor) {
      onUpdateInvestor({
        ...editingInvestor,
        name: name.trim(),
        role,
        capital_invested: capitalInvested,
        share_percentage: sharePercentage,
        join_date: joinDate,
        contract_months: contractMonths || 12,
      });
    } else {
      onAddInvestor({
        name: name.trim(),
        role,
        capital_invested: capitalInvested,
        share_percentage: sharePercentage,
        join_date: joinDate,
        contract_months: contractMonths || 12,
      });
    }

    setEditingInvestor(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Header Banner Konsorsium */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 space-y-3.5 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Ekuitas &amp; Portofolio Konsorsium
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {formatRupiah(totalCapital)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Total Modal Disetor 3 Investor • 100% Dialokasikan ke Infrastruktur
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={onOpenPrintModal}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors font-bold shadow"
              title="Cetak Laporan Resmi Investor"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={onOpenClosingModal}
              className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors font-bold shadow"
              title="Tutup Buku Bulanan &amp; Arsip Dividen"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup Buku</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah
            </button>
          </div>
        </div>

        {/* 4 KPI Ringkasan Konsorsium */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Total Dividen
            </span>
            <p className="text-xs sm:text-sm font-black text-emerald-400">{formatRupiah(totalConsortiumEarnings)}</p>
            <p className="text-[9px] text-slate-400">{overallPaybackPercent}% dari modal awal</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-cyan-400" /> Laba Siap Bagi
            </span>
            <p className="text-xs sm:text-sm font-black text-cyan-300">{formatRupiah(netProfit)}</p>
            <p className="text-[9px] text-slate-400">Bulan berjalan (tgl 25)</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-violet-400" /> Aset Fisik Riil
            </span>
            <p className="text-xs sm:text-sm font-black text-violet-300">{formatRupiah(totalCapexSpent)}</p>
            <p className="text-[9px] text-emerald-400 font-semibold">Cover 101.5% modal</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <span className="text-[9.5px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-amber-400" /> Estimasi BEP
            </span>
            <p className="text-xs sm:text-sm font-black text-amber-300">
              {overallBepMonths === '0' ? 'Impas' : `${overallBepMonths} Bulan`}
            </p>
            <p className="text-[9px] text-slate-400">Laju profit saat ini</p>
          </div>
        </div>

        {/* Saham check */}
        <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800">
          <span className="text-slate-400">Total Alokasi Porsi Saham:</span>
          <span
            className={`font-black ${
              Math.abs(totalShares - 100) < 0.1
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {totalShares.toFixed(1)}% {Math.abs(totalShares - 100) < 0.1 ? '✓ Pas 100%' : '⚠️ Belum 100%'}
          </span>
        </div>
      </div>

      {/* Transparansi Nilai Aset Fisik & Klausul Kontrak */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Kepemilikan Aset Jaringan Konsorsium</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-black text-[10px] border border-cyan-800/40">
            Aset Riil: {formatRupiah(totalCapexSpent)}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Modal disetor para mitra telah dibelanjakan menjadi aset produktif fisik (Starlink Kit, Core Router MikroTik, OLT HiOSO, Kabel Dropcore FO, dan UPS). Seluruh aset fisik adalah milik bersama konsorsium secara proporsional:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {investors.map((inv) => (
            <div key={inv.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-0.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-semibold truncate">{inv.name.split(' ')[0]}</span>
                <span className="font-bold text-emerald-400">{inv.share_percentage}%</span>
              </div>
              <p className="font-black text-xs text-slate-200">
                {formatRupiah((totalCapexSpent * inv.share_percentage) / 100)}
              </p>
            </div>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1 text-[10.5px] text-slate-400">
          <p className="font-semibold text-slate-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Klausul Kontrak 12 Bulan (Sep 2026 - Agu 2027)
          </p>
          <p className="leading-normal">
            Dividen bulanan (tgl 25) merupakan bagi hasil atas laba operasional bersih. Setelah masa kontrak 12 bulan berakhir, mitra investor dapat memperpanjang kontrak bagi hasil dividen atau melakukan evaluasi pengalihan valuasi kepemilikan aset.
          </p>
        </div>
      </div>

      {/* Investors List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5 uppercase tracking-wider">
          <PieChart className="w-4 h-4 text-emerald-400" />
          Rapor Portofolio &amp; Balik Modal Per Investor
        </h3>

        {investors.map((inv) => {
          const dividend = (netProfit * inv.share_percentage) / 100;
          const contract = calculateContractProgress(inv.join_date, inv.contract_months || 12);
          const historicalDividends = getInvestorHistoricalDividends(inv.id, inv.name);
          const totalEarned = historicalDividends + dividend;
          const paybackPercent =
            inv.capital_invested > 0
              ? Math.min(100, Number(((totalEarned / inv.capital_invested) * 100).toFixed(1)))
              : 0;
          const remainingCapital = Math.max(0, inv.capital_invested - totalEarned);
          const assetShare = (totalCapexSpent * inv.share_percentage) / 100;
          let bepEstimate = '∞';
          if (remainingCapital <= 0) {
            bepEstimate = '0';
          } else if (dividend > 0) {
            bepEstimate = (remainingCapital / dividend).toFixed(1);
          }

          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-xs space-y-3.5 shadow-md"
            >
              {/* Header Investor */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{inv.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {inv.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mulai Bergabung: <span className="text-slate-300 font-semibold">{contract.startStr}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {inv.share_percentage}% Saham
                  </div>
                </div>
              </div>

              {/* Rapor Finansial 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Modal Awal Disetor */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-slate-400" /> Modal Awal
                  </p>
                  <p className="font-black text-xs text-slate-100">{formatRupiah(inv.capital_invested)}</p>
                  <p className="text-[9.5px] text-slate-500">100% dialokasikan</p>
                </div>

                {/* 2. Sudah Untung Berapa (Masuk Rekening) */}
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-0.5">
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" /> Sudah Untung Masuk
                  </p>
                  <p className="font-black text-xs text-emerald-300">{formatRupiah(totalEarned)}</p>
                  <p className="text-[9.5px] text-slate-400">
                    Bln ini: {formatRupiah(dividend)} • Lalu: {formatRupiah(historicalDividends)}
                  </p>
                </div>

                {/* 3. Sisa Modal Belum Kembali & BEP */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Hourglass className="w-3 h-3 text-amber-400" /> Sisa Belum Impas
                  </p>
                  <p className={`font-black text-xs ${remainingCapital <= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {remainingCapital <= 0 ? 'LUNAS / IMPAS 🎉' : formatRupiah(remainingCapital)}
                  </p>
                  <p className="text-[9.5px] text-slate-400">
                    BEP: {bepEstimate === '0' ? 'Sudah Impas' : `${bepEstimate} Bln lagi`}
                  </p>
                </div>

                {/* 4. Nilai Aset Fisik Penjamin */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" /> Aset Penjamin
                  </p>
                  <p className="font-black text-xs text-cyan-300">{formatRupiah(assetShare)}</p>
                  <p className="text-[9.5px] text-slate-500">Starlink, FO, OLT, UPS</p>
                </div>
              </div>

              {/* Progress Bar Balik Modal (Payback / ROI) */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Progres Balik Modal (ROI)
                  </span>
                  <span className="font-black text-emerald-400">{paybackPercent}% Kembali</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(4, paybackPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Diterima: {formatRupiah(totalEarned)}</span>
                  <span>Target Modal: {formatRupiah(inv.capital_invested)}</span>
                </div>
              </div>

              {/* Progress Masa Kontrak Minimal 1 Tahun */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Masa Kontrak: Bulan ke-{contract.monthsPassed} dari {contract.totalMonths} Bln
                  </span>
                  <span className="font-black text-cyan-300">{contract.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${contract.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Mulai: {contract.startStr}</span>
                  <span className="text-amber-300 font-semibold">
                    {contract.remaining > 0 ? `Sisa ${contract.remaining} bulan lagi` : 'Kontrak Selesai / Siap Perpanjang'}
                  </span>
                  <span>Berakhir: {contract.endStr}</span>
                </div>
              </div>

              {/* Hak Dividen Bulan Berjalan Bar */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Hak Dividen Bulan Ini</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Tutup buku &amp; transfer dividen tgl 25</p>
                </div>
                <span className="font-black text-base text-emerald-300">
                  {formatRupiah(dividend)}
                </span>
              </div>

              <div className="flex justify-end pt-1 gap-2">
                <button
                  onClick={() => handleOpenEdit(inv)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Edit Investor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setInvestorToDelete(inv)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          );
        })}

        {investors.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60">
            Belum ada data investor atau pemegang saham.
          </div>
        )}
      </div>

      {/* Simulator Percepatan Balik Modal Berbasis Pelanggan */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulasi Percepatan Balik Modal Berbasis Pelanggan</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px]">
            Estimasi Laba
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Karakteristik bisnis ISP: Beban operasional (Starlink, PLN, Gaji) bersifat flat/tetap (~Rp 2,4 Jt). Setiap penambahan pelanggan baru langsung melipatgandakan dividen dan mempercepat BEP:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Skenario 1: 11 User */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200">11 User (Sekarang)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">Impas OPEX</span>
            </div>
            <p className="text-[10.5px] text-slate-400">Omzet: Rp 2,6 Jt • Laba: ~Rp 85rb</p>
            <p className="text-xs font-black text-amber-300">Dividen 20%: Rp 17.000 /bln</p>
            <p className="text-[10px] text-slate-500">Estimasi Balik Modal: Lambat</p>
          </div>

          {/* Skenario 2: 20 User */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-cyan-200">20 User (+9 User)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">Tumbuh 22x</span>
            </div>
            <p className="text-[10.5px] text-slate-400">Omzet: Rp 4,8 Jt • Laba: ~Rp 1,9 Jt</p>
            <p className="text-xs font-black text-cyan-300">Dividen 20%: Rp 380.000 /bln</p>
            <p className="text-[10px] text-emerald-400 font-semibold">Estimasi Balik Modal: ±13 Bulan</p>
          </div>

          {/* Skenario 3: 30 User */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-200">30 User (+19 User)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">Optimal 48x</span>
            </div>
            <p className="text-[10.5px] text-slate-400">Omzet: Rp 7,2 Jt • Laba: ~Rp 4,1 Jt</p>
            <p className="text-xs font-black text-emerald-300">Dividen 20%: Rp 820.000 /bln</p>
            <p className="text-[10px] text-emerald-400 font-bold">Estimasi Balik Modal: ±6 Bulan 🎉</p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Tutup Buku Bulanan (Audit Trail) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3 text-xs">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <History className="w-4 h-4 text-cyan-400" />
            Riwayat Arsip Tutup Buku Bulanan
          </h3>
          <button
            onClick={onOpenClosingModal}
            className="text-[11px] text-cyan-400 hover:underline font-semibold"
          >
            Lihat Lengkap &gt;
          </button>
        </div>

        {closings.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {closings.map((c) => (
              <div key={c.id} className="py-2.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-100">{c.period_month}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      {new Date(c.closed_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <span className="font-black text-emerald-400">
                    {formatRupiah(c.net_profit)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                  {c.investor_dividends.map((d) => (
                    <span
                      key={d.investor_id}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                    >
                      {d.name.split(' ')[0]}: <strong className="text-slate-200">{formatRupiah(d.dividend_amount)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4 text-xs">
            Belum ada arsip tutup buku.
          </p>
        )}
      </div>

      {/* Modal Tambah / Edit Investor */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                {editingInvestor ? 'Edit Data Investor' : 'Tambah Investor Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nama Investor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Haji Rahmat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Peran / Status</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Investor">Investor Pasif</option>
                  <option value="Managing Owner">Managing Owner (Pengelola)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Modal Disetor (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={capitalInvested || ''}
                    onChange={(e) => setCapitalInvested(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Porsi Saham (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    required
                    placeholder="20"
                    value={sharePercentage || ''}
                    onChange={(e) => setSharePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Kontrak Investasi Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tgl Mulai Kontrak</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Durasi Kontrak (Bulan)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={contractMonths}
                    onChange={(e) => setContractMonths(parseInt(e.target.value) || 12)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                >
                  {editingInvestor ? 'Simpan Perubahan' : 'Simpan Investor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(investorToDelete)}
        title="Hapus Data Investor"
        message={`Apakah Anda yakin ingin menghapus data investor "${investorToDelete?.name}" (${investorToDelete?.share_percentage}% saham)?`}
        onConfirm={() => {
          if (investorToDelete) {
            onDeleteInvestor(investorToDelete.id);
            setInvestorToDelete(null);
          }
        }}
        onCancel={() => setInvestorToDelete(null)}
      />
    </div>
  );
};
