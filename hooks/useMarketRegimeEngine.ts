import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateADX } from '../services/tradingLogicService';
import type { MarketRegime } from '../types';

const CALCULATION_INTERVAL = 30000; // 30 seconds

export const useMarketRegimeEngine = () => {
    const isEngineRunningRef = useRef(false);
    const lastRegimeRef = useRef<string | null>(null);

    useEffect(() => {
        const runEngine = async () => {
            if (isEngineRunningRef.current) return;
            isEngineRunningRef.current = true;
            
            try {
                const { activePair, rawCandlesMap, setMarketRegime } = useAppStore.getState();

                if (!activePair) return;

                const candles = rawCandlesMap.get(activePair);
                if (!candles || candles.length < 50) return;

                const adxValues = calculateADX(candles, 14);
                const lastAdx = adxValues[adxValues.length - 1];

                if (lastAdx === undefined) return;
                
                let newRegime: MarketRegime;

                if (lastAdx > 25) {
                    newRegime = {
                        regime: 'trending',
                        reasonKey: 'market_regime_reason_trending',
                        reasonPayload: { adx: lastAdx.toFixed(1) }
                    };
                } else {
                    newRegime = {
                        regime: 'ranging',
                        reasonKey: 'market_regime_reason_ranging',
                        reasonPayload: { adx: lastAdx.toFixed(1) }
                    };
                }
                
                // Only update state if the regime has changed to avoid unnecessary re-renders
                if (lastRegimeRef.current !== newRegime.regime) {
                    setMarketRegime(newRegime);
                    lastRegimeRef.current = newRegime.regime;
                }

            } catch (err) {
                console.warn('[MarketRegimeEngine] Error during analysis:', err);
            } finally {
                isEngineRunningRef.current = false;
            }
        };

        const intervalId = setInterval(runEngine, CALCULATION_INTERVAL);
        runEngine(); // Initial run

        return () => clearInterval(intervalId);
    }, []); // Runs once on mount
};