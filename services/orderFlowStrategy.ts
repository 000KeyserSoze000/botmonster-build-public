import type { Candle, ImperativeStrategyLogic, OrderFlowSettings, StrategyState, SwingPoint, StrategyStep, StepStatus } from '../types';
import { findRecentSwingLow, detectMarketStructure, processSMCIndicators, mapHtfEmaToLtfCandles } from './tradingLogicService';

interface OrderFlowState extends StrategyState {
    targetSwingLow: SwingPoint | null;
    liquidityGrabbed: boolean;
    fvgFound: { bottom: number, top: number } | null;
    returnedToPOI: boolean;
}

// This service will pre-process candles to add SMC indicators
const processCandles = (candles: Candle[], settings: OrderFlowSettings, htfCandles?: Candle[]): Candle[] => {
    try {
        let processed = [...candles];
        
        // 1. Calculate SMC indicators first
        processed = processSMCIndicators(processed, settings);
        
        // 2. Calculate Market Structure based on the base candles
        processed = detectMarketStructure(processed, settings.swingLookback);

        // 3. Map the HTF EMA data
        if (htfCandles && htfCandles.length > 0) {
            processed = mapHtfEmaToLtfCandles(processed, htfCandles, settings.htfEmaPeriod);
        }
        
        return processed;
    } catch (error) {
        console.error(`[OrderFlowStrategy] Error processing candles for ${settings.strategyId}:`, error);
        return candles; // Return original candles on error to prevent chart from breaking
    }
};

