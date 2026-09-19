import React, { useState } from 'react';
import { Sparkles, Trash2, RotateCcw, X, AlertTriangle, Check } from 'lucide-react';

interface ResetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBusinessName: string;
  onResetToZero: (businessName: string) => void;
  onResetToDemo: () => void;
}

export const ResetWizardModal: React.FC<ResetWizardModalProps> = ({
  isOpen,
  onClose,
  currentBusinessName,
  onResetToZero,
  onResetToDemo,
}) => {
  const [businessName, setBusinessName] = useState(currentBusinessName || 'Sako Makmur WiFi');
  const [isConfirmingZero, setIsConfirmingZero] = useState(false);

  if (!isOpen) return null;

  const handleStartZero = (e: React.FormEvent) => {
    e.preventDefault();
    onResetToZero(businessName.trim());
    setIsConfirmingZero(false);
    onClose();
  };

  const handleRestoreDemo = () => {
    onResetToDemo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 page-transition shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Setup Database Usaha (Mulai dari Nol)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isConfirmingZero ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Pilih opsi di bawah untuk mengatur database sesuai kebutuhan Anda:
            </p>

            {/* Option 1: Mulai dari Nol */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-100 text-sm">
                    Mulai Usaha Riil (Database Bersih 0)
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    Hapus semua data contoh (pelanggan demo, belanja demo) dan siapkan database bersih untuk menginput pelanggan asli Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmingZero(true)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-colors"
              >
                Mulai dari Nol Sekarang
              </button>
            </div>

            {/* Option 2: Isi Data Demo */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-400 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">
                    Muat Ulang Data Contoh (Demo)
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    Mengisi kembali simulasi lengkap: Starlink kit, MikroTik, 6 pelanggan contoh, dan 3 investor.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRestoreDemo}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
              >
                Muat Data Contoh
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation form */
          <form onSubmit={handleStartZero} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                Semua data pelanggan dan pengeluaran demo saat ini akan dikosongkan. Anda dapat mulai menginput data asli dari angka nol.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nama Usaha WiFi Anda
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Sako Makmur WiFi"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingZero(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
              >
                Konfirmasi & Mulai
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
