import { GoogleGenAI } from "@google/genai";
import type { AiCopilotSuggestion, StrategyDefinition } from '../types';

// This is a Vercel Edge Function, which runs securely on the server.
// It acts as a secure proxy to the Gemini API.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // 1. Check for the API key on the server-side.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'gemini_error_no_key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Ensure it's a POST request.
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { action, payload } = await request.json();
    const ai = new GoogleGenAI({ apiKey });

    let geminiResponse;

    // 3. Use a switch to handle different types of requests from the frontend.
    switch (action) {
      case 'generateContent':
      case 'debriefTrade':
        geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: payload.prompt,
          config: {
            systemInstruction: payload.systemInstruction,
            temperature: action === 'debriefTrade' ? 0.5 : 0.6,
          },
        });
        return new Response(JSON.stringify({ data: geminiResponse.text }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'generateSuggestions':
        geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: payload.userPrompt,
          config: {
            systemInstruction: payload.systemInstruction,
            temperature: 0.8,
            responseMimeType: 'application/json',
          },
        });
        // The Gemini API returns a stringified JSON, so we parse it before sending it back.
        const suggestionData = JSON.parse(geminiResponse.text.trim());
        return new Response(JSON.stringify({ data: suggestionData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    case 'generateStrategyDefinition':
        const systemInstruction = `You are an expert trading system designer. Your task is to generate a complete JSON object based on the user's request that strictly follows the structure of the TypeScript 'StrategyDefinition' and 'DeclarativeStrategyLogic' interfaces. The generated strategy MUST be of the 'declarative' type.
The JSON output must be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks. You must generate the response text in the user's language: ${payload.language}.

Here are the required interfaces:
\`\`\`typescript
interface StrategyDefinition {
  id: string; // unique kebab-case identifier, in english
  name: string; // The user-facing name of the strategy, in the user's language
  description: string; // A multi-line description of the strategy, in the user's language, using markdown for formatting (e.g. "### Step 1\n- Condition A...").
  chartRenderer: 'lightweight'; // Must be 'lightweight'
  logic: DeclarativeStrategyLogic;
  defaultSettings: object; // An object containing key-value pairs for all settings
  settingsConfig: SettingConfig[];
  indicatorConfig: IndicatorConfig[];
}

interface DeclarativeStrategyLogic {
    indicatorsToProcess: ('SMC' | 'EMA' | 'ADX' | 'RSI' | 'HTF_EMA' | 'MACD' | 'ATR' | 'BollingerBands' | 'Stochastic' | 'Ichimoku' | 'Supertrend' | 'VWAP' | 'OBV')[];
    steps: { name: string; conditions: Condition[]; }[];
    exitLogic: { stopLoss: { type: string; params_ref: { [key: string]: string }; }; takeProfit: { type: string; params_ref: { [key: string]: string }; }; };
}

interface Condition {
    type: string;
    params_ref?: { [key: string]: string };
    details: string; // CRITICAL: A user-facing description of what this condition is waiting for, in the user's language.
    detailsPayload?: { [key: string]: string }; // For dynamic values like thresholds.
}

interface SettingConfig { id: string; label: string; type: 'number' | 'toggle'; helpText: string; step?: number; min?: number; max?: number; suffix?: string; }
interface IndicatorConfig { id: string; label: string; }
\`\`\`

**Indicator Requirements & Available Conditions:**
For the strategy to function, every indicator mentioned in \`indicatorsToProcess\` MUST have its corresponding parameters defined in \`defaultSettings\` and \`settingsConfig\`, and its visual toggle in \`indicatorConfig\`. For EVERY condition, you MUST provide a meaningful 'details' string. Follow these rules STRICTLY:

- If using 'EMA':
  - Condition types: \`ema_cross_bullish\`, \`pullback_to_fast_ema\`.
  - \`defaultSettings\` must include \`fastEmaPeriod: number\`, \`slowEmaPeriod: number\`.
  - \`settingsConfig\` must have entries for \`fastEmaPeriod\`, \`slowEmaPeriod\`.
  - \`indicatorConfig\` must include \`{ id: 'showFastEma', ... }\` and \`{ id: 'showSlowEma', ... }\`.
  - Example Condition: \`{ "type": "ema_cross_bullish", "details": "Waiting for EMA {{fast}} to cross above EMA {{slow}}", "detailsPayload": { "fast": "fastEmaPeriod", "slow": "slowEmaPeriod" } }\`

- If using 'HTF_EMA':
  - Condition type: \`trend_up\`.
  - \`defaultSettings\` needs \`htfEmaPeriod: number\`.
  - \`settingsConfig\` needs an entry for \`htfEmaPeriod\`.
  - \`indicatorConfig\` needs \`{ id: 'showFastEma', label: 'Trend EMA' }\` (Uses 'showFastEma' intentionally).
  - Example Condition: \`{ "type": "trend_up", "details": "Waiting for price to be above HTF EMA ({{period}})", "detailsPayload": { "period": "htfEmaPeriod" } }\`

- If using 'ADX':
  - Condition type: 'adx_strong'. This REQUIRES: \`params_ref: { "threshold": "adxThreshold" }\`.
  - \`defaultSettings\` needs \`adxPeriod: number\`, \`adxThreshold: number\`.
  - \`settingsConfig\` needs entries for both.
  - No \`indicatorConfig\` needed.
  - Example Condition: \`{ "type": "adx_strong", "params_ref": { "threshold": "adxThreshold" }, "details": "Waiting for ADX to be above {{threshold}}", "detailsPayload": { "threshold": "adxThreshold" } }\`

- If using 'RSI':
  - Condition types: 'rsi_oversold' (requires \`params_ref: { "threshold": "rsiOversoldThreshold" }\`), 'rsi_overbought' (requires \`params_ref: { "threshold": "rsiOverboughtThreshold" }\`).
  - \`defaultSettings\` needs \`rsiPeriod: number\`, \`rsiOversoldThreshold: number\`, \`rsiOverboughtThreshold: number\`.
  - \`settingsConfig\` needs entries for all three.
  - \`indicatorConfig\` needs \`{ id: 'showRsi', ... }\`.
  - Example Condition: \`{ "type": "rsi_oversold", "params_ref": { "threshold": "rsiOversoldThreshold" }, "details": "Waiting for RSI to be oversold (< {{threshold}})", "detailsPayload": { "threshold": "rsiOversoldThreshold" } }\`

- If using 'MACD':
  - Condition types: 'macd_cross_up', 'macd_cross_down'.
  - \`defaultSettings\` needs \`macdFastPeriod: number\`, \`macdSlowPeriod: number\`, \`macdSignalPeriod: number\`.
  - \`settingsConfig\` needs entries for all three.
  - \`indicatorConfig\` needs \`{ id: 'showMacd', ... }\`.
  - Example Condition: \`{ "type": "macd_cross_up", "details": "Waiting for MACD line to cross above signal line" }\`
  
- If using 'SMC':
  - Condition types: 'liquidity_grab_low', 'price_in_bullish_fvg'.
  - \`defaultSettings\` needs \`swingLookback: number\`.
  - \`settingsConfig\` needs an entry for \`swingLookback\`.
  - \`indicatorConfig\` needs: \`{ id: 'showFVG', ... }\`, \`{ id: 'showSwings', ... }\`.
  - Example Condition: \`{ "type": "liquidity_grab_low", "details": "Waiting for a liquidity grab below a recent low" }\`

- If using 'ATR' for exits:
    - You must add 'ATR' to \`indicatorsToProcess\`.
    - \`defaultSettings\` must include \`atrPeriod: number\`, and multipliers like \`atrMultiplierSL: number\` or \`atrMultiplierTP: number\`.
    - \`settingsConfig\` must include entries for all these ATR parameters.
    - \`indicatorConfig\` must include \`{ id: 'showAtr', ... }\`.

- General condition types: 'bullish_candle' (Example: \`{ "type": "bullish_candle", "details": "Waiting for a bullish confirmation candle" }\`).

**Exit Logic Rules:**
The \`exitLogic\` object is mandatory. You can only use the following types:
- \`stopLoss\`:
    - type \`'swing_low'\`: Requires \`params_ref: { "lookback": "someLookbackPeriod" }\`. You must add the corresponding lookback parameter to \`defaultSettings\` and \`settingsConfig\`.
    - type \`'atr'\`: Requires \`params_ref: { "multiplier": "atrMultiplierSL" }\`. You must add \`atrPeriod\` and \`atrMultiplierSL\` to \`defaultSettings\` and \`settingsConfig\`, and add 'ATR' to \`indicatorsToProcess\`.
    - type \`'fixed_percent'\`: Requires \`params_ref: { "percent": "stopLossPercent" }\`. You must add \`stopLossPercent\` to \`defaultSettings\` and \`settingsConfig\`.
- \`takeProfit\`:
    - type \`'rr_ratio'\`: Requires \`params_ref: { "ratio": "riskRewardRatio" }\`. You must add \`riskRewardRatio\` to \`defaultSettings\` and \`settingsConfig\`.
    - type \`'atr'\`: Requires \`params_ref: { "multiplier": "atrMultiplierTP" }\`. You must add \`atrPeriod\` and \`atrMultiplierTP\` to \`defaultSettings\` and \`settingsConfig\`, and add 'ATR' to \`indicatorsToProcess\`.

**Key rules to follow:**
- The strategy must be for LONG positions only.
- The 'id' must be a unique, descriptive, kebab-case string based on the user's prompt, and must be in English.
- Use 'name', 'description', 'label', etc. fields directly with text in the user's language. Do not use '...Key' fields.
- 'defaultSettings' must include a 'strategyId' key that matches the top-level 'id'.
- For every indicator in \`indicatorsToProcess\` and every parameter referenced in a condition's \`params_ref\` or \`exitLogic\`'s \`params_ref\`, ensure the corresponding settings exist in \`defaultSettings\`, \`settingsConfig\`, and \`indicatorConfig\` by following the **Indicator Requirements** section above. This is the most important rule.
- Do not include 'run' or 'processCandles' functions in the 'logic' object.`;

        geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: payload.userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
            },
        });
        
        // We expect the response to be a JSON string, which we will pass directly to the client.
        return new Response(JSON.stringify({ data: geminiResponse.text.trim() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error("Error in Vercel Gemini function:", error);
    let errorMessage = 'gemini_error_api_fail';
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
      errorMessage = 'gemini_error_invalid_key';
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
