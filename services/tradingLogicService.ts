import type { Candle, PivotPoints, SwingPoint } from '../types';

export const calculateEMA = (prices: number[], period: number): number[] => {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  emaArray.push(sum / period);
  for (let i = period; i < prices.length; i++) {
    const emaIndex = i - period;
    emaArray[emaIndex+1] = (prices[i] * k) + (emaArray[emaIndex] * (1 - k));
  }
  return emaArray;
};

export const mapHtfEmaToLtfCandles = (ltfCandles: Candle[], htfCandles: Candle[], emaPeriod: number): Candle[] => {
    if (htfCandles.length < emaPeriod || ltfCandles.length === 0) return ltfCandles;

    const htfCloses = htfCandles.map(c => c.close);
    const htfEmas = calculateEMA(htfCloses, emaPeriod);
    const emaStartIndex = htfCandles.length - htfEmas.length;

    const htfCandlesWithEma = htfCandles.map((candle, index) => {
        const emaIndex = index - emaStartIndex;
        return {
            ...candle,
            htfEma: emaIndex >= 0 ? htfEmas[emaIndex] : undefined,
        };
    });

    return ltfCandles.map(ltfCandle => {
        // Find the latest HTF candle that is NOT in the future
        const relevantHtfCandle = [...htfCandlesWithEma].reverse().find(htf => htf.time <= ltfCandle.time);
        return {
            ...ltfCandle,
            htfEma: relevantHtfCandle?.htfEma,
        };
    });
};

export const calculateRSI = (prices: number[], period: number): number[] => {
    if (prices.length <= period) return [];

    const rsi: number[] = [];
    const changes = prices.slice(1).map((price, i) => price - prices[i]);

    let initialGain = 0;
    let initialLoss = 0;

    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) {
            initialGain += changes[i];
        } else {
            initialLoss += Math.abs(changes[i]);
        }
    }

    let avgGain = initialGain / period;
    let avgLoss = initialLoss / period;
    
    if (avgLoss === 0) {
        rsi.push(100);
    } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }

    for (let i = period; i < changes.length; i++) {
        const change = changes[i];
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

        if (avgLoss === 0) {
            rsi.push(100);
        } else {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }

    return rsi;
};


export const calculateVolumeSMA = (candles: Candle[], period: number): number[] => {
  if (candles.length < period) return [];
  const smaArray: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].volume;
  }
  smaArray.push(sum / period);

  for (let i = period; i < candles.length; i++) {
    sum = sum - candles[i - period].volume + candles[i].volume;
    smaArray.push(sum / period);
  }
  return smaArray;
};

export const calculateADX = (candles: Candle[], period: number): (number | undefined)[] => {
    if (candles.length < period * 2) return [];

    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];

    for (let i = 1; i < candles.length; i++) {
        const current = candles[i];
        const prev = candles[i - 1];

        const tr = Math.max(current.high - current.low, Math.abs(current.high - prev.close), Math.abs(current.low - prev.close));
        trueRanges.push(tr);

        const upMove = current.high - prev.high;
        const downMove = prev.low - current.low;

        plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    
    const rma = (data: number[], length: number) => {
        const result: number[] = [];
        if (data.length < length) return result;
        
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += data[i];
        }
        result.push(sum / length);

        for (let i = length; i < data.length; i++) {
            const prevRma = result[result.length - 1];
            result.push((prevRma * (length - 1) + data[i]) / length);
        }
        return result;
    }
    
    if (trueRanges.length < period) return [];

    const smoothedTRs = rma(trueRanges, period);
    const smoothedPlusDMs = rma(plusDMs, period);
    const smoothedMinusDMs = rma(minusDMs, period);

    const plusDIs: number[] = [];
    const minusDIs: number[] = [];

    for (let i = 0; i < smoothedTRs.length; i++) {
        plusDIs.push(smoothedTRs[i] !== 0 ? (smoothedPlusDMs[i] / smoothedTRs[i]) * 100 : 0);
        minusDIs.push(smoothedTRs[i] !== 0 ? (smoothedMinusDMs[i] / smoothedTRs[i]) * 100 : 0);
    }
    
    const dxs: number[] = [];
    for (let i = 0; i < plusDIs.length; i++) {
        const sum = plusDIs[i] + minusDIs[i];
        dxs.push(sum !== 0 ? (Math.abs(plusDIs[i] - minusDIs[i]) / sum) * 100 : 0);
    }

    if (dxs.length < period) return [];

    const adxs = rma(dxs, period);
    
    const offset = candles.length - adxs.length;
    
    const finalAdxs: (number | undefined)[] = Array(offset).fill(undefined);
    finalAdxs.push(...adxs);
    
    return finalAdxs;
};

