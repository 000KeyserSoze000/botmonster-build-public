
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TradingMode } from '../types';
import { CpuChipIcon, ListBulletIcon, PowerIcon, Cog8ToothIcon, ChevronUpIcon, ChevronDownIcon, CompassIcon, RectangleGroupIcon } from './icons/Icons';
import TradingModeSelector from './TradingModeSelector';
import { useTranslation } from '../hooks/useTranslation';
import ApiStatusIndicator from './ApiStatusIndicator';
import MarketSessionsIndicator from './MarketSessionsIndicator';

const LiveStatusIndicator: React.FC = () => {
    const t = useTranslation();
    const lastTickTime = useAppStore(state => state.lastTickTime);
    const [timeAgo, setTimeAgo] = React.useState(t('time_ago_now'));
    const [statusColor, setStatusColor] = React.useState('bg-green-500');

    React.useEffect(() => {
        const interval = setInterval(() => {
            const seconds = Math.floor((Date.now() - lastTickTime) / 1000);
            if (seconds < 5) {
                setTimeAgo(t('time_ago_now'));
            } else {
                setTimeAgo(t('time_ago_seconds', { seconds }));
            }
            
            if (seconds < 30) {
                setStatusColor('bg-green-500');
            } else if (seconds < 60) {
                setStatusColor('bg-yellow-500');
            } else {
                setStatusColor('bg-red-500');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastTickTime, t]);
    
    const isPulsing = (Date.now() - lastTickTime) < 2000;

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="relative flex h-2.5 w-2.5">
                {isPulsing && <span className={`absolute inline-flex h-full w-full rounded-full ${statusColor.replace(']', '/40]')} animate-ping opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColor}`}></span>
            </div>
            <span className="hidden sm:inline text-zinc-400">{timeAgo}</span>
        </div>
    );
};

const MasterSwitch: React.FC = () => {
    const t = useTranslation();
    const { isRunning, tradingMode, activeStrategyId, strategyDefinitions } = useAppStore(state => ({
        isRunning: state.isStrategyEngineRunning,
        tradingMode: state.tradingMode,
        activeStrategyId: state.activeStrategyId,
        strategyDefinitions: state.strategyDefinitions
    }));
    const handleMasterSwitchToggle = useAppStore(state => state.handleMasterSwitchToggle);
    
    const isLiveAndRunning = isRunning && tradingMode === 'Live';
    const buttonText = isRunning ? t('robotOn') : t('robotOff');

    const handleToggle = () => {
        const activeStrategy = strategyDefinitions.get(activeStrategyId);
        if (activeStrategy) {
            const identifier = activeStrategy.name || activeStrategy.nameKey!;
            handleMasterSwitchToggle(identifier);
        }
    };

    return (
        <button
            id="master-switch-button"
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 border ${
                isRunning 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            } ${isLiveAndRunning ? 'animate-pulse-bg-red' : ''}`}
        >
            <PowerIcon className="w-4 h-4" />
            <span className="hidden xl:inline">{buttonText}</span>
        </button>
    );
};

const Header: React.FC = () => {
    const t = useTranslation();
    const timeframes = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];
    const {
        activeTimeframe,
        quoteAsset,
        tradingMode,
        isWatchlistBarOpen,
    } = useAppStore(state => ({
        activeTimeframe: state.timeframe,
        quoteAsset: state.quoteAsset,
        tradingMode: state.tradingMode,
        isWatchlistBarOpen: state.isWatchlistBarOpen,
    }));

    const setActiveTimeframe = useAppStore(state => state.setTimeframe);
    const setQuoteAsset = useAppStore(state => state.setQuoteAsset);
    const handleModeChange = useAppStore(state => state.handleModeChange);
    const setShowWatchlistModal = useAppStore(state => state.setShowWatchlistModal);
    const setShowSettingsModal = useAppStore(state => state.setShowSettingsModal);
    const setIsWatchlistBarOpen = useAppStore(state => state.setIsWatchlistBarOpen);
    const toggleMobileLeftPanel = useAppStore(state => state.toggleMobileLeftPanel);
    const toggleMobileRightPanel = useAppStore(state => state.toggleMobileRightPanel);
    const toggleMobileBottomPanel = useAppStore(state => state.toggleMobileBottomPanel);
    
    const appVersion = "1.6.8"; // Hardcoded version to fix Vercel build issue

    return (
        <header className={`flex items-center justify-between p-2 md:p-3 bg-zinc-950/80 backdrop-blur-sm shadow-md h-16 flex-shrink-0 z-20 border-b transition-colors duration-300 ${
            tradingMode === 'Live' ? 'border-red-500/50' : 'border-zinc-700'
        }`}>
            {/* Left Section */}
            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-baseline gap-2 text-xl font-bold text-sky-500">
                    <CpuChipIcon className="w-7 h-7" />
                    <h1 className="hidden sm:inline">BotMonster</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        id="watchlist-manager-button"
                        onClick={() => setShowWatchlistModal(true)}
                        className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-sky-500 transition-colors"
                        aria-label={t('manageWatchlist')}
                    >
                       <ListBulletIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsWatchlistBarOpen(!isWatchlistBarOpen)}
                        className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sky-400 hover:text-sky-300 transition-colors"
                        aria-label={isWatchlistBarOpen ? t('hidePairBar') : t('showPairBar')}
                    >
                       {isWatchlistBarOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Center Section (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 text-sm flex-grow justify-center">
                 <LiveStatusIndicator />
                 <div className="w-px h-6 bg-zinc-700"></div>
                 <MarketSessionsIndicator />
                 <div className="w-px h-6 bg-zinc-700"></div>
                 <ApiStatusIndicator />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4 text-sm">
                 {/* Quote Asset Selector (Tablet+) */}
                 <div className="hidden md:flex items-center bg-zinc-800 rounded-md p-0.5">
                    {(['USDT', 'USDC'] as const).map(asset => (
                        <button
                            key={asset}
                            onClick={() => setQuoteAsset(asset)}
                            className={`px-2 py-0.5 text-xs font-semibold rounded-sm transition-colors duration-200 ${
                                quoteAsset === asset
                                ? 'bg-sky-500 text-white'
                                : 'text-zinc-400 hover:bg-zinc-700'
                            }`}
                        >
                            {asset}
                        </button>
                    ))}
                </div>

                {/* Timeframe Selector & Divider (Desktop+) */}
                <div className="hidden xl:flex items-center gap-4 text-sm">
                    <div className="flex items-center bg-zinc-800 rounded-md p-0.5">
                        {timeframes.map(tf => (
                            <button 
                                key={tf}
                                onClick={() => setActiveTimeframe(tf)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${
                                    activeTimeframe === tf 
                                    ? 'bg-sky-500 text-white' 
                                    : 'text-zinc-400 hover:bg-zinc-700'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-zinc-700"></div>
                </div>

                 <div className="flex items-center gap-2 md:gap-3">
                    <MasterSwitch />
                    <TradingModeSelector 
                        currentMode={tradingMode}
                        onModeChange={handleModeChange}
                    />
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="hidden md:block p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                        aria-label={t('openSettings')}
                    >
                       <Cog8ToothIcon className="w-5 h-5" />
                    </button>
                 </div>
                 
                 {/* Mobile Panel Toggles */}
                 <div className="md:hidden flex items-center gap-2 border-l border-zinc-700 pl-2">
                     <button onClick={toggleMobileLeftPanel} className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors" aria-label={t('openScannerPanel')}>
                        <CompassIcon className="w-5 h-5"/>
                     </button>
                     <button onClick={toggleMobileBottomPanel} className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors" aria-label={t('toggleBottomPanel')}>
                        <RectangleGroupIcon className="w-5 h-5"/>
                     </button>
                     <button onClick={toggleMobileRightPanel} className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors" aria-label={t('openSidebar')}>
                        <Cog8ToothIcon className="w-5 h-5"/>
                     </button>
                 </div>
            </div>
        </header>
    );
}

export default React.memo(Header);