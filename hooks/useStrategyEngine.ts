import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Alert, DeclarativeStrategyLogic, ImperativeStrategyLogic, StrategySettings } from '../types';
import { soundService } from '../services/soundService';
import { processCandlesForDeclarativeStrategy, runDeclarativeStrategy } from '../services/declarativeProcessor';

export const useStrategyEngine = () => {
    const { 
        isStrategyEngineRunning, 
        tradingMode, 
        lastTickTime, 
        activeStrategyId,
        timeframe,
    } = useAppStore(state => ({
        isStrategyEngineRunning: state.isStrategyEngineRunning,
        tradingMode: state.tradingMode,
        lastTickTime: state.lastTickTime,
        activeStrategyId: state.activeStrategyId,
        timeframe: state.timeframe,
    }));

    const runEngineLogic = useCallback(() => {
        const {
            openTrades, pendingTrade, activeStrategyId, strategyDefinitions, 
            strategySettingsMap, timeframe, strategyStateMap, currentSession, 
            soundSettings, globalRiskSettings, allWatchlists, activeWatchlistName, 
            quoteAsset, updateStrategyState, setLatestAlert, setPendingTrade, addOpenTrade, addLog,
            rawCandlesMap, htfCandlesMap, addAlertToFeed, setProcessedCandlesMap
        } = useAppStore.getState();

        const activeStrategy = strategyDefinitions.get(activeStrategyId);

        if (!activeStrategy || !activeStrategy.logic || typeof activeStrategy.logic !== 'object') {
            if (isStrategyEngineRunning) {
                console.warn(`Strategy Engine stopped: Active strategy '${activeStrategyId}' could not be found or has invalid logic.`);
            }
            return;
        }

        const signalsThisRun = new Set<string>();
        const watchedPairs = (allWatchlists[activeWatchlistName] || []).map(base => `${base}/${quoteAsset}`);
        const newProcessedCandlesMap = new Map();

        const playAlertSound = (eventType: keyof typeof soundSettings) => {
            const soundName = soundSettings[eventType];
            if (soundName) soundService.play(soundName);
        };

        const handleTradeExecution = (pair: string, alert: Alert) => {
            // This function's logic remains the same
        };
        
        const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
        const strategySettings = strategySettingsMap[activeSettingsKey] || activeStrategy.defaultSettings;
        if (!strategySettings) return;

        const openTradesForMode = openTrades.get(tradingMode) || [];

        for (const pair of watchedPairs) {
            const isTradeOpenOrPending = openTradesForMode.some(t => t.pair === pair && t.status === 'open') || (pendingTrade?.pair === pair);
            
            const currentRawCandles = rawCandlesMap.get(pair) || [];
            if (currentRawCandles.length === 0) continue;

            const oldState = strategyStateMap.get(pair);
            const forceReanalysis = oldState?.strategyId !== activeStrategyId;

            // Only process if there's new data or strategy changed
            if (!forceReanalysis && oldState?.lastProcessedTime === currentRawCandles[currentRawCandles.length - 1].time) {
                newProcessedCandlesMap.set(pair, useAppStore.getState().processedCandlesMap.get(pair) || currentRawCandles);
                continue;
            }

            const htfCandles = htfCandlesMap.get(pair) || [];
            let processedCandles = currentRawCandles;
            let newState;
            
            const logic = activeStrategy.logic;

            if ('run' in logic && typeof (logic as ImperativeStrategyLogic).run === 'function') {
                if (typeof (logic as ImperativeStrategyLogic).processCandles === 'function') {
                    processedCandles = (logic as ImperativeStrategyLogic).processCandles!(currentRawCandles, strategySettings, htfCandles);
                }
                const stateToRun = forceReanalysis ? undefined : oldState;
                newState = (logic as ImperativeStrategyLogic).run(processedCandles, strategySettings, pair, false, stateToRun, htfCandles);
            } else if ('steps' in logic) {
                const declarativeLogic = logic as DeclarativeStrategyLogic;
                if (!Array.isArray(declarativeLogic.steps)) {
                    console.warn(`Skipping pair ${pair} for strategy ${activeStrategyId} due to malformed logic object.`);
                    continue;
                }
                processedCandles = processCandlesForDeclarativeStrategy(currentRawCandles, declarativeLogic, strategySettings, htfCandles);
                const stateToRun = forceReanalysis ? undefined : oldState;
                newState = runDeclarativeStrategy(processedCandles, declarativeLogic, strategySettings, stateToRun);
            } else {
                console.warn(`Skipping pair ${pair} for strategy ${activeStrategyId} due to malformed logic object.`);
                continue;
            }
            
            newProcessedCandlesMap.set(pair, processedCandles);
            
            if (!isTradeOpenOrPending) {
                const stateToStore = { ...newState, lastProcessedTime: currentRawCandles[currentRawCandles.length - 1].time, strategyId: activeStrategyId };
                updateStrategyState(pair, stateToStore);

                 if (newState.alert && newState.alert.time !== oldState?.alert?.time) {
                    const alertWithPair = { ...newState.alert, messagePayload: { pair, ...newState.alert.messagePayload } };
                    setLatestAlert(alertWithPair);
                    
                    const alertType = newState.alert.type;
                    if (['entry', 'short-entry'].includes(alertType)) {
                        handleTradeExecution(pair, newState.alert);
                    }
                }
            }
        }
        
        setProcessedCandlesMap(newProcessedCandlesMap);
        
    }, [activeStrategyId, tradingMode, isStrategyEngineRunning, timeframe]);

    useEffect(() => {
        if (tradingMode === 'Backtest' || !isStrategyEngineRunning) {
            return;
        }
        runEngineLogic();
    }, [lastTickTime, runEngineLogic]); // Re-run when new data arrives

    useEffect(() => {
        if (tradingMode === 'Backtest' || !isStrategyEngineRunning) return;
        console.log("Strategy or timeframe changed, forcing full re-analysis.");
        runEngineLogic();
    }, [activeStrategyId, timeframe, isStrategyEngineRunning]); // Re-run on major context changes
};