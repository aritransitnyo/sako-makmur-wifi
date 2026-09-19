import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  Cpu,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Server,
  ExternalLink,
  Shield,
  Radio,
  Layers,
  KeyRound,
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
  const [activeTab, setActiveTab] = useState<'monitor' | 'olt' | 'winbox' | 'scripts'>('monitor');
  const [copied, setCopied] = useState<string | null>(null);

  // Script sub-tab (import vs export)
  const [scriptSubTab, setScriptSubTab] = useState<'export' | 'import'>('export');
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

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
        setTrafficRx(data.traffic.rxBitsPerSecond || 0);
        setTrafficTx(data.traffic.txBitsPerSecond || 0);
      }
    } catch {
      // silent
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
        setActiveSessions((prev) => prev.filter((s) => s.id !== session.id));
      } else {
        setMonitorError(data.message || 'Gagal kick user');
      }
    } catch (err: any) {
      setMonitorError(err.message);
    } finally {
      setKickingId(null);
    }
  };

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

  useEffect(() => {
    if (isOpen && activeTab === 'monitor' && isConnected === null) {
      testApiConnection();
    }
  }, [isOpen, activeTab]);

  const isUserOnline = (username: string) =>
    activeSessions.some((s) => s.name === username);

  const getSession = (username: string) =>
    activeSessions.find((s) => s.name === username);

  // ===== IMPORT PARSER =====
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

  // ===== EXPORT SCRIPT GENERATOR =====
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
    script += `/ppp secret add name="${sub.username_pppoe}" password="${pass}" profile="${profile}" service=pppoe disabled=${disabled} comment="${sub.full_name} - ${sub.address || 'Desa'}"\n`;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 w-full max-w-lg space-y-3.5 page-transition max-h-[94vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                Perangkat Jaringan Core
              </h3>
              <p className="text-[10px] text-slate-400">
                MikroTik RB750Gr3 &amp; HiOSO EPON OLT
              </p>
            </div>
            {isConnected && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25 ml-1">
                ROS v{routerVersion}
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

        {/* Tab switcher: 4 Main Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'monitor'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="truncate">Live Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('olt')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'olt'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="truncate">OLT HiOSO</span>
          </button>

          <button
            onClick={() => setActiveTab('winbox')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'winbox'
                ? 'bg-blue-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="truncate">Winbox</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === 'scripts'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">Skrip PPPoE</span>
          </button>
        </div>

        {/* ===== TAB 1: LIVE MONITOR ===== */}
        {activeTab === 'monitor' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            {/* Connection Status Banner */}
            {isConnected === null && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Menghubungkan ke MikroTik RouterOS API...
              </div>
            )}

            {isConnected === false && (
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  MikroTik API Belum Terhubung
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  {monitorError || 'Gagal menghubungi MikroTik via VPS bridge. Pastikan router menyala dan tunnel SSTP aktif.'}
                </p>
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
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-[11px]">
                            {routerInfo.board_name || 'MikroTik hEX RB750Gr3'}
                          </p>
                          <p className="text-[10px] text-slate-400">RouterOS v{routerInfo.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {routerInfo.uptime}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          CPU: {routerInfo.cpu_load}% • RAM: {formatMemory(routerInfo.free_memory)} / {formatMemory(routerInfo.total_memory)}
                        </p>
                      </div>
                    </div>

                    {/* Traffic Live */}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          ↓ {formatBytes(trafficRx)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-mono">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          ↑ {formatBytes(trafficTx)}
                        </span>
                      </div>
                      <button
                        onClick={fetchStatus}
                        disabled={monitorLoading}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Segarkan Data Router"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${monitorLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Sessions Count */}
                <div className="flex items-center justify-between px-1">
                  <p className="font-bold text-slate-200 text-[11px]">
                    PPPoE Online: <span className="text-emerald-400">{activeSessions.length}</span> / <span className="text-slate-400">{subscribers.length} User</span>
                  </p>
                  {lastRefresh && (
                    <p className="text-[10px] text-slate-500">
                      Update: {lastRefresh.toLocaleTimeString('id-ID')}
                    </p>
                  )}
                </div>

                {/* User List */}
                <div className="flex-1 overflow-auto space-y-1.5 max-h-[38vh] pr-1">
                  {subscribers
                    .filter((s) => s.status === 'active' || isUserOnline(s.username_pppoe))
                    .map((sub) => {
                      const online = isUserOnline(sub.username_pppoe);
                      const session = getSession(sub.username_pppoe);

                      return (
                        <div
                          key={sub.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            online
                              ? 'bg-emerald-950/15 border-emerald-500/20'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  online
                                    ? 'bg-emerald-500/15 border border-emerald-500/25'
                                    : 'bg-slate-800 border border-slate-700'
                                }`}
                              >
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
                                  <span
                                    className={`text-[9px] px-1 py-0.2 rounded font-bold border flex-shrink-0 ${
                                      online
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                        : 'bg-slate-800 text-slate-500 border-slate-700'
                                    }`}
                                  >
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
                                  title="Putus koneksi user ini (reconnect)"
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
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB 2: OLT HIOSO EPON ===== */}
        {activeTab === 'olt' && (
          <div className="space-y-3.5 flex-1 flex flex-col overflow-y-auto text-xs pr-1">
            {/* OLT Status Card */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      HiOSO HA7032CST EPON OLT
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Modul SFP PX20+++ 9dB • 2-PON Port
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  ACTIVE
                </span>
              </div>

              {/* Direct Open Button */}
              <a
                href="http://idn24.tunnel.id:3039"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Web GUI OLT (Port 3039)
              </a>
            </div>

            {/* OLT Connection Parameters */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-[11px] text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Parameter Akses &amp; Jaringan OLT
              </h4>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400">URL Remote OLT (Tunnel.id)</p>
                    <p className="font-mono font-bold text-cyan-300">http://idn24.tunnel.id:3039</p>
                  </div>
                  <button
                    onClick={() => handleCopyText('http://idn24.tunnel.id:3039', 'olt_url')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="Salin URL"
                  >
                    {copied === 'olt_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400">IP Management Local / VLAN 99</p>
                    <p className="font-mono font-bold text-slate-200">192.168.99.254 / 192.168.0.254</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Port 4 &amp; Trunk</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400">Status Auto-Register Modem Warga</p>
                    <p className="font-bold text-emerald-400">Aktif (Plug &amp; Play ONT ZTE)</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Auto-ONU</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-400 text-[10px] leading-relaxed">
              💡 <strong>Tips OLT:</strong> OLT HiOSO ini melayani distribusi fiber optic ke ODP warga. Setiap modem ONT ZTE baru yang dicolokkan ke splitter ODP akan otomatis teregistrasi tanpa perlu bind MAC manual.
            </div>
          </div>
        )}

        {/* ===== TAB 3: REMOTE WINBOX ===== */}
        {activeTab === 'winbox' && (
          <div className="space-y-3.5 flex-1 flex flex-col overflow-y-auto text-xs pr-1">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/25 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      Remote Winbox MikroTik
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Akses GUI Penuh RouterOS via Tunnel.id
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  ONLINE
                </span>
              </div>
            </div>

            {/* Connection Parameters */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-[11px] text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Kredensial Login Winbox
              </h4>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Connect To (Host &amp; Port)</p>
                    <p className="font-mono font-bold text-blue-300 text-xs">idn23.tunnel.id:3109</p>
                  </div>
                  <button
                    onClick={() => handleCopyText('idn23.tunnel.id:3109', 'winbox_host')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    {copied === 'winbox_host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Login User</p>
                    <p className="font-mono font-bold text-slate-200">admin</p>
                  </div>
                  <button
                    onClick={() => handleCopyText('admin', 'winbox_user')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    {copied === 'winbox_user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Password Winbox &amp; API</p>
                    <p className="font-mono font-bold text-amber-300">SakoMakmur2026!</p>
                  </div>
                  <button
                    onClick={() => handleCopyText('SakoMakmur2026!', 'winbox_pass')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    {copied === 'winbox_pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">API Endpoint (Mikhmon / Bridge)</p>
                    <p className="font-mono font-bold text-slate-300 text-xs">idn32.tunnel.id:3201</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Port 8728</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-400 text-[10px] leading-relaxed">
              💡 <strong>Cara Membuka Winbox:</strong> Buka aplikasi Winbox di PC / Laptop Anda, isi kolom <strong>Connect To</strong> dengan <code>idn23.tunnel.id:3109</code>, User: <code>admin</code>, Password: <code>SakoMakmur2026!</code>, lalu klik Connect.
            </div>
          </div>
        )}

        {/* ===== TAB 4: SKRIP PPPOE (IMPOR & EKSPOR) ===== */}
        {activeTab === 'scripts' && (
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden text-xs">
            {/* Sub-tab switcher */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setScriptSubTab('export')}
                className={`py-1.5 rounded-lg transition-all ${
                  scriptSubTab === 'export'
                    ? 'bg-purple-500 text-white shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Salin Skrip Ekspor ({subscribers.length} User)
              </button>
              <button
                onClick={() => setScriptSubTab('import')}
                className={`py-1.5 rounded-lg transition-all ${
                  scriptSubTab === 'import'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Impor Data Winbox
              </button>
            </div>

            {scriptSubTab === 'export' ? (
              <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                <p className="text-slate-400 text-[11px]">
                  Skrip RouterOS di bawah siap di-paste ke New Terminal Winbox untuk setup profil dan pelanggan otomatis:
                </p>
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 overflow-auto font-mono text-[10px] text-cyan-300 whitespace-pre leading-relaxed shadow-inner max-h-52">
                  {script}
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">
                    {subscribers.length} Pelanggan
                  </span>
                  <button
                    onClick={() => handleCopyText(script, 'full_script')}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    {copied === 'full_script' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Salin Skrip RouterOS
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                {!hasParsed ? (
                  <>
                    <p className="text-slate-400 text-[11px]">
                      Paste output dari perintah <code>/ppp secret export</code> di Winbox ke bawah:
                    </p>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`/ppp secret\nadd name="budi" password="123" profile="Paket 10M"`}
                      className="flex-1 min-h-[120px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
                    />
                    <button
                      onClick={handleParseMikrotik}
                      disabled={!inputText.trim()}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <Upload className="w-4 h-4" />
                      Analisa Data MikroTik
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">
                        Terdeteksi {parsedSubs.length} Pelanggan
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

                    <div className="flex-1 overflow-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-44 p-2">
                      {parsedSubs.map((sub, idx) => (
                        <div key={idx} className="py-1.5 px-2 flex justify-between items-center text-[11px]">
                          <div>
                            <p className="font-bold text-slate-200">{sub.full_name}</p>
                            <p className="font-mono text-cyan-400 text-[10px]">user: {sub.username_pppoe}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                            {sub.package_name}
                          </span>
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
                      <span>Timpa seluruh data lama dengan hasil impor ini</span>
                    </label>

                    <button
                      onClick={handleApplyImport}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5 transition-all shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Masukkan {parsedSubs.length} Pelanggan ke Aplikasi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
