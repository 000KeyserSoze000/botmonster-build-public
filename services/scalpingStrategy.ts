import type { Candle, ImperativeStrategyLogic, ScalpingSettings, StrategyState, StrategyStep, StepStatus } from '../types';
import { calculateADX, calculateEMA, findRecentSwingLow, mapHtfEmaToLtfCandles } from './tradingLogicService';

interface ScalpingState extends StrategyState {
    inPullbackZone: boolean;
}

const processCandles = (candles: Candle[], settings: ScalpingSettings, htfCandles?: Candle[]): Candle[] => {
    try {
        const s = settings as ScalpingSettings;
        const closes = candles.map(c => c.close);
        
        const fastEmas = calculateEMA(closes, s.fastEmaPeriod);
        const slowEmas = calculateEMA(closes, s.slowEmaPeriod);
        const adxs = calculateADX(candles, s.adxPeriod);

        let candlesWithIndicators: Candle[] = candles.map((candle, index) => {
            const fastEmaIndex = index - (closes.length - fastEmas.length);
            const slowEmaIndex = index - (closes.length - slowEmas.length);
            return {
                ...candle,
                fastEma: fastEmaIndex >= 0 ? fastEmas[fastEmaIndex] : undefined,
                slowEma: slowEmaIndex >= 0 ? slowEmas[slowEmaIndex] : undefined,
                adx: adxs[index],
            };
        });

        if (s.useMtfFilter && htfCandles && htfCandles.length > 0) {
            candlesWithIndicators = mapHtfEmaToLtfCandles(candlesWithIndicators, htfCandles, s.mtfEmaPeriod);
        }
        
        return candlesWithIndicators;
    } catch (error) {
        console.error(`[ScalpingStrategy] Error processing candles for ${settings.strategyId}:`, error);
        return candles; // Return original candles on error to prevent chart from breaking
    }
};

export const getScalpingInitialSteps = (): StrategyStep[] => [
    { nameKey: 'scalping_step1_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'scalping_step2_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'scalping_step3_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'scalping_step4_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'scalping_step5_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
];

const run: ImperativeStrategyLogic['run'] = (candles, settings, pair, isSignalOnly, prevState) => {
    const s = settings as ScalpingSettings;
    const initialSteps = getScalpingInitialSteps();

    let state: ScalpingState = (prevState as ScalpingState) || { 
        steps: initialSteps, 
        alert: null,
        inPullbackZone: false,
    };

    const currentCandle = candles[candles.length - 1];
    
    if (!currentCandle || !currentCandle.fastEma || !currentCandle.slowEma || !currentCandle.adx) {
         return { ...state, steps: initialSteps.map(s => ({ ...s, status: 'unmet' as StepStatus, detailsKey: 'scalping_step_insufficient_data' })) };
    }

    // Invalidation Logic: If we were waiting for confirmation but price dumped below the slow EMA, the setup is dead.
    if (state.inPullbackZone && currentCandle.close < currentCandle.slowEma) {
        return { steps: initialSteps, alert: null, inPullbackZone: false };
    }

    // Continuously check base conditions. If any fails, reset the whole process.
    let baseConditionsMet = true;
    const steps = [...state.steps];

    // Step 1: HTF Trend Filter
    if (s.useMtfFilter) {
        if (currentCandle.htfEma && currentCandle.close > currentCandle.htfEma) {
            steps[0] = { status: 'met', nameKey: 'scalping_step1_name', detailsKey: 'scalping_step1_bullish', detailsPayload: { timeframe: s.mtfTimeframe, period: s.mtfEmaPeriod } };
        } else {
            baseConditionsMet = false;
        }
    } else {
        steps[0] = { status: 'met', nameKey: 'scalping_step1_name', detailsKey: 'scalping_step1_disabled' };
    }

    // Step 2: ADX Trend Strength
    if (baseConditionsMet && currentCandle.adx > s.adxThreshold) {
        steps[1] = { status: 'met', nameKey: 'scalping_step2_name', detailsKey: 'scalping_step2_strong', detailsPayload: { adx: currentCandle.adx.toFixed(1), threshold: s.adxThreshold } };
    } else if (baseConditionsMet) {
        baseConditionsMet = false;
    }

    // Step 3: EMA Cross
    if (baseConditionsMet && currentCandle.fastEma > currentCandle.slowEma) {
        steps[2] = { status: 'met', nameKey: 'scalping_step3_name', detailsKey: 'scalping_step3_bullish', detailsPayload: { fast: s.fastEmaPeriod, slow: s.slowEmaPeriod } };
    } else if (baseConditionsMet) {
        baseConditionsMet = false;
    }

    if (!baseConditionsMet) {
        return { steps: initialSteps, alert: null, inPullbackZone: false };
    }
    
    // --- Stateful Pullback Logic ---
    // Step 4: Detect Pullback Zone
    if (steps[3].status !== 'met') {
        steps[3] = { status: 'waiting', nameKey: 'scalping_step4_name', detailsKey: 'scalping_step4_waiting', detailsPayload: { period: s.fastEmaPeriod } };
        if (currentCandle.low <= currentCandle.fastEma) {
            state.inPullbackZone = true;
            steps[3] = { status: 'met', nameKey: 'scalping_step4_name', detailsKey: 'orderFlow_step6_waiting' };
        }
    }

    // Step 5: Entry Confirmation (only if we are in pullback zone)
    if (steps[4].status !== 'met' && state.inPullbackZone) {
        steps[4] = { status: 'waiting', nameKey: 'scalping_step5_name', detailsKey: 'orderFlow_step6_waiting' };
        const isBullishConfirmation = currentCandle.close > currentCandle.open;
        
        if (isBullishConfirmation) {
             const swingLow = findRecentSwingLow(candles.slice(0, -1), s.swingLookbackForSL);
             if (swingLow) {
                 const entryPrice = currentCandle.close;
                 const sl = swingLow.candle.low;
                 const risk = entryPrice - sl;
                 if (risk > 0) {
                     const tp = entryPrice + (risk * s.riskRewardRatio);
                     state.alert = {
                         type: 'entry', messageKey: 'scalping_alert_entry', time: currentCandle.time,
                         direction: 'LONG', entryPrice, sl, tp
                     };
                     steps[4] = { status: 'met', nameKey: 'strategy_step_entry_confirmation', detailsKey: 'scalping_step5_ready' };
                     state.inPullbackZone = false; // Reset after firing signal
                 }
             }
        }
    }
    
    return { ...state, steps };
};

export const scalpingStrategyLogic: ImperativeStrategyLogic = {
    run,
    processCandles,
};