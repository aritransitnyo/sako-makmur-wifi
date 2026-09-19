import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, X } from 'lucide-react';
import { BusinessSettings, Investor, Subscriber, ExpenseTransaction } from '../types';
import { formatRupiah } from './MetricCard';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  expenses: ExpenseTransaction[];
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  investors,
  subscribers,
  expenses,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  const activeSubscribers = subscribers.filter((s) => s.status === 'active');
  const paidSubscribers = activeSubscribers.filter((s) => s.payment_status === 'paid');
  
  // Real cash inflow
  const realCashIn = paidSubscribers.reduce(
    (sum, s) => sum + (s.package_price || 100000),
    0
  );

  // Real cash outflow
  const realCashOut = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Reserve fund (10% of cash in)
  const reserveFund = realCashIn * (settings.reserve_fund_pct / 100);

  // Net Profit
  const netProfit = Math.max(0, realCashIn - realCashOut - reserveFund);

  // Generate WhatsApp message text
  let reportText = `📊 *LAPORAN KEUANGAN & DIVIDEN ${settings.business_name.toUpperCase()}*\n`;
  reportText += `🗓️ *Periode:* ${currentMonth}\n`;
  reportText += `📡 *Status Backhaul:* Starlink High-Speed Active\n`;
  reportText += `───────────────────────\n`;
  reportText += `👥 *User Aktif:* ${activeSubscribers.length} Pelanggan\n`;
  reportText += `✅ *Sudah Bayar:* ${paidSubscribers.length} User (${formatRupiah(realCashIn)})\n`;
  reportText += `⏳ *Belum Bayar:* ${activeSubscribers.length - paidSubscribers.length} User\n`;
  reportText += `───────────────────────\n`;
  reportText += `💵 *Total Kas Masuk:* ${formatRupiah(realCashIn)}\n`;
  reportText += `📉 *Total Biaya OPEX Riil:* ${formatRupiah(realCashOut)}\n`;
  reportText += `🛡️ *Dana Cadangan (${settings.reserve_fund_pct}%):* ${formatRupiah(reserveFund)}\n`;
  reportText += `───────────────────────\n`;
  reportText += `💰 *LABA BERSIH SIAP BAGI:* ${formatRupiah(netProfit)}\n\n`;
  reportText += `🤝 *DISTRIBUSI DIVIDEN INVESTOR:*\n`;

  investors.forEach((inv, index) => {
    const div = (netProfit * inv.share_percentage) / 100;
    reportText += `${index + 1}. *${inv.name}* (${inv.share_percentage}%): ${formatRupiah(div)}\n`;
  });

  reportText += `───────────────────────\n`;
  reportText += `_Laporan otomatis digenerate via ${settings.business_name} PWA Manager._`;

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

        <p className="text-xs text-slate-400">
          Format pesan resmi yang siap dibagikan ke grup WhatsApp investor untuk tutup buku bulanan:
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