export const findRecentSwingLow = (candles: Candle[], lookback: number): SwingPoint | null => {
    const searchSlice = candles.slice(0, -1);
    for (let i = searchSlice.length - lookback - 1; i >= lookback; i--) {
        const potentialSwing = searchSlice[i];
        let isSwingLow = true;
        for (let j = 1; j <= lookback; j++) {
            if (searchSlice[i - j] === undefined || searchSlice[i + j] === undefined) {
                 isSwingLow = false;
                 break;
            }
            if (potentialSwing.low >= searchSlice[i - j].low || potentialSwing.low >= searchSlice[i + j].low) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow) {
            return { candle: potentialSwing, index: i };
        }
    }
    return null;
}

export const findRecentSwingHigh = (candles: Candle[], lookback: number): SwingPoint | null => {
    const searchSlice = candles.slice(0, -1);
    for (let i = searchSlice.length - lookback - 1; i >= lookback; i--) {
        const potentialSwing = searchSlice[i];
        let isSwingHigh = true;
        for (let j = 1; j <= lookback; j++) {
             if (searchSlice[i - j] === undefined || searchSlice[i + j] === undefined) {
                 isSwingHigh = false;
                 break;
            }
            if (potentialSwing.high <= searchSlice[i - j].high || potentialSwing.high <= searchSlice[i + j].high) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh) {
            return { candle: potentialSwing, index: i };
        }
    }
    return null;
}

export const findAllSwingLows = (candles: Candle[], lookback: number): SwingPoint[] => {
    const swings: SwingPoint[] = [];
    if (candles.length < lookback * 2 + 1) return [];

    for (let i = lookback; i < candles.length - lookback; i++) {
        const potentialSwing = candles[i];
        let isSwingLow = true;
        for (let j = 1; j <= lookback; j++) {
            if (potentialSwing.low > candles[i - j].low || potentialSwing.low > candles[i + j].low) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow) {
            swings.push({ candle: potentialSwing, index: i });
            i += lookback; 
        }
    }
    return swings;
}

export const findAllSwingHighs = (candles: Candle[], lookback: number): SwingPoint[] => {
    const swings: SwingPoint[] = [];
    if (candles.length < lookback * 2 + 1) return [];

    for (let i = lookback; i < candles.length - lookback; i++) {
        const potentialSwing = candles[i];
        let isSwingHigh = true;
        for (let j = 1; j <= lookback; j++) {
            if (potentialSwing.high < candles[i - j].high || potentialSwing.high < candles[i + j].high) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh) {
            swings.push({ candle: potentialSwing, index: i });
            i += lookback;
        }
    }
    return swings;
}

export const detectMarketStructure = (candles: Candle[], lookback: number): Candle[] => {
    const swingHighs = findAllSwingHighs(candles, lookback);
    const swingLows = findAllSwingLows(candles, lookback);
    const candlesWithStructure = [...candles];

    if (swingHighs.length < 2 && swingLows.length < 2) return candlesWithStructure;

    let lastHigh = swingHighs[0];
    let lastLow = swingLows[0];
    let trend: 'bullish' | 'bearish' | 'ranging' = 'ranging';

    const allSwings = [...swingHighs.map(s => ({...s, type: 'high' as const})), ...swingLows.map(s => ({...s, type: 'low' as const}))]
        .sort((a,b) => a.index - b.index);

    for (const swing of allSwings) {
        if (swing.type === 'high') {
            if (lastHigh && swing.candle.high > lastHigh.candle.high) {
                const type = trend === 'bullish' ? 'BOS' : 'Choch';
                candlesWithStructure[swing.index].marketStructure = { type, direction: 'bullish', price: lastHigh.candle.high, time: swing.candle.time };
                trend = 'bullish';
            }
            lastHigh = swing;
        } else { // low
             if (lastLow && swing.candle.low < lastLow.candle.low) {
                const type = trend === 'bearish' ? 'BOS' : 'Choch';
                candlesWithStructure[swing.index].marketStructure = { type, direction: 'bearish', price: lastLow.candle.low, time: swing.candle.time };
                trend = 'bearish';
            }
            lastLow = swing;
        }
    }

    return candlesWithStructure;
};

