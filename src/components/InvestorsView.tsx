import React, { useState } from 'react';
import { PieChart, Plus, Trash2, Shield, UserCheck, Percent } from 'lucide-react';
import { Investor } from '../types';
import { formatRupiah } from './MetricCard';

interface InvestorsViewProps {
  investors: Investor[];
  netProfit: number;
  onAddInvestor: (inv: Omit<Investor, 'id'>) => void;
  onDeleteInvestor: (id: string) => void;
}

export const InvestorsView: React.FC<InvestorsViewProps> = ({
  investors,
  netProfit,
  onAddInvestor,
  onDeleteInvestor,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Managing Owner' | 'Investor'>('Investor');
  const [capitalInvested, setCapitalInvested] = useState(0);
  const [sharePercentage, setSharePercentage] = useState(0);

  const totalCapital = investors.reduce((sum, inv) => sum + inv.capital_invested, 0);
  const totalShares = investors.reduce((sum, inv) => sum + inv.share_percentage, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sharePercentage <= 0) return;

    onAddInvestor({
      name: name.trim(),
      role,
      capital_invested: capitalInvested,
      share_percentage: sharePercentage,
    });

    setName('');
    setCapitalInvested(0);
    setSharePercentage(0);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium">Struktur Ekuitas & Dividen Konsorsium</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {formatRupiah(totalCapital)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Laba Bersih Siap Bagi: <span className="text-emerald-400 font-bold">{formatRupiah(netProfit)}</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Investor
          </button>
        </div>

        {/* Saham check */}
        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
          <span className="text-slate-400">Total Alokasi Porsi Saham:</span>
          <span
            className={`font-bold ${
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
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-emerald-400" />
          Daftar Pemilik Modal & Pembagian Dividen Real-time
        </h3>

        {investors.map((inv) => {
          const dividend = (netProfit * inv.share_percentage) / 100;
          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{inv.name}</p>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {inv.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Modal Disetor: <span className="text-slate-200 font-semibold">{formatRupiah(inv.capital_invested)}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {inv.share_percentage}% Saham
                  </div>
                </div>
              </div>

              {/* Dividen Box */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Hak Dividen Bulan Ini:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {formatRupiah(dividend)}
                </span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onDeleteInvestor(inv.id)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Investor */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Tambah Investor Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Investor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Haji Rahmat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Peran / Status</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Investor">Investor Pasif</option>
                  <option value="Managing Owner">Managing Owner (Pengelola)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Modal Disetor (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={capitalInvested || ''}
                  onChange={(e) => setCapitalInvested(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Porsi Saham (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  required
                  placeholder="20"
                  value={sharePercentage || ''}
                  onChange={(e) => setSharePercentage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Simpan Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
