import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { DashboardView } from '../components/DashboardView';
import { SubscribersView } from '../components/SubscribersView';
import { CapexView } from '../components/CapexView';
import { InvestorsView } from '../components/InvestorsView';
import { SimulatorView } from '../components/SimulatorView';
import { SqlModal } from '../components/SqlModal';
import {
  DataService,
  DEFAULT_SETTINGS,
  DEFAULT_INVESTORS,
  DEFAULT_PACKAGES,
  DEFAULT_CAPEX,
  DEFAULT_SUBSCRIBERS,
} from '../lib/dataStore';
import {
  TabType,
  BusinessSettings,
  Investor,
  CapexItem,
  PppoePackage,
  Subscriber,
} from '../types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Core Data
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [investors, setInvestors] = useState<Investor[]>(DEFAULT_INVESTORS);
  const [packages, setPackages] = useState<PppoePackage[]>(DEFAULT_PACKAGES);
  const [capexItems, setCapexItems] = useState<CapexItem[]>(DEFAULT_CAPEX);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(DEFAULT_SUBSCRIBERS);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resSettings, resInvestors, resCapex, resPackages, resSubs] =
        await Promise.all([
          DataService.getSettings(),
          DataService.getInvestors(),
          DataService.getCapex(),
          DataService.getPackages(),
          DataService.getSubscribers(),
        ]);

      setSettings(resSettings.data);
      setInvestors(resInvestors.data);
      setCapexItems(resCapex.data);
      setPackages(resPackages.data);
      setSubscribers(resSubs.data);

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

  const handleDeleteSubscriber = (id: string) => {
    const updated = subscribers.filter((s) => s.id !== id);
    setSubscribers(updated);
    DataService.saveSubscribers(updated);
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

  const handleDeleteInvestor = (id: string) => {
    const updated = investors.filter((i) => i.id !== id);
    setInvestors(updated);
    DataService.saveInvestors(updated);
  };

  // Net Profit for Investor View
  const activeSubs = subscribers.filter((s) => s.status === 'active');
  const totalOmzet = activeSubs.reduce(
    (sum, s) => sum + (s.package_price || 125000),
    0
  );
  const reserveFund = totalOmzet * (settings.reserve_fund_pct / 100);
  const totalOpex =
    settings.starlink_cost +
    settings.node_power_cost +
    settings.operator_salary +
    reserveFund;
  const netProfit = Math.max(0, totalOmzet - totalOpex);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background glows for high-end look */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-t from-violet-600/5 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <Header
        businessName={settings.business_name}
        isSupabase={isSupabase}
        onRefresh={loadAllData}
        onOpenSqlModal={() => setShowSqlModal(true)}
        loading={loading}
      />

      {/* Main Body Container - Mobile First Styled */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            settings={settings}
            investors={investors}
            subscribers={subscribers}
            capexItems={capexItems}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersView
            subscribers={subscribers}
            packages={packages}
            onAddSubscriber={handleAddSubscriber}
            onToggleStatus={handleToggleSubscriberStatus}
            onDeleteSubscriber={handleDeleteSubscriber}
          />
        )}

        {activeTab === 'capex' && (
          <CapexView
            capexItems={capexItems}
            investors={investors}
            onAddCapex={handleAddCapex}
            onDeleteCapex={handleDeleteCapex}
          />
        )}

        {activeTab === 'investors' && (
          <InvestorsView
            investors={investors}
            netProfit={netProfit}
            onAddInvestor={handleAddInvestor}
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

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        subscriberCount={subscribers.filter((s) => s.status === 'active').length}
      />

      {/* SQL & Cloud Sync Modal */}
      <SqlModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        isSupabase={isSupabase}
      />
    </div>
  );
}