export const processSMCIndicators = (candles: Candle[], settings: { swingLookback: number }): Candle[] => {
    if (candles.length < 3) return candles;

    const processed = candles.map(c => ({...c})); // Create a mutable copy

    const swingHighs = findAllSwingHighs(processed, settings.swingLookback);
    const swingLows = findAllSwingLows(processed, settings.swingLookback);

    for (let i = 2; i < processed.length; i++) {
        const candle = processed[i];
        const prevCandle = processed[i-1];
        const prevPrevCandle = processed[i-2];

        // 1. Detect Fair Value Gaps (FVG)
        if (prevPrevCandle.high < candle.low && !prevCandle.fvgRange) {
            processed[i-1].fvgRange = { bottom: prevPrevCandle.high, top: candle.low, time: prevCandle.time, direction: 'bullish' };
        }
        if (prevPrevCandle.low > candle.high && !prevCandle.fvgRange) {
             processed[i-1].fvgRange = { bottom: candle.high, top: prevPrevCandle.low, time: prevCandle.time, direction: 'bearish' };
        }
        
        // 2. Mitigate FVGs
        for (let j = Math.max(0, i - 50); j < i; j++) {
            const pastCandle = processed[j];
            if (pastCandle.fvgRange && !pastCandle.fvgRange.mitigatedTime) {
                if (candle.high >= pastCandle.fvgRange.bottom && candle.low <= pastCandle.fvgRange.top) {
                    pastCandle.fvgRange.mitigatedTime = candle.time;
                }
            }
        }

        // 3. Detect Liquidity Grabs
        const lastLowBeforeCurrent = swingLows.filter(s => s.index < i).pop();
        if (lastLowBeforeCurrent && candle.low < lastLowBeforeCurrent.candle.low && candle.close > lastLowBeforeCurrent.candle.low) {
            candle.isLiquidityGrab = true;
            candle.grabType = 'low';
        }
        const lastHighBeforeCurrent = swingHighs.filter(s => s.index < i).pop();
        if (lastHighBeforeCurrent && candle.high > lastHighBeforeCurrent.candle.high && candle.close < lastHighBeforeCurrent.candle.high) {
            candle.isLiquidityGrab = true;
            candle.grabType = 'high';
        }
    }
    return processed;
};


export interface VolumeProfileData {
    price_low: number;
    price_high: number;
    volume: number;
}

export const calculateVolumeProfile = (candles: Candle[], numBuckets: number = 50): { profile: VolumeProfileData[], maxVolume: number } => {
    if (candles.length === 0) return { profile: [], maxVolume: 0 };

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
        minPrice = Math.min(minPrice, c.low);
        maxPrice = Math.max(maxPrice, c.high);
    }
    
    if (minPrice === maxPrice || !isFinite(minPrice) || !isFinite(maxPrice)) return { profile: [], maxVolume: 0 };

    const bucketSize = (maxPrice - minPrice) / numBuckets;
    const profile: VolumeProfileData[] = Array.from({ length: numBuckets }, (_, i) => ({
        price_low: minPrice + i * bucketSize,
        price_high: minPrice + (i + 1) * bucketSize,
        volume: 0,
    }));

    let maxVolume = 0;

    for (const candle of candles) {
        const startBucketIndex = Math.max(0, Math.floor((candle.low - minPrice) / bucketSize));
        const endBucketIndex = Math.min(numBuckets - 1, Math.floor((candle.high - minPrice) / bucketSize));
        
        const bucketsSpanned = (endBucketIndex - startBucketIndex) + 1;
        if (bucketsSpanned <= 0) continue;

        const volumePerBucket = candle.volume / bucketsSpanned;

        for (let i = startBucketIndex; i <= endBucketIndex; i++) {
            profile[i].volume += volumePerBucket;
            if (profile[i].volume > maxVolume) {
                maxVolume = profile[i].volume;
            }
        }
    }

    return { profile, maxVolume };
}

