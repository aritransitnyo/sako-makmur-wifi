import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  WifiOff,
  Activity,
  RefreshCw,
  Power,
  Zap,
  Clock,
  Cpu,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  Loader2,
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

// Types for API responses
interface ActiveSession {
  id: string;
  name: string;
  service: string;
  callerId: string;
  address: string;
  uptime: string;
  encoding: string;
  sessionId: string;
}

interface RouterInfo {
  uptime: string;
  version: string;
  cpu_load: string;
  free_memory: string;
  total_memory: string;
  board_name: string;
}

function formatBytes(bits: number): string {
  if (bits < 1000) return `${bits} bps`;
  if (bits < 1000000) return `${(bits / 1000).toFixed(1)} Kbps`;
  return `${(bits / 1000000).toFixed(2)} Mbps`;
}

function formatMemory(bytes: string): string {
  const num = parseInt(bytes, 10);
  if (isNaN(num)) return bytes;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

export const MikrotikModal: React.FC<MikrotikModalProps> = ({
  isOpen,
  onClose,
  subscribers,
  packages,
  onImportSubscribers,
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'import' | 'export'>('monitor');
  const [copied, setCopied] = useState(false);

  // Import states
  const [inputText, setInputText] = useState('');
  const [parsedSubs, setParsedSubs] = useState<Subscriber[]>([]);
  const [parsedPackages, setParsedPackages] = useState<PppoePackage[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [hasParsed, setHasParsed] = useState(false);

  // Monitor states
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [routerVersion, setRouterVersion] = useState('');
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [routerInfo, setRouterInfo] = useState<RouterInfo | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Traffic states
  const [trafficRx, setTrafficRx] = useState(0);
  const [trafficTx, setTrafficTx] = useState(0);
  const trafficTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!isOpen) return null;

  // ===== MONITOR FUNCTIONS =====

  const testApiConnection = async () => {
    setMonitorLoading(true);
    setMonitorError(null);
    try {
      const resp = await fetch('/api/mikrotik?action=test');
      const data = await resp.json();
      if (data.status === 'success' && data.success) {
        setIsConnected(true);
        setRouterVersion(data.version || '');
        // Auto-load status after successful connection
        await fetchStatus();
      } else {
        setIsConnected(false);
        setMonitorError(data.error || data.message || 'Koneksi gagal');
      }
    } catch (err: any) {
      setIsConnected(false);
      setMonitorError(err.message || 'Network error');
    } finally {
      setMonitorLoading(false);
    }
  };

  const fetchStatus = async () => {
    setMonitorLoading(true);
    setMonitorError(null);
    try {
      const resp = await fetch('/api/mikrotik?action=status');
      const data = await resp.json();
      if (data.status === 'success') {
        setActiveSessions(data.active_sessions || []);
        setRouterInfo(data.router || null);
        setIsConnected(true);
        setLastRefresh(new Date());
      } else {
        setMonitorError(data.message || 'Gagal ambil data');
      }
    } catch (err: any) {
      setMonitorError(err.message || 'Network error');
    } finally {
      setMonitorLoading(false);
    }
  };

  const fetchTraffic = async () => {
    try {
      const resp = await fetch('/api/mikrotik?action=traffic&interface=ether1-WAN');
      const data = await resp.json();
      if (data.status === 'success' && data.traffic) {
        setTrafficRx(data.traffic.rxBitsPerSecond);
        setTrafficTx(data.traffic.txBitsPerSecond);
      }
    } catch {
      // Silent fail for traffic polling
    }
  };

  const handleKickUser = async (session: ActiveSession) => {
    if (kickingId) return;
    setKickingId(session.id);
    try {
      const resp = await fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kick', sessionId: session.id }),
      });
      const data = await resp.json();
      if (data.status === 'success') {
        // Remove from local state immediately
        setActiveSessions(prev => prev.filter(s => s.id !== session.id));
      } else {
        setMonitorError(data.message || 'Gagal kick user');
      }
    } catch (err: any) {
      setMonitorError(err.message);
    } finally {
      setKickingId(null);
    }
  };

  // Start traffic polling when monitor tab is active
  useEffect(() => {
    if (activeTab === 'monitor' && isConnected) {
      fetchTraffic();
      trafficTimerRef.current = setInterval(fetchTraffic, 5000);
    }
    return () => {
      if (trafficTimerRef.current) {
        clearInterval(trafficTimerRef.current);
        trafficTimerRef.current = null;
      }
    };
  }, [activeTab, isConnected]);

  // Auto-test connection when monitor tab is first opened
  useEffect(() => {
    if (activeTab === 'monitor' && isConnected === null) {
      testApiConnection();
    }
  }, [activeTab]);

  // Helper: check if a subscriber username is online
  const isUserOnline = (username: string) =>
    activeSessions.some(s => s.name === username);

  const getSession = (username: string) =>
    activeSessions.find(s => s.name === username);

  // ===== IMPORT PARSER (preserved from original) =====

  const handleParseMikrotik = () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n');
    const detectedSubs: Subscriber[] = [];
    const detectedPackagesMap = new Map<string, PppoePackage>();

    packages.forEach((p) => detectedPackagesMap.set(p.package_name.toLowerCase(), p));

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

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

          let fullName = username;
          let address = '';
          let phone = '';

          if (comment) {
            fullName = comment;
            const phoneMatch = comment.match(/(08\d{8,12}|628\d{8,12})/);
            if (phoneMatch) {
              phone = phoneMatch[0];
              fullName = comment.replace(phoneMatch[0], '').replace(/[-–,]/g, ' ').trim();
            }
          }

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

  // ===== EXPORT SCRIPT GENERATOR (preserved from original) =====

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
            {isConnected && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                API v{routerVersion}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Monitor vs Impor vs Ekspor */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'monitor'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'import'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Impor
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'export'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor
          </button>
        </div>

        {/* ===== TAB: LIVE MONITOR ===== */}
        {activeTab === 'monitor' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            {/* Connection Status Banner */}
            {isConnected === null && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Menghubungkan ke MikroTik API...
              </div>
            )}

            {isConnected === false && (
              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  MikroTik API Tidak Terhubung
                </div>
                <p className="text-[11px] text-rose-300/70">{monitorError}</p>
                <button
                  onClick={testApiConnection}
                  disabled={monitorLoading}
                  className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {monitorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Coba Hubungkan Ulang
                </button>
              </div>
            )}

            {isConnected && (
              <>
                {/* Router Info Card */}
                {routerInfo && (
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-[11px]">{routerInfo.board_name || 'MikroTik'}</p>
                          <p className="text-[10px] text-slate-400">RouterOS v{routerInfo.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {routerInfo.uptime}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          CPU: {routerInfo.cpu_load}% • RAM: {formatMemory(routerInfo.free_memory)}/{formatMemory(routerInfo.total_memory)}
                        </p>
                      </div>
                    </div>

                    {/* Traffic Live */}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          ↓ {formatBytes(trafficRx)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-cyan-300">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          ↑ {formatBytes(trafficTx)}
                        </span>
                      </div>
                      <button
                        onClick={fetchStatus}
                        disabled={monitorLoading}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Refresh Status"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${monitorLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Sessions Count */}
                <div className="flex items-center justify-between px-1">
                  <p className="font-bold text-slate-200 text-[11px]">
                    PPPoE Online: <span className="text-emerald-400">{activeSessions.length}</span> / <span className="text-slate-400">{subscribers.length}</span>
                  </p>
                  {lastRefresh && (
                    <p className="text-[10px] text-slate-500">
                      Update: {lastRefresh.toLocaleTimeString('id-ID')}
                    </p>
                  )}
                </div>

                {/* Error banner */}
                {monitorError && (
                  <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {monitorError}
                  </div>
                )}

                {/* User List - Combined view: all subscribers with online status */}
                <div className="flex-1 overflow-auto space-y-1.5 max-h-[40vh] pr-1">
                  {subscribers
                    .filter(s => s.status === 'active' || isUserOnline(s.username_pppoe))
                    .map((sub) => {
                      const online = isUserOnline(sub.username_pppoe);
                      const session = getSession(sub.username_pppoe);

                      return (
                        <div
                          key={sub.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            online
                              ? 'bg-emerald-950/15 border-emerald-500/15'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                online
                                  ? 'bg-emerald-500/15 border border-emerald-500/25'
                                  : 'bg-slate-800 border border-slate-700'
                              }`}>
                                {online ? (
                                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-[11px] text-slate-200 truncate">
                                    {sub.full_name}
                                  </p>
                                  <span className={`text-[9px] px-1 py-0.5 rounded font-bold border flex-shrink-0 ${
                                    online
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-slate-800 text-slate-500 border-slate-700'
                                  }`}>
                                    {online ? 'ONLINE' : 'OFFLINE'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                  {sub.username_pppoe}
                                  {session && (
                                    <span className="text-slate-500 ml-1.5">
                                      • {session.address} • Up: {session.uptime}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {online && session && (
                                <button
                                  onClick={() => handleKickUser(session)}
                                  disabled={kickingId === session.id}
                                  className="px-2 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50 text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                  title="Disconnect user"
                                >
                                  {kickingId === session.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Power className="w-3 h-3" />
                                  )}
                                  Kick
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {subscribers.filter(s => s.status === 'active').length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-[11px]">
                      Tidak ada pelanggan aktif
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB: IMPORT (preserved from original) ===== */}
        {activeTab === 'import' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
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

        {/* ===== TAB: EXPORT (preserved from original) ===== */}
        {activeTab === 'export' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Skrip RouterOS di bawah berisi seluruh profil paket dan secret PPPoE yang ada di aplikasi. Salin dan tempel di Winbox MikroTik:
            </p>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto font-mono text-[11px] text-cyan-300 whitespace-pre leading-relaxed shadow-inner max-h-56">
              {script}
            </div>

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
