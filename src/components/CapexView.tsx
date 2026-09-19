import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Layers, DollarSign, Package, Edit3 } from 'lucide-react';
import { CapexItem, Investor } from '../types';
import { formatRupiah } from './MetricCard';

interface CapexViewProps {
  capexItems: CapexItem[];
  investors: Investor[];
  onAddCapex: (item: Omit<CapexItem, 'id' | 'total_price'>) => void;
  onUpdateCapex: (item: CapexItem) => void;
  onDeleteCapex: (id: string) => void;
}

export const CapexView: React.FC<CapexViewProps> = ({
  capexItems,
  investors,
  onAddCapex,
  onUpdateCapex,
  onDeleteCapex,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CapexItem | null>(null);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<CapexItem['category']>('Starlink & Backhaul');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('unit');
  const [unitPrice, setUnitPrice] = useState(0);

  const totalSpent = capexItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalCapital = investors.reduce((sum, inv) => sum + inv.capital_invested, 0);
  const sisaModal = Math.max(0, totalCapital - totalSpent);
  const percentUsed = totalCapital > 0 ? ((totalSpent / totalCapital) * 100).toFixed(1) : '0';

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemName('');
    setCategory('Starlink & Backhaul');
    setQuantity(1);
    setUnit('unit');
    setUnitPrice(0);
    setShowModal(true);
  };

  const handleOpenEdit = (item: CapexItem) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setCategory(item.category || 'Starlink & Backhaul');
    setQuantity(item.quantity);
    setUnit(item.unit);
    setUnitPrice(item.unit_price);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || unitPrice <= 0) return;

    if (editingItem) {
      onUpdateCapex({
        ...editingItem,
        item_name: itemName.trim(),
        category,
        quantity,
        unit,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
      });
    } else {
      onAddCapex({
        item_name: itemName.trim(),
        category,
        quantity,
        unit,
        unit_price: unitPrice,
      });
    }

    setItemName('');
    setQuantity(1);
    setUnitPrice(0);
    setEditingItem(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24 page-transition">
      {/* CAPEX Progress Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/20 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-medium">Alokasi Modal Belanja (CAPEX)</p>
            <p className="text-xl font-bold text-violet-300 mt-0.5">
              {formatRupiah(totalSpent)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Total Modal Investor: {formatRupiah(totalCapital)}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Beli Alat
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Modal Terpakai: {percentUsed}%</span>
            <span className="text-emerald-400 font-medium">
              Sisa Kas Modal: {formatRupiah(sisaModal)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(percentUsed))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          Rincian Aset Jaringan & Pengadaan ({capexItems.length} Item)
        </h3>

        {capexItems.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-xs space-y-2 shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-slate-100">{item.item_name}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-400 mt-1">
                  {item.category || 'Infrastruktur'}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-200">
                  {formatRupiah(item.total_price)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {item.quantity} {item.unit} @ {formatRupiah(item.unit_price)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                title="Edit Item"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDeleteCapex(item.id)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah / Edit CAPEX */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-violet-400" />
                {editingItem ? 'Edit Aset Belanja Modal' : 'Catat Belanja Modal (CAPEX)'}
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
                <label className="block text-slate-400 mb-1 font-medium">Nama Barang / Pengadaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kabel FO 1000m / Starlink Mount"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="Starlink & Backhaul">Starlink & Backhaul</option>
                  <option value="MikroTik & Core">MikroTik & Core Network</option>
                  <option value="Kabel & Distribusi">Kabel FO & Distribusi</option>
                  <option value="Power & Backup">Power, Listrik & UPS</option>
                  <option value="Lainnya">Lainnya / Tiang / Aksesoris</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="unit, roll, pcs"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={unitPrice || ''}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-slate-400">Total Biaya: </span>
                <span className="font-bold text-violet-400">
                  {formatRupiah(quantity * unitPrice)}
                </span>
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
                  className="w-1/2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
