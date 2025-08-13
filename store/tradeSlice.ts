import type { StateCreator } from 'zustand';
import type { AppState, TradeSlice, Trade, LogEntry, AlertEvent, TradingMode, SessionSummary } from '../types';
import * as db from '../services/databaseService';
import { calculateTradePnl, formatDuration, calculateBacktestStats } from '../services/backtestService';

export const createTradeSlice: StateCreator<AppState, [], [], TradeSlice> = (set, get) => ({
  trades: [],
  openTrades: new Map(),
  pendingTrade: null,
  logs: [],
  alertFeed: [],
  currentSession: new Map(),
  sessionHistory: [],
  selectedSessionFromHistory: null,
  showSessionStartModal: false,

  addTrade: async (trade) => {
    await db.saveTrade(trade);
    set(state => ({ trades: [...state.trades, trade] }));
  },

  addOpenTrade: (trade) => {
    set(state => {
      const mode = state.tradingMode;
      const currentOpen = state.openTrades.get(mode) || [];
      const newOpenTradesForMode = [...currentOpen, trade];
      const newOpenTradesMap = new Map(state.openTrades).set(mode, newOpenTradesForMode);
      db.saveOpenTrades(mode, newOpenTradesForMode);
      return { openTrades: newOpenTradesMap };
    });
  },

  closeTrade: (tradeId, exitPrice, exitReason) => {
    const { tradingMode, openTrades, globalRiskSettings, addTrade, addLog, setLatestAlert, addSessionToHistory, currentSession, soundSettings } = get();
    const openTradesForMode = openTrades.get(tradingMode) || [];
    const tradeToClose = openTradesForMode.find(t => t.id === tradeId);

    if (tradeToClose) {
      let pnlStats = { pnl: 0, pnlAmount: 0, realizedRR: 0 };
      try {
        pnlStats = calculateTradePnl(tradeToClose, exitPrice, globalRiskSettings);
      } catch (error) {
        console.error("Error calculating P&L for trade:", tradeId, error);
        addLog({type: 'error', messageKey: 'An error occurred while closing the trade.'});
      }

      const durationMs = Date.now() - tradeToClose.time;
      const closedTrade: Trade = {
        ...tradeToClose,
        status: 'closed',
        exitPrice,
        exitReason,
        exitTime: Date.now(),
        ...pnlStats,
        durationMs,
        duration: formatDuration(durationMs),
      };
      addTrade(closedTrade);

      const newOpenTrades = openTradesForMode.filter(t => t.id !== tradeId);
      const newOpenTradesMap = new Map(openTrades).set(tradingMode, newOpenTrades);
      db.saveOpenTrades(tradingMode, newOpenTrades);

      set({ openTrades: newOpenTradesMap });

      const isProfit = (pnlStats.pnlAmount || 0) >= 0;
      const soundToPlay = isProfit ? soundSettings.tp : soundSettings.sl;
      if (soundToPlay !== 'none') {
          // Placeholder for soundService.play(soundToPlay);
      }

      const messageKey = isProfit ? 'alert_tp_hit' : 'alert_sl_hit';
      addLog({ type: 'trade', messageKey, messagePayload: { pair: closedTrade.pair, price: exitPrice.toFixed(4), reason: exitReason } });
      setLatestAlert({ type: 'info', messageKey, time: Date.now(), messagePayload: { pair: closedTrade.pair, price: exitPrice.toFixed(4), reason: exitReason } });
    }
  },

  setPendingTrade: (trade) => set({ pendingTrade: trade }),
  addLog: (log) => set(state => ({ logs: [{ ...log, time: Date.now() }, ...state.logs.slice(0, 499)] })),
  
  addAlertToFeed: (alert) => {
    set(state => {
      const activeStrategy = state.strategyDefinitions.get(state.activeStrategyId);
      const newAlert: AlertEvent = {
        ...alert,
        id: `${Date.now()}-${alert.pair}`,
        time: Date.now(),
        strategyName: activeStrategy?.name,
        strategyNameKey: activeStrategy?.nameKey,
      };
      const newFeed = [newAlert, ...state.alertFeed.slice(0, 99)];
      db.saveAlertFeed(newFeed);
      return { alertFeed: newFeed };
    });
  },

  reviewEventInChart: (event) => {
    const { tradingMode } = get();
    // To prevent entering review mode from an active backtest and losing state
    if (tradingMode === 'Backtest') {
        get().setLatestAlert({type: 'info', messageKey: 'Cannot enter review mode while backtest is active.', time: Date.now()});
        return;
    }
    set({
      previousTradingMode: tradingMode,
      tradingMode: 'Backtest', // Use backtest UI for review
      activePair: event.pair,
      timeframe: event.timeframe,
    });
  },

  exitReviewMode: () => {
    const prevMode = get().previousTradingMode;
    if (prevMode) {
      set({ tradingMode: prevMode, previousTradingMode: null, backtestHistoricalData: [], backtestPlaybackState: 'idle' });
    }
  },

  addSessionToHistory: (session) => {
    db.addSessionSummary(session);
    set(state => ({ sessionHistory: [session, ...state.sessionHistory] }));
  },
  
  clearSessionHistory: async () => {
    get().hideConfirmation();
    await db.clearSessionHistory();
    set({ sessionHistory: [] });
  },
  
  setSelectedSessionFromHistory: (session) => set({ selectedSessionFromHistory: session }),

  manualCloseTrade: (tradeId) => {
    const { tradingMode, openTrades, rawCandlesMap, closeTrade } = get();
    const trade = (openTrades.get(tradingMode) || []).find(t => t.id === tradeId);
    const candles = rawCandlesMap.get(trade?.pair || '');
    if (trade && candles && candles.length > 0) {
      const lastPrice = candles[candles.length - 1].close;
      closeTrade(trade.id, lastPrice, 'Manual Close');
    }
  },

  confirmTrade: (payload?: { sizeMultiplier: number }) => {
    const { pendingTrade, addOpenTrade, tradingMode } = get();
    if (pendingTrade) {
        const sizeMultiplier = payload?.sizeMultiplier ?? 1;
        const finalPositionSize = pendingTrade.positionSize * sizeMultiplier;

        addOpenTrade({
            ...pendingTrade,
            positionSize: finalPositionSize,
            id: `${pendingTrade.time}-${pendingTrade.pair}`,
            mode: tradingMode,
            status: 'open',
        });
        set({ pendingTrade: null });
    }
  },

  continueSession: () => set({ showSessionStartModal: false, isStrategyEngineRunning: true }),
  
  startNewSession: (mode, strategyIdentifier) => {
    const newSession = {
      id: `${mode}-${Date.now()}`,
      startTime: Date.now(),
      mode,
      strategyId: get().activeStrategyId,
      strategyName: strategyIdentifier,
    };
    const newSessionMap = new Map(get().currentSession).set(mode, newSession);
    set({ currentSession: newSessionMap, isStrategyEngineRunning: true, showSessionStartModal: false });
  },

  startNewSessionAndCloseTrades: (strategyIdentifier) => {
    const { tradingMode, openTrades, closeTrade } = get();
    const openTradesForMode = openTrades.get(tradingMode) || [];
    openTradesForMode.forEach(trade => {
        const candles = get().rawCandlesMap.get(trade.pair);
        const exitPrice = candles ? candles[candles.length - 1].close : trade.entryPrice;
        closeTrade(trade.id, exitPrice, 'Manual Close');
    });
    get().startNewSession(tradingMode, strategyIdentifier);
  },

  startNewSessionAndMigrateTrades: (strategyIdentifier) => {
    const { tradingMode, openTrades } = get();
    get().startNewSession(tradingMode, strategyIdentifier);
    const newSessionId = get().currentSession.get(tradingMode)!.id;
    const openTradesForMode = (openTrades.get(tradingMode) || []).map(t => ({...t, sessionId: newSessionId}));
    const newOpenTradesMap = new Map(openTrades).set(tradingMode, openTradesForMode);
    db.saveOpenTrades(tradingMode, openTradesForMode);
    set({ openTrades: newOpenTradesMap });
  },
  
  stopRobotAndCloseTrades: () => {
    const { tradingMode, openTrades, closeTrade, currentSession, addSessionToHistory, globalRiskSettings } = get();
    const openTradesForMode = openTrades.get(tradingMode) || [];
    openTradesForMode.forEach(trade => {
        const candles = get().rawCandlesMap.get(trade.pair);
        const exitPrice = candles ? candles[candles.length - 1].close : trade.entryPrice;
        closeTrade(trade.id, exitPrice, 'Manual Close');
    });
    const session = currentSession.get(tradingMode);
    if (session) {
        const sessionTrades = get().trades.filter(t => t.sessionId === session.id);
        const stats = calculateBacktestStats(sessionTrades, globalRiskSettings.totalCapital);
        addSessionToHistory({ ...session, endTime: Date.now(), stats });
    }
    set({ isStrategyEngineRunning: false, showRobotStopModal: false, currentSession: new Map(currentSession).set(tradingMode, null) });
  },
  
  stopRobotAndKeepTrades: () => {
    const { tradingMode, currentSession, addSessionToHistory, globalRiskSettings } = get();
    const session = currentSession.get(tradingMode);
    if (session) {
        const sessionTrades = get().trades.filter(t => t.sessionId === session.id);
        const stats = calculateBacktestStats(sessionTrades, globalRiskSettings.totalCapital);
        addSessionToHistory({ ...session, endTime: Date.now(), stats });
    }
    set({ isStrategyEngineRunning: false, showRobotStopModal: false, currentSession: new Map(currentSession).set(tradingMode, null) });
  },

  setShowSessionStartModal: (show) => set({ showSessionStartModal: show }),

  calculatePositionSize: (entryPrice, stopLoss) => {
    const { globalRiskSettings } = get();
    // Implementation of position size calculation
    return 100; // Placeholder
  },
});