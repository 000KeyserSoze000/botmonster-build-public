import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { mapTimeframeToBinance, parseWebSocketData, fetchHistoricalCandles } from '../services/binanceService';
import * as db from '../services/databaseService';
import type { AppState, Candle } from '../types';

export const useWebSocket = () => {
    const {
        isDBHydrated, tradingMode, timeframe, quoteAsset,
        allWatchlists, activeWatchlistName, activePair
    } = useAppStore(state => ({
        isDBHydrated: state.isDBHydrated,
        tradingMode: state.tradingMode,
        timeframe: state.timeframe,
        quoteAsset: state.quoteAsset,
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        activePair: state.activePair
    }));
    
    // Actions are stable and can be pulled out
    const { setLastTickTime, updateCandle, setRawCandlesMap, setActivePair, setHtfCandlesMap } = useAppStore.getState();

    const watchedPairs = useMemo(() => 
        (allWatchlists[activeWatchlistName] || []).map(base => `${base}/${quoteAsset}`),
        [allWatchlists, activeWatchlistName, quoteAsset]
    );

    // Effect for initial data load and updates (Cache-First Strategy)
    useEffect(() => {
        if (tradingMode === 'Backtest' || !isDBHydrated) return;

        const loadAndRefreshData = async (pairsToLoad: string[], tf: string) => {
            const { setIsDataLoading } = useAppStore.getState();
            setIsDataLoading(true);

            try {
                // Phase 1: Load from DB instantly for UI responsiveness
                const dbCandlesMap = await db.getAllCandles();
                setRawCandlesMap(dbCandlesMap);

                // Phase 2: Refresh data in the background
                const updatePromises = pairsToLoad.map(async (pair) => {
                    const existingCandles = dbCandlesMap.get(pair) || [];
                    const lastTime = existingCandles.length > 0 ? existingCandles[existingCandles.length - 1].time : 0;
                    
                    let newCandles: Candle[];
                    if (existingCandles.length < 500 || lastTime === 0) {
                        newCandles = await fetchHistoricalCandles(pair, tf, 1000);
                    } else {
                        const recentFetched = await fetchHistoricalCandles(pair, tf, 500);
                        const combined = existingCandles.concat(recentFetched.filter(c => c.time > lastTime));
                        newCandles = Array.from(new Map(combined.map(c => [c.time, c])).values()).sort((a,b) => a.time - b.time);
                    }
                    
                    await db.saveCandlesForPair(pair, newCandles);
                    return { pair, candles: newCandles };
                });

                const results = await Promise.allSettled(updatePromises);
                
                const finalCandlesMap = new Map(useAppStore.getState().rawCandlesMap);
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.candles) {
                        finalCandlesMap.set(result.value.pair, result.value.candles);
                    } else if (result.status === 'rejected') {
                        console.error(`Failed to refresh data:`, result.reason);
                    }
                });
                
                setRawCandlesMap(finalCandlesMap);

                if (pairsToLoad.length > 0 && (!activePair || !pairsToLoad.includes(activePair))) {
                    setActivePair(pairsToLoad[0]);
                }
            } catch(e) {
                console.error("Error loading/refreshing candle data:", e);
            } finally {
                setIsDataLoading(false);
                setLastTickTime(Date.now()); // Trigger engine after data load/refresh
            }
        };

        loadAndRefreshData(watchedPairs, timeframe);
    }, [watchedPairs.toString(), timeframe, tradingMode, isDBHydrated, setRawCandlesMap, setActivePair, activePair]);

    // Effect for Higher Timeframe (HTF) data loading
    useEffect(() => {
        if (tradingMode === 'Backtest' || !isDBHydrated || watchedPairs.length === 0) return;

        const loadHtfData = async () => {
            console.log("Loading HTF (1H) data for all watched pairs...");
            const htfMap = new Map<string, Candle[]>();
            const htfTimeframe = '1H'; // Hardcoded for now, could be made configurable later

            const promises = watchedPairs.map(pair => 
                fetchHistoricalCandles(pair, htfTimeframe, 1000)
                    .then(candles => ({ pair, candles }))
                    .catch(error => {
                        console.error(`Failed to fetch HTF data for ${pair}:`, error);
                        return { pair, candles: [] };
                    })
            );

            const results = await Promise.all(promises);
            results.forEach(({ pair, candles }) => {
                if (candles.length > 0) {
                    htfMap.set(pair, candles);
                }
            });
            
            setHtfCandlesMap(htfMap);
            console.log(`Loaded HTF data for ${htfMap.size} pairs.`);
        };

        loadHtfData();
        const intervalId = setInterval(loadHtfData, 15 * 60 * 1000); // Refresh every 15 minutes

        return () => clearInterval(intervalId);

    }, [watchedPairs.toString(), tradingMode, isDBHydrated, setHtfCandlesMap]);


    // Effect for WebSocket connection
    useEffect(() => {
        if (tradingMode === 'Backtest' || watchedPairs.length === 0 || !isDBHydrated) {
            return;
        }

        const streams = watchedPairs.map(p => `${p.replace('/', '').toLowerCase()}@kline_${mapTimeframeToBinance(timeframe)}`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

        ws.onmessage = (event) => {
            setLastTickTime(Date.now());
            const data = JSON.parse(event.data);
            if (data.e !== 'kline') return;

            const { candle, pair } = parseWebSocketData(data);
            if (pair) {
                updateCandle(pair, candle);
                // Also save the updated candle data to IndexedDB
                const updatedCandles = useAppStore.getState().rawCandlesMap.get(pair);
                if (updatedCandles) {
                    db.saveCandlesForPair(pair, updatedCandles);
                }
            }
        };

        ws.onerror = (error) => console.error('WebSocket Error:', error);
        ws.onclose = () => console.log('WebSocket Disconnected');

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [watchedPairs.join(','), timeframe, tradingMode, isDBHydrated, updateCandle, setLastTickTime]); // Dependency on joined string
};