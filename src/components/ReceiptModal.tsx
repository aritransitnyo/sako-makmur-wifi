import React, { useState } from 'react';
import {
  Printer,
  X,
  Check,
  Copy,
  Receipt,
  CheckCircle2,
  Calendar,
  User,
  Wifi,
  Phone,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Subscriber } from '../types';
import { formatRupiah } from './MetricCard';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  paymentMethod?: string;
  paymentDate?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  subscriber,
  paymentMethod = 'Transfer Bank',
  paymentDate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !subscriber) return null;

  const now = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const currentMonthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const nextMonthIdx = (now.getMonth() + 1) % 12;
  const nextMonthYear = nextMonthIdx === 0 ? now.getFullYear() + 1 : now.getFullYear();
  const activeUntilStr = `Tgl ${subscriber.due_date || 10} ${monthNames[nextMonthIdx]} ${nextMonthYear}`;

  const receiptNo = `#LSM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${(
    subscriber.id || '001'
  )
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-4)
    .toUpperCase()}`;

  const formattedDate =
    paymentDate ||
    now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

  // Format WhatsApp Text
  const getWhatsAppMessage = () => {
    return `🧾 *KUITANSI PEMBAYARAN INTERNET RESMI*
*PROGRAM LAYANAN INTERNET*
*LIMBANGMULIA SEJAHTERA MANDIRI (LSM NetOS)*
━━━━━━━━━━━━━━━━━━━━
No. Bukti    : *${receiptNo}*
Waktu Bayar  : ${formattedDate}
Metode Bayar : *${paymentMethod}*

👤 *DATA PELANGGAN*
• Nama       : *${subscriber.full_name}*
• ID PPPoE   : \`${subscriber.username_pppoe}\`
• Alamat     : ${subscriber.address || 'Limbang Mulia'}

📦 *RINCIAN IURAN*
• Paket      : *${subscriber.package_name || '5 Mbps'}*
• Periode    : *${currentMonthStr}*
• Nominal    : *${formatRupiah(subscriber.package_price || 200000)}*
• Status     : ✅ *LUNAS (VERIFIED)*

📅 *MASA AKTIF LAYANAN*
• Aktif s/d  : *${activeUntilStr}*
━━━━━━━━━━━━━━━━━━━━
Terima kasih atas pembayaran iuran internet Anda tepat waktu.
Internet Anda aktif lancar dan stabil.

_LSM NetOS • Pengelola: Tri Wahyono_
_Layanan Bantuan Pelanggan Limbang Mulia_`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    let clean = (subscriber.phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const msg = encodeURIComponent(getWhatsAppMessage());
    if (clean) {
      window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${msg}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition max-h-[95vh] flex flex-col shadow-2xl print:shadow-none print:border-none print:max-w-none print:w-full print:p-0 print:text-black">
        {/* Header Modal (Hidden in Print) */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Kuitansi Resmi Pelanggan (LSM NetOS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto space-y-3 print:overflow-visible">
          {/* Paper Struk Frame */}
          <div
            id="receipt-print-area"
            className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden shadow-inner print:bg-white print:border print:border-black print:rounded-none print:p-6 print:text-black"
          >
            {/* Kop Surat Resmi */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-800 print:border-black">
              <span className="text-[10px] font-black tracking-widest uppercase text-cyan-400 print:text-black block">
                PROGRAM LAYANAN INTERNET
              </span>
              <h2 className="text-sm font-black text-slate-100 tracking-tight print:text-black leading-tight">
                LIMBANGMULIA SEJAHTERA MANDIRI
              </h2>
              <p className="text-[11px] font-bold text-emerald-400 print:text-black tracking-wide">
                (LSM NetOS)
              </p>
              <p className="text-[9.5px] text-slate-400 print:text-gray-700">
                Bukti Sah Pembayaran Iuran Internet Warga
              </p>
            </div>

            {/* Nomor & Waktu */}
            <div className="flex justify-between items-center text-[10.5px] text-slate-400 print:text-gray-800 pt-1">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 print:text-gray-600 block">
                  No. Kuitansi
                </span>
                <span className="font-mono font-bold text-slate-200 print:text-black">
                  {receiptNo}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 print:text-gray-600 block">
                  Waktu Bayar
                </span>
                <span className="font-semibold text-slate-300 print:text-black">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Data Pelanggan */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 print:bg-gray-50 print:border-gray-300">
              <div className="flex justify-between items-start text-xs">
                <span className="text-slate-400 print:text-gray-600 text-[11px]">Pelanggan:</span>
                <span className="font-bold text-slate-100 print:text-black text-right">
                  {subscriber.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 print:text-gray-600">ID PPPoE:</span>
                <span className="font-mono text-cyan-400 print:text-black font-semibold">
                  {subscriber.username_pppoe}
                </span>
              </div>
              {subscriber.address && (
                <div className="flex justify-between items-start text-[10.5px]">
                  <span className="text-slate-400 print:text-gray-600">Alamat:</span>
                  <span className="text-slate-300 print:text-black text-right max-w-[65%] truncate">
                    {subscriber.address}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-slate-400 print:text-gray-600">Metode:</span>
                <span className="font-bold text-slate-300 print:text-black">
                  {paymentMethod}
                </span>
              </div>
            </div>

            {/* Rincian Tagihan & Nominal */}
            <div className="space-y-2 pt-1 border-t border-dashed border-slate-800 print:border-black">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-200 print:text-black">
                    {subscriber.package_name || 'Paket Internet'}
                  </p>
                  <p className="text-[10px] text-slate-400 print:text-gray-600">
                    Periode: {currentMonthStr}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-100 print:text-black">
                  {formatRupiah(subscriber.package_price || 200000)}
                </p>
              </div>

              {/* Stempel / Badge Lunas */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between print:bg-gray-100 print:border-black">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
                  <span className="text-xs font-black tracking-wider text-emerald-300 print:text-black uppercase">
                    LUNAS / VERIFIED
                  </span>
                </div>
                <span className="text-base font-black text-emerald-400 print:text-black">
                  {formatRupiah(subscriber.package_price || 200000)}
                </span>
              </div>
            </div>

            {/* Masa Aktif Layanan */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10.5px] text-slate-300 print:text-black print:bg-white space-y-0.5">
              <span className="text-slate-400 print:text-gray-600 block text-[9.5px] uppercase font-semibold">
                Masa Aktif Layanan:
              </span>
              <p className="font-bold text-cyan-300 print:text-black">
                Internet Aktif Normal s/d {activeUntilStr}
              </p>
            </div>

            {/* Footer Struk */}
            <div className="text-center pt-2 border-t border-dashed border-slate-800 print:border-black space-y-1 text-[9.5px] text-slate-400 print:text-gray-700">
              <p className="font-semibold text-slate-300 print:text-black">
                Pengelola Operasional: Tri Wahyono (LSM NetOS)
              </p>
              <p className="leading-relaxed">
                Simpan kuitansi digital ini sebagai bukti sah pembayaran Anda.
              </p>
              <p className="text-[8.5px] text-slate-500 print:text-gray-500 font-mono">
                Diterbitkan otomatis via LSM NetOS Gateway • Layanan Komunitas Desa
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in Print) */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs print:hidden">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30 transition-all active:scale-95"
              title="Salin Teks Kuitansi WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin WA'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              title="Kirim Langsung ke WhatsApp Pelanggan"
            >
              <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Kirim WA</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              title="Cetak Struk Mini / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
