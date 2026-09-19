import React from 'react';
import { LayoutDashboard, Users, ShoppingBag, PieChart, Sliders } from 'lucide-react';
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
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'subscribers',
      label: 'Pelanggan',
      icon: <Users className="w-5 h-5" />,
      badge: subscriberCount,
    },
    {
      id: 'capex',
      label: 'CAPEX',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'investors',
      label: 'Investor',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: 'simulator',
      label: 'Simulasi',
      icon: <Sliders className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#070a12]/90 backdrop-blur-xl border-t border-slate-800/80 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
      <div className="max-w-md mx-auto grid grid-cols-5 px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 group active:scale-95"
            >
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[17px] text-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
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
