<<<<<<< HEAD
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
=======

import React, { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { useWebSocket } from './hooks/useWebSocket';
import { useStrategyEngine } from './hooks/useStrategyEngine';
import { useTradeManager } from './hooks/useTradeManager';
import { useBacktestEngine } from './hooks/useBacktestEngine';
import { useHeatmapEngine } from './hooks/useHeatmapEngine';
import { useMarketRegimeEngine } from './hooks/useMarketRegimeEngine';
import Header from './components/Header';
import StrategyPanel from './components/StrategyPanel';
import AlertPopup from './components/AlertPopup';
import TradeHistoryPanel from './components/TradeHistoryPanel';
import ConfirmationModal from './components/ConfirmationModal';
import { TradeConfirmationModal } from './components/TradeConfirmationModal';
import AiAnalysisPanel from './components/AiAnalysisPanel';
import { WatchlistManagerModal } from './components/WatchlistManagerModal';
import { BacktestSummaryModal } from './components/BacktestSummaryModal';
import SessionSummaryModal from './components/SessionSummaryModal';
import { PortfolioSummaryModal } from './components/StrategyExplanationModal';
import SettingsModal from './components/SettingsModal';
import SessionStartModal from './components/SessionStartModal';
import RobotStopModal from './components/RobotStopModal';
import { CpuChipIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, XMarkIcon } from './components/icons/Icons';
import TradingChart from './components/TradingChart';
import PairScanner from './components/PairScanner';
import { analyzeChartData } from './services/geminiService';
import type { StrategyDefinition } from './types';
import OptimizationSummaryModal from './components/ControlPanel'; // Re-using ControlPanel file for the new modal
import ComparisonModal from './components/CustomRechartsChart'; // Re-using file for Comparison Modal
import StrategyInfoModal from './components/StrategyInfoModal';
import ScannerPanel from './components/ScannerPanel';
import OnboardingWelcomeModal from './components/OnboardingWelcomeModal';
import OnboardingOverlay from './components/OnboardingOverlay';
import ReviewModeBanner from './components/ReviewModeBanner';
import PresetManagerModal from './components/PresetManagerModal';
import AiStrategyGeneratorModal from './components/AiStrategyGeneratorModal';
import { StrategyManagerModal } from './components/StrategyManagerModal';
import HelpArticleModal from './components/HelpArticleModal';
import { useTranslation } from './hooks/useTranslation';
import { useUpdater } from './hooks/useUpdater';

const LoadingOverlay: React.FC<{ message: string; progress?: number }> = ({ message, progress }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fade-in">
        <div className="flex items-center gap-4 mb-4 text-xl font-bold text-sky-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
            {message}
        </div>
        {progress !== undefined && (
            <div className="w-full max-w-md bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-linear" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        )}
    </div>
);


export default function App() {
  const t = useTranslation();
  // --- ATOMIC STATE SELECTION FOR PERFORMANCE ---
  // State for Modals & Overlays
  const isDBHydrated = useAppStore(state => state.isDBHydrated);
  const backtestLoadingProgress = useAppStore(state => state.backtestLoadingProgress);
  const isOptimizing = useAppStore(state => state.isOptimizing);
  const optimizationProgress = useAppStore(state => state.optimizationProgress);
  const showSessionStartModal = useAppStore(state => state.showSessionStartModal);
  const showRobotStopModal = useAppStore(state => state.showRobotStopModal);
  const pendingTrade = useAppStore(state => state.pendingTrade);
  const confirmTrades = useAppStore(state => state.globalRiskSettings.confirmTrades);
  const showWatchlistModal = useAppStore(state => state.showWatchlistModal);
  const selectedBacktestSession = useAppStore(state => state.selectedBacktestSession);
  const optimizationResults = useAppStore(state => state.optimizationResults);
  const showComparisonModal = useAppStore(state => state.showComparisonModal);
  const selectedSessionFromHistory = useAppStore(state => state.selectedSessionFromHistory);
  const showSettingsModal = useAppStore(state => state.showSettingsModal);
  const showPortfolioSummaryModal = useAppStore(state => state.showPortfolioSummaryModal);
  const portfolioBacktestSession = useAppStore(state => state.portfolioBacktestSession);
  const latestAlert = useAppStore(state => state.latestAlert);
  const showAiAnalysisPanel = useAppStore(state => state.showAiAnalysisPanel);
  const showAiStrategyGeneratorModal = useAppStore(state => state.showAiStrategyGeneratorModal);
  const showStrategyManagerModal = useAppStore(state => state.showStrategyManagerModal);
  const showWelcomeModal = useAppStore(state => state.showWelcomeModal);
  const onboardingStep = useAppStore(state => state.onboardingStep);
  const previousTradingMode = useAppStore(state => state.previousTradingMode);
  const isPresetManagerOpen = useAppStore(state => state.isPresetManagerOpen);
  const showStrategyInfoModal = useAppStore(state => state.showStrategyInfoModal);
  const isMobileLeftPanelOpen = useAppStore(state => state.isMobileLeftPanelOpen);
  const isMobileRightPanelOpen = useAppStore(state => state.isMobileRightPanelOpen);
  const isMobileBottomPanelOpen = useAppStore(state => state.isMobileBottomPanelOpen);
  
  // State for Layout & Core UI
  const isSidebarCollapsed = useAppStore(state => state.isSidebarCollapsed);
  const isScannerPanelCollapsed = useAppStore(state => state.isScannerPanelCollapsed);
  const isBottomPanelCollapsed = useAppStore(state => state.isBottomPanelCollapsed);
  const isWatchlistBarOpen = useAppStore(state => state.isWatchlistBarOpen);
  const tradingMode = useAppStore(state => state.tradingMode);
  
  // State for Data & Logic
  const activeStrategyId = useAppStore(state => state.activeStrategyId);
  const strategyDefinitions = useAppStore(state => state.strategyDefinitions);
  const allWatchlists = useAppStore(state => state.allWatchlists);
  const activeWatchlistName = useAppStore(state => state.activeWatchlistName);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);

  // Actions
  const hydrateFromDB = useAppStore(state => state.hydrateFromDB);
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  const toggleScannerPanel = useAppStore(state => state.toggleScannerPanel);
  const setLatestAlert = useAppStore(state => state.setLatestAlert);
  const setShowAiAnalysisPanel = useAppStore(state => state.setShowAiAnalysisPanel);
  const setSelectedBacktestSession = useAppStore(state => state.setSelectedBacktestSession);
  const setSelectedSessionFromHistory = useAppStore(state => state.setSelectedSessionFromHistory);
  const setShowPortfolioSummaryModal = useAppStore(state => state.setShowPortfolioSummaryModal);
  const setShowWelcomeModal = useAppStore(state => state.setShowWelcomeModal);
  const closeMobilePanels = useAppStore(state => state.closeMobilePanels);

  // === HOOKS: Encapsulated business logic ===
  useUpdater();
  useEffect(() => {
    hydrateFromDB();
  }, [hydrateFromDB]);

  // Onboarding logic
  useEffect(() => {
    if (isDBHydrated) {
      const currentWatchlist = allWatchlists[activeWatchlistName] || [];
      if (!hasCompletedOnboarding && currentWatchlist.length === 0) {
        setShowWelcomeModal(true);
      }
    }
  }, [isDBHydrated, hasCompletedOnboarding, allWatchlists, activeWatchlistName, setShowWelcomeModal]);

  useWebSocket();
  useStrategyEngine();
  useTradeManager();
  useBacktestEngine();
  useHeatmapEngine();
  useMarketRegimeEngine();
  
  // === DERIVED STATE ===
  const activeStrategy = useMemo(() => {
      return strategyDefinitions.get(activeStrategyId);
  }, [activeStrategyId, strategyDefinitions]);

  // === UI LOGIC ===
  const isLoading = backtestLoadingProgress.isLoading || isOptimizing;
  const loadingMessage = isOptimizing
    ? t('optimizingInProgress')
    : backtestLoadingProgress.messageKey
    ? t(backtestLoadingProgress.messageKey, backtestLoadingProgress.messagePayload)
    : t('loadingData');

  const loadingProgress = isOptimizing ? optimizationProgress : backtestLoadingProgress.progress;

  if (!isDBHydrated) {
    return <LoadingOverlay message={t('loadingTradingJournal')} />;
  }
  
  if (!activeStrategy) return null;

  return (
    <div className="flex flex-col h-screen">
      {isLoading && (
          <LoadingOverlay 
              message={loadingMessage}
              progress={loadingProgress}
          />
      )}
      
      {/* Modals & Overlays */}
      <ConfirmationModal />
      <SessionStartModal show={showSessionStartModal} />
      <RobotStopModal show={showRobotStopModal} />
      {pendingTrade && confirmTrades && <TradeConfirmationModal />}
      <WatchlistManagerModal show={showWatchlistModal} />
      <BacktestSummaryModal session={selectedBacktestSession} onClose={() => setSelectedBacktestSession(null)} />
      {optimizationResults && <OptimizationSummaryModal />}
      <ComparisonModal show={showComparisonModal} />
      <SessionSummaryModal sessionSummary={selectedSessionFromHistory} onClose={() => setSelectedSessionFromHistory(null)} />
      {showStrategyInfoModal && <StrategyInfoModal />}
      <SettingsModal show={showSettingsModal} />
      {showPortfolioSummaryModal && portfolioBacktestSession && (
          <PortfolioSummaryModal session={portfolioBacktestSession} onClose={() => setShowPortfolioSummaryModal(false)} />
      )}
      <OnboardingWelcomeModal show={showWelcomeModal} />
      {onboardingStep > -1 && <OnboardingOverlay />}
      {isPresetManagerOpen && <PresetManagerModal />}
      <StrategyManagerModal />
      <HelpArticleModal />
      
      <Header />
      {previousTradingMode && <ReviewModeBanner />}
      {isWatchlistBarOpen && <PairScanner />}
      {latestAlert && <AlertPopup alert={latestAlert} onClose={() => setLatestAlert(null)} />}
      {showAiAnalysisPanel && <AiAnalysisPanel onClose={() => setShowAiAnalysisPanel(false)} />}

      <main className="flex flex-1 overflow-hidden p-2 md:p-4 md:gap-4">
        {/* Left Scanner Panel (Desktop) */}
        <div id="left-panel" className={`hidden md:flex md:relative md:flex-shrink-0 transition-all duration-300 ease-in-out ${isScannerPanelCollapsed ? 'w-8' : 'w-[320px]'}`}>
          <button 
            onClick={toggleScannerPanel} 
            className={`absolute top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full p-1 z-30 transition-all duration-300 ${isScannerPanelCollapsed ? 'left-1/2 -translate-x-1/2' : '-right-3'}`}
            aria-label={t(isScannerPanelCollapsed ? 'openScannerPanel' : 'closeScannerPanel')}>
            {isScannerPanelCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </button>
          <aside className="w-full h-full bg-zinc-900 border-r border-zinc-700 flex flex-col overflow-hidden">
            <ScannerPanel isCollapsed={isScannerPanelCollapsed} />
          </aside>
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-2 md:gap-4 min-w-0 overflow-hidden">
<<<<<<< HEAD
            <div className="flex-1 bg-zinc-800 rounded-lg border border-zinc-700 shadow-2xl shadow-zinc-950/20 min-h-0">
              <TradingChart activeView={activeView} />
            </div>
            <div className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out ${isBottomPanelCollapsed ? 'h-[52px]' : 'h-[260px]'}`}>
              <TradeHistoryPanelContent isCollapsed={isBottomPanelCollapsed} onToggle={() => setBottomPanelCollapsed(!isBottomPanelCollapsed)} />
=======
            <div className="flex-1 bg-zinc-800 rounded-lg p-1 md:p-2 border border-zinc-700 shadow-2xl shadow-zinc-950/20 min-h-0">
              <TradingChart />
            </div>
            <div id="bottom-panel" className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out ${isBottomPanelCollapsed ? 'h-[52px]' : (tradingMode === 'Backtest' && useAppStore.getState().backtestHistoricalData.length > 0) ? 'h-[308px]' : 'h-[260px]'}`}>
              <TradeHistoryPanel />
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
            </div>
        </div>
        
        {/* Right Strategy Panel (Desktop) */}
<<<<<<< HEAD
        <div className={`hidden md:flex md:relative md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-8' : 'w-[380px]'}`}>
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className={`absolute top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full p-1 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'left-1/2 -translate-x-1/2' : '-left-3'}`}
            aria-label={isSidebarCollapsed ? 'Ouvrir la barre latérale' : 'Fermer la barre latérale'}>
            {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </button>
          <StrategyPanel activeView={activeView} setActiveView={setActiveView} isCollapsed={isSidebarCollapsed} />
        </div>
      </main>

      {/* Mobile Panel Overlays */}
=======
        <div id="right-panel" className={`hidden md:flex md:relative md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-8' : 'w-[380px]'}`}>
          <button onClick={toggleSidebar} className={`absolute top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-sky-500 text-sky-400 hover:text-white rounded-full p-1 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'left-1/2 -translate-x-1/2' : '-left-3'}`}
            aria-label={t(isSidebarCollapsed ? 'openSidebar' : 'closeSidebar')}>
            {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
          </button>
          <aside className="w-full h-full bg-zinc-900 border-l border-zinc-700 flex flex-col overflow-hidden">
            <StrategyPanel />
          </aside>
        </div>
      </main>

       {/* Mobile Panel Overlays */}
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
      {(isMobileLeftPanelOpen || isMobileRightPanelOpen || isMobileBottomPanelOpen) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={closeMobilePanels}
        />
      )}
      
<<<<<<< HEAD
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
=======
      <aside className={`md:hidden fixed top-0 left-0 bottom-0 w-[320px] bg-zinc-900 z-40 transition-transform duration-300 ease-in-out ${isMobileLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <ScannerPanel isCollapsed={false} />
      </aside>

      <aside className={`md:hidden fixed top-0 right-0 bottom-0 w-[320px] bg-zinc-900 z-40 transition-transform duration-300 ease-in-out ${isMobileRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <StrategyPanel />
      </aside>

      <aside className={`md:hidden fixed bottom-0 left-0 right-0 h-[60vh] bg-zinc-800 rounded-t-lg border-t border-zinc-700 z-40 transition-transform duration-300 ease-in-out ${isMobileBottomPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <TradeHistoryPanel />
      </aside>

    </div>
  );
}
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
