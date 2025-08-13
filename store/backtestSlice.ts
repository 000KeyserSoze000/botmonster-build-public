import type { StateCreator } from 'zustand';
import type { AppState, BacktestSlice, BacktestLoadingProgress, Candle, StrategySettings } from '../types';
import { fetchAllHistoricalCandles } from '../services/binanceService';
import { runHeadlessBacktest, calculatePortfolioBacktestStats } from '../services/backtestService';

export const createBacktestSlice: StateCreator<AppState, [], [], BacktestSlice> = (set, get) => ({
  isVisualBacktest: true,
  backtestHistoricalData: [],
  backtestPlaybackState: 'idle',
  backtestCandleIndex: 0,
  backtestSpeed: 100,
  backtestClosedTrades: [],
  backtestHistory: [],
  selectedBacktestSession: null,
  backtestLoadingProgress: { isLoading: false, messageKey: '', progress: 0 },
  portfolioBacktestSession: null,
  showPortfolioSummaryModal: false,
  isOptimizing: false,
  optimizationProgress: 0,
  optimizationResults: null,
  comparisonSessionIds: [],
  showComparisonModal: false,

  setIsVisualBacktest: (isVisual) => set({ isVisualBacktest: isVisual }),
  
  startBacktest: async (pair, timeframe, period) => {
    get().resetBacktest();
    set({ backtestLoadingProgress: { isLoading: true, messageKey: 'initializing', progress: 0 } });
    try {
      const onProgress = (progress: Partial<BacktestLoadingProgress>) => {
        set(state => ({ backtestLoadingProgress: { ...state.backtestLoadingProgress, ...progress } }));
      };
      const data = await fetchAllHistoricalCandles(pair, timeframe, period, onProgress);
      if (data.length < 50) {
        throw new Error('error_insufficient_data');
      }
      set({ backtestHistoricalData: data, backtestPlaybackState: 'paused' });
    } catch(e: any) {
      get().setLatestAlert({ type: 'info', messageKey: 'error_load_failed', messagePayload: { message: e.message }, time: Date.now() });
    } finally {
      set({ backtestLoadingProgress: { isLoading: false, messageKey: '', progress: 0 } });
    }
  },

  runQuickBacktest: (pair, timeframe, period, strategyIdentifier) => {
    // This is a placeholder for a future fully headless quick backtest.
    // For now, it will trigger a visual backtest.
    get().startBacktest(pair, timeframe, period);
  },

  runPortfolioBacktest: async (timeframe, period, strategyIdentifier) => {
    // To be implemented
  },
  
  setBacktestPlaybackState: (state) => set({ backtestPlaybackState: state }),
  setBacktestHistoricalData: (data) => set({ backtestHistoricalData: data }),
  setBacktestCandleIndex: (index) => set({ backtestCandleIndex: index }),
  setBacktestSpeed: (speed) => set({ backtestSpeed: speed }),
  addBacktestClosedTrade: (trade) => set((state) => ({ backtestClosedTrades: [...state.backtestClosedTrades, trade] })),
  setSelectedBacktestSession: (session) => set({ selectedBacktestSession: session }),
  addBacktestToHistory: (session) => set((state) => ({ backtestHistory: [session, ...state.backtestHistory] })),
  
  clearBacktestHistory: () => {
      // This is now the confirmed action
      get().hideConfirmation();
      set({ backtestHistory: [], selectedBacktestSession: null, comparisonSessionIds: [] });
  },

  resetBacktest: () => {
    set({
      backtestHistoricalData: [],
      backtestPlaybackState: 'idle',
      backtestCandleIndex: 0,
      backtestClosedTrades: [],
      openTrades: new Map(get().openTrades).set('Backtest', []),
    });
  },
  setBacktestLoadingProgress: (progress) => set(state => ({ backtestLoadingProgress: { ...state.backtestLoadingProgress, ...progress } })),
  setPortfolioBacktestSession: (session) => set({ portfolioBacktestSession: session }),
  setShowPortfolioSummaryModal: (show) => set({ showPortfolioSummaryModal: show }),

  startOptimization: async (params) => {
    // To be implemented
  },

  clearOptimizationResults: () => set({ optimizationResults: null }),
  applyOptimizationSettings: (settings) => get().updateStrategySettings(() => settings),
  toggleComparisonSessionId: (sessionId) => {
    set(state => {
      const currentIds = state.comparisonSessionIds;
      if (currentIds.includes(sessionId)) {
        return { comparisonSessionIds: currentIds.filter(id => id !== sessionId) };
      }
      if (currentIds.length < 2) {
        return { comparisonSessionIds: [...currentIds, sessionId] };
      }
      return {}; // Do nothing if already 2 are selected
    });
  },
  setShowComparisonModal: (show) => set({ showComparisonModal: show }),
});