import type { StateCreator } from 'zustand';
import type { AppState, DataSlice, Candle } from '../types';

export const createDataSlice: StateCreator<AppState, [], [], DataSlice> = (set, get) => ({
  rawCandlesMap: new Map(),
  processedCandlesMap: new Map(),
  htfCandlesMap: new Map(),
  strategyStateMap: new Map(),
  isDataLoading: false,
  lastTickTime: 0,
  heatmapData: new Map(),
  marketRegime: null,

  setRawCandlesMap: (map) => set({ rawCandlesMap: map }),
  setProcessedCandlesMap: (map) => set({ processedCandlesMap: map }),
  setHtfCandlesMap: (map) => set({ htfCandlesMap: map }),
  setStrategyStateMap: (map) => set({ strategyStateMap: map }),

  updateCandle: (pair, candle) => {
    const rawCandlesMap = get().rawCandlesMap;
    const existingCandles = rawCandlesMap.get(pair) || [];
    const newCandles = [...existingCandles];
    
    if (newCandles.length > 0 && newCandles[newCandles.length - 1].time === candle.time) {
      newCandles[newCandles.length - 1] = candle;
    } else {
      newCandles.push(candle);
    }
    
    // Keep the array size manageable
    if (newCandles.length > 2000) {
      newCandles.shift();
    }
    
    const newMap = new Map(rawCandlesMap).set(pair, newCandles);
    set({ rawCandlesMap: newMap });
  },

  updateStrategyState: (pair, state) => {
    const newMap = new Map(get().strategyStateMap).set(pair, state);
    set({ strategyStateMap: newMap });
  },
  
  setIsDataLoading: (isLoading) => set({ isDataLoading: isLoading }),
  setLastTickTime: (time) => set({ lastTickTime: time }),
  setHeatmapData: (data) => set({ heatmapData: data }),
  setMarketRegime: (regime) => set({ marketRegime: regime }),
});