import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  X,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wifi,
} from 'lucide-react';
import { Subscriber, PppoePackage } from '../types';
import { formatRupiah } from './MetricCard';

interface MikrotikModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: Subscriber[];
  packages: PppoePackage[];
  onImportSubscribers: (
    newSubs: Subscriber[],
    replaceExisting: boolean,
    newPackages: PppoePackage[]
  ) => void;
}

export const MikrotikModal: React.FC<MikrotikModalProps> = ({
  isOpen,
  onClose,
  subscribers,
  packages,
  onImportSubscribers,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [copied, setCopied] = useState(false);

  // Import states
  const [inputText, setInputText] = useState('');
  const [parsedSubs, setParsedSubs] = useState<Subscriber[]>([]);
  const [parsedPackages, setParsedPackages] = useState<PppoePackage[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  // Parser logic for RouterOS CLI output (/ppp secret export or /ppp secret print)
  const handleParseMikrotik = () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n');
    const detectedSubs: Subscriber[] = [];
    const detectedPackagesMap = new Map<string, PppoePackage>();

    // Seed existing packages into map
    packages.forEach((p) => detectedPackagesMap.set(p.package_name.toLowerCase(), p));

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      // Extract /ppp profile add ...
      if (trimmed.includes('profile') && (trimmed.includes('add') || trimmed.includes('set'))) {
        const nameMatch = trimmed.match(/name="([^"]+)"/) || trimmed.match(/name=([^\s]+)/);
        const rateMatch = trimmed.match(/rate-limit="([^"]+)"/) || trimmed.match(/rate-limit=([^\s]+)/);

        if (nameMatch && nameMatch[1]) {
          const profName = nameMatch[1];
          const speed = rateMatch ? rateMatch[1] : '10M/10M';
          if (!detectedPackagesMap.has(profName.toLowerCase())) {
            detectedPackagesMap.set(profName.toLowerCase(), {
              id: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              package_name: profName,
              speed_limit: speed,
              price_monthly: 150000,
            });
          }
        }
      }

      // Extract /ppp secret add ...
      if (trimmed.includes('name=') || (trimmed.startsWith('add') && trimmed.includes('service=pppoe'))) {
        const nameMatch = trimmed.match(/name="([^"]+)"/) || trimmed.match(/name=([^\s]+)/);
        const passMatch = trimmed.match(/password="([^"]+)"/) || trimmed.match(/password=([^\s]+)/);
        const profileMatch = trimmed.match(/profile="([^"]+)"/) || trimmed.match(/profile=([^\s]+)/);
        const commentMatch = trimmed.match(/comment="([^"]+)"/) || trimmed.match(/comment=([^\s]+)/);
        const disabledMatch = trimmed.match(/disabled=(yes|no)/);

        if (nameMatch && nameMatch[1]) {
          const username = nameMatch[1];
          const password = passMatch ? passMatch[1] : '123';
          const profileName = profileMatch ? profileMatch[1] : 'default';
          const comment = commentMatch ? commentMatch[1] : '';
          const isDisabled = disabledMatch ? disabledMatch[1] === 'yes' : false;

          // Parse full name, address, phone from comment if available
          let fullName = username;
          let address = '';
          let phone = '';

          if (comment) {
            fullName = comment;
            // Phone number regex detection (08... or 628...)
            const phoneMatch = comment.match(/(08\d{8,12}|628\d{8,12})/);
            if (phoneMatch) {
              phone = phoneMatch[0];
              fullName = comment.replace(phoneMatch[0], '').replace(/[-–,]/g, ' ').trim();
            }
          }

          // Match package
          let pkg = detectedPackagesMap.get(profileName.toLowerCase());
          if (!pkg) {
            pkg = {
              id: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              package_name: profileName,
              speed_limit: '10 Mbps',
              price_monthly: 100000,
            };
            detectedPackagesMap.set(profileName.toLowerCase(), pkg);
          }

          detectedSubs.push({
            id: `sub-mikrotik-${Date.now()}-${index}`,
            username_pppoe: username,
            pppoe_password: password,
            full_name: fullName || username,
            package_id: pkg.id,
            package_name: pkg.package_name,
            package_price: pkg.price_monthly,
            address: address || 'MikroTik Import',
            phone: phone,
            status: isDisabled ? 'suspended' : 'active',
            due_date: 10,
            payment_status: 'unpaid',
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    const newPkgs = Array.from(detectedPackagesMap.values());
    setParsedSubs(detectedSubs);
    setParsedPackages(newPkgs);
    setHasParsed(true);
  };

  const handleApplyImport = () => {
    onImportSubscribers(parsedSubs, replaceExisting, parsedPackages);
    onClose();
  };

  // Generate RouterOS Script for Export
  let script = `# ==========================================\n`;
  script += `# SAKO MAKMUR WIFI - MIKROTIK PPPoE SETUP\n`;
  script += `# Paste di New Terminal MikroTik (Winbox)\n`;
  script += `# ==========================================\n\n`;

  script += `# 1. BUAT PROFILE BANDWIDTH\n`;
  packages.forEach((pkg) => {
    const rate = pkg.speed_limit.replace(/\s+/g, '').toLowerCase();
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 page-transition max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Integrasi MikroTik RouterOS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Impor vs Ekspor */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Impor dari MikroTik
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Ekspor ke MikroTik
          </button>
        </div>

        {/* TAB IMPORT CONTENT */}
        {activeTab === 'import' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            {/* Step-by-step instructions */}
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-slate-300 space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold text-cyan-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Cara Mengambil Data dari MikroTik:
              </p>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-400">
                <li>Buka <strong>Winbox</strong> MikroTik Anda &gt; klik <strong>New Terminal</strong>.</li>
                <li>
                  Ketik perintah: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">/ppp secret export</code> lalu tekan <strong>Enter</strong>.
                </li>
                <li>Salin (Copy) semua teks output terminal tersebut.</li>
                <li>Tempel (Paste) ke kolom di bawah, lalu klik <strong>Analisa Data</strong>.</li>
              </ol>
            </div>

            {/* Input textarea */}
            {!hasParsed ? (
              <div className="flex-1 flex flex-col space-y-2">
                <label className="text-slate-400 font-medium text-[11px]">
                  Tempel Output Terminal MikroTik di sini:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Contoh teks dari Winbox:\n/ppp secret\nadd name="budi" password="123" profile="Paket 20M" comment="Pak Budi RT 01"\nadd name="warno" password="456" profile="Paket 10M" comment="Warno"`}
                  className="flex-1 min-h-[140px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
                />
                <button
                  onClick={handleParseMikrotik}
                  disabled={!inputText.trim()}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-lg shadow-cyan-500/20"
                >
                  <Upload className="w-4 h-4" />
                  Analisa &amp; Deteksi Pelanggan
                </button>
              </div>
            ) : (
              /* Preview detected results */
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">
                    Terdeteksi {parsedSubs.length} Pelanggan &amp; {parsedPackages.length} Profil
                  </span>
                  <button
                    onClick={() => {
                      setHasParsed(false);
                      setParsedSubs([]);
                    }}
                    className="text-cyan-400 text-[11px] underline"
                  >
                    Ubah Teks Input
                  </button>
                </div>

                {/* List Preview */}
                <div className="flex-1 overflow-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-48 p-2">
                  {parsedSubs.map((sub, idx) => (
                    <div key={idx} className="py-1.5 px-2 flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-bold text-slate-200">{sub.full_name}</p>
                        <p className="font-mono text-cyan-400 text-[10px]">
                          user: {sub.username_pppoe} • pass: {sub.pppoe_password}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {sub.package_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Options: Replace or Append */}
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded accent-cyan-400 w-4 h-4"
                  />
                  <span>
                    Ganti seluruh data pelanggan lama dengan data MikroTik ini (Timpa)
                  </span>
                </label>

                {/* Submit Import Button */}
                <button
                  onClick={handleApplyImport}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/25 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Masukkan {parsedSubs.length} Pelanggan ke Aplikasi
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB EXPORT CONTENT */}
        {activeTab === 'export' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Skrip RouterOS di bawah berisi seluruh profil paket dan secret PPPoE yang ada di aplikasi. Salin dan tempel di Winbox MikroTik:
            </p>

            {/* Script Box */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto font-mono text-[11px] text-cyan-300 whitespace-pre leading-relaxed shadow-inner max-h-56">
              {script}
            </div>

            {/* Copy Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-500 font-medium text-[11px]">
                {subscribers.length} Pelanggan Siap Diekspor
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
                    <Copy className="w-4 h-4" /> Salin Skrip RouterOS
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
