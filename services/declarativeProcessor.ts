
import type { Candle, DeclarativeStrategyLogic, StrategySettings, Condition, StrategyState, StrategyStep, StepStatus, Alert } from '../types';
import { 
    processSMCIndicators, 
    calculateEMA, 
    calculateADX, 
    calculateVolumeSMA, 
    calculateRSI, 
    mapHtfEmaToLtfCandles,
    findRecentSwingLow,
    calculateMACD,
    calculateATR,
    calculateBollingerBands,
    calculateStochastic,
    calculateIchimokuCloud,
    calculateSupertrend,
    calculateVWAP,
    calculateOBV,
} from './tradingLogicService';

export const processCandlesForDeclarativeStrategy = (
    candles: Candle[],
    logic: DeclarativeStrategyLogic,
    settings: StrategySettings,
    htfCandles?: Candle[]
): Candle[] => {
    try {
        if (!logic || !Array.isArray(logic.indicatorsToProcess)) {
            console.warn("[Declarative Processor] Attempted to process candles with malformed logic. indicatorsToProcess is missing or not an array.", logic);
            return candles;
        }

        let processedCandles = [...candles];
        const closes = processedCandles.map(c => c.close);

        if (logic.indicatorsToProcess.includes('EMA')) {
            const fastEmas = calculateEMA(closes, (settings as any).fastEmaPeriod);
            const slowEmas = calculateEMA(closes, (settings as any).slowEmaPeriod);
            processedCandles = processedCandles.map((c, i) => ({
                ...c,
                fastEma: fastEmas[i - (closes.length - fastEmas.length)],
                slowEma: slowEmas[i - (closes.length - slowEmas.length)],
            }));
        }

        if (logic.indicatorsToProcess.includes('HTF_EMA') && htfCandles) {
            processedCandles = mapHtfEmaToLtfCandles(processedCandles, htfCandles, (settings as any).htfEmaPeriod);
        }

        if (logic.indicatorsToProcess.includes('ADX')) {
            const adxs = calculateADX(processedCandles, (settings as any).adxPeriod);
            processedCandles = processedCandles.map((c, i) => ({ ...c, adx: adxs[i] }));
        }
        
        if (logic.indicatorsToProcess.includes('RSI')) {
            const rsis = calculateRSI(closes, (settings as any).rsiPeriod);
            processedCandles = processedCandles.map((c, i) => ({ ...c, rsi: rsis[i - (closes.length - rsis.length)] }));
        }

        if (logic.indicatorsToProcess.includes('SMC')) {
            processedCandles = processSMCIndicators(processedCandles, settings as any);
        }
        
        if (logic.indicatorsToProcess.includes('MACD')) {
            const macds = calculateMACD(closes, (settings as any).macdFastPeriod, (settings as any).macdSlowPeriod, (settings as any).macdSignalPeriod);
            const offset = processedCandles.length - macds.length;
            processedCandles = processedCandles.map((c, i) => ({ ...c, macd: i >= offset ? macds[i - offset] : undefined }));
        }
        
        if (logic.indicatorsToProcess.includes('ATR')) {
            const atrs = calculateATR(processedCandles, (settings as any).atrPeriod);
            const offset = processedCandles.length - atrs.length;
            processedCandles = processedCandles.map((c, i) => ({ ...c, atr: i >= offset ? atrs[i - offset] : undefined }));
        }

        return processedCandles;
    } catch (error) {
        console.error(`[Declarative Processor] Error processing candles:`, error);
        return candles;
    }
};

