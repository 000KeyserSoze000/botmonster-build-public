import type { StrategyDefinition, DeclarativeStrategyLogic, StrategyStep, OrderFlowSettings, ScalpingSettings, VolumeAnomalySettings, RsiDivergenceSettings, TestSettings } from '../types';
import * as db from './databaseService';
import { orderFlowStrategyLogic, getOrderFlowInitialSteps } from './orderFlowStrategy';
import { scalpingStrategyLogic, getScalpingInitialSteps } from './scalpingStrategy';
import { volumeAnomalyStrategyLogic, getVolumeAnomalyInitialSteps } from './volumeAnomalyStrategy';
import { rsiDivergenceStrategyLogic, getRsiDivergenceInitialSteps } from './rsiDivergenceStrategy';

const orderFlowSmc: StrategyDefinition = {
  id: "order-flow-smc",
  nameKey: "strategy_order-flow-smc_name",
  descriptionKey: "strategy_order-flow-smc_desc",
  logic: orderFlowStrategyLogic,
  getInitialSteps: getOrderFlowInitialSteps,
  defaultSettings: {
    strategyId: "order-flow-smc",
    enabled: true,
    htfEmaPeriod: 50,
    swingLookback: 10,
    zoneSearchWindow: 20,
    riskRewardRatio: 2.0,
    trailingStop: 0.5,
    mtfTimeframe: "4H"
  } as OrderFlowSettings,
  settingsConfig: [
    { id: "enabled", labelKey: "setting_label_enabled", type: "toggle", helpTextKey: "setting_help_enabled" },
    { id: "riskRewardRatio", labelKey: "setting_label_riskRewardRatio", type: "number", helpTextKey: "setting_help_riskRewardRatio", step: 0.1, min: 0.5 },
    { id: "trailingStop", labelKey: "setting_label_trailingStop", type: "number", helpTextKey: "setting_help_trailingStop", "suffix": "%", "step": 0.1, min: 0 },
    { id: "htfEmaPeriod", labelKey: "setting_label_htfEmaPeriod", type: "number", helpTextKey: "setting_help_htfEmaPeriod" },
    { id: "swingLookback", labelKey: "setting_label_swingLookback", type: "number", helpTextKey: "setting_help_swingLookback" },
    { id: "zoneSearchWindow", labelKey: "setting_label_zoneSearchWindow", type: "number", helpTextKey: "setting_help_zoneSearchWindow" }
  ],
  indicatorConfig: [
      { id: "showFVG", labelKey: "indicator_label_showFVG" },
      { id: "showOB", labelKey: "indicator_label_showOB" },
      { id: "showSwings", labelKey: "indicator_label_showSwings" },
      { id: "showLiquidityGrabs", labelKey: "indicator_label_showLiquidityGrabs" },
      { id: "showFastEma", labelKey: "indicator_label_showFastEma" },
      { id: "showVolumeProfile", labelKey: "indicator_label_showVolumeProfile" }
  ],
  chartRenderer: "lightweight"
};