const getUTCDayStart = (timestamp: number): number => {
    const d = new Date(timestamp);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export const calculatePivotPoints = (candles: Candle[]): PivotPoints | null => {
    if (candles.length === 0) return null;

    const todayStart = getUTCDayStart(candles[candles.length - 1].time);
    
    const prevDayCandles = candles.filter(c => getUTCDayStart(c.time) < todayStart);
    if (prevDayCandles.length === 0) return null;
    
    const lastDayTimestamp = getUTCDayStart(prevDayCandles[prevDayCandles.length - 1].time);
    const lastFullDayCandles = prevDayCandles.filter(c => getUTCDayStart(c.time) === lastDayTimestamp);
    if (lastFullDayCandles.length === 0) return null;

    const H = Math.max(...lastFullDayCandles.map(c => c.high));
    const L = Math.min(...lastFullDayCandles.map(c => c.low));
    const C = lastFullDayCandles[lastFullDayCandles.length - 1].close;

    if (!isFinite(H) || !isFinite(L) || !isFinite(C)) return null;

    const P = (H + L + C) / 3;
    const R1 = (2 * P) - L;
    const S1 = (2 * P) - H;
    const R2 = P + (H - L);
    const S2 = P - (H - L);
    const R3 = H + 2 * (P - L);
    const S3 = L - 2 * (H - P);

    return { P, R1, S1, R2, S2, R3, S3 };
};

export const calculateMACD = (prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): { macd: number, signal: number, histogram: number }[] => {
    if (prices.length < slowPeriod) return [];
    const fastEmas = calculateEMA(prices, fastPeriod);
    const slowEmas = calculateEMA(prices, slowPeriod);
    
    // Align EMAs
    const macdLine: number[] = [];
    const alignOffset = fastEmas.length - slowEmas.length;
    for (let i = 0; i < slowEmas.length; i++) {
        macdLine.push(fastEmas[i + alignOffset] - slowEmas[i]);
    }
    
    if (macdLine.length < signalPeriod) return [];
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    const results: { macd: number, signal: number, histogram: number }[] = [];
    const resultOffset = macdLine.length - signalLine.length;
    for(let i = 0; i < signalLine.length; i++) {
        const macd = macdLine[i + resultOffset];
        const signal = signalLine[i];
        results.push({ macd, signal, histogram: macd - signal });
    }
    
    return results;
};

export const calculateATR = (candles: Candle[], period: number): number[] => {
    if (candles.length < period) return [];
    
    const trueRanges: number[] = [];
    for (let i = 1; i < candles.length; i++) {
        const current = candles[i];
        const prev = candles[i-1];
        const tr = Math.max(current.high - current.low, Math.abs(current.high - prev.close), Math.abs(current.low - prev.close));
        trueRanges.push(tr);
    }

    const atr: number[] = [];
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += trueRanges[i];
    }
    atr.push(sum / period);
    
    for (let i = period; i < trueRanges.length; i++) {
        const nextAtr = (atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period;
        atr.push(nextAtr);
    }
    
    return atr;
};

export const calculateBollingerBands = (prices: number[], period: number, stdDev: number): { upper: number, middle: number, lower: number }[] => {
    if (prices.length < period) return [];
    
    const results: { upper: number, middle: number, lower: number }[] = [];
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        const sma = slice.reduce((sum, val) => sum + val, 0) / period;
        const standardDeviation = Math.sqrt(slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period);
        results.push({
            middle: sma,
            upper: sma + stdDev * standardDeviation,
            lower: sma - stdDev * standardDeviation,
        });
    }
    return results;
};

export const calculateStochastic = (candles: Candle[], period: number, kSlowing: number, dPeriod: number): { k: number, d: number }[] => {
    if (candles.length < period + kSlowing - 1) return [];

    const kValues: number[] = [];
    for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const highestHigh = Math.max(...slice.map(c => c.high));
        const lowestLow = Math.min(...slice.map(c => c.low));
        const currentClose = candles[i].close;
        const k = (lowestLow === highestHigh) ? 100 : 100 * ((currentClose - lowestLow) / (highestHigh - lowestLow));
        kValues.push(k);
    }

    const smoothedK = calculateEMA(kValues, kSlowing); // Using EMA for smoothing %K
    const dValues = calculateEMA(smoothedK, dPeriod);

    const results: { k: number, d: number }[] = [];
    const offset = smoothedK.length - dValues.length;
    for (let i = 0; i < dValues.length; i++) {
        results.push({ k: smoothedK[i + offset], d: dValues[i] });
    }
    return results;
};

