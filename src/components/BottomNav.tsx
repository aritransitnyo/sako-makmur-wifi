import React from 'react';
import { LayoutDashboard, Users, ShoppingBag, PieChart, Wallet } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  subscriberCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  subscriberCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Ringkasan',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'subscribers',
      label: 'Pelanggan',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: subscriberCount,
    },
    {
      id: 'expenses',
      label: 'Buku Kas',
      icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'capex',
      label: 'CAPEX',
      icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'investors',
      label: 'Investor',
      icon: <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#070a12]/95 backdrop-blur-2xl border-t border-slate-800/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-150 group active:scale-95 touch-manipulation select-none"
            >
              <div
                className={`relative px-2.5 sm:px-3.5 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center transition-colors ${
                  isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