const scalpingEmaCross: StrategyDefinition = {
  id: "scalping-ema-cross",
  nameKey: "strategy_scalping-ema-cross_name",
  descriptionKey: "strategy_scalping-ema-cross_desc",
  logic: scalpingStrategyLogic,
  getInitialSteps: getScalpingInitialSteps,
  defaultSettings: {
    strategyId: "scalping-ema-cross",
    enabled: true,
    fastEmaPeriod: 9,
    slowEmaPeriod: 21,
    trailingStop: 1,
    adxPeriod: 14,
    adxThreshold: 25,
    useMtfFilter: true,
    mtfTimeframe: "1H",
    mtfEmaPeriod: 50,
    riskRewardRatio: 1.5,
    swingLookbackForSL: 5
  } as ScalpingSettings,
  settingsConfig: [
    { id: "enabled", labelKey: "setting_label_enabled", type: "toggle", helpTextKey: "setting_help_enabled" },
    { id: "riskRewardRatio", labelKey: "setting_label_riskRewardRatio", type: "number", helpTextKey: "setting_help_riskRewardRatio", step: 0.1, min: 0.5 },
    { id: "useMtfFilter", labelKey: "setting_label_useMtfFilter", type: "toggle", helpTextKey: "setting_help_useMtfFilter" },
    { id: "mtfEmaPeriod", labelKey: "setting_label_mtfEmaPeriod", type: "number", helpTextKey: "setting_help_mtfEmaPeriod" },
    { id: "trailingStop", labelKey: "setting_label_trailingStop", type: "number", helpTextKey: "setting_help_trailingStop", "suffix": "%", "step": 0.1, min: 0 },
    { id: "fastEmaPeriod", labelKey: "setting_label_fastEmaPeriod", type: "number", helpTextKey: "setting_help_fastEmaPeriod" },
    { id: "slowEmaPeriod", labelKey: "setting_label_slowEmaPeriod", type: "number", helpTextKey: "setting_help_slowEmaPeriod" },
    { id: "adxPeriod", labelKey: "setting_label_adxPeriod", type: "number", helpTextKey: "setting_help_adxPeriod" },
    { id: "adxThreshold", labelKey: "setting_label_adxThreshold", type: "number", helpTextKey: "setting_help_adxThreshold" }
  ],
  indicatorConfig: [
      { id: "showFastEma", labelKey: "indicator_label_showFastEma" },
      { id: "showSlowEma", labelKey: "indicator_label_showSlowEma" },
      { id: "showPivots", labelKey: "indicator_label_showPivots" }
  ],
  chartRenderer: "lightweight"
};

const volumeAnomalyScalper: StrategyDefinition = {
  id: "volume-anomaly-scalper",
  nameKey: "strategy_volume-anomaly-scalper_name",
  descriptionKey: "strategy_volume-anomaly-scalper_desc",
  logic: volumeAnomalyStrategyLogic,
  getInitialSteps: getVolumeAnomalyInitialSteps,
  defaultSettings: {
    strategyId: "volume-anomaly-scalper",
    enabled: true,
    volumeSmaPeriod: 20,
    volumeFactor: 5,
    riskRewardRatio: 2.0,
    stopLossPercent: 0.1
  } as VolumeAnomalySettings,
  settingsConfig: [
    { id: "enabled", labelKey: "setting_label_enabled", type: "toggle", helpTextKey: "setting_help_enabled"},
    { id: "volumeSmaPeriod", labelKey: "setting_label_volumeSmaPeriod", type: "number", helpTextKey: "setting_help_volumeSmaPeriod"},
    { id: "volumeFactor", labelKey: "setting_label_volumeFactor", type: "number", helpTextKey: "setting_help_volumeFactor", step: 0.5, min: 1},
    { id: "riskRewardRatio", labelKey: "setting_label_riskRewardRatio", type: "number", helpTextKey: "setting_help_riskRewardRatio", step: 0.1, min: 0.5}
  ],
  indicatorConfig: [
      { id: "showVolumeAnomaly", labelKey: "indicator_label_showVolumeAnomaly" },
      { id: "showPivots", labelKey: "indicator_label_showPivots" }
  ],
  chartRenderer: "lightweight"
};

const rsiDivergenceHunter: StrategyDefinition = {
  id: "rsi-divergence-hunter",
  nameKey: "strategy_rsi-divergence-hunter_name",
  descriptionKey: "strategy_rsi-divergence-hunter_desc",
  logic: rsiDivergenceStrategyLogic,
  getInitialSteps: getRsiDivergenceInitialSteps,
  defaultSettings: {
    strategyId: "rsi-divergence-hunter",
    enabled: true,
    rsiPeriod: 14,
    rsiOversoldThreshold: 35,
    confirmationCandleLookback: 5,
    riskRewardRatio: 2.0,
    swingLookbackForSL: 5
  } as RsiDivergenceSettings,
  settingsConfig: [
    { id: "enabled", labelKey: "setting_label_enabled", type: "toggle", helpTextKey: "setting_help_enabled" },
    { id: "riskRewardRatio", labelKey: "setting_label_riskRewardRatio", type: "number", helpTextKey: "setting_help_riskRewardRatio", step: 0.1, min: 0.5 },
    { id: "rsiPeriod", labelKey: "setting_label_rsiPeriod", type: "number", helpTextKey: "setting_help_rsiPeriod" },
    { id: "rsiOversoldThreshold", labelKey: "setting_label_rsiOversoldThreshold", type: "number", helpTextKey: "setting_help_rsiOversoldThreshold" },
    { id: "confirmationCandleLookback", labelKey: "setting_label_confirmationCandleLookback", type: "number", helpTextKey: "setting_help_confirmationCandleLookback" },
    { id: "swingLookbackForSL", labelKey: "setting_label_swingLookback", type: "number", helpTextKey: "setting_help_swingLookback" }
  ],
  indicatorConfig: [
      { id: "showRsi", labelKey: "indicator_label_showRsi" },
      { id: "showDivergence", labelKey: "indicator_label_showDivergence" }
  ],
  chartRenderer: "lightweight"
};

