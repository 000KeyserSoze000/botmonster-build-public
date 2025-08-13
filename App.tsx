import React, { useState } from 'react';
import { Header } from './components/TitleBar';
import { StrategyPanel } from './components/Sidebar';
import { TradingChart } from './components/MainContent';
import { NavItem } from './types';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, XMarkIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<NavItem>(NavItem.Dashboard);
  
  // Desktop panel state
  const [isScannerPanelCollapsed, setScannerPanelCollapsed] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isBottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Mobile panel state
  const [isMobileLeftPanelOpen, setMobileLeftPanelOpen] = useState(false);
  const [isMobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const [isMobileBottomPanelOpen, setMobileBottomPanelOpen] = useState(false);

  const closeMobilePanels = () => {
    setMobileLeftPanelOpen(false);
    setMobileRightPanelOpen(false);
    setMobileBottomPanelOpen(false);
  };

  const ScannerPanelContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
      <aside className="w-full h-full bg-zinc-900 flex flex-col overflow-hidden p-2">
         {!isCollapsed && <h2 className="text-lg font-semibold text-zinc-200 px-2 pt-2 pb-4">Scanner</h2>}
         {/* Placeholder content */}
         {!isCollapsed && <div className="text-zinc-400 text-sm px-2">Le contenu du scanner de paires sera ici.</div>}
      </aside>
  );

  const TradeHistoryPanelContent = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => (
    <div className="w-full h-full bg-zinc-800 rounded-lg border border-zinc-700 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-zinc-700 flex-shrink-0">
            <h2 className="font-semibold text-zinc-200">Historique des Trades</h2>
            <button onClick={onToggle} className="text-zinc-400 hover:text-white">
                {/* Normally an up/down chevron, but reusing for simplicity */}
                {isCollapsed ? "Ouvrir" : "Fermer"}
            </button>
        </div>
        {!isCollapsed && 
            <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-zinc-400 text-sm">L'historique des trades sera affiché ici.</p>
            </div>
        }
    </div>
  );

  return (
    <div className="flex flex-col h-screen font-sans bg-zinc-900 overflow-hidden select-none">
      <Header 
        onToggleMobileLeft={() => setMobileLeftPanelOpen(v => !v)}
        onToggleMobileRight={() => setMobileRightPanelOpen(v => !v)}
        onToggleMobileBottom={() => setMobileBottomPanelOpen(v => !v)}
      />

      <main className="flex flex-1 overflow-hidden p-2 md:p-4 md:gap-4">
        {/* Left Scanner Panel (Desktop) */}
        <div className={`hidden md:flex md:relative md:flex-shrink-0 transition-all duration-300 ease-in-out ${isScannerPanelCollapsed ? 'w-8' : 'w-[320px]'}`}>
          <button 
            onClick={() => setScannerPanelCollapsed(!isScannerPanelCollapsed)} 
            className={`absolute top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full p-1 z-10 transition-all duration-300 ${isScannerPanelCollapsed ? 'left-1/2 -translate-x-1/2' : '-right-3'}`}
            aria-label={isScannerPanelCollapsed ? 'Ouvrir le panneau du scanner' : 'Fermer le panneau du scanner'}>
            {isScannerPanelCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </button>
          <ScannerPanelContent isCollapsed={isScannerPanelCollapsed} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-2 md:gap-4 min-w-0 overflow-hidden">
            <div className="flex-1 bg-zinc-800 rounded-lg border border-zinc-700 shadow-2xl shadow-zinc-950/20 min-h-0">
              <TradingChart activeView={activeView} />
            </div>
            <div className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out ${isBottomPanelCollapsed ? 'h-[52px]' : 'h-[260px]'}`}>
              <TradeHistoryPanelContent isCollapsed={isBottomPanelCollapsed} onToggle={() => setBottomPanelCollapsed(!isBottomPanelCollapsed)} />
            </div>
        </div>
        
        {/* Right Strategy Panel (Desktop) */}
        <div className={`hidden md:flex md:relative md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-8' : 'w-[380px]'}`}>
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className={`absolute top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full p-1 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'left-1/2 -translate-x-1/2' : '-left-3'}`}
            aria-label={isSidebarCollapsed ? 'Ouvrir la barre latérale' : 'Fermer la barre latérale'}>
            {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </button>
          <StrategyPanel activeView={activeView} setActiveView={setActiveView} isCollapsed={isSidebarCollapsed} />
        </div>
      </main>

      {/* Mobile Panel Overlays */}
      {(isMobileLeftPanelOpen || isMobileRightPanelOpen || isMobileBottomPanelOpen) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={closeMobilePanels}
        />
      )}
      
      <aside className={`md:hidden fixed top-0 left-0 h-full w-[320px] bg-zinc-900 z-40 transition-transform duration-300 ease-in-out ${isMobileLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileLeftPanelOpen(false)} className="absolute top-2 right-2 p-2 text-zinc-400"><XMarkIcon /></button>
        <ScannerPanelContent isCollapsed={false} />
      </aside>

      <aside className={`md:hidden fixed top-0 right-0 h-full w-[320px] bg-zinc-900 z-40 transition-transform duration-300 ease-in-out ${isMobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setMobileRightPanelOpen(false)} className="absolute top-2 right-2 p-2 text-zinc-400"><XMarkIcon /></button>
        <StrategyPanel activeView={activeView} setActiveView={(v) => { setActiveView(v); closeMobilePanels(); }} isCollapsed={false} />
      </aside>

      <aside className={`md:hidden fixed bottom-0 left-0 right-0 h-[60vh] bg-zinc-800 rounded-t-lg border-t border-zinc-700 z-40 transition-transform duration-300 ease-in-out ${isMobileBottomPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div onClick={() => setMobileBottomPanelOpen(false)} className="absolute top-2 right-2 p-2 text-zinc-400 cursor-pointer">Fermer</div>
        <TradeHistoryPanelContent isCollapsed={false} onToggle={() => setMobileBottomPanelOpen(false)} />
      </aside>
    </div>
  );
};

export default App;
