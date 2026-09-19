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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-cyan-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
