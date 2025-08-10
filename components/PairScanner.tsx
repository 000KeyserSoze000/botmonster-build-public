import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { PairScannerInfo } from '../types';
import { useAppStore } from '../store/useAppStore';
import { RadarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const StrategyProgress: React.FC<{ completedSteps: number, activeStepIndex: number | null, totalSteps: number }> = ({ completedSteps, activeStepIndex, totalSteps }) => {
    if (totalSteps === 0 || completedSteps === 0) return null;

    return (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3/4 flex gap-1 h-1">
            {Array.from({ length: totalSteps }).map((_, index) => {
                let bgColor = 'bg-zinc-600'; // Default for pending steps
                if (index < completedSteps) {
                    bgColor = 'bg-sky-500'; // Completed
                }
                if (index === activeStepIndex) {
                    bgColor = 'bg-sky-300 animate-pulse'; // Active
                }
                return <div key={index} className={`flex-1 h-full rounded-full transition-colors ${bgColor}`}></div>;
            })}
        </div>
    );
};

const PairScanner: React.FC = () => {
    const t = useTranslation();
    const {
        activePair,
        strategyStateMap,
        openTrades, // This is the Map
        tradingMode,
        allWatchlists,
        activeWatchlistName,
        quoteAsset,
    } = useAppStore(state => ({
        activePair: state.activePair,
        strategyStateMap: state.strategyStateMap,
        openTrades: state.openTrades,
        tradingMode: state.tradingMode,
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        quoteAsset: state.quoteAsset,
    }));
    const setActivePair = useAppStore(state => state.setActivePair);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const watchedPairs = useMemo(() =>
        (allWatchlists[activeWatchlistName] || []).map(base => `${base}/${quoteAsset}`),
        [allWatchlists, activeWatchlistName, quoteAsset]
    );

    const openTradesForMode = useMemo(() => openTrades.get(tradingMode) || [], [openTrades, tradingMode]);

    const sortedPairs = useMemo(() => {
        return [...watchedPairs].sort((a, b) => {
            const isAPosition = openTradesForMode.some(trade => trade.pair === a);
            const isBPosition = openTradesForMode.some(trade => trade.pair === b);
            
            if (isAPosition && !isBPosition) return -1;
            if (!isAPosition && isBPosition) return 1;

            const infoA = strategyStateMap.get(a)?.isHot || false;
            const infoB = strategyStateMap.get(b)?.isHot || false;
            if (infoA && !infoB) return -1;
            if (!infoA && infoB) return 1;

            return a.localeCompare(b);
        });
    }, [watchedPairs, openTradesForMode, strategyStateMap]);
    
    const checkForScrollability = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const hasOverflow = container.scrollWidth > container.clientWidth;
            setCanScrollLeft(hasOverflow && container.scrollLeft > 5);
            setCanScrollRight(hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkForScrollability();

        const handleScroll = () => checkForScrollability();
        container.addEventListener('scroll', handleScroll, { passive: true });
        
        const resizeObserver = new ResizeObserver(checkForScrollability);
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, [sortedPairs, checkForScrollability]);

    const handleScrollClick = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

    const handleMouseEnter = (e: React.MouseEvent, pair: string) => {
        const info = enhancedScannerInfo.get(pair);
        if (info?.isHot && info.status) {
            setTooltip({ content: info.status, x: e.clientX, y: e.clientY + 20 });
        }
    };

    const handleMouseLeave = () => setTooltip(null);
    
    const enhancedScannerInfo = useMemo<Map<string, PairScannerInfo>>(() => {
      const infoMap = new Map<string, PairScannerInfo>();
      for (const [pair, state] of strategyStateMap.entries()) {
          if (!state || !state.steps) continue;
          const completedSteps = state.steps.filter(s => s.status === 'met').length;
          const activeStepIndex = state.steps.findIndex(s => s.status === 'waiting');
          const isHot = completedSteps > 0;
          let status = t('scanner_scanning_status');
          if (activeStepIndex !== -1) { status = t(state.steps[activeStepIndex].detailsKey, state.steps[activeStepIndex].detailsPayload); }
          else if (completedSteps === state.steps.length) { status = t(state.steps[state.steps.length - 1].detailsKey, state.steps[state.steps.length - 1].detailsPayload); }
          infoMap.set(pair, { isHot, status, completedSteps, activeStepIndex: activeStepIndex !== -1 ? activeStepIndex : null, });
      }
      return infoMap;
    }, [strategyStateMap, t]);

    return (
        <div className="bg-zinc-900 border-b border-zinc-700 p-2 flex-shrink-0 animate-fade-in-down">
            <div className="relative flex items-center">
                 {/* Left Button & Fade */}
                <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
                <button
                    onClick={() => handleScrollClick('left')}
                    aria-label={t('scroll_left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 bg-zinc-800/60 backdrop-blur-sm hover:bg-sky-500 rounded-full text-zinc-200 transition-all duration-300 ${canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                {/* Scrollable Container */}
                <div 
                    ref={scrollContainerRef} 
                    className="flex items-center space-x-1 p-1 overflow-x-auto"
                    // Hide scrollbar CSS
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .overflow-x-auto::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {sortedPairs.map(pair => {
                        const info = enhancedScannerInfo.get(pair);
                        const totalSteps = strategyStateMap.get(pair)?.steps.length || 0;
                        const isHot = info?.isHot || false;
                        const isInPosition = openTradesForMode.some(trade => trade.pair === pair);

                        return (
                            <button 
                                key={pair}
                                onClick={() => setActivePair(pair)}
                                onMouseEnter={(e) => handleMouseEnter(e, pair)}
                                onMouseLeave={handleMouseLeave}
                                className={`relative px-4 py-1.5 pb-4 text-sm font-medium rounded-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 flex-shrink-0 ${
                                    activePair === pair 
                                    ? 'bg-sky-500 text-white' 
                                    : isHot
                                    ? 'text-sky-400 bg-sky-500/20 hover:bg-sky-500/30'
                                    : 'text-zinc-200 bg-zinc-800 hover:bg-zinc-700'
                                } ${isInPosition ? 'animate-pulse-border-green' : ''}`}
                            >
                                {isHot && (
                                    <span className="absolute top-1 right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                        <RadarIcon className="w-3 h-3 text-sky-400"/>
                                    </span>
                                )}
                                {pair}
                                {activePair === pair && (
                                    <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-white rounded-full"></div>
                                )}
                                <StrategyProgress
                                    completedSteps={info?.completedSteps || 0}
                                    activeStepIndex={info?.activeStepIndex || null}
                                    totalSteps={totalSteps}
                                />
                            </button>
                        )
                    })}
                </div>

                 {/* Right Button & Fade */}
                <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
                <button
                    onClick={() => handleScrollClick('right')}
                    aria-label={t('scroll_right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 bg-zinc-800/60 backdrop-blur-sm hover:bg-sky-500 rounded-full text-zinc-200 transition-all duration-300 ${canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>

                {tooltip && (
                    <div 
                        className="fixed z-50 px-3 py-1.5 text-xs font-semibold text-white bg-sky-500 rounded-md shadow-lg"
                        style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
                    >
                        {tooltip.content}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(PairScanner);