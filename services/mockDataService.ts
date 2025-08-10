import type { Candle } from '../types';

function getTimeStep(timeframe: string): number {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1), 10);
    switch(unit) {
        case 'm': return value * 60 * 1000;
        case 'H': return value * 60 * 60 * 1000;
        case 'D': return value * 24 * 60 * 60 * 1000;
        case 'W': return value * 7 * 24 * 60 * 60 * 1000;
        default: return 4 * 60 * 60 * 1000; // default to 4H
    }
}

function applyIndicatorLogic(candle: Candle, prevCandles: Candle[]): Candle {
    const i = prevCandles.length;
    if (i < 3) return candle;
    
    const data = [...prevCandles, candle];
    const newCandle = {...candle};

    // Detect Order Block (OB) - a down candle before a strong up move
    const prevCandle = data[i - 1];
    const isBearishPrev = prevCandle.close < prevCandle.open;
    const isStrongBullishCurrent = newCandle.close > newCandle.open && (newCandle.close - newCandle.open) > (prevCandle.open - prevCandle.close) * 1.5;
    if (isBearishPrev && isStrongBullishCurrent && newCandle.close > prevCandle.high) {
      // This logic is tricky for real-time, as it modifies a past candle. 
      // For this simulation, we'll skip modifying the past. A real implementation might require a look-back update.
    }
    
    // Detect Fair Value Gap (FVG)
    const first = data[i - 2];
    const third = newCandle;
    if (first.high < third.low) { // Bullish FVG
      data[i-1].fvgRange = { bottom: first.high, top: third.low, time: data[i-1].time, direction: 'bullish' };
    } else if (first.low > third.high) { // Bearish FVG
      data[i-1].fvgRange = { bottom: third.high, top: first.low, time: data[i-1].time, direction: 'bearish' };
    }

    // Detect Liquidity Grab
    const prevHigh = Math.max(data[i-1].high, data[i-2].high, data[i-3].high);
    const prevLow = Math.min(data[i-1].low, data[i-2].low, data[i-3].low);
    const wickSize = newCandle.high - newCandle.low;
    const bodySize = Math.abs(newCandle.open - newCandle.close);
    if (bodySize > 0.01 && wickSize > bodySize * 2.5) { // Ensure there's some body
        if (newCandle.low < prevLow && newCandle.close > newCandle.open) {
            newCandle.isLiquidityGrab = true;
        }
        if (newCandle.high > prevHigh && newCandle.close < newCandle.open) {
            newCandle.isLiquidityGrab = true;
        }
    }
    
    return newCandle;
}

export function generateCandlestickData(count: number, timeframe: string): Candle[] {
  let data: Candle[] = [];
  let price = 50000 + (Math.random() - 0.5) * 10000;
  const now = Date.now();
  const timeStep = getTimeStep(timeframe);

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * timeStep;
    const open = price;
    const change = (Math.random() - 0.49) * (price * 0.03);
    let close = open + change;
    const high = Math.max(open, close) + Math.random() * (price * 0.01);
    const low = Math.min(open, close) - Math.random() * (price * 0.01);
    const volume = Math.random() * 1000 + 100;

    let candle: Candle = { time, open, high, low, close, volume };
    candle = applyIndicatorLogic(candle, data);
    data.push(candle);
    price = close;
  }
  return data;
}

export function generateNextCandle(previousCandles: Candle[], timeframe: string): Candle {
    const previousCandle = previousCandles[previousCandles.length - 1];
    const open = previousCandle.close;
    const time = previousCandle.time + getTimeStep(timeframe);
    const change = (Math.random() - 0.495) * (open * 0.015); // smaller changes for next candle
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * (open * 0.005);
    const low = Math.min(open, close) - Math.random() * (open * 0.005);
    const volume = previousCandle.volume * (0.8 + Math.random() * 0.4);

    let candle: Candle = { time, open, high, low, close, volume };
    
    // Pass the available history to correctly calculate indicators for the new candle.
    candle = applyIndicatorLogic(candle, previousCandles);

    return candle;
}