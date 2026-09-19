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
import {
  DataService,
  DEFAULT_SETTINGS,
  DEFAULT_INVESTORS,
  DEFAULT_PACKAGES,
  DEFAULT_CAPEX,
  DEFAULT_SUBSCRIBERS,
  DEFAULT_EXPENSES,
} from '../lib/dataStore';
import {
  TabType,
  BusinessSettings,
  Investor,
  CapexItem,
  PppoePackage,
  Subscriber,
  ExpenseTransaction,
} from '../types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);

  // Modals
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showShareReportModal, setShowShareReportModal] = useState(false);
  const [showMikrotikModal, setShowMikrotikModal] = useState(false);
  const [showResetWizardModal, setShowResetWizardModal] = useState(false);

  // Core Data
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [investors, setInvestors] = useState<Investor[]>(DEFAULT_INVESTORS);
  const [packages, setPackages] = useState<PppoePackage[]>(DEFAULT_PACKAGES);
  const [capexItems, setCapexItems] = useState<CapexItem[]>(DEFAULT_CAPEX);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(DEFAULT_SUBSCRIBERS);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(DEFAULT_EXPENSES);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resSettings, resInvestors, resCapex, resPackages, resSubs, resExpenses] =
        await Promise.all([
          DataService.getSettings(),
          DataService.getInvestors(),
          DataService.getCapex(),
          DataService.getPackages(),
          DataService.getSubscribers(),
          DataService.getExpenses(),
        ]);

      setSettings(resSettings.data);
      setInvestors(resInvestors.data);
      setCapexItems(resCapex.data);
      setPackages(resPackages.data);
      setSubscribers(resSubs.data);
      setExpenses(resExpenses.data);

      setIsSupabase(
        resSettings.isSupabase ||
          resInvestors.isSupabase ||
          resCapex.isSupabase ||
          resSubs.isSupabase
      );
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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
  };

  const handleUpdateSubscriber = (updatedSub: Subscriber) => {
    const updated = subscribers.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
  };

  const handleToggleSubscriberStatus = (
    id: string,
    newStatus: 'active' | 'suspended' | 'terminated'
  ) => {
    const updated = subscribers.map((s) =>
      s.id === id ? { ...s, status: newStatus } : s
    );
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
  };

  const handleTogglePayment = (id: string, newPaymentStatus: 'paid' | 'unpaid') => {
    const updated = subscribers.map((s) =>
      s.id === id
        ? {
            ...s,
            payment_status: newPaymentStatus,
            last_paid_at: newPaymentStatus === 'paid' ? new Date().toISOString() : s.last_paid_at,
          }
        : s
    );
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
  };

  const handleDeleteSubscriber = (id: string) => {
    const updated = subscribers.filter((s) => s.id !== id);
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
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

  // Reset Handlers
  const handleResetToZero = (name: string) => {
    DataService.resetToZero(name);
    loadAllData();
  };

  const handleResetToDemo = () => {
    DataService.resetToDemo();
    loadAllData();
  };

  // Financial Figures
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const paidSubs = activeSubs.filter((s) => s.payment_status === 'paid');
  const realCashIn = paidSubs.reduce(
    (sum, s) => sum + (s.package_price || 125000),
    0
  );
  const realCashOut = expenses.reduce((sum, e) => sum + e.amount, 0);

  const reserveFund = realCashIn * (settings.reserve_fund_pct / 100);
  const netProfit = Math.max(0, realCashIn - realCashOut - reserveFund);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
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
        loading={loading}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            settings={settings}
            investors={investors}
            subscribers={subscribers}
            capexItems={capexItems}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersView
            businessName={settings.business_name}
            subscribers={subscribers}
            packages={packages}
            onAddSubscriber={handleAddSubscriber}
            onUpdateSubscriber={handleUpdateSubscriber}
            onToggleStatus={handleToggleSubscriberStatus}
            onTogglePayment={handleTogglePayment}
            onDeleteSubscriber={handleDeleteSubscriber}
            onOpenMikrotikModal={() => setShowMikrotikModal(true)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            realCashIn={realCashIn}
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
            netProfit={netProfit}
            onAddInvestor={handleAddInvestor}
            onUpdateInvestor={handleUpdateInvestor}
            onDeleteInvestor={handleDeleteInvestor}
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
      />

      <ResetWizardModal
        isOpen={showResetWizardModal}
        onClose={() => setShowResetWizardModal(false)}
        currentBusinessName={settings.business_name}
        onResetToZero={handleResetToZero}
        onResetToDemo={handleResetToDemo}
      />
    </div>
  );
}
