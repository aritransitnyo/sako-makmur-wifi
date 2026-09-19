import React, { useState } from 'react';
import {
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Subscriber } from '../types';
import { formatRupiah } from './MetricCard';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  subscribers: Subscriber[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  businessName,
  subscribers,
}) => {
  const [broadcastType, setBroadcastType] = useState<'billing_10' | 'warning_18'>('billing_10');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const currentMonth = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Filter only active subscribers who have NOT yet paid
  const unpaidSubs = subscribers.filter(
    (s) => s.status === 'active' && s.payment_status === 'unpaid'
  );

  const getCleanPhone = (phoneNum: string) => {
    let clean = phoneNum.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const getMessageForSub = (sub: Subscriber, type: 'billing_10' | 'warning_18') => {
    const cleanPhone = getCleanPhone(sub.phone);
    const amountStr = formatRupiah(sub.package_price || 200000);

    if (type === 'billing_10') {
      return `*TAGIHAN WIFI BULANAN - ${businessName.toUpperCase()}*\n\nHalo Bapak/Ibu *${sub.full_name}*,\n\nTagihan WiFi Anda untuk periode *${currentMonth}* sebesar *${amountStr}* (*${sub.package_name}*) sudah terbit per tanggal 10.\n\nPembayaran dapat dilakukan mulai hari ini sampai jatuh tempo pada *tanggal 18 ${currentMonth}* melalui Transfer Bank atau Tunai ke petugas penagih.\n\nUsername: *${sub.username_pppoe}*\n\nTerima kasih atas kerja samanya! 🙏`;
    } else {
      return `⚠️ *PERINGATAN JATUH TEMPO & ISOLIR - ${businessName.toUpperCase()}*\n\nHalo Bapak/Ibu *${sub.full_name}*,\n\nKami menginformasikan bahwa *hari ini tanggal 18* adalah batas akhir (jatuh tempo) pembayaran tagihan WiFi periode *${currentMonth}* sebesar *${amountStr}*.\n\nMohon segera melakukan pembayaran atau konfirmasi bukti transfer hari ini agar sistem tidak melakukan *ISOLIR (Pemutusan Internet Otomatis)* pada pukul 23:59 WIB.\n\nUsername PPPoE: *${sub.username_pppoe}*\n\nJika sudah membayar, abaikan pesan ini. Terima kasih! 🙏`;
    }
  };

  const handleSendWA = (sub: Subscriber) => {
    const cleanPhone = getCleanPhone(sub.phone);
    if (!cleanPhone) return;
    const text = getMessageForSub(sub, broadcastType);
    setSentMap((prev) => ({ ...prev, [sub.id]: true }));
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100">
              Broadcast WhatsApp Siklus Tagihan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Tgl 10 vs Tgl 18 */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setBroadcastType('billing_10')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              broadcastType === 'billing_10'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Tagihan Tgl 10 ({unpaidSubs.length})
          </button>
          <button
            onClick={() => setBroadcastType('warning_18')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              broadcastType === 'warning_18'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Warning Isolir Tgl 18 ({unpaidSubs.length})
          </button>
        </div>

        {/* Info Banner */}
        <div
          className={`p-3 rounded-2xl text-xs space-y-1 ${
            broadcastType === 'billing_10'
              ? 'bg-cyan-950/40 border border-cyan-500/25 text-cyan-200'
              : 'bg-amber-950/40 border border-amber-500/25 text-amber-200'
          }`}
        >
          <p className="font-bold flex items-center gap-1.5">
            {broadcastType === 'billing_10' ? (
              <>
                <Calendar className="w-4 h-4 text-cyan-400" />
                Broadcast Pembukaan Tagihan (Setiap Tanggal 10)
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Peringatan Terakhir Sebelum Isolir (Jatuh Tempo Tanggal 18)
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {broadcastType === 'billing_10'
              ? 'Mengabarkan bahwa tagihan bulan baru sudah terbit dan batas pembayaran sampai tanggal 18.'
              : 'Mengingatkan warga bahwa hari ini adalah jatuh tempo tgl 18 dan koneksi akan terputus jika belum konfirmasi.'}
          </p>
        </div>

        {/* Unpaid Subscriber List */}
        <div className="flex-1 overflow-auto space-y-2 pr-1 divide-y divide-slate-800/60 max-h-72">
          {unpaidSubs.map((sub) => {
            const hasPhone = Boolean(sub.phone && sub.phone.trim().length > 6);
            const isSent = sentMap[sub.id];

            return (
              <div
                key={sub.id}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-100">{sub.full_name}</p>
                    {isSent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        ✓ Terkirim
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {sub.phone || 'Tanpa No WA'} • {formatRupiah(sub.package_price || 200000)}
                  </p>
                </div>

                <button
                  onClick={() => handleSendWA(sub)}
                  disabled={!hasPhone}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow ${
                    !hasPhone
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : broadcastType === 'billing_10'
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim WA
                </button>
              </div>
            );
          })}

          {unpaidSubs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800/60">
              Luar biasa! Semua pelanggan aktif sudah melunasi tagihan bulan ini.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            {unpaidSubs.length} Pelanggan Belum Bayar
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
