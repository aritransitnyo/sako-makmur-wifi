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
} from 'lucide-react';
import { Investor, MonthlyClosing } from '../types';
import { formatRupiah } from './MetricCard';
import { ConfirmModal } from './ConfirmModal';

interface InvestorsViewProps {
  investors: Investor[];
  closings: MonthlyClosing[];
  netProfit: number;
  onAddInvestor: (inv: Omit<Investor, 'id'>) => void;
  onUpdateInvestor: (inv: Investor) => void;
  onDeleteInvestor: (id: string) => void;
  onOpenClosingModal: () => void;
  onOpenPrintModal: () => void;
}

export const InvestorsView: React.FC<InvestorsViewProps> = ({
  investors,
  closings,
  netProfit,
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

  const totalCapital = investors.reduce((sum, inv) => sum + inv.capital_invested, 0);
  const totalShares = investors.reduce((sum, inv) => sum + inv.share_percentage, 0);

  const handleOpenAdd = () => {
    setEditingInvestor(null);
    setName('');
    setRole('Investor');
    setCapitalInvested(0);
    setSharePercentage(0);
    setShowModal(true);
  };

  const handleOpenEdit = (inv: Investor) => {
    setEditingInvestor(inv);
    setName(inv.name);
    setRole(inv.role);
    setCapitalInvested(inv.capital_invested);
    setSharePercentage(inv.share_percentage);
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
      });
    } else {
      onAddInvestor({
        name: name.trim(),
        role,
        capital_invested: capitalInvested,
        share_percentage: sharePercentage,
      });
    }

    setName('');
    setCapitalInvested(0);
    setSharePercentage(0);
    setEditingInvestor(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 space-y-3 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Struktur Ekuitas &amp; Dividen Konsorsium
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {formatRupiah(totalCapital)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Laba Bersih Siap Bagi: <span className="text-emerald-400 font-bold">{formatRupiah(netProfit)}</span>
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

      {/* Investors List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5 uppercase tracking-wider">
          <PieChart className="w-4 h-4 text-emerald-400" />
          Daftar Pemilik Modal &amp; Pembagian Dividen
        </h3>

        {investors.map((inv) => {
          const dividend = (netProfit * inv.share_percentage) / 100;
          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-xs space-y-3 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{inv.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {inv.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Modal Disetor: <span className="text-slate-200 font-bold">{formatRupiah(inv.capital_invested)}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {inv.share_percentage}% Saham
                  </div>
                </div>
              </div>

              {/* Dividen Box */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Hak Dividen Bulan Ini:</span>
                <span className="font-black text-sm text-emerald-400">
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
