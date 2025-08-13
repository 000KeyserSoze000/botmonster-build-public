
import { get, set, del, keys, createStore, clear } from 'idb-keyval';
import type { Candle, Trade, TradingMode, SessionSummary, AlertEvent, ScannerPreset, StrategyDefinition } from '../types';

// Create separate stores for different data types for better organization
const candleStore = createStore('botmonster-candles', 'candle-data');
const tradeStore = createStore('botmonster-trades', 'trade-data');
const openTradesStore = createStore('botmonster-open-trades', 'open-trade-data');
const settingsStore = createStore('botmonster-settings', 'settings-data');
const sessionHistoryStore = createStore('botmonster-sessions', 'session-history');
const alertFeedStore = createStore('botmonster-alerts', 'alert-feed');
const scannerPresetStore = createStore('botmonster-scanner-presets', 'scanner-presets');
const strategyStore = createStore('botmonster-strategies', 'strategy-data');

// --- General Settings Store Functions (for Zustand persist) ---

export const getAppState = (key: IDBValidKey) => {
    return get(key, settingsStore);
}

export const setAppState = (key: IDBValidKey, value: unknown) => {
    return set(key, value, settingsStore);
}

export const delAppState = (key: IDBValidKey) => {
    return del(key, settingsStore);
}

// --- Custom Strategy Functions ---

export const saveImportedStrategy = async (strategy: StrategyDefinition): Promise<void> => {
    try {
        await set(strategy.id, strategy, strategyStore);
    } catch (error) {
        console.error(`Failed to save imported strategy ${strategy.id}:`, error);
    }
};

export const getImportedStrategies = async (): Promise<StrategyDefinition[]> => {
    const strategies: StrategyDefinition[] = [];
    try {
        const strategyKeys = await keys(strategyStore);
        for (const key of strategyKeys) {
            const strategy = await get<StrategyDefinition>(key, strategyStore);
            if (strategy) {
                strategies.push(strategy);
            }
        }
    } catch (error) {
        console.error("Failed to get all imported strategies:", error);
    }
    return strategies;
};

export const deleteStrategy = async (id: string): Promise<void> => {
    try {
        await del(id, strategyStore);
    } catch (error) {
        console.error(`Failed to delete strategy ${id}:`, error);
    }
};

// --- Candle Data Functions ---

export const saveCandlesForPair = async (pair: string, candles: Candle[]): Promise<void> => {
    try {
        await set(pair, candles, candleStore);
    } catch (error) {
        console.error(`Failed to save candles for ${pair}:`, error);
    }
};

export const getAllCandles = async (): Promise<Map<string, Candle[]>> => {
    const candleMap = new Map<string, Candle[]>();
    try {
        const pairKeys = await keys(candleStore);
        for (const key of pairKeys) {
            if (typeof key === 'string') {
                const candles = await get<Candle[]>(key, candleStore);
                if (candles) {
                    candleMap.set(key, candles);
                }
            }
        }
    } catch (error) {
        console.error("Failed to get all candles:", error);
    }
    return candleMap;
};


// --- Closed Trade History Functions ---

export const saveTrade = async (trade: Trade): Promise<void> => {
    try {
        await set(trade.id, trade, tradeStore);
    } catch (error) {
        console.error(`Failed to save trade ${trade.id}:`, error);
    }
};

export const getAllTrades = async (): Promise<Trade[]> => {
    const tradeList: Trade[] = [];
    try {
        const tradeKeys = await keys(tradeStore);
        for (const key of tradeKeys) {
            const trade = await get<Trade>(key, tradeStore);
            if (trade) {
                tradeList.push(trade);
            }
        }
    } catch (error) {
        console.error("Failed to get all trades:", error);
    }
    return tradeList.sort((a, b) => (b.exitTime || b.time) - (a.exitTime || a.time));
};

export const clearTrades = async (): Promise<void> => {
    try {
        await clear(tradeStore);
        console.log("All closed trade history cleared from IndexedDB.");
    } catch (error) {
        console.error("Failed to clear trade history:", error);
    }
};


// --- Open Trade Functions (Context-Aware) ---

const getOpenTradesKey = (mode: TradingMode) => `open-trades-${mode}`;

export const saveOpenTrades = async (mode: TradingMode, openTrades: Trade[]): Promise<void> => {
    try {
        const key = getOpenTradesKey(mode);
        await set(key, openTrades, openTradesStore);
    } catch (error) {
        console.error(`Failed to save open trades for ${mode}:`, error);
    }
};

export const getOpenTrades = async (mode: TradingMode): Promise<Trade[]> => {
    try {
        const key = getOpenTradesKey(mode);
        const trades = await get<Trade[]>(key, openTradesStore);
        return trades || [];
    } catch (error) {
        console.error(`Failed to get open trades for ${mode}:`, error);
        return [];
    }
};

export const clearOpenTrades = async (mode: TradingMode): Promise<void> => {
     try {
        const key = getOpenTradesKey(mode);
        await del(key, openTradesStore);
    } catch (error) {
        console.error(`Failed to clear open trades for ${mode}:`, error);
    }
};

// --- Session History Functions ---
export const addSessionSummary = async (summary: SessionSummary): Promise<void> => {
    try {
        await set(summary.id, summary, sessionHistoryStore);
    } catch (error) {
        console.error(`Failed to save session summary ${summary.id}:`, error);
    }
};

export const getAllSessionSummaries = async (): Promise<SessionSummary[]> => {
    const history: SessionSummary[] = [];
    try {
        const sessionKeys = await keys(sessionHistoryStore);
        for (const key of sessionKeys) {
            const summary = await get<SessionSummary>(key, sessionHistoryStore);
            if (summary) {
                history.push(summary);
            }
        }
    } catch (error) {
        console.error("Failed to get all session summaries:", error);
    }
    return history.sort((a, b) => b.startTime - a.startTime);
};

export const clearSessionHistory = async (): Promise<void> => {
    try {
        await clear(sessionHistoryStore);
        console.log("Session history cleared from IndexedDB.");
    } catch (error) {
        console.error("Failed to clear session history:", error);
    }
};

// --- Alert Feed Functions ---
export const saveAlertFeed = async (feed: AlertEvent[]): Promise<void> => {
    try {
        await set('alert-feed-history', feed, alertFeedStore);
    } catch (error) {
        console.error("Failed to save alert feed:", error);
    }
};

export const getAlertFeed = async (): Promise<AlertEvent[]> => {
    try {
        const feed = await get<AlertEvent[]>('alert-feed-history', alertFeedStore);
        return feed || [];
    } catch (error) {
        console.error("Failed to get alert feed:", error);
        return [];
    }
};

// --- Scanner Preset Functions ---
export const saveScannerPresets = async (presets: ScannerPreset[]): Promise<void> => {
    try {
        await set('scanner-presets-list', presets, scannerPresetStore);
    } catch (error) {
        console.error("Failed to save scanner presets:", error);
    }
};

export const getScannerPresets = async (): Promise<ScannerPreset[]> => {
    try {
        const presets = await get<ScannerPreset[]>('scanner-presets-list', scannerPresetStore);
        return presets || [];
    } catch (error) {
        console.error("Failed to get scanner presets:", error);
        return [];
    }
};
