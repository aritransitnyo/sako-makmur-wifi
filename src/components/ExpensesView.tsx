import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  FileText,
  ArrowDownRight,
  Tag,
  Edit3,
  ExternalLink,
  Layers,
  Banknote,
  PiggyBank,
  ShieldCheck,
  Shield,
  Wrench,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ExpenseTransaction, MonthlyClosing } from '../types';
import { formatRupiah } from './MetricCard';
import { ConfirmModal } from './ConfirmModal';

interface ExpensesViewProps {
  expenses: ExpenseTransaction[];
  realCashIn: number;
  sisaKasModal: number;
  cumulativeReserveFund?: number;
  reserveFundSpent?: number;
  totalReserveAllocated?: number;
  activePeriodKey?: string;
  activePeriodMonth?: string;
  closings?: MonthlyClosing[];
  onAddExpense: (item: Omit<ExpenseTransaction, 'id' | 'created_at'>) => void;
  onUpdateExpense: (item: ExpenseTransaction) => void;
  onDeleteExpense: (id: string) => void;
  onSyncRoutineExpenses?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  realCashIn,
  sisaKasModal,
  cumulativeReserveFund = 0,
  reserveFundSpent = 0,
  totalReserveAllocated = 0,
  activePeriodKey,
  activePeriodMonth = 'Oktober 2026',
  closings = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onSyncRoutineExpenses,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);
  const [expToDelete, setExpToDelete] = useState<ExpenseTransaction | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'Kas Operasional' | 'Kas Dana Cadangan (Maintenance)' | 'Kas Sisa Modal'
  >('all');
  const [periodFilter, setPeriodFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Form State
  const [category, setCategory] = useState<string>('Listrik & Token PLN');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fundSource, setFundSource] = useState<
    'Kas Operasional' | 'Kas Sisa Modal' | 'Kas Dana Cadangan (Maintenance)' | 'Dana Talangan Pengelola'
  >('Kas Operasional');
  const [receiptUrl, setReceiptUrl] = useState('');

  // Latest closing for period segregation
  const latestClosing = closings && closings.length > 0
    ? [...closings].sort((a, b) => (b.period_key || '').localeCompare(a.period_key || ''))[0]
    : null;

  const isArchivedExpense = (exp: ExpenseTransaction) => {
    if (!latestClosing) return false;
    const expKey = (exp.date || '').slice(0, 7);
    if (expKey && expKey <= latestClosing.period_key) return true;
    if (exp.created_at && latestClosing.closed_at && exp.created_at <= latestClosing.closed_at) return true;
    return false;
  };

  // Calculations
  const expenseItems = expenses.filter((e) => e.type !== 'income');
  const opexExpenses = expenseItems.filter(
    (e) => !e.fund_source || e.fund_source === 'Kas Operasional'
  );
  // Current active period operational expenses
  const activeOpexExpenses = opexExpenses.filter((e) => !isArchivedExpense(e));
  const archivedExpenses = expenses.filter((e) => isArchivedExpense(e));
  const activeExpenses = expenses.filter((e) => !isArchivedExpense(e));

  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const totalOpexBerjalan = activeOpexExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netKasOperasional = realCashIn - totalOpexBerjalan;

  // Filtered list
  const displayedExpenses = expenses.filter((e) => {
    if (periodFilter === 'active' && isArchivedExpense(e)) return false;
    if (periodFilter === 'archived' && !isArchivedExpense(e)) return false;
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'Kas Operasional') return !e.fund_source || e.fund_source === 'Kas Operasional';
    return e.fund_source === selectedFilter;
  });

  const displayedExpenseItems = displayedExpenses.filter((e) => e.type !== 'income');
  const displayedExpenseAmount = displayedExpenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setCategory('Listrik & Token PLN');
    setAmount(0);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setFundSource('Kas Operasional');
    setReceiptUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (exp: ExpenseTransaction) => {
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDescription(exp.description);
    setDate(exp.date);
    setFundSource(exp.fund_source || 'Kas Operasional');
    setReceiptUrl(exp.receipt_url || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description) return;

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        date,
        category,
        amount,
        description: description.trim(),
        fund_source: fundSource,
        receipt_url: receiptUrl.trim() || undefined,
      });
    } else {
      onAddExpense({
        date,
        category,
        amount,
        description: description.trim(),
        fund_source: fundSource,
        receipt_url: receiptUrl.trim() || undefined,
      });
    }

    setEditingExpense(null);
    setShowModal(false);
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes('Starlink')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (cat.includes('Listrik') || cat.includes('PLN')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (cat.includes('Gaji') || cat.includes('Operator')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (cat.includes('Bensin') || cat.includes('Transport')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (cat.includes('Sparepart') || cat.includes('FO')) return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    if (cat.includes('Darurat') || cat.includes('Force')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (cat.includes('ONT') || cat.includes('Router')) return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* 3 Kantong Kas: Operasional vs Sisa Modal vs Dana Cadangan (Tabungan) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Kantong 1: Kas Operasional */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/25 shadow-lg space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5" /> Kas Operasional
          </p>
          <p
            className={`text-base sm:text-lg font-black mt-1 ${
              netKasOperasional >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatRupiah(netKasOperasional)}
          </p>
          <p className="text-[10px] text-slate-400">
            Masuk: {formatRupiah(realCashIn)} • OPEX: {formatRupiah(totalOpexBerjalan)}
          </p>
        </div>

        {/* Kantong 2: Kas Sisa Modal */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/25 shadow-lg space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
            <PiggyBank className="w-3.5 h-3.5" /> Kas Sisa Modal
          </p>
          <p className="text-base sm:text-lg font-black text-violet-300 mt-1">
            {formatRupiah(sisaKasModal)}
          </p>
          <p className="text-[10px] text-slate-400">
            Kas Belanja Alat (CAPEX)
          </p>
        </div>

        {/* Kantong 3: Kas Dana Cadangan (Tabungan Jaringan) */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/25 shadow-lg space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Tabungan Cadangan
          </p>
          <p className="text-base sm:text-lg font-black text-cyan-300 mt-1">
            {formatRupiah(cumulativeReserveFund)}
          </p>
          <p className="text-[10px] text-slate-400">
            Alokasi: {formatRupiah(totalReserveAllocated)} • Pakai: {formatRupiah(reserveFundSpent)}
          </p>
        </div>
      </div>

      {/* Auto-Sync Banner & Single Source of Truth Notice */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Single Source of Truth: Pengeluaran Buku Kas = OPEX Dashboard</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Semua item Kas Operasional di sini otomatis menjadi potongan biaya OPEX di Dashboard dan dividen investor tanpa selisih rupiah.
          </p>
        </div>
        {onSyncRoutineExpenses && (
          <button
            onClick={onSyncRoutineExpenses}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex-shrink-0 active:scale-95 shadow-sm"
            title="Sinkronkan beban rutin (Starlink, Listrik, Gaji Operator 500rb, Marketing 50rb, Jasa Tagih) ke Buku Kas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sinkron Beban Rutin
          </button>
        )}
      </div>

      {/* Button Catat Biaya Bar */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs font-bold text-slate-200">
            {periodFilter === 'active'
              ? `Buku Kas Periode ${activePeriodMonth}`
              : periodFilter === 'archived'
              ? `Arsip Buku Kas (${latestClosing?.period_month || 'Periode Lalu'})`
              : 'Semua Riwayat Buku Kas'}
          </p>
          <p className="text-[11px] text-slate-400">
            {periodFilter === 'active' ? (
              <>
                <span className="text-slate-300 font-medium">{displayedExpenses.length} Transaksi Bulan Ini</span>
                {' • '}
                Beban OPEX: <span className="text-rose-400 font-bold">{formatRupiah(displayedExpenseAmount)}</span>
              </>
            ) : periodFilter === 'archived' ? (
              <>
                <span className="text-slate-300 font-medium">{displayedExpenses.length} Transaksi Arsip</span>
                {' • '}
                Beban Ditutup: <span className="text-rose-400 font-bold">{formatRupiah(displayedExpenseAmount)}</span>
              </>
            ) : (
              <>
                <span className="text-slate-300 font-medium">Total {expenses.length} Transaksi Kumulatif</span>
                {' • '}
                Total Riil: <span className="text-rose-400 font-bold">{formatRupiah(totalExpense)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSyncRoutineExpenses && (
            <button
              onClick={onSyncRoutineExpenses}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Sync
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Catat Biaya
          </button>
        </div>
      </div>

      {/* Period Segregation Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setPeriodFilter('active')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
            periodFilter === 'active'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚡ Periode Berjalan</span>
          <span className="font-mono text-[11px]">({activePeriodMonth})</span>
        </button>
        {archivedExpenses.length > 0 && (
          <button
            onClick={() => setPeriodFilter('archived')}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              periodFilter === 'archived'
                ? 'bg-slate-700 text-slate-100 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Arsip Ditutup ({archivedExpenses.length})</span>
          </button>
        )}
        <button
          onClick={() => setPeriodFilter('all')}
          className={`py-2 px-3 rounded-xl font-bold transition-all ${
            periodFilter === 'all'
              ? 'bg-slate-700 text-slate-100 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Semua ({expenses.length})
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedFilter === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Semua ({expenses.length})
        </button>
        <button
          onClick={() => setSelectedFilter('Kas Operasional')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedFilter === 'Kas Operasional'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Kas Operasional
        </button>
        <button
          onClick={() => setSelectedFilter('Kas Dana Cadangan (Maintenance)')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
            selectedFilter === 'Kas Dana Cadangan (Maintenance)'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'bg-slate-900 text-cyan-400 border border-slate-800 hover:text-cyan-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Tabungan Cadangan ({expenses.filter((e) => e.fund_source === 'Kas Dana Cadangan (Maintenance)').length})
        </button>
        <button
          onClick={() => setSelectedFilter('Kas Sisa Modal')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedFilter === 'Kas Sisa Modal'
              ? 'bg-violet-500 text-slate-950 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Kas Sisa Modal
        </button>
      </div>

      {/* Audit Banner khusus Kas Dana Cadangan */}
      {selectedFilter === 'Kas Dana Cadangan (Maintenance)' && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Audit Kas Dana Cadangan &amp; Maintenance
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[10px]">
              Saldo Tersimpan: {formatRupiah(cumulativeReserveFund)}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Dana cadangan 10% disisihkan setiap tutup buku tanggal 20 ke rekening khusus tabungan. Biaya perbaikan darurat/force majeure yang ditarik dari kantong ini tidak mengurangi laba bersih dividen bulan berjalan.
          </p>
        </div>
      )}

      {/* Expenses History List */}
      <div className="space-y-2.5">
        {displayedExpenses.map((exp) => (
          <div
            key={exp.id}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all text-xs shadow-md space-y-2"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(
                      exp.category
                    )}`}
                  >
                    {exp.category}
                  </span>
                  {isArchivedExpense(exp) ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
                      <Lock className="w-2.5 h-2.5" /> Ditutup ({latestClosing?.period_month || 'Lalu'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      ⚡ Periode Aktif
                    </span>
                  )}
                  {exp.type === 'income' && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                      Pemasukan
                    </span>
                  )}
                  {exp.fund_source && (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                        exp.fund_source === 'Kas Dana Cadangan (Maintenance)'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
                          : exp.fund_source === 'Kas Sisa Modal'
                          ? 'bg-violet-950/80 text-violet-300 border-violet-600/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {exp.fund_source === 'Kas Dana Cadangan (Maintenance)' && (
                        <Shield className="w-2.5 h-2.5 inline mr-1 text-cyan-400" />
                      )}
                      {exp.fund_source}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {exp.date}
                  </span>
                </div>
                <p className="font-bold text-slate-100 text-sm mt-0.5">{exp.description}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p
                  className={`font-black text-sm ${
                    exp.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {exp.type === 'income' ? '+' : '-'} {formatRupiah(exp.amount)}
                </p>
                {exp.receipt_url && (
                  <a
                    href={exp.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline mt-0.5"
                  >
                    Bukti Nota <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(exp)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                title="Edit Pengeluaran"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setExpToDelete(exp)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60">
            Belum ada pengeluaran yang dicatat.
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Biaya */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md my-auto flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                {editingExpense ? 'Edit Pengeluaran Riil' : 'Catat Pengeluaran Riil'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs">
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
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Langganan Starlink">Langganan Starlink</option>
                    <option value="Listrik & Token PLN">Listrik &amp; Token PLN</option>
                    <option value="Gaji Operator">Gaji Operator &amp; Helpdesk (Rp 500rb)</option>
                    <option value="Komisi Marketing">Komisi Marketing (Rp 50rb)</option>
                    <option value="Jasa Tagih Lapangan">Jasa Tagih Lapangan (Rp 5rb/user)</option>
                    <option value="Bensin & Transport">Bensin &amp; Transport Patroli</option>
                    <option value="Sparepart & Konektor FO">Sparepart &amp; Konektor FO Siaga</option>
                    <option value="Perbaikan Darurat / Force Majeure">Perbaikan Darurat / Force Majeure</option>
                    <option value="Ganti Router ONT Pelanggan">Ganti Router ONT Pelanggan</option>
                    <option value="Lain-lain">Lain-lain / Operasional</option>
                  </select>
                </div>

                {/* Sumber Dana Selector */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Sumber Dana</label>
                  <select
                    value={fundSource}
                    onChange={(e) => setFundSource(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kas Operasional">Kas Operasional (Iuran Pelanggan)</option>
                    <option value="Kas Sisa Modal">Kas Sisa Modal Investor (CAPEX)</option>
                    <option value="Kas Dana Cadangan (Maintenance)">Kas Dana Cadangan (Tabungan Jaringan / Maintenance)</option>
                    <option value="Dana Talangan Pengelola">Dana Talangan Pengelola</option>
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

                {/* URL Bukti / Nota */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    URL Link Bukti Nota / Foto (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... atau link foto"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons Sticky / Pinned Footer */}
              <div className="p-4 sm:p-5 pt-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur shrink-0 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingExpense ? 'Simpan Perubahan' : 'Simpan Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(expToDelete)}
        title="Hapus Catatan Biaya"
        message={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${expToDelete?.description}" sebesar ${formatRupiah(expToDelete?.amount || 0)}?`}
        onConfirm={() => {
          if (expToDelete) {
            onDeleteExpense(expToDelete.id);
            setExpToDelete(null);
          }
        }}
        onCancel={() => setExpToDelete(null)}
      />
    </div>
  );
};
