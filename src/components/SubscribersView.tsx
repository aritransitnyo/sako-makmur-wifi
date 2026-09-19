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

    // Reset & Close
    setUsername('');
    setFullName('');
    setAddress('');
    setPhone('');
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* Revenue Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-500/20 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Total Tagihan Pelanggan Aktif</p>
          <p className="text-xl font-bold text-cyan-400 mt-0.5">
            {formatRupiah(activeRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {subscribers.filter((s) => s.status === 'active').length} dari {subscribers.length} Pelanggan
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama, PPPoE username, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'suspended'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status === 'all'
                ? `Semua (${subscribers.length})`
                : status === 'active'
                ? `Aktif (${subscribers.filter((s) => s.status === 'active').length})`
                : `Isolir (${subscribers.filter((s) => s.status === 'suspended').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriber List */}
      <div className="space-y-2.5">
        {filtered.map((sub) => {
          const isActive = sub.status === 'active';
          return (
            <div
              key={sub.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-100">{sub.full_name}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.2 rounded text-[10px] font-semibold border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isActive ? 'Aktif' : 'Terisolir'}
                    </span>
                  </div>
                  <p className="font-mono text-cyan-400/90 text-[11px] mt-0.5">
                    pppoe: {sub.username_pppoe}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-200">
                    {formatRupiah(sub.package_price || 100000)}
                  </p>
                  <p className="text-[10px] text-slate-400">{sub.package_name}</p>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {sub.address || 'Alamat tidak diisi'}
                  </span>
                  {sub.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {sub.phone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onToggleStatus(sub.id, isActive ? 'suspended' : 'active')
                    }
                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                      isActive
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/50'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50'
                    }`}
                  >
                    {isActive ? 'Isolir' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => onDeleteSubscriber(sub.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ada data pelanggan yang cocok.
          </div>
        )}
      </div>

      {/* Modal Tambah Subscriber */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Tambah Pelanggan PPPoE Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Username PPPoE</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: sako_rt01_budi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Paket PPPoE</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.speed_limit}) - {formatRupiah(pkg.price_monthly)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alamat Pemasangan</label>
                <input
                  type="text"
                  placeholder="RT / RW / No. Rumah"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="08..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
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
