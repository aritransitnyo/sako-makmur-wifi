import React from 'react';
import { Wifi, Database, Sparkles, Share2, RefreshCw, Lock } from 'lucide-react';

interface HeaderProps {
  businessName: string;
  isSupabase: boolean;
  onRefresh: () => void;
  onOpenSqlModal: () => void;
  onOpenResetWizard: () => void;
  onOpenShareReport: () => void;
  onLockApp: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  isSupabase,
  onRefresh,
  onOpenSqlModal,
  onOpenResetWizard,
  onOpenShareReport,
  onLockApp,
  loading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070a12]/90 backdrop-blur-xl border-b border-slate-800/90 px-3.5 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-black text-sm text-slate-100 tracking-tight leading-none">
                {businessName || 'Sako Makmur WiFi'}
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Starlink PPPoE Manager
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          {/* Mulai dari Nol Setup */}
          <button
            onClick={onOpenResetWizard}
            className="p-2 rounded-xl bg-slate-900 text-cyan-400 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Setup Usaha / Mulai dari Nol"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Laporan WA */}
          <button
            onClick={onOpenShareReport}
            className="p-2 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Bagikan Laporan ke WhatsApp Investor"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Cloud Supabase Status */}
          <button
            onClick={onOpenSqlModal}
            className={`p-2 rounded-xl text-xs font-medium border transition-all ${
              isSupabase
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60'
                : 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
            }`}
            title="Status Database Cloud Supabase"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Lock App / Logout */}
          <button
            onClick={onLockApp}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Kunci Aplikasi (Logout)"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
