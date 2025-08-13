import type { StateCreator } from 'zustand';
import type { AppState, AiSlice } from '../types';
import { analyzeChartData, generateStrategySuggestions, generateStrategyDefinition } from '../services/geminiService';
import { t } from '../i18n';

export const createAiSlice: StateCreator<AppState, [], [], AiSlice> = (set, get) => ({
  aiState: {
    analysis: '',
    isLoading: false,
    error: '',
  },
  aiCopilotSuggestions: null,
  isCopilotLoading: false,
  aiCopilotError: null,
  aiStrategyGeneratorState: {
    isLoading: false,
    generatedStrategyJson: null,
    error: null,
  },

  setAiState: (update) => {
    set((state) => ({ aiState: { ...state.aiState, ...update } }));
  },

  requestCopilotSuggestions: async (userPrompt, systemInstruction) => {
    set({ isCopilotLoading: true, aiCopilotError: null, aiCopilotSuggestions: null });
    try {
      const suggestions = await generateStrategySuggestions(userPrompt, systemInstruction);
      set({ aiCopilotSuggestions: suggestions, isCopilotLoading: false });
    } catch (err: any) {
      set({ aiCopilotError: err.message || 'copilot_error_unknown', isCopilotLoading: false });
    }
  },

  clearCopilotSuggestions: () => {
    set({ aiCopilotSuggestions: null, isCopilotLoading: false, aiCopilotError: null });
  },
  
  generateAiStrategy: async (prompt) => {
    set({ aiStrategyGeneratorState: { isLoading: true, generatedStrategyJson: null, error: null } });
    try {
        const language = get().language;
        const jsonString = await generateStrategyDefinition(prompt, language);
        // Do a basic check to see if it's valid JSON before setting
        JSON.parse(jsonString); 
        set({ aiStrategyGeneratorState: { isLoading: false, generatedStrategyJson: jsonString, error: null } });
    } catch (error: any) {
        console.error("Failed to generate or parse AI strategy:", error);
        const errorMessage = error instanceof SyntaxError ? t('error_import_invalid_json') : t('error_generate_strategy');
        set({ aiStrategyGeneratorState: { isLoading: false, generatedStrategyJson: null, error: errorMessage } });
    }
  },

  clearAiStrategyGenerator: () => {
    set({ aiStrategyGeneratorState: { isLoading: false, generatedStrategyJson: null, error: null } });
  }
});