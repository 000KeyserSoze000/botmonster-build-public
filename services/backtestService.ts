import type { Trade, BacktestStats, StrategyDefinition, StrategySettings, GlobalRiskSettings, Candle, PortfolioBacktestStats, ImperativeStrategyLogic } from '../types';

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 || result === '') result += `${seconds}s`;
  return result.trim();
}

/**
 * Centralized utility to calculate a risk-based position size for SPOT TRADING.
 * It ensures the calculated position size does not exceed available capital.
 * @param equity The current total equity, used for calculating the risk amount.
 * @param availableCapital The actual cash available to open new positions.
 * @returns The position size in the QUOTE asset, or 0 if the trade is invalid.
 */
export function calculatePositionSize(
    equity: number,
    availableCapital: number,
    riskPerTradePercent: number,
    entryPrice: number,
    stopLoss: number
): number {
    if (entryPrice <= 0 || stopLoss <= 0 || equity <= 0 || riskPerTradePercent <= 0) {
        return 0;
    }

    const riskAmount = equity * (riskPerTradePercent / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);

    if (riskPerUnit <= 0) {
        return 0; // Invalid risk (SL is at or beyond entry)
    }

    const unitsToBuy = riskAmount / riskPerUnit;
    const positionSizeInQuote = unitsToBuy * entryPrice;

    // SPOT Market Constraint: Position size cannot exceed available capital.
    if (positionSizeInQuote > availableCapital) {
        return 0;
    }

    return positionSizeInQuote;
}


/**
 * A centralized utility to calculate P&L for a closed trade.
 * This ensures consistency across all parts of the app (live, paper, backtest).
 * @param trade The trade object (must have entryPrice and positionSize).
 * @param exitPrice The price at which the trade was closed.
 * @param riskSettings The global risk settings for commission calculation.
 * @returns An object with pnl (percentage) and pnlAmount (quote currency).
 */
export function calculateTradePnl(
  trade: Pick<Trade, 'direction' | 'entryPrice' | 'positionSize' | 'sl'>, 
  exitPrice: number, 
  riskSettings: GlobalRiskSettings
): { pnl: number; pnlAmount: number, realizedRR: number } {
    if (!trade.entryPrice || !trade.positionSize) {
        return { pnl: 0, pnlAmount: 0, realizedRR: 0 };
    }
    const { positionSize, entryPrice, direction, sl } = trade;

    const pnlMultiplier = direction === 'LONG' ? 1 : -1;
    const rawPnlAmount = (exitPrice - entryPrice) * (positionSize / entryPrice) * pnlMultiplier;

    let finalPnlAmount = rawPnlAmount;
    const feePercent = riskSettings.commission * (riskSettings.useBnbFees ? 0.75 : 1);
    if (feePercent > 0) {
        const entryValue = positionSize;
        const exitValue = positionSize * (exitPrice / entryPrice);
        const totalCommission = (entryValue + exitValue) * (feePercent / 100);
        finalPnlAmount -= totalCommission;
    }

    const pnl = (finalPnlAmount / positionSize) * 100;
    const risk = Math.abs(entryPrice - sl);
    const reward = Math.abs(exitPrice - entryPrice);
    const realizedRR = risk > 0 ? reward / risk : 0;

    return { pnl, pnlAmount: finalPnlAmount, realizedRR };
}


