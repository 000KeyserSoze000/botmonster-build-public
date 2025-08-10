
import type { Candle, ImperativeStrategyLogic, VolumeAnomalySettings, StrategyState, StrategyStep, StepStatus } from '../types';
import { calculateVolumeSMA } from './tradingLogicService';

const processCandles = (candles: Candle[], settings: VolumeAnomalySettings): Candle[] => {
    try {
        const s = settings as VolumeAnomalySettings;
        const volumeSmas = calculateVolumeSMA(candles, s.volumeSmaPeriod);

        return candles.map((candle, index) => {
            const smaIndex = index - (candles.length - volumeSmas.length);
            return {
                ...candle,
                volumeSma: smaIndex >= 0 ? volumeSmas[smaIndex] : undefined,
            };
        });
    } catch (error) {
        console.error(`[VolumeAnomalyStrategy] Error processing candles for ${settings.strategyId}:`, error);
        return candles; // Return original candles on error to prevent chart from breaking
    }
};

export const getVolumeAnomalyInitialSteps = (): StrategyStep[] => [
    { nameKey: 'volume_step1_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'volume_step2_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'volume_step3_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
];

const run: ImperativeStrategyLogic['run'] = (candles, settings, pair, isSignalOnly, prevState) => {
    const s = settings as VolumeAnomalySettings;
    const initialSteps = getVolumeAnomalyInitialSteps();

    let state: StrategyState = prevState || { steps: initialSteps, alert: null };

    if (state.steps.some(step => step.status === 'unmet')) {
         state = { ...state, steps: getVolumeAnomalyInitialSteps(), alert: null };
    }

    const steps = [...state.steps];
    const currentCandle = candles[candles.length - 1];

    if (!currentCandle || !currentCandle.volumeSma) {
        return { ...state, steps: getVolumeAnomalyInitialSteps().map(s => ({ ...s, status: 'unmet' as StepStatus, detailsKey: 'scalping_step_insufficient_data' })) };
    }

    // Step 1: Anomaly Detection
    if (steps[0].status !== 'met') {
        steps[0] = { status: 'waiting', nameKey: 'volume_step1_name', detailsKey: 'volume_step1_waiting' };
        if (currentCandle.volume > currentCandle.volumeSma * s.volumeFactor) {
            const multiplier = (currentCandle.volume / currentCandle.volumeSma).toFixed(1);
            steps[0] = { status: 'met', nameKey: 'volume_step1_name', detailsKey: 'volume_step1_met', detailsPayload: { multiplier } };
        }
    }

    // Step 2: Candle Analysis
    if (steps[0].status === 'met' && steps[1].status !== 'met') {
        if (currentCandle.close > currentCandle.open) {
            steps[1] = { status: 'met', nameKey: 'volume_step2_name', detailsKey: 'volume_step2_met' };
        } else {
            steps[1] = { status: 'unmet', nameKey: 'volume_step2_name', detailsKey: 'volume_step2_unmet' };
            return { ...state, steps };
        }
    }
    
    // Step 3: Entry Signal
    if (steps[1].status === 'met' && steps[2].status !== 'met') {
        const entryPrice = currentCandle.close;
        const sl = currentCandle.low * (1 - s.stopLossPercent / 100);
        const risk = entryPrice - sl;
        
        if (risk > 0) {
            const tp = entryPrice + (risk * s.riskRewardRatio);
            state.alert = {
                type: 'entry', messageKey: 'volume_alert_entry', time: currentCandle.time,
                direction: 'LONG', entryPrice, sl, tp
            };
            steps[2] = { status: 'met', nameKey: 'strategy_step_entry_confirmation', detailsKey: 'scalping_step5_ready' };
        } else {
             steps[2] = { status: 'unmet', nameKey: 'volume_step3_name', detailsKey: 'volume_step3_invalid_risk' };
        }
    }

    return { ...state, steps };
};

export const volumeAnomalyStrategyLogic: ImperativeStrategyLogic = {
    run,
    processCandles,
};