const checkCondition = (condition: Condition, candle: Candle, settings: StrategySettings): boolean => {
    const params = condition.params_ref ?
        Object.entries(condition.params_ref).reduce((acc, [key, value]) => {
            acc[key] = (settings as any)[value!];
            return acc;
        }, {} as Record<string, any>)
        : {};

    switch (condition.type) {
        case 'bullish_candle':
            return candle.close > candle.open;
        case 'ema_cross_bullish':
            return candle.fastEma !== undefined && candle.slowEma !== undefined && candle.fastEma > candle.slowEma;
        case 'pullback_to_fast_ema':
            return candle.fastEma !== undefined && candle.low <= candle.fastEma && candle.close > candle.fastEma;
        case 'trend_up':
            return candle.htfEma !== undefined && candle.close > candle.htfEma;
        case 'adx_strong':
            return candle.adx !== undefined && candle.adx > params.threshold;
        case 'rsi_oversold':
            return candle.rsi !== undefined && candle.rsi < params.threshold;
        case 'liquidity_grab_low':
            return !!candle.isLiquidityGrab && candle.grabType === 'low';
        case 'price_in_bullish_fvg':
            return !!candle.fvgRange && candle.fvgRange.direction === 'bullish' && candle.low <= candle.fvgRange.top && candle.high >= candle.fvgRange.bottom;
        case 'macd_cross_up':
            return candle.macd !== undefined && candle.macd.macd > candle.macd.signal && candle.macd.histogram > 0;
        default:
            return false;
    }
};

export const runDeclarativeStrategy = (
    candles: Candle[],
    logic: DeclarativeStrategyLogic,
    settings: StrategySettings,
    prevState?: StrategyState,
): StrategyState => {
    const currentCandle = candles[candles.length - 1];
    const getInitialSteps = () => logic.steps.map(step => ({
        name: step.name,
        nameKey: step.nameKey,
        status: 'pending' as StepStatus,
        details: step.conditions[0]?.details,
        detailsKey: step.conditions[0]?.detailsKey,
        detailsPayload: step.conditions[0]?.detailsPayload,
    }));

    let state: StrategyState = prevState || {
        steps: getInitialSteps(),
        alert: null,
    };

    if (state.steps.some(step => step.status === 'unmet')) {
        state = { ...state, steps: getInitialSteps(), alert: null };
    }

    let allPreviousStepsMet = true;
    const newSteps: StrategyStep[] = [];

    for (let i = 0; i < logic.steps.length; i++) {
        const stepLogic = logic.steps[i];
        const currentStepState = state.steps[i] ? { ...state.steps[i] } : getInitialSteps()[i];
        
        if (!allPreviousStepsMet) {
            newSteps.push(currentStepState);
            continue;
        }

        const conditionsMet = stepLogic.conditions.every(cond => checkCondition(cond, currentCandle, settings));

        if (conditionsMet) {
            currentStepState.status = 'met';
        } else {
            currentStepState.status = 'waiting';
            allPreviousStepsMet = false;
        }
        newSteps.push(currentStepState);
    }
    
    let alert: Alert | null = null;
    const allStepsMet = newSteps.every(s => s.status === 'met');

    if (allStepsMet && !state.signalFired) {
        const entryPrice = currentCandle.close;
        let sl = 0;
        let tp = 0;

        const slConfig = logic.exitLogic.stopLoss;
        if (slConfig.type === 'fixed_percent') {
            const percent = (settings as any)[slConfig.params_ref.percent!];
            sl = entryPrice * (1 - percent / 100);
        } else if (slConfig.type === 'swing_low') {
            const lookback = (settings as any)[slConfig.params_ref.lookback!];
            const swingLow = findRecentSwingLow(candles.slice(0, -1), lookback);
            sl = swingLow ? swingLow.candle.low : entryPrice * 0.99;
        }

        const tpConfig = logic.exitLogic.takeProfit;
        const risk = entryPrice - sl;
        if (tpConfig.type === 'rr_ratio' && risk > 0) {
            const ratio = (settings as any)[tpConfig.params_ref.ratio!];
            tp = entryPrice + (risk * ratio);
        }

        if (sl > 0 && tp > 0 && risk > 0) {
            alert = {
                type: 'entry',
                messageKey: 'scalping_step5_ready',
                time: currentCandle.time,
                direction: 'LONG',
                entryPrice,
                sl,
                tp,
            };
            state.signalFired = true;
        }
    }
    
    return { ...state, steps: newSteps, alert };
};