export const getOrderFlowInitialSteps = (): StrategyStep[] => [
    { nameKey: 'orderFlow_step1_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'orderFlow_step2_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'orderFlow_step3_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'orderFlow_step4_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'orderFlow_step5_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
    { nameKey: 'orderFlow_step6_name', status: 'pending', detailsKey: 'orderFlow_step_pending_details' },
];


const run: ImperativeStrategyLogic['run'] = (candles, settings, pair, isSignalOnly, prevState, htfCandles) => {
    const s = settings as OrderFlowSettings;
    const initialSteps = getOrderFlowInitialSteps();

    let state: OrderFlowState = (prevState as OrderFlowState) || {
        steps: initialSteps,
        alert: null,
        targetSwingLow: null,
        liquidityGrabbed: false,
        fvgFound: null,
        returnedToPOI: false,
    };
    
    const currentCandle = candles[candles.length - 1];

    if (candles.length < s.htfEmaPeriod) {
        return { ...state, steps: initialSteps.map(s => ({ ...s, status: 'unmet' as StepStatus, detailsKey: 'orderFlow_step_insufficient_data' })) };
    }

    // --- NEW: Continuous HTF Trend Check as a Guard Clause ---
    const htfEma = currentCandle.htfEma;
    const isHtfTrendValid = htfEma ? currentCandle.close > htfEma : false;

    if (!isHtfTrendValid) {
        // If the primary trend condition is not met at any time, reset the entire state machine.
        // This prevents the strategy from continuing to look for a signal in an invalid context.
        return {
            steps: initialSteps,
            alert: null,
            targetSwingLow: null,
            liquidityGrabbed: false,
            fvgFound: null,
            returnedToPOI: false,
        };
    }

    // If we reach here, the HTF trend is valid.
    const steps = [...state.steps];
    steps[0] = { status: 'met', nameKey: 'orderFlow_step1_name', detailsKey: 'orderFlow_step1_details', detailsPayload: { direction: 'Bullish', priceDirection: 'above', period: s.htfEmaPeriod } };
    
    // Reset logic if a subsequent step was unmet on a previous tick
    if (steps.slice(1).some(step => step.status === 'unmet')) {
         state = { ...state, steps: [steps[0], ...initialSteps.slice(1)], targetSwingLow: null, liquidityGrabbed: false, fvgFound: null, returnedToPOI: false, alert: null };
    }


    // Step 2: Swing Low Identification
    if (steps[1].status !== 'met') {
        const swingLow = findRecentSwingLow(candles, s.swingLookback);
        if (swingLow) {
            state.targetSwingLow = swingLow;
            steps[1] = { status: 'met', nameKey: 'orderFlow_step2_name', detailsKey: 'orderFlow_step2_details', detailsPayload: { value: swingLow.candle.low.toFixed(4) } };
        } else {
            steps[1] = { status: 'waiting', nameKey: 'orderFlow_step2_name', detailsKey: 'orderFlow_step2_waiting' };
            return { ...state, steps };
        }
    }

    // Step 3: Wait for Liquidity Grab
    if (steps[2].status !== 'met') {
        if (!state.targetSwingLow) { return { ...state, steps: getOrderFlowInitialSteps(), targetSwingLow: null, liquidityGrabbed: false, fvgFound: null, returnedToPOI: false, alert: null }; }
        steps[2] = { status: 'waiting', nameKey: 'orderFlow_step3_name', detailsKey: 'orderFlow_step3_waiting', detailsPayload: { value: state.targetSwingLow.candle.low.toFixed(4) } };
        if (currentCandle.isLiquidityGrab && currentCandle.low < state.targetSwingLow.candle.low) {
            state.liquidityGrabbed = true;
            steps[2] = { status: 'met', nameKey: 'orderFlow_step3_name', detailsKey: 'orderFlow_step3_details', detailsPayload: { value: state.targetSwingLow.candle.low.toFixed(4) } };
        }
    }
    if (!state.liquidityGrabbed) return { ...state, steps };


    // Step 4: Search for Bullish FVG
    if (steps[3].status !== 'met') {
        const searchWindow = candles.slice(Math.max(0, candles.length - s.zoneSearchWindow));
        const fvg = searchWindow.reverse().find(c => c.fvgRange && c.fvgRange.direction === 'bullish' && !c.fvgRange.mitigatedTime);
        if (fvg && fvg.fvgRange) {
            state.fvgFound = { bottom: fvg.fvgRange.bottom, top: fvg.fvgRange.top };
            steps[3] = { status: 'met', nameKey: 'orderFlow_step4_name', detailsKey: 'orderFlow_step4_details', detailsPayload: { bottom: fvg.fvgRange.bottom.toFixed(4), top: fvg.fvgRange.top.toFixed(4) } };
        } else {
            steps[3] = { status: 'unmet', nameKey: 'orderFlow_step4_name', detailsKey: 'orderFlow_step4_waiting' };
            return { ...state, steps: steps, fvgFound: null, returnedToPOI: false, alert: null };
        }
    }

    // Step 5: Return to POI
    if (steps[4].status !== 'met') {
        if (!state.fvgFound) { return { ...state, steps: getOrderFlowInitialSteps(), targetSwingLow: null, liquidityGrabbed: false, fvgFound: null, returnedToPOI: false, alert: null }; }
        steps[4] = { status: 'waiting', nameKey: 'orderFlow_step5_name', detailsKey: 'orderFlow_step5_waiting', detailsPayload: { bottom: state.fvgFound.bottom.toFixed(4), top: state.fvgFound.top.toFixed(4) } };
        if (currentCandle.low <= state.fvgFound.top && currentCandle.high >= state.fvgFound.bottom) {
             state.returnedToPOI = true;
             steps[4] = { status: 'met', nameKey: 'orderFlow_step5_name', detailsKey: 'orderFlow_step5_details' };
        }
    }
    if (!state.returnedToPOI) return { ...state, steps };
    
    // Step 6: Confirmation Signal
    if (steps[5].status !== 'met') {
        steps[5] = { status: 'waiting', nameKey: 'orderFlow_step6_name', detailsKey: 'orderFlow_step6_waiting' };
        const isBullishConfirmation = currentCandle.close > currentCandle.open;
        if (isBullishConfirmation && state.targetSwingLow) {
            steps[5] = { status: 'met', nameKey: 'orderFlow_step6_name', detailsKey: 'orderFlow_step6_confirmed' };
            
            const entryPrice = currentCandle.close;
            const sl = state.targetSwingLow.candle.low;
            const risk = entryPrice - sl;
            if (risk > 0) {
                 const tp = entryPrice + (risk * s.riskRewardRatio);
                 state.alert = {
                    type: 'entry',
                    messageKey: 'orderFlow_alert_entry',
                    time: currentCandle.time,
                    direction: 'LONG',
                    entryPrice, sl, tp
                 };
            } else {
                steps[5] = { status: 'unmet', nameKey: 'orderFlow_step6_name', detailsKey: 'orderFlow_step6_invalid_risk' };
            }
        }
    }

    return state;
};

export const orderFlowStrategyLogic: ImperativeStrategyLogic = {
    run,
    processCandles,
};