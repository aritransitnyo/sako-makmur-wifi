import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Hapus Permanen',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 page-transition shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Konfirmasi Keamanan</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          {message}
        </p>

        <div className="pt-2 flex gap-2">
          <button
            onClick={onCancel}
            className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
