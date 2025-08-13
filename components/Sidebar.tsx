import React from 'react';
import { NavItem } from '../types';
import { GithubIcon, SettingsIcon, BarChartIcon, LayoutDashboardIcon } from './Icons';

interface StrategyPanelProps {
  activeView: NavItem;
  setActiveView: (view: NavItem) => void;
  isCollapsed: boolean;
}

interface NavLinkProps {
  label: NavItem;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ label, icon, isActive, isCollapsed, onClick }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : ''}
    className={`flex items-center w-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-md ${
      isActive
        ? 'bg-sky-500/20 text-sky-300'
        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
    } ${isCollapsed ? 'justify-center' : ''}`}
  >
    {icon}
    {!isCollapsed && <span className="ml-3">{label}</span>}
  </button>
);

export const StrategyPanel: React.FC<StrategyPanelProps> = ({ activeView, setActiveView, isCollapsed }) => {
  const navItems = [
    { id: NavItem.Dashboard, icon: <LayoutDashboardIcon /> },
    { id: NavItem.Analytics, icon: <BarChartIcon /> },
    { id: NavItem.Releases, icon: <GithubIcon /> },
    { id: NavItem.Settings, icon: <SettingsIcon /> },
  ];

  return (
    <aside className="w-full h-full bg-zinc-900 flex flex-col overflow-hidden p-2">
       {!isCollapsed && 
         <h2 className="text-lg font-semibold text-zinc-200 px-2 pt-2 pb-4">
            Navigation
         </h2>
       }
      <div className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            label={item.id}
            icon={item.icon}
            isActive={activeView === item.id}
            isCollapsed={isCollapsed}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </div>
      <div className="mt-auto p-4 text-center text-xs text-zinc-500">
        {!isCollapsed &&
            <>
                <p>Version 0.1.0</p>
                <p>Prêt pour la release !</p>
            </>
        }
      </div>
    </aside>
  );
};