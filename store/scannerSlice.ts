import type { StateCreator } from 'zustand';
import type { AppState, ScannerSlice, ScannerFilters, MarketData } from '../types';
import { fetch24hTickerData } from '../services/binanceService';
import { calculateEMA } from '../services/tradingLogicService';

export const createScannerSlice: StateCreator<AppState, [], [], ScannerSlice> = (set, get) => ({
  isScanning: false,
  scannerResults: [],
  scannerFilters: {
    minVolume24h: 20_000_000,
    trendTimeframes: ['1H', '4H'],
    trendDirection: 'bullish',
  },
  scannerPresets: [
    { 
      name: 'High Volume Momentum', 
      filters: { 
        minVolume24h: 20_000_000, 
        trendTimeframes: ['1H', '4H'], 
        trendDirection: 'bullish',
      } 
    },
    {
      name: 'Potential Reversals (RSI)',
      filters: {
        minVolume24h: 5_000_000,
        trendTimeframes: [],
        trendDirection: 'any',
        strategyId: 'rsi-divergence-hunter',
        strategyStep: 1, // At least in "Oversold Context"
      }
    },
    {
      name: 'SMC Setups in Progress',
      filters: {
        minVolume24h: 10_000_000,
        trendTimeframes: ['4H'],
        trendDirection: 'bullish',
        strategyId: 'order-flow-smc',
        strategyStep: 2, // At least "Trend Analysis" is met
      }
    }
  ],
  activePresetName: 'High Volume Momentum',
  isPresetManagerOpen: false,

  setScannerFilters: (filters) => {
    set(state => ({ scannerFilters: { ...state.scannerFilters, ...filters }, activePresetName: null }));
  },

  runMarketScan: async () => {
    if (get().isScanning) return;
    set({ isScanning: true, scannerResults: [] });
    try {
      const { quoteAsset, scannerFilters } = get();
      
      const rawData = await fetch24hTickerData();
      const leveragedPatterns = ['UP', 'DOWN', 'BULL', 'BEAR', '3L', '3S', '5L', '5S'];
      
      const marketData: MarketData[] = rawData
        .filter(d => 
          d.symbol.endsWith(quoteAsset) &&
          parseFloat(d.quoteVolume) > scannerFilters.minVolume24h &&
          !leveragedPatterns.some(p => d.symbol.includes(p))
        )
        .map(d => ({
          symbol: d.symbol,
          baseAsset: d.symbol.replace(quoteAsset, ''),
          quoteAsset,
          lastPrice: d.lastPrice,
          priceChangePercent: d.priceChangePercent,
          quoteVolume: d.quoteVolume,
        }));
      
      set({ scannerResults: marketData.slice(0, 50) }); // Initial result set
    } catch (e: any) {
      get().setLatestAlert({ type: 'info', messageKey: 'scanner_failed', messagePayload: { error: e.message }, time: Date.now() });
    } finally {
      set({ isScanning: false });
    }
  },

  selectPairFromScanner: (scannerResult) => {
    const pair = `${scannerResult.baseAsset}/${scannerResult.quoteAsset}`;
    get().setActivePair(pair);
  },

  saveScannerPreset: (name, filters) => {
    set(state => {
      const existingIndex = state.scannerPresets.findIndex(p => p.name === name);
      const newPresets = [...state.scannerPresets];
      if (existingIndex > -1) {
        newPresets[existingIndex] = { name, filters };
      } else {
        newPresets.push({ name, filters });
      }
      return { scannerPresets: newPresets, activePresetName: name };
    });
  },

  loadScannerPreset: (name) => {
    const preset = get().scannerPresets.find(p => p.name === name);
    if (preset) {
      set({ scannerFilters: preset.filters, activePresetName: name });
    }
  },

  deleteScannerPreset: (name) => {
    set(state => ({
      scannerPresets: state.scannerPresets.filter(p => p.name !== name),
      activePresetName: state.activePresetName === name ? null : state.activePresetName,
    }));
  },

  setActivePresetName: (name) => set({ activePresetName: name }),
  setIsPresetManagerOpen: (isOpen) => set({ isPresetManagerOpen: isOpen }),
});