export function runHeadlessBacktest(
    allCandles: Candle[],
    strategy: StrategyDefinition,
    settings: StrategySettings,
    globalRiskSettings: GlobalRiskSettings,
    strategyNameKey: string
): Trade[] {
    if (!('run' in strategy.logic)) {
        console.warn(`Strategy ${strategy.id} is declarative and cannot be run in headless backtest.`);
        return [];
    }
    const strategyLogic = strategy.logic as ImperativeStrategyLogic;
    const closedTrades: Trade[] = [];
    let openTrades: Trade[] = [];
    let equity = globalRiskSettings.totalCapital;
    const initialIndex = 50;

    const processedCandles = strategyLogic.processCandles
        ? strategyLogic.processCandles(allCandles, settings)
        : allCandles;

    for (let i = initialIndex; i < processedCandles.length; i++) {
        const currentCandle = processedCandles[i];
        
        const stillOpenTrades: Trade[] = [];
        for (const trade of openTrades) {
            let updatedTrade = { ...trade };
            let exitPrice: number | undefined;
            let exitReason: 'TP' | 'SL' | 'Trailing Stop' | undefined;
            
            const trailingStopPercent = (settings as any).trailingStop;
            if (trailingStopPercent > 0) {
                 if (updatedTrade.direction === 'LONG') {
                    if (currentCandle.high > (updatedTrade.highestPriceSoFar || updatedTrade.entryPrice)) {
                        updatedTrade.highestPriceSoFar = currentCandle.high;
                        const newTrailingStop = updatedTrade.highestPriceSoFar * (1 - trailingStopPercent / 100);
                        if (newTrailingStop > (updatedTrade.trailingStopPrice || updatedTrade.sl)) {
                            updatedTrade.trailingStopPrice = newTrailingStop;
                        }
                    }
                }
            }

            const activeSL = updatedTrade.trailingStopPrice || updatedTrade.sl;
            if (updatedTrade.direction === 'LONG') {
                if (currentCandle.low <= activeSL) { exitPrice = activeSL; exitReason = updatedTrade.trailingStopPrice ? 'Trailing Stop' : 'SL'; }
                else if (currentCandle.high >= updatedTrade.tp) { exitPrice = updatedTrade.tp; exitReason = 'TP'; }
            }
            
            if (exitPrice && exitReason) {
                const pnlStats = calculateTradePnl(updatedTrade, exitPrice, globalRiskSettings);
                equity += pnlStats.pnlAmount;

                const finalTrade = { ...updatedTrade, exitPrice, exitReason, exitTime: currentCandle.time, status: 'closed' as const, ...pnlStats };
                closedTrades.push(finalTrade);
            } else {
                stillOpenTrades.push(updatedTrade);
            }
        }
        openTrades = stillOpenTrades;
        
        const isTradeOpen = openTrades.length > 0;
        if (!isTradeOpen) {
            const candleSlice = processedCandles.slice(0, i + 1);
            const state = strategyLogic.run(candleSlice, settings, 'OPTIMIZATION', false);
            
            if (state.alert && (state.alert.type === 'entry') && state.alert.direction === 'LONG') {
                const { entryPrice, sl, tp } = state.alert;
                if (entryPrice && sl && tp) {
                    const capitalInUse = openTrades.reduce((sum, t) => sum + t.positionSize, 0);
                    const availableCapital = equity - capitalInUse;

                    const positionSizeInQuote = calculatePositionSize(
                        equity,
                        availableCapital,
                        globalRiskSettings.riskPerTrade,
                        entryPrice,
                        sl
                    );

                    if (positionSizeInQuote > 0) {
                        openTrades.push({
                            id: `${currentCandle.time}`, sessionId: 'optimization', pair: 'OPTIMIZATION', strategyId: strategy.id,
                            strategyNameKey: strategyNameKey, timeframe: 'OPTIMIZATION', direction: 'LONG',
                            entryPrice, time: currentCandle.time, sl, tp, positionSize: positionSizeInQuote, status: 'open',
                            mode: 'Backtest'
                        });
                    }
                }
            }
        }
    }
    
    return closedTrades.map(trade => {
        if (!trade.exitTime) return trade;
        const durationMs = trade.exitTime - trade.time;
        return { ...trade, durationMs, duration: formatDuration(durationMs) };
    });
}

export function calculatePortfolioBacktestStats(allTrades: Trade[], totalCapital: number): PortfolioBacktestStats {
    const globalStats = calculateBacktestStats(allTrades, totalCapital);

    const tradesByPair: Record<string, Trade[]> = {};
    for (const trade of allTrades) {
        if (!tradesByPair[trade.pair]) {
            tradesByPair[trade.pair] = [];
        }
        tradesByPair[trade.pair].push(trade);
    }

    const performanceByPair: PortfolioBacktestStats['performanceByPair'] = {};
    for (const pair in tradesByPair) {
        const pairTrades = tradesByPair[pair];
        if (pairTrades.length > 0) {
            const pairStats = calculateBacktestStats(pairTrades, 0);
            performanceByPair[pair] = {
                netProfit: pairStats.netProfit,
                totalTrades: pairStats.totalTrades,
                winRate: pairStats.winRate,
                profitFactor: pairStats.profitFactor,
            };
        }
    }

    return {
        globalStats,
        performanceByPair,
    };
}

