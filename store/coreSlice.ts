import type { StateCreator } from 'zustand';
import type { AppState, CoreSlice, TradingMode, StrategyDefinition, DeclarativeStrategyLogic } from '../types';
import { loadStrategies } from '../services/strategyLoader';
import * as db from '../services/databaseService';

const BUILT_IN_STRATEGY_IDS = ["order-flow-smc", "scalping-ema-cross", "volume-anomaly-scalper", "rsi-divergence-hunter", "test-strategy"];

export const createCoreSlice: StateCreator<AppState, [], [], CoreSlice> = (set, get) => ({
  language: 'fr',
  activeStrategyId: 'scalping-ema-cross',
  strategyDefinitions: new Map(),
  tradingMode: 'Paper',
  previousTradingMode: null,
  timeframe: '5m',
  activePair: 'BTC/USDC',
  quoteAsset: 'USDC',
  isDBHydrated: false,
  binanceApiStatus: { usedWeight: 0, limit: 1200 },
  isStrategyEngineRunning: false,

  setLanguage: (lang) => {
    // The i18next.changeLanguage call was removed as it's not needed by the custom i18n setup and was causing a crash.
    set({ language: lang });
  },

  hydrateFromDB: async () => {
    console.log("Hydrating data from IndexedDB...");
    get().checkIsTauri(); // Check environment first
    const strategies = await loadStrategies();
    set({ strategyDefinitions: strategies });

    const [trades, openTradesPaper, openTradesLive, sessionHistory, alertFeed] = await Promise.all([
        db.getAllTrades(),
        db.getOpenTrades('Paper'),
        db.getOpenTrades('Live'),
        db.getAllSessionSummaries(),
        db.getAlertFeed()
    ]);

    const openTradesMap = new Map();
    openTradesMap.set('Paper', openTradesPaper);
    openTradesMap.set('Live', openTradesLive);

    set({
      trades,
      openTrades: openTradesMap,
      sessionHistory,
      alertFeed,
      isDBHydrated: true,
    });
    
    // Load API keys if in Tauri
    await get().loadApiKeys();
    
    // --- ROBUSTNESS: Check for dangling open trades on startup ---
    const danglingTrades = openTradesPaper.length > 0 || openTradesLive.length > 0;
    if (danglingTrades) {
        // We can't know which mode was last active, so we default to Paper if it has trades, otherwise Live.
        const lastModeWithTrades = openTradesPaper.length > 0 ? 'Paper' : 'Live';
        set({ tradingMode: lastModeWithTrades });
        get().setShowSessionStartModal(true);
    }

    console.log(`Loaded ${trades.length} historical trades.`);
  },

  importStrategy: (strategyJson: string) => {
    try {
        const parsed = JSON.parse(strategyJson);

        const requiredFields = ['id', 'name', 'logic', 'defaultSettings', 'settingsConfig', 'indicatorConfig'];
        const missingFields = requiredFields.filter(f => !(f in parsed));
        if (missingFields.length > 0) {
            throw new Error(`error_import_missing_fields: ${missingFields.join(', ')}`);
        }
        
        const logic = parsed.logic as DeclarativeStrategyLogic;
        if (!logic || !Array.isArray(logic.steps) || !Array.isArray(logic.indicatorsToProcess) || !logic.exitLogic) {
             throw new Error(`error_import_missing_fields: logic block is malformed`);
        }

        if (get().strategyDefinitions.has(parsed.id)) {
            throw new Error(`error_import_invalid_id: ${parsed.id}`);
        }

        const newStrategy: StrategyDefinition = parsed;

        if ('steps' in newStrategy.logic && !newStrategy.getInitialSteps) {
            newStrategy.getInitialSteps = () => (newStrategy.logic as DeclarativeStrategyLogic).steps.map((step: any) => ({
                name: step?.name,
                nameKey: step?.nameKey, 
                status: 'pending', 
                detailsKey: 'orderFlow_step_pending_details'
            }));
        }

        db.saveImportedStrategy(newStrategy);

        const newMap = new Map(get().strategyDefinitions);
        newMap.set(newStrategy.id, newStrategy);
        set({ strategyDefinitions: newMap, activeStrategyId: newStrategy.id });

        get().setLatestAlert({ type: 'info', messageKey: 'import_strategy_success', messagePayload: { name: newStrategy.name }, time: Date.now() });

    } catch (e: any) {
        let messageKey = 'error_import_failed';
        if (e instanceof SyntaxError) messageKey = 'error_import_invalid_json';
        else if (e.message.startsWith('error_')) messageKey = e.message;
        
        get().setLatestAlert({ type: 'info', messageKey, messagePayload: { message: e.message }, time: Date.now() });
        console.error("Strategy import failed:", e);
    }
  },

  deleteStrategy: async (id) => {
    const { strategyDefinitions, activeStrategyId, setLatestAlert } = get();
    if (id === activeStrategyId) {
        setLatestAlert({ type: 'info', messageKey: 'error_delete_active_strategy', time: Date.now() });
        return;
    }
    if (BUILT_IN_STRATEGY_IDS.includes(id)) {
         console.error("Attempted to delete a built-in strategy.");
         return;
    }
    await db.deleteStrategy(id);
    const newMap = new Map(strategyDefinitions);
    const deleted = newMap.delete(id);
    
    if(deleted) {
        set({ strategyDefinitions: newMap });
    }
  },

  setActiveStrategyId: (id) => {
    const strategy = get().strategyDefinitions.get(id);
    if (strategy) {
      set({ activeStrategyId: id });
    }
  },

  _setTradingMode: (mode) => set({ tradingMode: mode }),
  setTimeframe: (tf) => set({ timeframe: tf }),
  setActivePair: (pair) => set({ activePair: pair }),
  setQuoteAsset: (asset) => set({ quoteAsset: asset }),
  setBinanceApiStatus: (status) => set({ binanceApiStatus: status }),

  handleModeChange: (newMode: TradingMode) => {
    if (newMode === 'Live' && get().tradingMode !== 'Live') {
        get().showConfirmation({
            titleKey: 'confirm_live_title',
            messageKey: 'confirm_live_p1',
            confirmAction: '_setTradingMode',
            confirmActionPayload: newMode,
            confirmButtonTextKey: 'confirm_live_button',
            confirmButtonVariant: 'danger',
        });
    } else {
        get()._setTradingMode(newMode);
    }
  },

  handleMasterSwitchToggle: (strategyIdentifier) => {
    const { isStrategyEngineRunning, tradingMode, openTrades } = get();
    if (isStrategyEngineRunning) {
      if ((openTrades.get(tradingMode) || []).length > 0) {
        get().setShowRobotStopModal(true);
      } else {
        get().stopRobotAndKeepTrades(); 
      }
    } else {
      get().startNewSession(tradingMode, strategyIdentifier);
    }
  },

  clearHistory: async () => {
    get().hideConfirmation();
    await db.clearTrades();
    set({ trades: [] });
  },
});