export const calculateIchimokuCloud = (candles: Candle[], conversionPeriod: number, basePeriod: number, laggingSpanPeriod: number, displacement: number): { conversion: number, base: number, spanA: number, spanB: number, lagging: number }[] => {
    const results: any[] = [];

    for (let i = 0; i < candles.length; i++) {
        const conversionSlice = candles.slice(Math.max(0, i - conversionPeriod + 1), i + 1);
        const conversionHigh = Math.max(...conversionSlice.map(c => c.high));
        const conversionLow = Math.min(...conversionSlice.map(c => c.low));
        const conversion = (conversionHigh + conversionLow) / 2;
        
        const baseSlice = candles.slice(Math.max(0, i - basePeriod + 1), i + 1);
        const baseHigh = Math.max(...baseSlice.map(c => c.high));
        const baseLow = Math.min(...baseSlice.map(c => c.low));
        const base = (baseHigh + baseLow) / 2;

        const lagging = candles[i - laggingSpanPeriod]?.close;
        
        results.push({ time: candles[i].time, conversion, base, lagging });
    }
    
    for (let i = 0; i < results.length; i++) {
        const futureIndex = i + displacement;
        if (futureIndex < results.length) {
            results[futureIndex].spanA = (results[i].conversion + results[i].base) / 2;

            const spanBSlice = candles.slice(Math.max(0, i - laggingSpanPeriod + 1), i + 1);
            const spanBHigh = Math.max(...spanBSlice.map(c => c.high));
            const spanBLow = Math.min(...spanBSlice.map(c => c.low));
            results[futureIndex].spanB = (spanBHigh + spanBLow) / 2;
        }
    }
    
    return results;
};

export const calculateSupertrend = (candles: Candle[], period: number, multiplier: number): { value: number, direction: number }[] => {
    if (candles.length < period) return [];

    const atrValues = calculateATR(candles, period);
    const results: { value: number, direction: number }[] = [];
    const atrOffset = candles.length - atrValues.length;

    for (let i = atrOffset; i < candles.length; i++) {
        const candle = candles[i];
        const atr = atrValues[i - atrOffset];
        const hl2 = (candle.high + candle.low) / 2;
        const upperBand = hl2 + multiplier * atr;
        const lowerBand = hl2 - multiplier * atr;

        let supertrend = 0;
        let direction = 1;

        if (i > atrOffset) {
            const prev = results[results.length - 1];
            const prevCandle = candles[i - 1];
            if (prev.direction === 1) { // Up trend
                if (candle.close > prev.value) {
                    supertrend = Math.max(prev.value, lowerBand);
                } else {
                    supertrend = upperBand;
                    direction = -1;
                }
            } else { // Down trend
                if (candle.close < prev.value) {
                    supertrend = Math.min(prev.value, upperBand);
                } else {
                    supertrend = lowerBand;
                    direction = 1;
                }
            }
        } else {
            supertrend = lowerBand;
        }
        
        results.push({ value: supertrend, direction });
    }
    return results;
};

export const calculateVWAP = (candles: Candle[]): number[] => {
    if (candles.length === 0) return [];
    const vwap: number[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    for (const candle of candles) {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        const tpv = typicalPrice * candle.volume;
        cumulativeTPV += tpv;
        cumulativeVolume += candle.volume;
        vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
    }
    return vwap;
};

export const calculateOBV = (candles: Candle[]): number[] => {
    if (candles.length === 0) return [];
    const obv: number[] = [0];
    for (let i = 1; i < candles.length; i++) {
        const current = candles[i];
        const prev = candles[i-1];
        if (current.close > prev.close) {
            obv.push(obv[i-1] + current.volume);
        } else if (current.close < prev.close) {
            obv.push(obv[i-1] - current.volume);
        } else {
            obv.push(obv[i-1]);
        }
    }
    return obv;
};