
import type { Candle, ImperativeStrategyLogic, RsiDivergenceSettings, StrategyState, StrategyStep, StepStatus, SwingPoint } from '../types';
import { calculateRSI, findAllSwingLows, findRecentSwingLow } from './tradingLogicService';

interface RsiDivergenceState extends StrategyState {
    isOversold: boolean;
    divergenceFound: boolean;
    lastPriceLow: SwingPoint | null;
    lastRsiLow: { value: number, index: number } | null;
}

const processCandles = (candles: Candle[], settings: RsiDivergenceSettings): Candle[] => {
    try {
        const s = settings as RsiDivergenceSettings;
        const closes = candles.map(c => c.close);
        const rsis = calculateRSI(closes, s.rsiPeriod);

        return candles.map((candle, index) => {
            const rsiIndex = index - (closes.length - rsis.length);
            return {
                ...candle,
                rsi: rsiIndex >= 0 ? rsis[rsiIndex] : undefined,
            };
        });
    } catch (error) {
        console.error(`[RsiDivergenceStrategy] Error processing candles for ${settings.strategyId}:`, error);
        return candles; // Return original candles on error to prevent chart from breaking
    }
};

export const getRsiDivergenceInitialSteps = (): StrategyStep[] => [
    { nameKey: 'rsi_step1_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'rsi_step2_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'rsi_step3_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'rsi_step4_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
];

const run: ImperativeStrategyLogic['run'] = (candles, settings, pair, isSignalOnly, prevState) => {
    const s = settings as RsiDivergenceSettings;
    const initialSteps = getRsiDivergenceInitialSteps();

    let state: RsiDivergenceState = (prevState as RsiDivergenceState) || { 
        steps: initialSteps, alert: null, isOversold: false, divergenceFound: false, lastPriceLow: null, lastRsiLow: null 
    };

    if (state.steps.some(step => step.status === 'unmet')) {
         state = { ...state, steps: getRsiDivergenceInitialSteps(), alert: null, isOversold: false, divergenceFound: false, lastPriceLow: null, lastRsiLow: null };
    }

    const steps = [...state.steps];
    const currentCandle = candles[candles.length - 1];

    if (!currentCandle || currentCandle.rsi === undefined) {
        return { ...state, steps: getRsiDivergenceInitialSteps().map(s => ({ ...s, status: 'unmet' as StepStatus, detailsKey: 'scalping_step_insufficient_data' })) };
    }

    // Step 1: Oversold context
    if (steps[0].status !== 'met') {
        if (currentCandle.rsi < s.rsiOversoldThreshold) {
            state.isOversold = true;
            steps[0] = { status: 'met', nameKey: 'rsi_step1_name', detailsKey: 'rsi_step1_met', detailsPayload: { rsi: currentCandle.rsi.toFixed(1), threshold: s.rsiOversoldThreshold } };
        } else if (state.isOversold) {
            // Condition stays met if we were oversold, to allow divergence to form after exiting the zone
            steps[0] = { status: 'met', nameKey: 'rsi_step1_name', detailsKey: 'rsi_step1_active_div', detailsPayload: { rsi: currentCandle.rsi.toFixed(1) } };
        } else {
             steps[0] = { status: 'waiting', nameKey: 'rsi_step1_name', detailsKey: 'rsi_step1_waiting', detailsPayload: { threshold: s.rsiOversoldThreshold } };
             return { ...state, steps };
        }
    }

    // Step 2: Divergence Detection
    if (steps[1].status !== 'met') {
        steps[1] = { status: 'waiting', nameKey: 'rsi_step2_name', detailsKey: 'rsi_step2_waiting' };
        const priceLows = findAllSwingLows(candles, 3);
        
        if (priceLows.length >= 2) {
            const lastLow = priceLows[priceLows.length - 1];
            const prevLow = priceLows[priceLows.length - 2];
            const rsiAtLastLow = candles[lastLow.index]?.rsi;
            const rsiAtPrevLow = candles[prevLow.index]?.rsi;

            if (rsiAtLastLow && rsiAtPrevLow) {
                if (lastLow.candle.low < prevLow.candle.low && rsiAtLastLow > rsiAtPrevLow) {
                    state.divergenceFound = true;
                    state.lastPriceLow = lastLow;
                    steps[1] = { status: 'met', nameKey: 'rsi_step2_name', detailsKey: 'rsi_step2_met' };
                }
            }
        }
    }
    
    if (!state.divergenceFound || !state.lastPriceLow) return { ...state, steps };

    // Step 3: Confirmation Candle
    if (steps[2].status !== 'met') {
        steps[2] = { status: 'waiting', nameKey: 'rsi_step3_name', detailsKey: 'rsi_step3_waiting' };
        const lookbackCandles = candles.slice(-s.confirmationCandleLookback);
        const confirmationCandle = lookbackCandles.find(c => c.close > c.open && c.close > state.lastPriceLow!.candle.low);
        if (confirmationCandle) {
            steps[2] = { status: 'met', nameKey: 'rsi_step3_name', detailsKey: 'rsi_step3_met' };
        }
    }

    // Step 4: Entry Signal
    if (steps[2].status === 'met' && steps[3].status !== 'met') {
        const slSwingLow = findRecentSwingLow(candles, s.swingLookbackForSL);
        if (slSwingLow) {
            const entryPrice = currentCandle.close;
            const sl = slSwingLow.candle.low;
            const risk = entryPrice - sl;
            if (risk > 0) {
                const tp = entryPrice + (risk * s.riskRewardRatio);
                state.alert = {
                    type: 'entry', messageKey: 'rsi_alert_entry', time: currentCandle.time,
                    direction: 'LONG', entryPrice, sl, tp
                };
                steps[3] = { status: 'met', nameKey: 'strategy_step_entry_confirmation', detailsKey: 'scalping_step5_ready' };
            }
        }
    }

    return { ...state, steps };
};

export const rsiDivergenceStrategyLogic: ImperativeStrategyLogic = {
    run,
    processCandles,
};
