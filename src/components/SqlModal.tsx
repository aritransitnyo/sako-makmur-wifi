import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../lib/dataStore';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupabase: boolean;
}

export const SqlModal: React.FC<SqlModalProps> = ({
  isOpen,
  onClose,
  isSupabase,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Koneksi & Skema Supabase PostgreSQL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Status Database:</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isSupabase
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isSupabase ? '● Terhubung Cloud Supabase' : '● Mode Cepat (Local + Cloud Ready)'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Target Project:{' '}
            <span className="text-cyan-400 font-mono">
              https://quxkfnlizpsdccuomqdd.supabase.co
            </span>
          </p>
        </div>

        {/* SQL Script Box */}
        <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">
              Skema Tabel Lengkap (Tinggal Salin & Tempel)
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin SQL
                </>
              )}
            </button>
          </div>

          <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto font-mono text-[11px] text-cyan-300/90 max-h-56">
            <pre>{SUPABASE_SQL_SCRIPT}</pre>
          </div>
        </div>

        {/* Action instructions */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <a
            href="https://app.supabase.com/project/quxkfnlizpsdccuomqdd/database/sql"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:underline"
          >
            Buka Supabase SQL Editor <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
