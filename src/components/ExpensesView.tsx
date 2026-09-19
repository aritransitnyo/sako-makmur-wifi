import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Calendar, FileText, ArrowDownRight, Tag } from 'lucide-react';
import { ExpenseTransaction } from '../types';
import { formatRupiah } from './MetricCard';

interface ExpensesViewProps {
  expenses: ExpenseTransaction[];
  realCashIn: number;
  onAddExpense: (item: Omit<ExpenseTransaction, 'id' | 'created_at'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  realCashIn,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<ExpenseTransaction['category']>('Listrik & Token PLN');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = realCashIn - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description) return;

    onAddExpense({
      date,
      category,
      amount,
      description: description.trim(),
    });

    setAmount(0);
    setDescription('');
    setShowModal(false);
  };

  const getCategoryColor = (cat: ExpenseTransaction['category']) => {
    switch (cat) {
      case 'Langganan Starlink':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Listrik & Token PLN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Gaji Operator':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Bensin & Transport':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Sparepart & Konektor FO':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Cashflow Summary Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/25 shadow-lg space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Buku Kas & Biaya Riil Bulan Ini
            </p>
            <p className="text-2xl font-black text-slate-50 mt-0.5">
              {formatRupiah(totalExpense)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari Kas Iuran Diterima:{' '}
              <span className="text-emerald-400 font-bold">{formatRupiah(realCashIn)}</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Catat Biaya
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Sisa Kas Operasional:</span>
          <span
            className={`font-black text-sm ${
              netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatRupiah(netCashFlow)}
          </span>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5 uppercase tracking-wider">
          <Wallet className="w-4 h-4 text-amber-400" />
          Rincian Pengeluaran Terjadwal ({expenses.length} Transaksi)
        </h3>

        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all text-xs shadow-md space-y-2"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(
                      exp.category
                    )}`}
                  >
                    {exp.category}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {exp.date}
                  </span>
                </div>
                <p className="font-bold text-slate-100 text-sm mt-0.5">{exp.description}</p>
              </div>

              <div className="text-right">
                <p className="font-black text-sm text-rose-400">
                  - {formatRupiah(exp.amount)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => onDeleteExpense(exp.id)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </button>
            </div>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60">
            Belum ada pengeluaran yang dicatat bulan ini.
          </div>
        )}
      </div>

      {/* Modal Tambah Biaya */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Catat Pengeluaran Riil
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
                <label className="block text-slate-400 mb-1 font-medium">Tanggal</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Kategori Biaya</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Langganan Starlink">Langganan Starlink</option>
                  <option value="Listrik & Token PLN">Listrik & Token PLN</option>
                  <option value="Gaji Operator">Gaji Operator & Helpdesk</option>
                  <option value="Bensin & Transport">Bensin & Transport Patroli</option>
                  <option value="Sparepart & Konektor FO">Sparepart & Konektor FO</option>
                  <option value="Lain-lain">Lain-lain / Konsumsi / Lakban</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Keterangan Pengeluaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli token PLN 200rb untuk node 2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nominal Biaya (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  placeholder="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-amber-500"
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
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
