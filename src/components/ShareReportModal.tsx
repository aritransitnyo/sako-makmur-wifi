import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, X, Archive, Calendar } from 'lucide-react';
import { BusinessSettings, Investor, Subscriber, ExpenseTransaction, MonthlyClosing } from '../types';
import { formatRupiah } from './MetricCard';
import { calculateFinancials, getActivePeriodInfo } from '../lib/financialCalculations';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  expenses: ExpenseTransaction[];
  closings?: MonthlyClosing[];
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  investors,
  subscribers,
  expenses,
  closings = [],
}) => {
  const [copied, setCopied] = useState(false);
  const { activePeriodMonth, latestClosing } = getActivePeriodInfo(closings);
  
  // Default to closed period if we are early in the month or active collections haven't started
  const [reportMode, setReportMode] = useState<'closed' | 'active'>('closed');

  if (!isOpen) return null;

  const fin = calculateFinancials(subscribers, settings, investors, [], expenses, closings);
  const realCashIn = fin.totalOmzet;
  const realCashOut = fin.totalOpex;
  const reserveFund = fin.reserveFundAmount;
  const netProfit = fin.netProfit;

  let reportText = '';

  if (reportMode === 'closed' && latestClosing) {
    reportText = `📊 *LAPORAN RESMI KEUANGAN & DIVIDEN ${settings.business_name.toUpperCase()}*\n`;
    reportText += `🗓️ *Periode:* ${latestClosing.period_month}\n`;
    reportText += `🔒 *Status:* TELAH DITUTUP & LUNAS DITRANSFER ✅\n`;
    reportText += `Ditutup oleh: ${latestClosing.closed_by || 'Tri Wahyono'}\n`;
    reportText += `📡 *Status Backhaul:* Starlink High-Speed Active\n`;
    reportText += `───────────────────────\n`;
    reportText += `👥 *Pelanggan Lunas:* ${latestClosing.paid_subscribers_count} dari ${latestClosing.active_subscribers_count} User\n`;
    reportText += `💵 *Total Kas Masuk:* ${formatRupiah(latestClosing.gross_revenue)}\n`;
    reportText += `📉 *Total Beban OPEX:* ${formatRupiah(latestClosing.total_expenses)}\n`;
    reportText += `🛡️ *Dana Cadangan (${latestClosing.reserve_fund_pct || 10}%):* ${formatRupiah(latestClosing.reserve_fund_amount)}\n`;
    reportText += `───────────────────────\n`;
    reportText += `💰 *LABA BERSIH DIBAGIKAN:* ${formatRupiah(latestClosing.net_profit)}\n\n`;
    reportText += `🤝 *STATUS PENCAIRAN DIVIDEN:*\n`;

    if (latestClosing.investor_dividends && latestClosing.investor_dividends.length > 0) {
      latestClosing.investor_dividends.forEach((inv, index) => {
        reportText += `${index + 1}. *${inv.name}* (${inv.share_percentage}%): ${formatRupiah(inv.dividend_amount)} [LUNAS DITRANSFER ✅]\n`;
      });
    } else {
      fin.investorDividends.forEach((inv, index) => {
        reportText += `${index + 1}. *${inv.name}* (${inv.share_percentage}%): ${formatRupiah(inv.dividendAmount)} [LUNAS DITRANSFER ✅]\n`;
      });
    }

    reportText += `───────────────────────\n`;
    reportText += `✅ *Seluruh dividen periode ini telah selesai ditransfer ke rekening masing-masing investor.*\n`;
    reportText += `_Laporan arsip resmi ${settings.business_name} System._`;
  } else {
    const today = new Date().getDate();
    const cycleStatus = today < 10 
      ? 'Masa Persiapan Tagihan (Tagihan Terbit Tgl 10)' 
      : today < 18 
      ? 'Masa Penagihan Aktif (Jatuh Tempo Tgl 18)' 
      : 'Menuju Tutup Buku & Bagi Dividen Tgl 25';

    reportText = `📊 *UPDATE OPERASIONAL BERJALAN ${settings.business_name.toUpperCase()}*\n`;
    reportText += `🗓️ *Periode:* ${activePeriodMonth}\n`;
    reportText += `📌 *Status Siklus:* ${cycleStatus}\n`;
    reportText += `📡 *Status Backhaul:* Starlink High-Speed Active\n`;
    reportText += `───────────────────────\n`;
    reportText += `👥 *User Aktif:* ${fin.activeCount} Pelanggan\n`;
    reportText += `✅ *Sudah Bayar:* ${fin.paidCount} User (${formatRupiah(realCashIn)})\n`;
    reportText += `⏳ *Belum Bayar:* ${fin.unpaidCount} User (Potensi ${formatRupiah(fin.totalPotensiOmzet)})\n`;
    reportText += `───────────────────────\n`;
    reportText += `💵 *Total Kas Masuk Berjalan:* ${formatRupiah(realCashIn)}\n`;
    reportText += `📉 *Total Beban OPEX:* ${formatRupiah(realCashOut)}\n`;
    reportText += `   • Starlink: ${formatRupiah(fin.starlinkCost)}\n`;
    reportText += `   • Listrik Node: ${formatRupiah(fin.nodePowerCost)}\n`;
    reportText += `   • Gaji Operator: ${formatRupiah(fin.operatorSalary)}\n`;
    reportText += `   • Jasa Tagih (${fin.paidCount}x5rb): ${formatRupiah(fin.totalCollectorFee)}\n`;
    reportText += `   • Marketing: ${formatRupiah(fin.marketingFee)}\n`;
    reportText += `🛡️ *Dana Cadangan (${fin.reserveFundPct}%):* ${formatRupiah(reserveFund)}\n`;
    reportText += `───────────────────────\n`;
    reportText += `💰 *SURPLUS LABA KAS SAAT INI:* ${formatRupiah(netProfit)}\n\n`;
    reportText += `🤝 *PROYEKSI HAK DIVIDEN BERJALAN:*\n`;

    fin.investorDividends.forEach((inv, index) => {
      reportText += `${index + 1}. *${inv.name}* (${inv.share_percentage}%): ${formatRupiah(inv.dividendAmount)} (Kunci Tgl 25)\n`;
    });

    reportText += `───────────────────────\n`;
    reportText += `⚠️ *Catatan:* Perhitungan dividen bulan berjalan akan dikunci pada tanggal 25 setelah penerimaan kas masuk selesai terkumpul.\n`;
    reportText += `_Laporan operasional live via ${settings.business_name} System._`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Laporan WhatsApp Investor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Arsip Tutup Buku vs Periode Berjalan */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setReportMode('closed')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              reportMode === 'closed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {latestClosing ? `Arsip ${latestClosing.period_month}` : 'Arsip Tutup Buku'}
          </button>
          <button
            type="button"
            onClick={() => setReportMode('active')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              reportMode === 'active'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {`Berjalan (${activePeriodMonth})`}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          {reportMode === 'closed'
            ? 'Format laporan resmi dividen yang sudah lunas ditransfer ke investor:'
            : 'Format laporan perkembangan tagihan & kas masuk bulan berjalan:'}
        </p>

        {/* Text Area Preview */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed shadow-inner">
          {reportText}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <button
            onClick={handleCopy}
            className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Salin Teks
              </>
            )}
          </button>
          <button
            onClick={handleOpenWhatsApp}
            className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-slate-950" /> Buka WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
