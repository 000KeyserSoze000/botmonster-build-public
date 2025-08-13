import type { StateCreator } from 'zustand';
import type { AppState, SettingsSlice, StrategySettings, IndicatorSettings, GlobalRiskSettings } from '../types';

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
  soundSettings: { entry: 'notify', grab: 'chime', tp: 'success', sl: 'buzz' },
  allWatchlists: { 'Default': ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE'] },
  activeWatchlistName: 'Default',
  strategySettingsMap: {},
  indicatorSettings: {
    showFVG: true, showOB: true, showSwings: true, showLiquidityGrabs: true,
    showFastEma: true, showSlowEma: true, showPivots: true, showVolumeAnomaly: true,
    showRsi: true, showDivergence: true, showVolumeProfile: true,
  },
  globalRiskSettings: {
    totalCapital: 10000, confirmTrades: true, commission: 0.1, slippage: 0.05,
    useBnbFees: true, riskManagementMode: 'pro', riskPerTrade: 1, maxConcurrentRisk: 5,
    fixedPositionAmount: 100, maxOpenPositions: 5,
  },
  socialSettings: { telegramHandle: '', twitterHandle: '', instagramHandle: '' },

  setSoundSettings: (settings) => set({ soundSettings: settings }),
  updateWatchlists: (newCollection, newActiveName) => {
    set({ allWatchlists: newCollection, activeWatchlistName: newActiveName });
  },
  
  updateStrategySettings: (updater) => {
    const { activeStrategyId, timeframe } = get();
    const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
    
    set(state => {
      const currentSettings = state.strategySettingsMap[activeSettingsKey] || state.strategyDefinitions.get(activeStrategyId)?.defaultSettings;
      if (!currentSettings) return {};
      
      const newSettings = updater(currentSettings);
      
      return {
        strategySettingsMap: {
          ...state.strategySettingsMap,
          [activeSettingsKey]: newSettings,
        }
      };
    });
  },

  resetStrategySettings: () => {
    const { activeStrategyId, timeframe } = get();
    const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
    
    set(state => {
      const newMap = { ...state.strategySettingsMap };
      delete newMap[activeSettingsKey];
      return { strategySettingsMap: newMap };
    });
  },

  setIndicatorSettings: (updater) => {
    set(state => ({
        indicatorSettings: typeof updater === 'function' 
            ? updater(state.indicatorSettings) 
            : updater
    }));
  },

  setGlobalRiskSettings: (updater) => {
     set(state => ({
        globalRiskSettings: typeof updater === 'function' 
            ? updater(state.globalRiskSettings) 
            : updater
    }));
  },

  setSocialSettings: (settings) => set({ socialSettings: settings }),
});