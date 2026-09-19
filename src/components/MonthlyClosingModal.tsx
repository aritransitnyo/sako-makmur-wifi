import React, { useState } from 'react';
import {
  History,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Share2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  BusinessSettings,
  Investor,
  Subscriber,
  ExpenseTransaction,
  MonthlyClosing,
  InvestorDividendSnapshot,
} from '../types';
import { formatRupiah } from './MetricCard';

interface MonthlyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  expenses: ExpenseTransaction[];
  closings: MonthlyClosing[];
  onSaveClosing: (
    closing: MonthlyClosing,
    resetSubscriberPayments: boolean
  ) => void;
  onToggleDividendPaid: (
    closingId: string,
    investorId: string,
    newStatus: 'paid' | 'pending'
  ) => void;
  onDeleteClosing: (closingId: string) => void;
}

export const MonthlyClosingModal: React.FC<MonthlyClosingModalProps> = ({
  isOpen,
  onClose,
  settings,
  investors,
  subscribers,
  expenses,
  closings,
  onSaveClosing,
  onToggleDividendPaid,
  onDeleteClosing,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');
  const [expandedId, setExpandedId] = useState<string | null>(closings[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for creating a new closing
  const defaultMonthName = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [periodMonth, setPeriodMonth] = useState(defaultMonthName);
  const [notes, setNotes] = useState('');
  const [resetPayments, setResetPayments] = useState(true);

  if (!isOpen) return null;

  // Real live numbers for current period closing
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const paidSubs = activeSubs.filter((s) => s.payment_status === 'paid');
  const realCashIn = paidSubs.reduce(
    (sum, s) => sum + (s.package_price || 200000),
    0
  );
  const realCashOut = expenses.reduce((sum, e) => sum + e.amount, 0);
  const reserveFund = realCashIn * (settings.reserve_fund_pct / 100);
  const netProfit = Math.max(0, realCashIn - realCashOut - reserveFund);

  const currentDividends: InvestorDividendSnapshot[] = investors.map((inv) => ({
    investor_id: inv.id,
    name: inv.name,
    role: inv.role,
    share_percentage: inv.share_percentage,
    dividend_amount: (netProfit * inv.share_percentage) / 100,
    paid_status: 'pending',
  }));

  const handleCreateClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const periodKey = new Date().toISOString().slice(0, 7); // e.g. 2026-09
    const newClosing: MonthlyClosing = {
      id: `close-${Date.now()}`,
      period_month: periodMonth.trim(),
      period_key: periodKey,
      closed_at: new Date().toISOString(),
      closed_by: `${investors.find((i) => i.role === 'Managing Owner')?.name || 'Pengelola'}`,
      active_subscribers_count: activeSubs.length,
      paid_subscribers_count: paidSubs.length,
      gross_revenue: realCashIn,
      total_expenses: realCashOut,
      reserve_fund_amount: reserveFund,
      reserve_fund_pct: settings.reserve_fund_pct,
      net_profit: netProfit,
      investor_dividends: currentDividends,
      notes: notes.trim(),
    };

    onSaveClosing(newClosing, resetPayments);
    setActiveTab('history');
    setExpandedId(newClosing.id);
  };

  const handleCopyHistoryReport = (c: MonthlyClosing) => {
    let report = `📊 *ARSIP LAPORAN KEUANGAN ${settings.business_name.toUpperCase()}*\n`;
    report += `🗓️ *Periode:* ${c.period_month}\n`;
    report += `🔒 *Ditutup pada:* ${new Date(c.closed_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}\n`;
    report += `───────────────────────\n`;
    report += `👥 Pelanggan Lunas: ${c.paid_subscribers_count} dari ${c.active_subscribers_count} Aktif\n`;
    report += `💵 Total Kas Masuk: ${formatRupiah(c.gross_revenue)}\n`;
    report += `📉 Total Biaya OPEX: ${formatRupiah(c.total_expenses)}\n`;
    report += `🛡️ Dana Cadangan (${c.reserve_fund_pct}%): ${formatRupiah(c.reserve_fund_amount)}\n`;
    report += `───────────────────────\n`;
    report += `💰 *LABA BERSIH DIBAGI:* ${formatRupiah(c.net_profit)}\n\n`;
    report += `🤝 *STATUS PENCAIRAN DIVIDEN:*\n`;
    c.investor_dividends.forEach((inv, i) => {
      report += `${i + 1}. *${inv.name}* (${inv.share_percentage}%): ${formatRupiah(inv.dividend_amount)} [${inv.paid_status === 'paid' ? 'LUNAS DITRANSFER ✅' : 'PENDING ⏳'}]\n`;
    });
    if (c.notes) {
      report += `\n📝 *Catatan:* ${c.notes}\n`;
    }
    report += `───────────────────────`;

    navigator.clipboard.writeText(report);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Tutup Buku Bulanan &amp; Arsip Dividen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Arsip ({closings.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'create'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Kunci &amp; Tutup Bulan Ini
          </button>
        </div>

        {/* TAB 1: HISTORY AUDIT TRAIL */}
        {activeTab === 'history' && (
          <div className="space-y-3 flex-1 overflow-auto text-xs pr-1">
            {closings.map((c) => {
              const isExpanded = expandedId === c.id;
              const allDividendsPaid = c.investor_dividends.every(
                (inv) => inv.paid_status === 'paid'
              );

              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-slate-950 border border-slate-800/90 shadow-md overflow-hidden transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-100">{c.period_month}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            allDividendsPaid
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {allDividendsPaid ? '✓ Dividen Ditransfer' : '⏳ Sebagian Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ditutup {new Date(c.closed_at).toLocaleDateString('id-ID')} • {c.paid_subscribers_count} Pelanggan Lunas
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-black text-sm text-emerald-400">
                          {formatRupiah(c.net_profit)}
                        </p>
                        <p className="text-[10px] text-slate-500">Laba Bersih</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-3.5 bg-slate-900/90 border-t border-slate-800/80 space-y-3 page-transition">
                      {/* Breakdown Stats */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-slate-500">Total Omzet</p>
                          <p className="font-bold text-slate-200 mt-0.5">{formatRupiah(c.gross_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total OPEX</p>
                          <p className="font-bold text-rose-300 mt-0.5">{formatRupiah(c.total_expenses)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Dana Cadangan</p>
                          <p className="font-bold text-amber-300 mt-0.5">{formatRupiah(c.reserve_fund_amount)}</p>
                        </div>
                      </div>

                      {/* Investor Dividends Checklist */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Rekam Jejak Transfer Dividen:
                        </p>
                        <div className="space-y-1.5">
                          {c.investor_dividends.map((inv) => {
                            const isPaid = inv.paid_status === 'paid';
                            return (
                              <div
                                key={inv.investor_id}
                                className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-slate-200">{inv.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    Porsi {inv.share_percentage}% • {formatRupiah(inv.dividend_amount)}
                                  </p>
                                </div>

                                <button
                                  onClick={() =>
                                    onToggleDividendPaid(
                                      c.id,
                                      inv.investor_id,
                                      isPaid ? 'pending' : 'paid'
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                    isPaid
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  }`}
                                >
                                  {isPaid ? '✓ Sudah Ditransfer' : '⏳ Klik Jika Sudah Transfer'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          Catatan: &ldquo;{c.notes}&rdquo;
                        </p>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                        <button
                          onClick={() => onDeleteClosing(c.id)}
                          className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Arsip
                        </button>

                        <button
                          onClick={() => handleCopyHistoryReport(c)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow"
                        >
                          {copiedId === c.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Salin Laporan WA
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {closings.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800/60">
                Belum ada arsip tutup buku bulanan. Gunakan tab &ldquo;Kunci &amp; Tutup Bulan Ini&rdquo; di atas untuk membuat rekam jejak resmi pertama Anda.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE CLOSING SNAPSHOT */}
        {activeTab === 'create' && (
          <form
            onSubmit={handleCreateClosing}
            className="space-y-3.5 flex-1 overflow-auto text-xs"
          >
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-slate-300 space-y-2">
              <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Snapshot Finansial Terkunci
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tutup buku akan merekam angka pasti pendapatan iuran riil, pengeluaran kas, serta porsi dividen investor saat ini ke arsip permanen.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nama Periode Tutup Buku
              </label>
              <input
                type="text"
                required
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                placeholder="Contoh: September 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Numbers Review */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Pelanggan Lunas:</span>
                <span className="font-bold">{paidSubs.length} dari {activeSubs.length} User</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Iuran Terkumpul:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(realCashIn)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total OPEX Riil Tercatat:</span>
                <span className="font-bold text-rose-300">{formatRupiah(realCashOut)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Dana Cadangan ({settings.reserve_fund_pct}%):</span>
                <span className="font-bold text-amber-400">{formatRupiah(reserveFund)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-800 text-slate-100">
                <span>Laba Bersih Siap Bagi:</span>
                <span className="text-emerald-400">{formatRupiah(netProfit)}</span>
              </div>
            </div>

            {/* Dividend Allocation Preview */}
            <div className="space-y-1.5">
              <p className="text-slate-400 font-medium text-[11px]">
                Pembagian Dividen yang Akan Dikunci:
              </p>
              {currentDividends.map((inv) => (
                <div
                  key={inv.investor_id}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex justify-between items-center text-[11px]"
                >
                  <span className="font-semibold text-slate-200">{inv.name} ({inv.share_percentage}%)</span>
                  <span className="font-bold text-emerald-400">{formatRupiah(inv.dividend_amount)}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Catatan Penutupan Buku (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tutup buku tepat waktu, transfer dividen via BCA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            {/* Reset Payments Option for Next Month */}
            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={resetPayments}
                onChange={(e) => setResetPayments(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded"
              />
              <span>
                Reset status tagihan seluruh pelanggan menjadi <strong>Belum Bayar</strong> untuk menyambut bulan berikutnya
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4" />
              Kunci &amp; Simpan Tutup Buku Resmi
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
