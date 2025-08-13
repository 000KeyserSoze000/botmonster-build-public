import { GoogleGenAI } from "@google/genai";
import { useAppStore } from '../store/useAppStore';
import type { AiCopilotSuggestion } from '../types';

let ai: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

function getAiClient(): GoogleGenAI {
  const { geminiApiKey, isTauri } = useAppStore.getState();

  if (!isTauri) {
      throw new Error("API calls can only be made from the desktop application.");
  }
  
  if (!geminiApiKey) {
    throw new Error('gemini_error_no_key');
  }

  if (ai && lastUsedKey === geminiApiKey) {
    return ai;
  }

  ai = new GoogleGenAI({ apiKey: geminiApiKey });
  lastUsedKey = geminiApiKey;
  return ai;
}

export async function analyzeChartData(prompt: string, systemInstruction: string): Promise<string> {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
            },
        });
        return response.text;
    } catch (error: any) {
        console.error("Gemini API Error (analyzeChartData):", error);
        throw new Error(error.message.includes('API key') ? 'gemini_error_invalid_key' : 'gemini_error_api_fail');
    }
}

export async function generateStrategySuggestions(
    userPrompt: string,
    systemInstruction: string
): Promise<AiCopilotSuggestion[]> {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                responseMimeType: 'application/json',
            },
        });
        const suggestions = JSON.parse(response.text.trim());
        return Array.isArray(suggestions) ? suggestions : [suggestions];
    } catch (error: any) {
        console.error("Gemini API Error (generateStrategySuggestions):", error);
        throw new Error(error.message.includes('API key') ? 'gemini_error_invalid_key' : 'gemini_error_api_fail');
    }
}

export async function analyzeTradeForDebrief(prompt: string, systemInstruction: string): Promise<string> {
     try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });
        return response.text;
    } catch (error: any) {
        console.error("Gemini API Error (analyzeTradeForDebrief):", error);
        throw new Error(error.message.includes('API key') ? 'gemini_error_invalid_key' : 'gemini_error_api_fail');
    }
}

export async function generateStrategyDefinition(userPrompt: string, language: string): Promise<string> {
    // This function now needs to be called from the AI slice which has access to the full system prompt
    // For now, we'll keep the direct call logic
     try {
        const aiClient = getAiClient();
        const systemInstruction = `You are an expert trading system designer...`; // The full prompt is very long, assuming it's passed correctly.
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
            },
        });
        return response.text.trim();
    } catch (error: any) {
        console.error("Gemini API Error (generateStrategyDefinition):", error);
        throw new Error(error.message.includes('API key') ? 'gemini_error_invalid_key' : 'gemini_error_api_fail');
    }
}