const testStrategy: StrategyDefinition = {
  id: "test-strategy",
  name: "Test Strategy",
  description: "A simple test strategy that enters on any bullish candle. Useful for testing trade execution.",
  logic: {
    indicatorsToProcess: [],
    steps: [
      {
        name: 'Bullish Candle',
        conditions: [{ type: 'bullish_candle', details: "Waiting for a candle's close to be higher than its open." }]
      }
    ],
    exitLogic: {
      stopLoss: {
        type: 'fixed_percent',
        params_ref: { percent: 'stopLossPercent' }
      },
      takeProfit: {
        type: 'rr_ratio',
        params_ref: { ratio: 'riskRewardRatio' }
      }
    }
  } as DeclarativeStrategyLogic,
  getInitialSteps: () => [{ name: 'Bullish Candle', status: 'pending', details: 'Waiting for data...' }],
  defaultSettings: {
    strategyId: "test-strategy",
    enabled: true,
    stopLossPercent: 1.0,
    riskRewardRatio: 1.5,
  } as TestSettings,
  settingsConfig: [
    { id: "enabled", label: "Enable Strategy", type: "toggle", helpText: "" },
    { id: "stopLossPercent", label: "Stop Loss Percent", type: "number", helpText: "The fixed percentage below the entry price to set the Stop Loss.", step: 0.1, min: 0.1, suffix: "%" },
    { id: "riskRewardRatio", label: "Risk/Reward Ratio", type: "number", helpText: "The R:R ratio to determine the Take Profit.", step: 0.1, min: 0.1 },
  ],
  indicatorConfig: [],
  chartRenderer: "lightweight"
};

export const loadStrategies = async (): Promise<Map<string, StrategyDefinition>> => {
    const builtInStrategies: StrategyDefinition[] = [
        orderFlowSmc,
        scalpingEmaCross,
        volumeAnomalyScalper,
        rsiDivergenceHunter,
        testStrategy,
    ];

    const strategyMap = new Map<string, StrategyDefinition>();

    builtInStrategies.forEach(s => {
        strategyMap.set(s.id, s);
    });

    try {
        const importedStrategies = await db.getImportedStrategies();
        importedStrategies.forEach(s => {
            console.log(`Loading imported strategy: ${s.name || s.nameKey}`);
            // This shim ensures that declarative strategies (like those from the AI)
            // have a function to generate their initial step states for the UI and engine.
            // FIX: Added robust checks to prevent crashes if `s.logic` or `s.logic.steps` is malformed from the database.
            if (s.logic && typeof s.logic === 'object' && 'steps' in s.logic && Array.isArray((s.logic as any).steps) && !s.getInitialSteps) {
                s.getInitialSteps = () => (s.logic as DeclarativeStrategyLogic).steps.map((step: any) => ({
                    // FIX: This now correctly handles both `name` (from AI strategies) and `nameKey` properties
                    // and uses optional chaining to prevent crashes if a step object is null or malformed.
                    name: step?.name,
                    nameKey: step?.nameKey, 
                    status: 'pending', 
                    detailsKey: 'orderFlow_step_pending_details'
                }));
            }
            strategyMap.set(s.id, s);
        });
    } catch (error) {
        console.error("Failed to load imported strategies from DB:", error);
    }

    return strategyMap;
};