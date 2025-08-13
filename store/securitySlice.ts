import type { StateCreator } from 'zustand';
import type { AppState, SecuritySlice } from '../types';
import * as secureStorage from '../services/secureStorageService';

export const createSecuritySlice: StateCreator<AppState, [], [], SecuritySlice> = (set, get) => ({
  geminiApiKey: null,
  binanceApiKey: null,
  binanceApiSecret: null,
  isTauri: false,

  checkIsTauri: () => {
    // A simple way to check if running in Tauri context
    const isTauriEnv = !!(window as any).__TAURI__;
    set({ isTauri: isTauriEnv });
  },

  setApiKeys: async (keys) => {
    if (!get().isTauri) return;
    try {
      await secureStorage.saveApiKeys(keys);
      set({
        geminiApiKey: keys.gemini,
        binanceApiKey: keys.binanceKey,
        binanceApiSecret: keys.binanceSecret,
      });
    } catch (error) {
      console.error('Failed to save API keys:', error);
      // Optionally, show an error to the user
    }
  },

  loadApiKeys: async () => {
    if (!get().isTauri) return;
    try {
      const keys = await secureStorage.loadApiKeys();
      if (keys) {
        set({
          geminiApiKey: keys.gemini,
          binanceApiKey: keys.binanceKey,
          binanceApiSecret: keys.binanceSecret,
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      // This is expected if the file doesn't exist yet
    }
  },
});
