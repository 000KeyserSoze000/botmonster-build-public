import React from 'react';
import { APP_TITLE } from '../constants';
import { PanelLeftIcon, PanelRightIcon, PanelBottomIcon } from './Icons';

interface HeaderProps {
    onToggleMobileLeft: () => void;
    onToggleMobileRight: () => void;
    onToggleMobileBottom: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileLeft, onToggleMobileRight, onToggleMobileBottom }) => {
  return (
    <header className="flex-shrink-0 bg-zinc-800/80 backdrop-blur-sm border-b border-zinc-700/80 h-14 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <span className="text-lg font-bold text-zinc-100">{APP_TITLE}</span>
      </div>
      
      {/* Mobile navigation toggles */}
      <div className="md:hidden flex items-center gap-2">
         <button onClick={onToggleMobileLeft} className="p-2 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-sky-400 transition-colors">
            <PanelLeftIcon className="w-5 h-5" />
         </button>
         <button onClick={onToggleMobileBottom} className="p-2 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-sky-400 transition-colors">
            <PanelBottomIcon className="w-5 h-5" />
         </button>
         <button onClick={onToggleMobileRight} className="p-2 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-sky-400 transition-colors">
            <PanelRightIcon className="w-5 h-5" />
         </button>
      </div>

       {/* Desktop placeholder controls */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
        <span className="text-sm font-medium text-zinc-300">Utilisateur</span>
      </div>
    </header>
  );
};