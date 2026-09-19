import React from 'react';
import { Printer, Download, X, Check, Building2 } from 'lucide-react';
import {
  BusinessSettings,
  Investor,
  Subscriber,
  ExpenseTransaction,
  CapexItem,
} from '../types';
import { formatRupiah } from './MetricCard';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  expenses: ExpenseTransaction[];
  capexItems: CapexItem[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  investors,
  subscribers,
  expenses,
  capexItems,
}) => {
  if (!isOpen) return null;

  const currentMonth = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const currentDateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date());

  // Calculations
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const paidSubs = activeSubs.filter((s) => s.payment_status === 'paid');

  const totalModal = investors.reduce((sum, i) => sum + i.capital_invested, 0);
  const totalCapexSpent = capexItems.reduce((sum, c) => sum + c.total_price, 0);
  const sisaKasModal = Math.max(0, totalModal - totalCapexSpent);

  const realCashIn = paidSubs.reduce((sum, s) => sum + (s.package_price || 200000), 0);
  const realOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
  const reserveFund = realCashIn * (settings.reserve_fund_pct / 100);
  const netProfit = Math.max(0, realCashIn - realOpex - reserveFund);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-2xl space-y-4 page-transition max-h-[94vh] flex flex-col shadow-2xl">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Laporan Keuangan &amp; Dividen Resmi (Investor Ready)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Paper Area */}
        <div
          id="printable-report"
          className="flex-1 overflow-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs space-y-5 print:bg-white print:text-black print:p-0 print:border-none"
        >
          {/* Header Surat Laporan */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-base font-black text-slate-100 uppercase tracking-tight">
                {settings.business_name || 'SAKO MAKMUR WIFI'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Konsorsium Internet Desa &amp; Starlink Hybrid FO
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Dicetak: {currentDateStr}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20 text-[10px]">
                PERIODE: {currentMonth.toUpperCase()}
              </span>
            </div>
          </div>

          {/* 1. Posisi Kas & Modal (CAPEX) */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              1. Posisi Kas Modal &amp; Pengadaan (CAPEX)
            </h4>
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400">Total Modal Disetor</p>
                <p className="font-black text-sm text-slate-100 mt-0.5">{formatRupiah(totalModal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Belanja Modal (CAPEX)</p>
                <p className="font-black text-sm text-violet-300 mt-0.5">{formatRupiah(totalCapexSpent)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Sisa Kas Modal</p>
                <p className="font-black text-sm text-emerald-400 mt-0.5">{formatRupiah(sisaKasModal)}</p>
              </div>
            </div>
          </div>

          {/* 2. Laporan Laba Rugi Operasional */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              2. Laporan Laba Rugi Operasional Berjalan
            </h4>
            <div className="space-y-1.5 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Pemasukan Iuran ({paidSubs.length} User Lunas):</span>
                <span className="font-bold text-emerald-400">{formatRupiah(realCashIn)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Beban Operasional Riil (Buku Kas):</span>
                <span className="font-bold text-rose-300">- {formatRupiah(realOpex)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Alokasi Dana Cadangan / Maintenance ({settings.reserve_fund_pct}%):</span>
                <span className="font-bold text-amber-300">- {formatRupiah(reserveFund)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-black pt-2 text-slate-100">
                <span>LABA BERSIH SIAP BAGI (NET PROFIT):</span>
                <span className="text-emerald-400 font-black">{formatRupiah(netProfit)}</span>
              </div>
            </div>
          </div>

          {/* 3. Rekapitulasi Dividen Investor Konsorsium */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              3. Rekapitulasi Pembagian Dividen Pemegang Modal
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Nama Pemegang Saham</th>
                    <th className="p-2.5">Peran</th>
                    <th className="p-2.5 text-center">Porsi (%)</th>
                    <th className="p-2.5 text-right">Hak Dividen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                  {investors.map((inv) => {
                    const dividend = (netProfit * inv.share_percentage) / 100;
                    return (
                      <tr key={inv.id}>
                        <td className="p-2.5 font-bold text-slate-100">{inv.name}</td>
                        <td className="p-2.5 text-slate-400">{inv.role}</td>
                        <td className="p-2.5 text-center font-bold text-cyan-300">{inv.share_percentage}%</td>
                        <td className="p-2.5 text-right font-black text-emerald-400">{formatRupiah(dividend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tanda Tangan Konsorsium */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-400 border-t border-slate-800">
            <div>
              <p>Mengetahui &amp; Mengesahkan,</p>
              <p className="font-bold text-slate-200 mt-12 underline">
                Ahmad Fauzi
              </p>
              <p className="text-[10px]">Managing Owner / Pengelola</p>
            </div>
            <div>
              <p>Perwakilan Pemodal,</p>
              <p className="font-bold text-slate-200 mt-12 underline">
                Tri Wahyono / Anwar Khadafi
              </p>
              <p className="text-[10px]">Investor Konsorsium</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
};
