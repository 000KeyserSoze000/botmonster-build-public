import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ExitReason, BacktestSession, StrategySettings } from '../types';
import { calculateBacktestStats, calculateTradePnl, formatDuration } from '../services/backtestService';

/**
 * A comprehensive hook for managing the entire backtesting lifecycle.
 * It's architected to prevent infinite loops by separating concerns into distinct effects
 * and using getState() to access fresh state within the core logic loop.
 */
export const useBacktestEngine = () => {
    // --- Select reactive state needed for triggering effects ---
    const backtestPlaybackState = useAppStore(state => state.backtestPlaybackState);
    const backtestSpeed = useAppStore(state => state.backtestSpeed);
    const backtestCandleIndex = useAppStore(state => state.backtestCandleIndex);
    const tradingMode = useAppStore(state => state.tradingMode);
    const backtestHistoricalData = useAppStore(state => state.backtestHistoricalData);

    // --- EFFECT 1: Playback Loop ---
    // This effect handles the automatic advancement of candles when in "playing" state.
    useEffect(() => {
        if (tradingMode !== 'Backtest' || backtestPlaybackState !== 'playing' || backtestHistoricalData.length === 0) {
            return;
        }

        const intervalId = setInterval(() => {
            const currentIndex = useAppStore.getState().backtestCandleIndex;
            const totalCandles = useAppStore.getState().backtestHistoricalData.length;
            if (currentIndex < totalCandles - 1) {
                // Advance to the next candle
                useAppStore.getState().setBacktestCandleIndex(currentIndex + 1);
            } else {
                // Auto-pause at the end
                useAppStore.getState().setBacktestPlaybackState('paused');
            }
        }, backtestSpeed);

        return () => clearInterval(intervalId);
    }, [tradingMode, backtestPlaybackState, backtestSpeed, backtestHistoricalData.length]);


    // --- EFFECT 2: Core Backtest Engine ---
    // This is the heart of the backtest. It runs strategy logic and manages trades.
    // CRUCIAL: It ONLY depends on the candle index. All other state is fetched via getState()
    // to prevent dependency-driven infinite loops.
    useEffect(() => {
        if (tradingMode !== 'Backtest' || backtestHistoricalData.length === 0 || backtestCandleIndex === 0) {
            return;
        }

        // Get a fresh snapshot of the entire state and all necessary actions
        const {
            activePair, openTrades: openTradesMap, strategyStateMap, activeStrategyId, timeframe,
            strategyDefinitions, strategySettingsMap, globalRiskSettings, backtestClosedTrades,
            addBacktestClosedTrade, updateStrategyState, addOpenTrade, calculatePositionSize
        } = useAppStore.getState();
        
        const openTrades = openTradesMap.get('Backtest') || [];

        const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
        const strategySettings = (strategySettingsMap[activeSettingsKey] || strategyDefinitions.get(activeStrategyId)?.defaultSettings) as StrategySettings;
        const currentStrategy = strategyDefinitions.get(activeStrategyId);

        if (!strategySettings || !currentStrategy || !('run' in currentStrategy.logic)) return;

        const i = backtestCandleIndex;
        const currentCandle = backtestHistoricalData[i];
        if (!currentCandle) return;

        // --- LOGIC ---
        // 1. Manage any existing open trade for the active pair
        const openTradeForPair = openTrades.find(t => t.pair === activePair && t.status === 'open');
        
        if (openTradeForPair) {
            let updatedTrade = { ...openTradeForPair };
            let exitPrice: number | undefined;
            let exitReason: ExitReason | undefined;

            // Trailing Stop Logic
            const trailingStopPercent = (strategySettings as any).trailingStop;
            if (trailingStopPercent > 0) {
                if (updatedTrade.direction === 'LONG') {
                    if (currentCandle.high > (updatedTrade.highestPriceSoFar || updatedTrade.entryPrice)) {
                        updatedTrade.highestPriceSoFar = currentCandle.high;
                        const newTrailingStop = updatedTrade.highestPriceSoFar * (1 - trailingStopPercent / 100);
                        if (newTrailingStop > (updatedTrade.trailingStopPrice || updatedTrade.sl)) {
                            updatedTrade.trailingStopPrice = newTrailingStop;
                        }
                    }
                } else { // SHORT
                    if (currentCandle.low < (updatedTrade.lowestPriceSoFar || updatedTrade.entryPrice)) {
                        updatedTrade.lowestPriceSoFar = currentCandle.low;
                        const newTrailingStop = updatedTrade.lowestPriceSoFar * (1 + trailingStopPercent / 100);
                        if (newTrailingStop < (updatedTrade.trailingStopPrice || updatedTrade.sl)) {
                            updatedTrade.trailingStopPrice = newTrailingStop;
                        }
                    }
                }
            }

            const activeSL = updatedTrade.trailingStopPrice || updatedTrade.sl;

            // Check for TP/SL hit
            if (updatedTrade.direction === 'LONG') {
                if (currentCandle.low <= activeSL) { exitPrice = activeSL; exitReason = updatedTrade.trailingStopPrice ? 'Trailing Stop' : 'SL'; }
                else if (currentCandle.high >= updatedTrade.tp) { exitPrice = updatedTrade.tp; exitReason = 'TP'; }
            } else { // SHORT
                if (currentCandle.high >= activeSL) { exitPrice = activeSL; exitReason = updatedTrade.trailingStopPrice ? 'Trailing Stop' : 'SL'; }
                else if (currentCandle.low <= updatedTrade.tp) { exitPrice = updatedTrade.tp; exitReason = 'TP'; }
            }

            // If trade is closed, process it
            if (exitPrice && exitReason) {
                const pnlStats = calculateTradePnl(updatedTrade, exitPrice, globalRiskSettings);
                const durationMs = currentCandle.time - updatedTrade.time;

                const closedTrade = { 
                    ...updatedTrade, 
                    status: 'closed' as const, 
                    exitPrice, 
                    exitReason, 
                    exitTime: currentCandle.time, 
                    ...pnlStats,
                    durationMs, 
                    duration: formatDuration(durationMs)
                };
                
                addBacktestClosedTrade(closedTrade);
                const newOpenTrades = openTrades.filter(t => t.id !== updatedTrade.id);
                const newOpenTradesMap = new Map(openTradesMap).set('Backtest', newOpenTrades);
                useAppStore.setState({ openTrades: newOpenTradesMap });
            } else {
                // If trade is still open, update its state (for trailing stop)
                const newOpenTrades = openTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t);
                const newOpenTradesMap = new Map(openTradesMap).set('Backtest', newOpenTrades);
                useAppStore.setState({ openTrades: newOpenTradesMap });
            }
        } else {
            // 2. If no open trade, run the strategy to look for a new entry
            const currentSlice = backtestHistoricalData.slice(0, i + 1);

            const processedSlice = currentStrategy.logic.processCandles
                ? currentStrategy.logic.processCandles(currentSlice, strategySettings)
                : currentSlice;

            const state = currentStrategy.logic.run(processedSlice, strategySettings, activePair, false, strategyStateMap.get(activePair));
            updateStrategyState(activePair, state);
            
            if (state.alert && (state.alert.type === 'entry' || state.alert.type === 'short-entry') && state.alert.direction) {
                const { entryPrice: originalEntryPrice, sl: originalSl, tp: originalTp } = state.alert;

                if (originalEntryPrice && originalSl && originalTp) {
                    
                    // --- Capital Management for Backtest ---
                    const initialCapital = globalRiskSettings.totalCapital;
                    const realizedPnl = backtestClosedTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0);
                    const currentEquity = initialCapital + realizedPnl;
                    const capitalInUse = openTrades.reduce((sum, trade) => sum + trade.positionSize, 0);
                    const availableCapital = currentEquity - capitalInUse;
                    // ---

                    let entryPrice = originalEntryPrice;
                    let sl = originalSl;
                    let tp = originalTp;

                    const originalRisk = Math.abs(originalEntryPrice - originalSl);
                    
                    if (globalRiskSettings.slippage > 0) {
                        if (state.alert.direction === 'LONG') {
                            entryPrice = originalEntryPrice * (1 + globalRiskSettings.slippage / 100);
                            sl = entryPrice - originalRisk;
                            const originalReward = Math.abs(originalTp - originalEntryPrice);
                            tp = entryPrice + originalReward;
                        }
                    }
                    
                    const positionSizeInQuote = calculatePositionSize(entryPrice, sl);
                    
                    if (positionSizeInQuote > 0) {
                        const plannedRR = Math.abs(tp - entryPrice) / Math.abs(entryPrice-sl);

                        addOpenTrade({
                            sessionId: 'backtest-session', pair: activePair, strategyId: activeStrategyId,
                            strategyNameKey: currentStrategy.nameKey, timeframe, direction: state.alert.direction,
                            entryPrice, time: state.alert.time, sl, tp, positionSize: positionSizeInQuote,
                            plannedRR, durationMs: 0, id: `${state.alert.time}-${activePair}`, mode: 'Backtest',
                            status: 'open',
                            highestPriceSoFar: state.alert.direction === 'LONG' ? entryPrice : undefined,
                            lowestPriceSoFar: state.alert.direction === 'SHORT' ? entryPrice : undefined,
                        });
                    }
                }
            }
        }
    }, [tradingMode, backtestCandleIndex, backtestHistoricalData]); // <-- Simple & Robust Dependencies


    // --- EFFECT 3: End of Backtest Management ---
    // This effect handles generating and saving the final summary.
    useEffect(() => {
        if (tradingMode !== 'Backtest' || backtestHistoricalData.length === 0) return;

        if (backtestCandleIndex >= backtestHistoricalData.length - 1) {
            const {
                activeStrategyId, timeframe, activePair, globalRiskSettings,
                strategySettingsMap, backtestClosedTrades, strategyDefinitions,
                addBacktestToHistory, setSelectedBacktestSession,
            } = useAppStore.getState();

            const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
            const strategySettings = strategySettingsMap[activeSettingsKey] || strategyDefinitions.get(activeStrategyId)?.defaultSettings;
            
            if (strategySettings) {
                const stats = calculateBacktestStats(backtestClosedTrades, globalRiskSettings.totalCapital);
                const currentStrategy = strategyDefinitions.get(activeStrategyId);
                const session: BacktestSession = {
                    id: `B-${Date.now()}`,
                    date: Date.now(),
                    pair: activePair,
                    timeframe: timeframe,
                    strategyId: activeStrategyId,
                    strategyNameKey: currentStrategy ? currentStrategy.nameKey : 'unknown_strategy',
                    stats: stats,
                    settings: strategySettings,
                };
                addBacktestToHistory(session);
                setSelectedBacktestSession(session);
            }
        }
    }, [tradingMode, backtestCandleIndex, backtestHistoricalData.length]);
};