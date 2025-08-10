import { createWithEqualityFn } from 'zustand/traditional';
import { shallow as shallowCompare } from 'zustand/shallow';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type { AppState, Language } from '../types';
import * as db from '../services/databaseService';
import type { PersistStorage } from 'zustand/middleware';
import { createCoreSlice } from './coreSlice';
import { createUiSlice } from './uiSlice';
import { createDataSlice } from './dataSlice';
import { createTradeSlice } from './tradeSlice';
import { createBacktestSlice } from './backtestSlice';
import { createScannerSlice } from './scannerSlice';
import { createAiSlice } from './aiSlice';
import { createSettingsSlice } from './settingsSlice';
import { createSecuritySlice } from './securitySlice';

const indexedDBStorage: PersistStorage<Partial<AppState>> = {
  getItem: async (name) => {
    const state = await db.getAppState(name);
    return state ? { state: state as Partial<AppState>, version: 0 } : null;
  },
  setItem: async (name, value) => {
    await db.setAppState(name, value.state);
  },
  removeItem: async (name) => {
    await db.delAppState(name);
  },
};

export const useAppStore = createWithEqualityFn<AppState>()(
  persist(
    subscribeWithSelector(
      (set, get, api) => ({
        ...createCoreSlice(set, get, api),
        ...createUiSlice(set, get, api),
        ...createDataSlice(set, get, api),
        ...createTradeSlice(set, get, api),
        ...createBacktestSlice(set, get, api),
        ...createScannerSlice(set, get, api),
        ...createAiSlice(set, get, api),
        ...createSettingsSlice(set, get, api),
        ...createSecuritySlice(set, get, api),
      })
    ),
    {
      name: 'botmonster-storage',
      storage: indexedDBStorage,
      partialize: (state) => ({
        // Core Slice
        language: state.language,
        activeStrategyId: state.activeStrategyId,
        tradingMode: state.tradingMode,
        timeframe: state.timeframe,
        quoteAsset: state.quoteAsset,
        // UI Slice
        isSidebarCollapsed: state.isSidebarCollapsed,
        isScannerPanelCollapsed: state.isScannerPanelCollapsed,
        isBottomPanelCollapsed: state.isBottomPanelCollapsed,
        isWatchlistBarOpen: state.isWatchlistBarOpen,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        // Trade Slice
        alertFeed: state.alertFeed,
        // Scanner Slice
        scannerPresets: state.scannerPresets,
        activePresetName: state.activePresetName,
        // Backtest Slice
        backtestHistory: state.backtestHistory,
        isVisualBacktest: state.isVisualBacktest,
        // Settings Slice
        soundSettings: state.soundSettings,
        globalRiskSettings: state.globalRiskSettings,
        socialSettings: state.socialSettings,
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        strategySettingsMap: state.strategySettingsMap,
      }),
      merge: (persistedState: any, currentState: AppState) => {
        const supportedLanguages: Language[] = ['en', 'fr'];
        if (persistedState.language && !supportedLanguages.includes(persistedState.language)) {
            console.warn(`Unsupported language '${persistedState.language}' found in storage. Resetting to 'fr'.`);
            persistedState.language = 'fr';
        }
        return { ...currentState, ...persistedState };
      },
    }
  ),
  shallowCompare
);