const getPnlDistribution = (trades: Trade[]): { bucket: string; count: number }[] => {
    const buckets: Record<string, number> = {};
    const bucketSize = 0.5;

    trades.forEach(trade => {
        if (trade.pnl === undefined) return;
        const bucket = Math.floor(trade.pnl / bucketSize) * bucketSize;
        const bucketLabel = `${bucket.toFixed(1)}% à ${(bucket + bucketSize).toFixed(1)}%`;
        buckets[bucketLabel] = (buckets[bucketLabel] || 0) + 1;
    });
    
    return Object.entries(buckets)
      .map(([bucket, count]) => ({ bucket, count }))
      .sort((a, b) => parseFloat(a.bucket) - parseFloat(b.bucket));
};


export function calculateBacktestStats(trades: Trade[], totalCapital: number): BacktestStats {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      netProfit: 0, profitFactor: 0, totalTrades: 0, winningTrades: 0,
      losingTrades: 0, winRate: 0, averageGain: 0, averageLoss: 0,
      maxDrawdown: 0, bestTradePnl: 0, worstTradePnl: 0, averageDuration: '0s',
      averageWinDuration: '0s', averageLossDuration: '0s', averageRR: 0,
      longestWinningStreak: 0, longestLosingStreak: 0,
      equityCurve: [{ time: Date.now(), value: totalCapital }],
      pnlDistribution: [],
    };
  }

  let grossProfit = 0, grossLoss = 0, winningTrades = 0, losingTrades = 0;
  let bestTradePnl = -Infinity, worstTradePnl = Infinity;
  let totalDurationMs = 0, winDurationMs = 0, lossDurationMs = 0;
  let totalRR = 0, winCountForRR = 0;
  let longestWinningStreak = 0, longestLosingStreak = 0;
  let currentWinStreak = 0, currentLossStreak = 0;
  
  const sortedTrades = [...trades].sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));

  const equityCurve: { time: number; value: number }[] = [{ time: (sortedTrades[0]?.time || Date.now()) - 1, value: totalCapital }];
  let currentCapital = totalCapital;
  let peakCapital = totalCapital;
  let maxDrawdown = 0;

  sortedTrades.forEach(trade => {
    const pnlAmount = trade.pnlAmount || 0;
    currentCapital += pnlAmount;
    
    if (currentCapital > peakCapital) {
        peakCapital = currentCapital;
    }
    const drawdown = ((peakCapital - currentCapital) / peakCapital) * 100;
    if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
    }

    equityCurve.push({ time: trade.exitTime || trade.time, value: currentCapital });

    totalDurationMs += trade.durationMs || 0;
    if (pnlAmount > 0) {
      winningTrades++;
      grossProfit += pnlAmount;
      bestTradePnl = Math.max(bestTradePnl, pnlAmount);
      winDurationMs += trade.durationMs || 0;
      if (trade.realizedRR) {
        totalRR += trade.realizedRR;
        winCountForRR++;
      }
      currentWinStreak++;
      longestLosingStreak = Math.max(longestLosingStreak, currentLossStreak);
      currentLossStreak = 0;
    } else {
      losingTrades++;
      grossLoss += Math.abs(pnlAmount);
      worstTradePnl = Math.min(worstTradePnl, pnlAmount);
      lossDurationMs += trade.durationMs || 0;
      currentLossStreak++;
      longestWinningStreak = Math.max(longestWinningStreak, currentWinStreak);
      currentWinStreak = 0;
    }
  });
  
  longestWinningStreak = Math.max(longestWinningStreak, currentWinStreak);
  longestLosingStreak = Math.max(longestLosingStreak, currentLossStreak);

  const netProfit = grossProfit - grossLoss;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const averageGain = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;

  return {
    netProfit,
    profitFactor,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    averageGain,
    averageLoss,
    maxDrawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown,
    bestTradePnl,
    worstTradePnl,
    equityCurve,
    pnlDistribution: getPnlDistribution(trades),
    averageDuration: formatDuration(totalDurationMs > 0 ? totalDurationMs / totalTrades : 0),
    averageWinDuration: formatDuration(winDurationMs > 0 ? winDurationMs / winningTrades : 0),
    averageLossDuration: formatDuration(lossDurationMs > 0 ? lossDurationMs / losingTrades : 0),
    averageRR: winCountForRR > 0 ? totalRR / winCountForRR : 0,
    longestWinningStreak,
    longestLosingStreak,
  };
}