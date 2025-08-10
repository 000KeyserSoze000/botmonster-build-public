import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchHistoricalCandles } from '../services/binanceService';
import { calculateEMA } from '../services/tradingLogicService';
import type { HeatmapCellData, HeatmapData } from '../types';

const HEATMAP_TIMEFRAMES = ['15m', '1H', '4H', '1D'];
const CALCULATION_INTERVAL = 30000; // 30 seconds

export const useHeatmapEngine = () => {
    const isEngineRunningRef = useRef(false);

    useEffect(() => {
        const runEngine = async () => {
            if (isEngineRunningRef.current) return;
            isEngineRunningRef.current = true;
            
            try {
                const {
                    allWatchlists, activeWatchlistName, quoteAsset,
                    strategyDefinitions, activeStrategyId, strategySettingsMap,
                    setHeatmapData, heatmapData
                } = useAppStore.getState();

                const watchedPairs = (allWatchlists[activeWatchlistName] || []).map(base => `${base}/${quoteAsset}`);
                if (watchedPairs.length === 0) {
                    if (heatmapData.size > 0) setHeatmapData(new Map());
                    return;
                }

                const newHeatmapData: HeatmapData = new Map(heatmapData);
                const activeStrategy = strategyDefinitions.get(activeStrategyId);
                if (!activeStrategy || !('run' in activeStrategy.logic)) return;

                for (const pair of watchedPairs) {
                    for (const timeframe of HEATMAP_TIMEFRAMES) {
                        const key = `${pair}-${timeframe}`;
                        try {
                            const candles = await fetchHistoricalCandles(pair, timeframe, 100);
                            if (candles.length < 51) continue;

                            const lastCandle = candles[candles.length - 1];
                            
                            // 1. Trend Strength
                            const closes = candles.map(c => c.close);
                            const ema50 = calculateEMA(closes, 50);
                            const lastEma = ema50[ema50.length - 1];
                            const trendStrength = lastEma ? (lastCandle.close - lastEma) / lastEma : 0;
                            
                            // 2. Signal Proximity
                            const settings = strategySettingsMap[`${activeStrategyId}-${timeframe}`] || activeStrategy.defaultSettings;
                            const processedCandles = activeStrategy.logic.processCandles ? activeStrategy.logic.processCandles(candles, settings) : candles;
                            const state = activeStrategy.logic.run(processedCandles, settings, pair, false);
                            
                            const totalSteps = state.steps.length;
                            const metSteps = state.steps.filter(s => s.status === 'met').length;
                            const signalProgress = totalSteps > 0 ? metSteps / totalSteps : 0;
                            const isHot = signalProgress > 0.75 && signalProgress < 1;

                            // 3. Composite Score & Status
                            let score = trendStrength * 100;
                            score += signalProgress * 50;
                            
                            let statusTextKey = 'scanner_scanning_status';
                            let statusTextPayload = undefined;
                            const activeStep = state.steps.find(s => s.status === 'waiting');
                            if (activeStep) {
                                statusTextKey = activeStep.detailsKey;
                                statusTextPayload = activeStep.detailsPayload;
                            } else if (metSteps === totalSteps) {
                                statusTextKey = 'scalping_step5_ready';
                            }

                            const cellData: HeatmapCellData = {
                                pair,
                                timeframe,
                                score,
                                isHot,
                                trendStrength,
                                signalProgress,
                                statusTextKey,
                                statusTextPayload,
                            };
                            newHeatmapData.set(key, cellData);
                        } catch (error) {
                            console.warn(`[HeatmapEngine] Failed to process ${key}:`, error);
                        }
                    }
                     // Update UI after each pair is processed
                    setHeatmapData(new Map(newHeatmapData));
                }
            } catch (err) {
                console.error('[HeatmapEngine] Critical error:', err);
            } finally {
                isEngineRunningRef.current = false;
            }
        };

        const intervalId = setInterval(runEngine, CALCULATION_INTERVAL);
        runEngine(); // Initial run

        return () => clearInterval(intervalId);
    }, []); // Runs once on mount
};