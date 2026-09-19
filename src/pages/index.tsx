import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { DashboardView } from '../components/DashboardView';
import { SubscribersView } from '../components/SubscribersView';
import { ExpensesView } from '../components/ExpensesView';
import { CapexView } from '../components/CapexView';
import { InvestorsView } from '../components/InvestorsView';
import { SimulatorView } from '../components/SimulatorView';
import { SqlModal } from '../components/SqlModal';
import { ShareReportModal } from '../components/ShareReportModal';
import { MikrotikModal } from '../components/MikrotikModal';
import { ResetWizardModal } from '../components/ResetWizardModal';
import { MonthlyClosingModal } from '../components/MonthlyClosingModal';
import { PrintReportModal } from '../components/PrintReportModal';
import { BroadcastModal } from '../components/BroadcastModal';
import { AuthGate } from '../components/AuthGate';
import { calculateFinancials } from '../lib/financialCalculations';
import {
  DataService,
  DEFAULT_SETTINGS,
  DEFAULT_INVESTORS,
  DEFAULT_PACKAGES,
  DEFAULT_CAPEX,
  DEFAULT_SUBSCRIBERS,
  DEFAULT_EXPENSES,
  DEFAULT_CLOSINGS,
} from '../lib/dataStore';
import {
  TabType,
  BusinessSettings,
  Investor,
  CapexItem,
  PppoePackage,
  Subscriber,
  ExpenseTransaction,
  MonthlyClosing,
} from '../types';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);

  // Modals
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showShareReportModal, setShowShareReportModal] = useState(false);
  const [showMikrotikModal, setShowMikrotikModal] = useState(false);
  const [showResetWizardModal, setShowResetWizardModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Core Data
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [investors, setInvestors] = useState<Investor[]>(DEFAULT_INVESTORS);
  const [packages, setPackages] = useState<PppoePackage[]>(DEFAULT_PACKAGES);
  const [capexItems, setCapexItems] = useState<CapexItem[]>(DEFAULT_CAPEX);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(DEFAULT_SUBSCRIBERS);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(DEFAULT_EXPENSES);
  const [closings, setClosings] = useState<MonthlyClosing[]>(DEFAULT_CLOSINGS);

  // Check auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = sessionStorage.getItem('smw_auth');
      if (storedAuth === '1') {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('smw_auth', '1');
    }
  };

  const handleLockApp = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('smw_auth');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resSettings, resInvestors, resCapex, resPackages, resSubs, resExpenses, resClosings] =
        await Promise.all([
          DataService.getSettings(),
          DataService.getInvestors(),
          DataService.getCapex(),
          DataService.getPackages(),
          DataService.getSubscribers(),
          DataService.getExpenses(),
          DataService.getMonthlyClosings(),
        ]);

      setSettings(resSettings.data);
      setInvestors(resInvestors.data);
      setCapexItems(resCapex.data);
      setPackages(resPackages.data);
      setSubscribers(resSubs.data);
      setExpenses(resExpenses.data);
      setClosings(resClosings.data);

      setIsSupabase(
        resSettings.isSupabase ||
          resInvestors.isSupabase ||
          resCapex.isSupabase ||
          resSubs.isSupabase ||
          resClosings.isSupabase
      );
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      DataService.triggerCloudSync();
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Helper to map package to MikroTik profile
  const getMikrotikProfile = (pkgName?: string, price?: number): string => {
    const name = (pkgName || '').toLowerCase();
    if (name.includes('20') || (price && price >= 500000)) return 'PAKET-20M';
    if (name.includes('15') || (price && price >= 400000)) return 'PAKET-15M';
    if (name.includes('10') || (price && price >= 300000)) return 'PAKET-10M';
    if (name.includes('8') || (price && price >= 250000)) return 'PAKET-8M';
    return 'PAKET-5M';
  };

  // Subscribers Handlers
  const handleAddSubscriber = (newSub: Omit<Subscriber, 'id'>) => {
    const created: Subscriber = {
      ...newSub,
      id: `sub-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...subscribers];
    setSubscribers(updated);
    DataService.saveSubscribers(updated);

    // Otomatis buat akun PPPoE di router MikroTik
    if (newSub.username_pppoe) {
      const profile = getMikrotikProfile(newSub.package_name, newSub.package_price);
      fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_secret',
          name: newSub.username_pppoe,
          password: newSub.pppoe_password || '123',
          profile: profile,
          comment: newSub.full_name,
          disabled: newSub.status === 'suspended',
        }),
      }).catch((err) => console.warn('[MikroTik Add Sync Error]:', err));
    }
  };

  const handleUpdateSubscriber = (updatedSub: Subscriber) => {
    const updated = subscribers.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubscribers(updated);
    DataService.saveSubscribers(updated);

    // Sinkron update akun ke MikroTik
    if (updatedSub.username_pppoe) {
      const profile = getMikrotikProfile(updatedSub.package_name, updatedSub.package_price);
      fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_secret',
          name: updatedSub.username_pppoe,
          password: updatedSub.pppoe_password || '123',
          profile: profile,
          comment: updatedSub.full_name,
          disabled: updatedSub.status === 'suspended',
        }),
      }).catch((err) => console.warn('[MikroTik Update Sync Error]:', err));
    }
  };

  const handleToggleSubscriberStatus = (
    id: string,
    newStatus: 'active' | 'suspended' | 'terminated'
  ) => {
    const targetSub = subscribers.find((s) => s.id === id);
    const updated = subscribers.map((s) =>
      s.id === id ? { ...s, status: newStatus } : s
    );
    setSubscribers(updated);
    DataService.saveSubscribers(updated);

    // Sinkron isolir / aktifkan langsung ke router MikroTik!
    if (targetSub && targetSub.username_pppoe) {
      const isolate = newStatus === 'suspended' || newStatus === 'terminated';
      fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'isolir_user',
          name: targetSub.username_pppoe,
          isolate: isolate,
        }),
      }).catch((err) => console.warn('[MikroTik Isolir Sync Error]:', err));
    }
  };

  // Payment confirmation with automatic Buku Kas sync & auto-unisolir
  const handleConfirmPayment = (id: string, method: 'Tunai' | 'Transfer Bank') => {
    const targetSub = subscribers.find((s) => s.id === id);
    if (!targetSub) return;

    const wasSuspended = targetSub.status === 'suspended';
    const updated = subscribers.map((s) =>
      s.id === id
        ? {
            ...s,
            status: wasSuspended ? ('active' as const) : s.status,
            payment_status: 'paid' as const,
            payment_method: method,
            last_paid_at: new Date().toISOString(),
          }
        : s
    );
    setSubscribers(updated);
    DataService.saveSubscribers(updated);

    // Jika sebelumnya di-isolir, otomatis pulihkan internetnya di MikroTik saat bayar!
    if (wasSuspended && targetSub.username_pppoe) {
      fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'isolir_user',
          name: targetSub.username_pppoe,
          isolate: false,
        }),
      }).catch((err) => console.warn('[MikroTik Un-isolir Sync Error]:', err));
    }

    // Auto-record cash-in transaction to Buku Kas
    const newExpensesList = [...expenses];
    const amount = targetSub.package_price || 200000;
    const currentPeriodKey = new Date().toISOString().slice(0, 7);
    const isCurrentPeriodClosed = closings.some((c) => c.period_key === currentPeriodKey);

    const incomeEntry: ExpenseTransaction = {
      id: `inc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Iuran Bulanan Pelanggan',
      amount: amount,
      description: isCurrentPeriodClosed
        ? `Iuran Susulan ${targetSub.full_name} (${method}) - Kas Masuk Periode Berikutnya`
        : `Iuran ${targetSub.full_name} (${method})`,
      fund_source: 'Kas Operasional',
      created_at: new Date().toISOString(),
    };
    newExpensesList.unshift(incomeEntry);

    setExpenses(newExpensesList);
    DataService.saveExpenses(newExpensesList);
  };

  const handleCancelPayment = (id: string) => {
    const updated = subscribers.map((s) =>
      s.id === id ? { ...s, payment_status: 'unpaid' as const } : s
    );
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
  };

  const handleDeleteSubscriber = (id: string) => {
    const targetSub = subscribers.find((s) => s.id === id);
    const updated = subscribers.filter((s) => s.id !== id);
    setSubscribers(updated);
    DataService.saveSubscribers(updated);

    // Hapus user PPPoE dari MikroTik
    if (targetSub && targetSub.username_pppoe) {
      fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_secret',
          name: targetSub.username_pppoe,
        }),
      }).catch((err) => console.warn('[MikroTik Delete Sync Error]:', err));
    }
  };

  // Expenses Handlers
  const handleAddExpense = (item: Omit<ExpenseTransaction, 'id' | 'created_at'>) => {
    const created: ExpenseTransaction = {
      ...item,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...expenses];
    setExpenses(updated);
    DataService.saveExpenses(updated);
  };

  const handleUpdateExpense = (updatedExp: ExpenseTransaction) => {
    const updated = expenses.map((e) => (e.id === updatedExp.id ? updatedExp : e));
    setExpenses(updated);
    DataService.saveExpenses(updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    DataService.saveExpenses(updated);
  };

  // Capex Handlers
  const handleAddCapex = (item: Omit<CapexItem, 'id' | 'total_price'>) => {
    const created: CapexItem = {
      ...item,
      id: `cap-${Date.now()}`,
      total_price: item.quantity * item.unit_price,
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...capexItems];
    setCapexItems(updated);
    DataService.saveCapex(updated);
  };

  const handleUpdateCapex = (updatedItem: CapexItem) => {
    const updated = capexItems.map((c) => (c.id === updatedItem.id ? updatedItem : c));
    setCapexItems(updated);
    DataService.saveCapex(updated);
  };

  const handleDeleteCapex = (id: string) => {
    const updated = capexItems.filter((c) => c.id !== id);
    setCapexItems(updated);
    DataService.saveCapex(updated);
  };

  // Investor Handlers
  const handleAddInvestor = (inv: Omit<Investor, 'id'>) => {
    const created: Investor = {
      ...inv,
      id: `inv-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...investors, created];
    setInvestors(updated);
    DataService.saveInvestors(updated);
  };

  const handleUpdateInvestor = (updatedInv: Investor) => {
    const updated = investors.map((i) => (i.id === updatedInv.id ? updatedInv : i));
    setInvestors(updated);
    DataService.saveInvestors(updated);
  };

  const handleDeleteInvestor = (id: string) => {
    const updated = investors.filter((i) => i.id !== id);
    setInvestors(updated);
    DataService.saveInvestors(updated);
  };

  // Settings Handler
  const handleUpdateSettings = (updatedSettings: BusinessSettings) => {
    setSettings(updatedSettings);
    DataService.updateSettings(updatedSettings);
  };

  // Import from MikroTik Handler
  const handleImportMikrotik = (
    newSubs: Subscriber[],
    replaceExisting: boolean,
    newPackages: PppoePackage[]
  ) => {
    let finalSubs: Subscriber[] = [];
    if (replaceExisting) {
      finalSubs = newSubs;
    } else {
      const map = new Map<string, Subscriber>();
      subscribers.forEach((s) => map.set(s.username_pppoe, s));
      newSubs.forEach((s) => map.set(s.username_pppoe, s));
      finalSubs = Array.from(map.values());
    }

    setSubscribers(finalSubs);
    DataService.saveSubscribers(finalSubs);

    if (newPackages && newPackages.length > 0) {
      const pkgMap = new Map<string, PppoePackage>();
      packages.forEach((p) => pkgMap.set(p.package_name.toLowerCase(), p));
      newPackages.forEach((p) => {
        if (!pkgMap.has(p.package_name.toLowerCase())) {
          pkgMap.set(p.package_name.toLowerCase(), p);
        }
      });
      const finalPackages = Array.from(pkgMap.values());
      setPackages(finalPackages);
      DataService.savePackages(finalPackages);
    }
  };

  // Monthly Closing Handlers
  const handleSaveClosing = (
    closing: MonthlyClosing,
    resetSubscriberPayments: boolean
  ) => {
    const updatedClosings = [closing, ...closings];
    setClosings(updatedClosings);
    DataService.saveMonthlyClosings(updatedClosings);

    if (resetSubscriberPayments) {
      const resetSubs = subscribers.map((s) => ({
        ...s,
        payment_status: 'unpaid' as const,
      }));
      setSubscribers(resetSubs);
      DataService.saveSubscribers(resetSubs);
    }
  };

  const handleToggleDividendPaid = (
    closingId: string,
    investorId: string,
    newStatus: 'paid' | 'pending'
  ) => {
    const updated = closings.map((c) => {
      if (c.id !== closingId) return c;
      const updatedDivs = c.investor_dividends.map((inv) =>
        inv.investor_id === investorId
          ? {
              ...inv,
              paid_status: newStatus,
              paid_at: newStatus === 'paid' ? new Date().toISOString() : undefined,
            }
          : inv
      );
      return { ...c, investor_dividends: updatedDivs };
    });
    setClosings(updated);
    DataService.saveMonthlyClosings(updated);
  };

  const handleDeleteClosing = (closingId: string) => {
    const updated = closings.filter((c) => c.id !== closingId);
    setClosings(updated);
    DataService.saveMonthlyClosings(updated);
  };

  // Reset Handlers
  const handleResetToZero = (name: string) => {
    DataService.resetToZero(name);
    loadAllData();
  };

  const handleResetToDemo = () => {
    DataService.resetToDemo();
    loadAllData();
  };

  // Unified Financial Calculations
  const fin = calculateFinancials(subscribers, settings, investors, capexItems, expenses, closings);
  const realCashIn = fin.totalOmzet;
  const netProfit = fin.netProfit;
  const totalCapital = fin.totalCapital;
  const totalCapexSpent = fin.totalCapexSpent;
  const sisaKasModal = fin.sisaKasModal;

  // If auth gate is not yet verified
  if (authChecked && !isAuthenticated) {
    return (
      <AuthGate
        businessName={settings.business_name}
        correctPin={settings.admin_pin || '140320'}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-t from-violet-600/5 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <Header
        businessName={settings.business_name}
        isSupabase={isSupabase}
        onRefresh={loadAllData}
        onOpenSqlModal={() => setShowSqlModal(true)}
        onOpenResetWizard={() => setShowResetWizardModal(true)}
        onOpenShareReport={() => setShowShareReportModal(true)}
        onOpenMikrotikModal={() => setShowMikrotikModal(true)}
        onLockApp={handleLockApp}
        loading={loading}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-28">
        {activeTab === 'dashboard' && (
          <DashboardView
            settings={settings}
            investors={investors}
            subscribers={subscribers}
            capexItems={capexItems}
            expenses={expenses}
            closings={closings}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onUpdateSettings={handleUpdateSettings}
            onOpenNetworkModal={() => setShowMikrotikModal(true)}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersView
            businessName={settings.business_name}
            subscribers={subscribers}
            packages={packages}
            collectorFeePerUser={settings.collector_fee_per_user ?? 5000}
            onAddSubscriber={handleAddSubscriber}
            onUpdateSubscriber={handleUpdateSubscriber}
            onToggleStatus={handleToggleSubscriberStatus}
            onConfirmPayment={handleConfirmPayment}
            onCancelPayment={handleCancelPayment}
            onDeleteSubscriber={handleDeleteSubscriber}
            onOpenMikrotikModal={() => setShowMikrotikModal(true)}
            onOpenBroadcastModal={() => setShowBroadcastModal(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            realCashIn={realCashIn}
            sisaKasModal={sisaKasModal}
            cumulativeReserveFund={fin.cumulativeReserveFund}
            reserveFundSpent={fin.reserveFundSpent}
            totalReserveAllocated={fin.totalReserveAllocated}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'capex' && (
          <CapexView
            capexItems={capexItems}
            investors={investors}
            onAddCapex={handleAddCapex}
            onUpdateCapex={handleUpdateCapex}
            onDeleteCapex={handleDeleteCapex}
          />
        )}

        {activeTab === 'investors' && (
          <InvestorsView
            investors={investors}
            closings={closings}
            netProfit={netProfit}
            totalCapexSpent={totalCapexSpent}
            onAddInvestor={handleAddInvestor}
            onUpdateInvestor={handleUpdateInvestor}
            onDeleteInvestor={handleDeleteInvestor}
            onOpenClosingModal={() => setShowClosingModal(true)}
            onOpenPrintModal={() => setShowPrintModal(true)}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            settings={settings}
            investors={investors}
            capexItems={capexItems}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        subscriberCount={subscribers.filter((s) => s.status === 'active' && s.payment_status === 'unpaid').length}
      />

      {/* Modals */}
      <SqlModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        isSupabase={isSupabase}
      />

      <ShareReportModal
        isOpen={showShareReportModal}
        onClose={() => setShowShareReportModal(false)}
        settings={settings}
        investors={investors}
        subscribers={subscribers}
        expenses={expenses}
      />

      <MikrotikModal
        isOpen={showMikrotikModal}
        onClose={() => setShowMikrotikModal(false)}
        subscribers={subscribers}
        packages={packages}
        onImportSubscribers={handleImportMikrotik}
      />

      <ResetWizardModal
        isOpen={showResetWizardModal}
        onClose={() => setShowResetWizardModal(false)}
        currentBusinessName={settings.business_name}
        onResetToZero={handleResetToZero}
        onResetToDemo={handleResetToDemo}
      />

      <MonthlyClosingModal
        isOpen={showClosingModal}
        onClose={() => setShowClosingModal(false)}
        settings={settings}
        investors={investors}
        subscribers={subscribers}
        expenses={expenses}
        closings={closings}
        onSaveClosing={handleSaveClosing}
        onToggleDividendPaid={handleToggleDividendPaid}
        onDeleteClosing={handleDeleteClosing}
      />

      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        settings={settings}
        investors={investors}
        subscribers={subscribers}
        expenses={expenses}
        capexItems={capexItems}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        businessName={settings.business_name}
        subscribers={subscribers}
      />
    </div>
  );
}
