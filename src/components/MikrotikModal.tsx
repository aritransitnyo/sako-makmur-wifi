import React, { useState } from 'react';
import { Terminal, Copy, Check, X, ShieldAlert } from 'lucide-react';
import { Subscriber, PppoePackage } from '../types';

interface MikrotikModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: Subscriber[];
  packages: PppoePackage[];
}

export const MikrotikModal: React.FC<MikrotikModalProps> = ({
  isOpen,
  onClose,
  subscribers,
  packages,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate RouterOS Script
  let script = `# ==========================================\n`;
  script += `# SAKO MAKMUR WIFI - MIKROTIK PPPoE SETUP\n`;
  script += `# Paste di New Terminal MikroTik (Winbox)\n`;
  script += `# ==========================================\n\n`;

  script += `# 1. BUAT PROFILE BANDWIDTH\n`;
  packages.forEach((pkg) => {
    const rate = pkg.speed_limit.replace(/\s+/g, '').toLowerCase(); // e.g. 10mbps
    script += `/ppp profile add name="${pkg.package_name}" rate-limit="${rate}/${rate}" comment="SakoMakmur_${pkg.speed_limit}"\n`;
  });

  script += `\n# 2. BUAT PPPoE SECRET PELANGGAN\n`;
  subscribers.forEach((sub) => {
    const pass = sub.pppoe_password || '123';
    const profile = sub.package_name || 'default';
    const disabled = sub.status === 'active' ? 'no' : 'yes';
    script += `/ppp secret add name="${sub.username_pppoe}" password="${pass}" profile="${profile}" service=pppoe disabled=${disabled} comment="${sub.full_name} - ${sub.address}"\n`;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Export Skrip MikroTik PPPoE (RouterOS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Skrip CLI ini dapat langsung ditempel ke <span className="text-cyan-400 font-mono">Winbox &gt; New Terminal</span> untuk otomatis membuat PPPoE Secrets dan Profile kecepatan!
        </p>

        {/* Script Output Container */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto font-mono text-[11px] text-cyan-300 whitespace-pre leading-relaxed shadow-inner">
          {script}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Total {subscribers.length} Pelanggan
          </span>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Berhasil Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Salin Skrip MikroTik
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
