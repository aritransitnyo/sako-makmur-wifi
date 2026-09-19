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
} from 'lucide-react';
import { Subscriber, PppoePackage } from '../types';
import { formatRupiah } from './MetricCard';

interface SubscribersViewProps {
  subscribers: Subscriber[];
  packages: PppoePackage[];
  onAddSubscriber: (sub: Omit<Subscriber, 'id'>) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'suspended' | 'terminated') => void;
  onDeleteSubscriber: (id: string) => void;
}

export const SubscribersView: React.FC<SubscribersViewProps> = ({
  subscribers,
  packages,
  onAddSubscriber,
  onToggleStatus,
  onDeleteSubscriber,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || 'pkg-1');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const filtered = subscribers.filter((sub) => {
    const matchSearch =
      sub.full_name.toLowerCase().includes(search.toLowerCase()) ||
      sub.username_pppoe.toLowerCase().includes(search.toLowerCase()) ||
      sub.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ? true : sub.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const activeRevenue = subscribers
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.package_price || 100000), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) return;

    const pkg = packages.find((p) => p.id === selectedPackageId);
    onAddSubscriber({
      username_pppoe: username.trim().toLowerCase(),
      full_name: fullName.trim(),
      package_id: selectedPackageId,
      package_name: pkg?.package_name || 'Paket Internet',
      package_price: pkg?.price_monthly || 100000,
      address: address.trim(),
      phone: phone.trim(),
      status: 'active',
    });

    setUsername('');
    setFullName('');
    setAddress('');
    setPhone('');
    setShowModal(false);
  };

  const getCleanPhone = (phoneNum: string) => {
    let clean = phoneNum.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/25 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            Pendapatan Pelanggan Aktif
          </p>
          <p className="text-2xl font-black text-slate-50 mt-0.5">
            {formatRupiah(activeRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-bold">{activeCount} Aktif</span> • {subscribers.length - activeCount} Terisolir
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Tambah
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama, PPPoE username, alamat RT/RW..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
          />
        </div>

        {/* Chips */}
        <div className="flex gap-1.5">
          {(['all', 'active', 'suspended'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status === 'all'
                ? `Semua (${subscribers.length})`
                : status === 'active'
                ? `Aktif (${activeCount})`
                : `Isolir (${subscribers.length - activeCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filtered.map((sub) => {
          const isActive = sub.status === 'active';
          const cleanPhone = sub.phone ? getCleanPhone(sub.phone) : '';

          return (
            <div
              key={sub.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all text-xs shadow-md space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{sub.full_name}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isActive ? '● Aktif' : '○ Isolir'}
                    </span>
                  </div>
                  <p className="font-mono text-cyan-400 text-[11px] flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    {sub.username_pppoe}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm text-slate-100">
                    {formatRupiah(sub.package_price || 100000)}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40">
                    {sub.package_name || '10 Mbps'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-2 truncate pr-2">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{sub.address || 'Alamat RT/RW'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(sub.full_name)},%20informasi%20layanan%20Sako%20Makmur%20WiFi`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/60 transition-colors"
                      title="Hubungi WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() =>
                      onToggleStatus(sub.id, isActive ? 'suspended' : 'active')
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      isActive
                        ? 'bg-rose-950/50 text-rose-300 border-rose-800/50 hover:bg-rose-900/50'
                        : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
                    }`}
                  >
                    {isActive ? 'Isolir' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => onDeleteSubscriber(sub.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus"
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
            Tidak ada pelanggan yang cocok dengan pencarian.
          </div>
        )}
      </div>

      {/* Modal Tambah Subscriber */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Tambah Pelanggan PPPoE Baru
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

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Username PPPoE (Login MikroTik)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: sako_rt01_slamet"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Pilihan Paket PPPoE</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.speed_limit}) - {formatRupiah(pkg.price_monthly)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Alamat Pemasangan (Dropcore FO)</label>
                <input
                  type="text"
                  placeholder="Contoh: RT 02 / RW 01 Dekat Masjid"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nomor WhatsApp</label>
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
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
