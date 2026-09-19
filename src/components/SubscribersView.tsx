import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  MessageCircle,
  Wifi,
  Calendar,
  Terminal,
  Clock,
  DollarSign,
  Send,
  Edit3,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Subscriber, PppoePackage } from '../types';
import { formatRupiah } from './MetricCard';
import { ConfirmModal } from './ConfirmModal';

interface SubscribersViewProps {
  businessName: string;
  subscribers: Subscriber[];
  packages: PppoePackage[];
  onAddSubscriber: (sub: Omit<Subscriber, 'id'>) => void;
  onUpdateSubscriber: (sub: Subscriber) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'suspended' | 'terminated') => void;
  onConfirmPayment: (id: string, method: 'Tunai' | 'Transfer Bank') => void;
  onCancelPayment: (id: string) => void;
  onDeleteSubscriber: (id: string) => void;
  onOpenMikrotikModal: () => void;
}

export const SubscribersView: React.FC<SubscribersViewProps> = ({
  businessName,
  subscribers,
  packages,
  onAddSubscriber,
  onUpdateSubscriber,
  onToggleStatus,
  onConfirmPayment,
  onCancelPayment,
  onDeleteSubscriber,
  onOpenMikrotikModal,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unpaid' | 'paid' | 'suspended'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);

  // Deletion Confirmation State
  const [subToDelete, setSubToDelete] = useState<Subscriber | null>(null);

  // Payment Confirmation Modal (Tunai vs Transfer Bank)
  const [payingSub, setPayingSub] = useState<Subscriber | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [fullName, setFullName] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || 'pkg-5m');
  const [customPrice, setCustomPrice] = useState<number>(packages[0]?.price_monthly || 200000);
  const [installationFee, setInstallationFee] = useState<number>(0);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState<number>(10);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setUsername('');
    setPassword('123');
    setFullName('');
    const firstPkg = packages[0] || { id: 'pkg-5m', price_monthly: 200000 };
    setSelectedPackageId(firstPkg.id);
    setCustomPrice(firstPkg.price_monthly || 200000);
    setInstallationFee(0);
    setAddress('');
    setPhone('');
    setDueDate(10);
    setShowModal(true);
  };

  const handleOpenEdit = (sub: Subscriber) => {
    setEditingSub(sub);
    setUsername(sub.username_pppoe);
    setPassword(sub.pppoe_password || '123');
    setFullName(sub.full_name);
    setSelectedPackageId(sub.package_id || packages[0]?.id || 'pkg-5m');
    setCustomPrice(sub.package_price || 200000);
    setInstallationFee(sub.installation_fee || 0);
    setAddress(sub.address || '');
    setPhone(sub.phone || '');
    setDueDate(sub.due_date || 10);
    setShowModal(true);
  };

  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const found = packages.find((p) => p.id === pkgId);
    if (found) {
      setCustomPrice(found.price_monthly);
    }
  };

  const filtered = subscribers.filter((sub) => {
    const matchSearch =
      sub.full_name.toLowerCase().includes(search.toLowerCase()) ||
      sub.username_pppoe.toLowerCase().includes(search.toLowerCase()) ||
      sub.address.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filterTab === 'all') return true;
    if (filterTab === 'unpaid') return sub.status === 'active' && sub.payment_status === 'unpaid';
    if (filterTab === 'paid') return sub.payment_status === 'paid';
    if (filterTab === 'suspended') return sub.status === 'suspended';
    return true;
  });

  const activeSubscribers = subscribers.filter((s) => s.status === 'active');
  const paidSubscribers = activeSubscribers.filter((s) => s.payment_status === 'paid');
  const unpaidSubscribers = activeSubscribers.filter((s) => s.payment_status === 'unpaid');

  const totalPotensi = activeSubscribers.reduce((sum, s) => sum + (s.package_price || 200000), 0);
  const totalTerkumpul = paidSubscribers.reduce((sum, s) => sum + (s.package_price || 200000), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) return;

    const pkg = packages.find((p) => p.id === selectedPackageId);
    const finalPkgName = pkg?.package_name || editingSub?.package_name || 'Paket Up to 5 Mbps';
    const finalPrice = customPrice || pkg?.price_monthly || 200000;

    if (editingSub) {
      onUpdateSubscriber({
        ...editingSub,
        username_pppoe: username.trim().toLowerCase(),
        pppoe_password: password.trim() || '123',
        full_name: fullName.trim(),
        package_id: selectedPackageId,
        package_name: finalPkgName,
        package_price: finalPrice,
        installation_fee: installationFee || 0,
        address: address.trim(),
        phone: phone.trim(),
        due_date: dueDate || 10,
      });
    } else {
      onAddSubscriber({
        username_pppoe: username.trim().toLowerCase(),
        pppoe_password: password.trim() || '123',
        full_name: fullName.trim(),
        package_id: selectedPackageId,
        package_name: finalPkgName,
        package_price: finalPrice,
        installation_fee: installationFee || 0,
        address: address.trim(),
        phone: phone.trim(),
        status: 'active',
        due_date: dueDate || 10,
        payment_status: 'unpaid',
      });
    }

    setEditingSub(null);
    setShowModal(false);
  };

  const getCleanPhone = (phoneNum: string) => {
    let clean = phoneNum.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const sendReceiptWhatsApp = (sub: Subscriber) => {
    const cleanPhone = getCleanPhone(sub.phone);
    if (!cleanPhone) return;
    const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
    const methodStr = sub.payment_method ? ` (${sub.payment_method})` : '';
    const text = `*KUITANSI PEMBAYARAN WIFI - ${businessName.toUpperCase()}*\n\nHalo Bapak/Ibu *${sub.full_name}*,\n\nTerima kasih! Pembayaran iuran WiFi Anda untuk periode *${currentMonth}* sebesar *${formatRupiah(sub.package_price || 200000)}* telah KAMI TERIMA${methodStr} (LUNAS ✅).\n\nUsername PPPoE: *${sub.username_pppoe}*\nPaket: *${sub.package_name}*\n\nSelamat menikmati koneksi internet cepat kami. Jika ada kendala, hubungi kami di nomor ini. 🙏`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendReminderWhatsApp = (sub: Subscriber) => {
    const cleanPhone = getCleanPhone(sub.phone);
    if (!cleanPhone) return;
    const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
    const text = `*PEMBERITAHUAN TAGIHAN WIFI - ${businessName.toUpperCase()}*\n\nHalo Bapak/Ibu *${sub.full_name}*,\n\nMengingatkan tagihan WiFi periode *${currentMonth}* sebesar *${formatRupiah(sub.package_price || 200000)}* jatuh tempo pada *tanggal ${sub.due_date || 10}*.\n\nMohon melakukan pembayaran via transfer atau konfirmasi jika sudah membayar agar koneksi tetap lancar. Terima kasih! 🙏`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Top Banner Kasir Tagihan */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/25 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
              Kasir &amp; Tagihan Bulan Ini
            </p>
            <p className="text-2xl font-black text-slate-50 mt-0.5">
              {formatRupiah(totalTerkumpul)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari Potensi: <span className="text-slate-200 font-bold">{formatRupiah(totalPotensi)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMikrotikModal}
              className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors font-bold"
              title="Import / Export MikroTik"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">MikroTik</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah
            </button>
          </div>
        </div>

        {/* Progress tagihan */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-emerald-400 font-bold">
            ✓ {paidSubscribers.length} Lunas
          </span>
          <span className="text-amber-400 font-bold">
            ⏳ {unpaidSubscribers.length} Belum Bayar
          </span>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari pelanggan, username PPPoE, RT/RW..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
          />
        </div>

        {/* Status Tabs */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all text-center ${
              filterTab === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Semua ({subscribers.length})
          </button>
          <button
            onClick={() => setFilterTab('unpaid')}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all text-center ${
              filterTab === 'unpaid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Belum ({unpaidSubscribers.length})
          </button>
          <button
            onClick={() => setFilterTab('paid')}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all text-center ${
              filterTab === 'paid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Lunas ({paidSubscribers.length})
          </button>
          <button
            onClick={() => setFilterTab('suspended')}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all text-center ${
              filterTab === 'suspended'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Isolir ({subscribers.length - activeSubscribers.length})
          </button>
        </div>
      </div>

      {/* Subscriber Cards */}
      <div className="space-y-2.5">
        {filtered.map((sub) => {
          const isActive = sub.status === 'active';
          const isPaid = sub.payment_status === 'paid';
          const hasPhone = Boolean(sub.phone);

          return (
            <div
              key={sub.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all text-xs shadow-md space-y-2.5"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{sub.full_name}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isPaid ? `✓ Lunas${sub.payment_method ? ` (${sub.payment_method})` : ''}` : '⏳ Belum Bayar'}
                    </span>
                    {!isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Isolir
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="font-mono text-cyan-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      {sub.username_pppoe}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      Jatuh Tempo: Tgl {sub.due_date || 10}
                    </span>
                    {sub.installation_fee && sub.installation_fee > 0 && (
                      <span className="text-[10px] text-amber-400 font-medium">
                        PSB: {formatRupiah(sub.installation_fee)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm text-slate-100">
                    {formatRupiah(sub.package_price || 200000)}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40">
                    {sub.package_name || '5 Mbps'}
                  </span>
                </div>
              </div>

              {/* Address & Quick Actions Bar */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px] gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{sub.address || 'Alamat RT/RW'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Payment Button */}
                  <button
                    onClick={() => {
                      if (isPaid) {
                        onCancelPayment(sub.id);
                      } else {
                        setPayingSub(sub);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${
                      isPaid
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {isPaid ? 'Batal Lunas' : 'Terima Bayar'}
                  </button>

                  {/* WhatsApp Action */}
                  {hasPhone && (
                    isPaid ? (
                      <button
                        onClick={() => sendReceiptWhatsApp(sub)}
                        className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/60 transition-colors"
                        title="Kirim Kuitansi WhatsApp"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => sendReminderWhatsApp(sub)}
                        className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/50 hover:bg-amber-900/60 transition-colors"
                        title="Kirim Pengingat Tagihan WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  {/* Isolir toggle */}
                  <button
                    onClick={() => onToggleStatus(sub.id, isActive ? 'suspended' : 'active')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      isActive
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/50'
                        : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40 hover:bg-cyan-900/50'
                    }`}
                  >
                    {isActive ? 'Isolir' : 'Aktif'}
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    title="Edit Data Pelanggan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSubToDelete(sub)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus Pelanggan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60">
            Tidak ada pelanggan dalam kategori ini.
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Subscriber */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                {editingSub ? 'Edit Data Pelanggan PPPoE' : 'Tambah Pelanggan PPPoE Baru'}
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
                <label className="block text-slate-400 mb-1 font-medium">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak RT Slamet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Username PPPoE</label>
                  <input
                    type="text"
                    required
                    placeholder="sako_rt01_slamet"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Password PPPoE</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Package Select */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Paket PPPoE</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.speed_limit}) - {formatRupiah(pkg.price_monthly)}/bln
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tarif Bulanan (Rp)</label>
                  <input
                    type="number"
                    min="50000"
                    step="10000"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 200000)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jatuh Tempo (Tgl)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Biaya Pasang Baru / PSB */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Biaya Pasang Baru / PSB (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="0"
                  value={installationFee || ''}
                  onChange={(e) => setInstallationFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Biaya registrasi awal untuk pengembalian modal belanja alat.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Alamat Pemasangan</label>
                <input
                  type="text"
                  placeholder="Contoh: RT 02 / RW 01 Dekat Masjid"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nomor WhatsApp Pelanggan</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
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
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                >
                  {editingSub ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembayaran: Tunai vs Transfer Bank */}
      {payingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 page-transition shadow-2xl">
            <div className="text-center space-y-1">
              <p className="font-bold text-sm text-slate-100">Konfirmasi Terima Iuran</p>
              <p className="text-xs text-slate-400">
                Pelanggan: <span className="font-bold text-slate-200">{payingSub.full_name}</span>
              </p>
              <p className="text-lg font-black text-emerald-400 mt-1">
                {formatRupiah(payingSub.package_price || 200000)}
              </p>
            </div>

            <p className="text-xs text-slate-300 text-center font-medium">
              Pilih metode pembayaran yang diterima:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onConfirmPayment(payingSub.id, 'Tunai');
                  setPayingSub(null);
                }}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-bold text-slate-200"
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                Uang Tunai
              </button>
              <button
                onClick={() => {
                  onConfirmPayment(payingSub.id, 'Transfer Bank');
                  setPayingSub(null);
                }}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-bold text-slate-200"
              >
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Transfer Bank
              </button>
            </div>

            <button
              onClick={() => setPayingSub(null)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(subToDelete)}
        title="Hapus Pelanggan PPPoE"
        message={`Apakah Anda yakin ingin menghapus data pelanggan "${subToDelete?.full_name}" (${subToDelete?.username_pppoe})? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          if (subToDelete) {
            onDeleteSubscriber(subToDelete.id);
            setSubToDelete(null);
          }
        }}
        onCancel={() => setSubToDelete(null)}
      />
    </div>
  );
};
