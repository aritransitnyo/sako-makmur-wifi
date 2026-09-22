import React, { useState } from 'react';
import {
  Printer,
  X,
  Check,
  Copy,
  Receipt,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { Subscriber } from '../types';
import { formatRupiah } from './MetricCard';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  paymentMethod?: string;
  paymentDate?: string;
  receiptNumber?: string;
  paymentPeriod?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  subscriber,
  paymentMethod = 'Transfer Bank',
  paymentDate,
  receiptNumber,
  paymentPeriod,
}) => {
  const [copied, setCopied] = useState(false);
  const [sendingWA, setSendingWA] = useState(false);

  if (!isOpen || !subscriber) return null;

  const now = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const currentMonthStr = paymentPeriod
    ? (() => {
        const [year, month] = paymentPeriod.split('-').map(Number);
        return monthNames[(month || 1) - 1] ? `${monthNames[(month || 1) - 1]} ${year}` : paymentPeriod;
      })()
    : `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const receiptNo = receiptNumber || `#LSM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${(
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

  // Format WhatsApp Text (Opsi 2: Berdasarkan Periode Bulan Penuh Tanpa Tanggal Ambigu)
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
• Periode    : *Bulan ${currentMonthStr} (1 Bulan)*
• Nominal    : *${formatRupiah(subscriber.package_price || 200000)}*
• Status     : ✅ *LUNAS (VERIFIED)*

📶 *STATUS LAYANAN*
• Koneksi    : ✅ *AKTIF NORMAL*
━━━━━━━━━━━━━━━━━━━━
Terima kasih atas pembayaran iuran internet Anda.
Internet Anda aktif lancar dan stabil.

_LSM NetOS Gateway • Layanan Komunitas Desa_`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (sendingWA) return;
    setSendingWA(true);
    setTimeout(() => setSendingWA(false), 2000);

    let clean = (subscriber.phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const msg = encodeURIComponent(getWhatsAppMessage());
    if (clean) {
      window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Isolated Print Styles: Only #lsm-receipt-print is printed */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 13in;
            margin: 0;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Sembunyikan seluruh isi body aplikasi */
          body * {
            visibility: hidden !important;
          }

          /* Tampilkan HANYA struk kuitansi */
          #lsm-receipt-print,
          #lsm-receipt-print * {
            visibility: visible !important;
          }

          #lsm-receipt-print {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            box-sizing: border-box !important;
            box-sizing: border-box !important;
            width: 7.7in !important;
            max-width: 7.7in !important;
            min-height: 12.2in !important;
            margin: 0 auto !important;
            padding: 0.55in !important;
            max-height: 12.2in !important;
            height: 12.2in !important;
            zoom: 1 !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px dashed #222222 !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }

          #lsm-receipt-print,
          #lsm-receipt-print * {
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          #lsm-receipt-print p,
          #lsm-receipt-print span,
          #lsm-receipt-print h2,
          #lsm-receipt-print div {
            color: #000000 !important;
            text-shadow: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header Modal with Direct Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 leading-tight">
                Kuitansi Resmi (LSM NetOS)
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {subscriber.full_name} • {formatRupiah(subscriber.package_price || 200000)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
              title="Cetak Kuitansi / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1 text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              title="Kirim ke WhatsApp Pelanggan"
            >
              <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>WA</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
              title="Salin Format WhatsApp"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Paper Struk Frame (Targeted by Print CSS) */}
          <div
            id="lsm-receipt-print"
            className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden shadow-inner text-slate-200"
          >
            {/* Kop Surat Resmi */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-800">
              <span className="text-[10px] font-black tracking-widest uppercase text-cyan-400 block">
                PROGRAM LAYANAN INTERNET
              </span>
              <h2 className="text-sm font-black text-slate-100 tracking-tight leading-tight">
                LIMBANGMULIA SEJAHTERA MANDIRI
              </h2>
              <p className="text-[11px] font-bold text-emerald-400 tracking-wide">
                (LSM NetOS)
              </p>
              <p className="text-[9.5px] text-slate-400">
                Bukti Sah Pembayaran Iuran Internet Warga
              </p>
            </div>

            {/* Nomor & Waktu */}
            <div className="flex justify-between items-center text-[10.5px] text-slate-400 pt-1">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                  No. Kuitansi
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {receiptNo}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                  Waktu Bayar
                </span>
                <span className="font-semibold text-slate-300">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Data Pelanggan */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-start text-xs">
                <span className="text-slate-400 text-[11px]">Pelanggan:</span>
                <span className="font-bold text-slate-100 text-right">
                  {subscriber.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">ID PPPoE:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {subscriber.username_pppoe}
                </span>
              </div>
              {subscriber.address && (
                <div className="flex justify-between items-start text-[10.5px]">
                  <span className="text-slate-400">Alamat:</span>
                  <span className="text-slate-300 text-right max-w-[65%] truncate">
                    {subscriber.address}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-slate-400">Metode:</span>
                <span className="font-bold text-slate-300">
                  {paymentMethod}
                </span>
              </div>
            </div>

            {/* Rincian Tagihan & Nominal */}
            <div className="space-y-2 pt-1 border-t border-dashed border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-200">
                    {subscriber.package_name || 'Paket Internet'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Periode: {currentMonthStr}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-100">
                  {formatRupiah(subscriber.package_price || 200000)}
                </p>
              </div>

              {/* Stempel / Badge Lunas */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black tracking-wider text-emerald-300 uppercase">
                    LUNAS / VERIFIED
                  </span>
                </div>
                <span className="text-base font-black text-emerald-400">
                  {formatRupiah(subscriber.package_price || 200000)}
                </span>
              </div>
            </div>

            {/* Status Layanan (Opsi 2: 1 Bulan Penuh Bersih) */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10.5px] text-slate-300 space-y-0.5">
              <span className="text-slate-400 block text-[9.5px] uppercase font-semibold">
                Status Layanan:
              </span>
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Koneksi Internet Aktif Normal (1 Bulan Penuh)
              </p>
            </div>

            {/* Footer Struk */}
            <div className="text-center pt-2 border-t border-dashed border-slate-800 space-y-1 text-[9.5px] text-slate-400">
              <p className="font-bold text-slate-300">
                Layanan Internet Desa LSM NetOS
              </p>
              <p className="leading-relaxed">
                Simpan kuitansi digital ini sebagai bukti sah pembayaran Anda.
              </p>
              <p className="text-[8.5px] text-slate-500 font-mono">
                Diterbitkan otomatis via LSM NetOS Gateway • Layanan Pelanggan Warga
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Kirim ke WA</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
