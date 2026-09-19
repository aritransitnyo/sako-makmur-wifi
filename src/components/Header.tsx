import React from 'react';
import { Wifi, Database, ShieldCheck, RefreshCw } from 'lucide-react';

interface HeaderProps {
  businessName: string;
  isSupabase: boolean;
  onRefresh: () => void;
  onOpenSqlModal: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  isSupabase,
  onRefresh,
  onOpenSqlModal,
  loading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base text-slate-100 tracking-tight leading-none">
                {businessName || 'Sako Makmur WiFi'}
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Starlink Backhaul
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              PPPoE Executive & Equity Manager
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSqlModal}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSupabase
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
            }`}
            title="Status Database Supabase"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabase ? 'Supabase Sync' : 'Local + Supabase'}
            </span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
