import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Trade } from '../types';

export const useTradeManager = () => {
    const { tradingMode, rawCandlesMap } = useAppStore(state => ({
        tradingMode: state.tradingMode,
        rawCandlesMap: state.rawCandlesMap,
    }));

    useEffect(() => {
        const {
            openTrades, // This is the full Map
            closeTrade,
            strategySettingsMap,
            activeStrategyId,
            timeframe,
            strategyDefinitions,
        } = useAppStore.getState();

        // ONLY manage trades for the current mode.
        const openTradesForCurrentMode = openTrades.get(tradingMode) || [];
        if (tradingMode === 'Backtest' || openTradesForCurrentMode.length === 0) {
            return;
        }

        const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
        const strategySettings = strategySettingsMap[activeSettingsKey] || strategyDefinitions.get(activeStrategyId)?.defaultSettings;
        if (!strategySettings) return;
        
        const tradesToUpdate: Trade[] = [];

        for (const trade of openTradesForCurrentMode) {
            const candles = rawCandlesMap.get(trade.pair);
            if (!candles || candles.length === 0) continue;
            
            const lastCandle = candles[candles.length - 1];
            let updatedTrade = { ...trade };
            let exitPrice: number | undefined;
            let exitReason: 'TP' | 'SL' | 'Trailing Stop' | undefined;

            const trailingStopPercent = (strategySettings as any).trailingStop;
            if (trailingStopPercent > 0) {
                if (updatedTrade.direction === 'LONG') {
                    if (lastCandle.high > (updatedTrade.highestPriceSoFar || updatedTrade.entryPrice)) {
                        updatedTrade.highestPriceSoFar = lastCandle.high;
                        const newTrailingStop = updatedTrade.highestPriceSoFar * (1 - trailingStopPercent / 100);
                        if (newTrailingStop > (updatedTrade.trailingStopPrice || updatedTrade.sl)) {
                            updatedTrade.trailingStopPrice = newTrailingStop;
                        }
                    }
                } else { // SHORT
                    if (lastCandle.low < (updatedTrade.lowestPriceSoFar || updatedTrade.entryPrice)) {
                        updatedTrade.lowestPriceSoFar = lastCandle.low;
                        const newTrailingStop = updatedTrade.lowestPriceSoFar * (1 + trailingStopPercent / 100);
                        if (newTrailingStop < (updatedTrade.trailingStopPrice || updatedTrade.sl)) {
                            updatedTrade.trailingStopPrice = newTrailingStop;
                        }
                    }
                }
            }
            
            const activeSL = updatedTrade.trailingStopPrice || updatedTrade.sl;
            if (updatedTrade.direction === 'LONG') {
                if (lastCandle.low <= activeSL) { exitPrice = activeSL; exitReason = updatedTrade.trailingStopPrice ? 'Trailing Stop' : 'SL'; }
                else if (lastCandle.high >= updatedTrade.tp) { exitPrice = updatedTrade.tp; exitReason = 'TP'; }
            }
            
            if (exitPrice !== undefined && exitReason) {
                closeTrade(updatedTrade.id, exitPrice, exitReason);
            } else if (JSON.stringify(trade) !== JSON.stringify(updatedTrade)) {
                // If only trailing stop updated, we need to save it
                tradesToUpdate.push(updatedTrade);
            }
        }
        
        if (tradesToUpdate.length > 0) {
             const newOpenTradesForMode = openTradesForCurrentMode.map(t => tradesToUpdate.find(ut => ut.id === t.id) || t);
             const newOpenTradesMap = new Map(openTrades).set(tradingMode, newOpenTradesForMode);
             useAppStore.getState().openTrades.set(tradingMode, newOpenTradesForMode); // Directly mutate for this non-reactive update
             useAppStore.setState({ openTrades: newOpenTradesMap }); // Trigger re-render
        }

    }, [rawCandlesMap, tradingMode]);
};