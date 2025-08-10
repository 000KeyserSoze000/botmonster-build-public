import React, { useState, useEffect, useMemo } from 'react';
import type { AppState, Trade, TradingMode, Candle, Session, BacktestStats, BacktestSession, GlobalRiskSettings, SessionSummary, LogEntry } from '../types';
import { useAppStore } from '../store/useAppStore';
import { ChartPieIcon, ArrowLongUpIcon, ArrowLongDownIcon, ArrowDownTrayIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, ClockIcon, LightBulbIcon, ExclamationTriangleIcon, RectangleGroupIcon, DocumentChartBarIcon, Bars3Icon } from './icons/Icons';
import BacktestControls from './BacktestControls';
import { calculateBacktestStats } from '../services/backtestService';
import { useTranslation } from '../hooks/useTranslation';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { analyzeTradeForDebrief } from '../services/geminiService';

const getModeStyles = (mode: TradingMode) => {
    switch (mode) {
        case 'Live': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Paper': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
        case 'Backtest': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
}

const LivePnl: React.FC<{ trade: Trade, candles: Candle[] | undefined}> = ({ trade, candles }) => {
    const [pnl, setPnl] = useState({ amount: 0, percentage: 0 });

    useEffect(() => {
        if (!candles || candles.length === 0 || !trade.status || trade.status !== 'open') return;
        
        const currentPrice = candles[candles.length - 1].close;
        const pnlMultiplier = trade.direction === 'LONG' ? 1 : -1;
        const amount = (currentPrice / trade.entryPrice - 1) * trade.positionSize * pnlMultiplier;
        const percentage = (currentPrice / trade.entryPrice - 1) * 100 * pnlMultiplier;

        setPnl({ amount, percentage });

    }, [candles, trade]);
    
    const isProfit = pnl.amount >= 0;

    return (
         <div className={`font-mono font-semibold animate-pulse-live ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            <div>{isProfit ? '+' : ''}{pnl.amount.toFixed(2)}</div>
            <div className="text-xs">({pnl.percentage.toFixed(2)}%)</div>
        </div>
    );
}

type SortableKeys = 'pnlAmount' | 'durationMs' | 'plannedRR' | 'exitTime';
const SortableHeader: React.FC<{
    label: string;
    sortKey: SortableKeys;
    sortConfig: { key: SortableKeys; direction: 'asc' | 'desc' } | null;
    setSortConfig: (config: { key: SortableKeys; direction: 'asc' | 'desc' }) => void;
    className?: string;
}> = ({ label, sortKey, sortConfig, setSortConfig, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;

    const handleClick = () => {
        const newDirection = direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key: sortKey, direction: newDirection });
    };

    return (
        <div className={`flex items-center cursor-pointer ${className}`} onClick={handleClick}>
            {label}
            {isSorted && (
                direction === 'asc' 
                ? <ChevronUpIcon className="w-3 h-3 ml-1" /> 
                : <ChevronDownIcon className="w-3 h-3 ml-1" />
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; className?: string; helpText?: string }> = ({ label, value, className, helpText }) => (
    <div className="bg-zinc-900/50 p-4 rounded-lg" title={helpText}>
        <div className="text-sm text-zinc-400">{label}</div>
        <div className={`text-2xl font-bold ${className}`}>{value}</div>
    </div>
);


const TradeHistoryPanel: React.FC = () => {
    const t = useTranslation();
    const {
        tradingMode,
        rawCandlesMap,
        isStrategyEngineRunning,
        isCollapsed,
        isBacktestModeActive,
        openTrades, // This is the full map
        trades,
        backtestClosedTrades,
        globalRiskSettings,
        backtestHistory,
        sessionHistory,
        comparisonSessionIds,
        currentSession, // This is the full map
        logs,
    } = useAppStore(state => ({
        tradingMode: state.tradingMode,
        rawCandlesMap: state.rawCandlesMap,
        isStrategyEngineRunning: state.isStrategyEngineRunning,
        isCollapsed: state.isBottomPanelCollapsed,
        isBacktestModeActive: state.tradingMode === 'Backtest' && state.backtestHistoricalData.length > 0,
        openTrades: state.openTrades,
        trades: state.trades,
        backtestClosedTrades: state.backtestClosedTrades,
        globalRiskSettings: state.globalRiskSettings,
        backtestHistory: state.backtestHistory,
        sessionHistory: state.sessionHistory,
        comparisonSessionIds: state.comparisonSessionIds,
        currentSession: state.currentSession,
        logs: state.logs,
    }));
    
    const { 
        manualCloseTrade, toggleBottomPanel, setSelectedBacktestSession, 
        toggleComparisonSessionId, setShowComparisonModal,
        setSelectedSessionFromHistory, setActivePair, showConfirmation
    } = useAppStore(state => ({
        manualCloseTrade: state.manualCloseTrade,
        toggleBottomPanel: state.toggleBottomPanel,
        setSelectedBacktestSession: state.setSelectedBacktestSession,
        toggleComparisonSessionId: state.toggleComparisonSessionId,
        setShowComparisonModal: state.setShowComparisonModal,
        setSelectedSessionFromHistory: state.setSelectedSessionFromHistory,
        setActivePair: state.setActivePair,
        showConfirmation: state.showConfirmation,
    }));

    const [activeTab, setActiveTab] = useState<'open' | 'history' | 'session' | 'journal' | 'backtests' | 'logs'>('open');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'exitTime', direction: 'desc' });
    const [debriefingTrade, setDebriefingTrade] = useState<{ id: string; analysis: string; isLoading: boolean; error: string; } | null>(null);

    const allClosedTrades = useMemo(() => {
        const closedTradesSource = (tradingMode === 'Backtest' ? backtestClosedTrades : trades);
        const allClosed = closedTradesSource.filter(t => t.status === 'closed');

        if (tradingMode === 'Backtest') {
            return allClosed; // Backtest history is self-contained and reset with each run.
        }

        const activeSession = currentSession.get(tradingMode);
        // For Paper/Live, filter by the active session ID.
        if (activeSession) {
            return allClosed.filter(t => t.sessionId === activeSession.id);
        }

        // If no session is active, the history for the "current session" is empty.
        return [];
    }, [tradingMode, backtestClosedTrades, trades, currentSession]);


    useEffect(() => {
        if (debriefingTrade && debriefingTrade.isLoading && !debriefingTrade.analysis) {
            const tradeToDebrief = [...allClosedTrades, ...backtestClosedTrades].find(t => t.id === debriefingTrade.id);
            if (tradeToDebrief) {
                (async () => {
                    try {
                        const { rawCandlesMap, language } = useAppStore.getState();
                        const allCandles = rawCandlesMap.get(tradeToDebrief.pair) || [];
                        const tradeStartIndex = allCandles.findIndex(c => c.time >= tradeToDebrief.time);
                        const contextStartIndex = Math.max(0, tradeStartIndex - 50);
                        const tradeEndIndex = allCandles.findIndex(c => c.time >= (tradeToDebrief.exitTime || 0));
                        const contextEndIndex = Math.min(allCandles.length -1, tradeEndIndex + 10);
                        
                        const contextCandles = allCandles.slice(contextStartIndex, contextEndIndex);
                        if (contextCandles.length === 0) {
                            throw new Error("debrief_error_no_data");
                        }

                        const tradeContext = `
                            - Trade Direction: ${tradeToDebrief.direction}
                            - Entry Price: ${tradeToDebrief.entryPrice.toFixed(4)} at ${new Date(tradeToDebrief.time).toISOString()}
                            - Initial Stop Loss: ${tradeToDebrief.sl.toFixed(4)}
                            - Initial Take Profit: ${tradeToDebrief.tp.toFixed(4)}
                            - Exit Price: ${tradeToDebrief.exitPrice?.toFixed(4)} at ${new Date(tradeToDebrief.exitTime || 0).toISOString()}
                            - Exit Reason: ${tradeToDebrief.exitReason}
                            - P&L: ${tradeToDebrief.pnl?.toFixed(2)}%
                        `;
                        const candleData = contextCandles.map(c => ({ o: c.open, h: c.high, l: c.low, c: c.close, t: c.time }));
                        const prompt = `Here is the trade to analyze:\n${tradeContext}\n\nHere is the chart data around the trade (entry is within this data):\n${JSON.stringify(candleData)}`;
                        const systemInstruction = `You are an expert trading coach. Your task is to provide a concise debrief of a closed trade.
- Analyze the provided trade details and chart data.
- Be objective and constructive.
- Your response MUST be in markdown format.
- Your response must have exactly two sections: "### ${t('debrief_strong_points')}" and "### ${t('debrief_improvements')}".
- Under each section, provide 1 to 2 bullet points.
- Keep the points extremely concise and directly related to the trade data.
- Respond exclusively in the user's language which is ${language}.`;


                        const analysis = await analyzeTradeForDebrief(prompt, systemInstruction);
                        const sanitizedHtml = DOMPurify.sanitize(await marked(analysis));
                        setDebriefingTrade({ id: tradeToDebrief.id, analysis: sanitizedHtml, isLoading: false, error: '' });
                    } catch (err: any) {
                        const messageKey = err.message || 'debrief_error';
                        setDebriefingTrade({ id: tradeToDebrief.id, analysis: '', isLoading: false, error: t(messageKey) });
                    }
                })();
            }
        }
    }, [debriefingTrade, allClosedTrades, backtestClosedTrades, t]);
    
    const handleDebriefClick = (tradeId: string) => {
        if (debriefingTrade?.id === tradeId) {
            setDebriefingTrade(null); // Toggle off
        } else {
            setDebriefingTrade({ id: tradeId, isLoading: true, analysis: '', error: '' });
        }
    };


    const currentlyOpenTrades = useMemo(() => {
        return (openTrades.get(tradingMode) || []).filter(t => t.status === 'open').sort((a, b) => b.time - a.time);
    }, [openTrades, tradingMode]);

    const activeSession = useMemo(() => {
        return currentSession.get(tradingMode);
    }, [currentSession, tradingMode]);
    


    const sessionStats = useMemo<BacktestStats | null>(() => {
        if (!activeSession || !activeSession.id || tradingMode === 'Backtest' || !globalRiskSettings) {
            return null;
        }
        const sessionClosedTrades = trades.filter(t => t.status === 'closed' && t.sessionId === activeSession.id);
        const capital = globalRiskSettings.totalCapital;
        return calculateBacktestStats(sessionClosedTrades, capital);
    }, [trades, activeSession, globalRiskSettings, tradingMode]);


    useEffect(() => {
        if (currentlyOpenTrades.length === 0 && activeTab === 'open' && tradingMode === 'Backtest') {
            setActiveTab('backtests');
        } else if (currentlyOpenTrades.length === 0 && activeTab === 'open') {
             setActiveTab(sessionStats ? 'session' : 'history');
        }
    }, [currentlyOpenTrades.length, activeTab, allClosedTrades.length, sessionStats, tradingMode]);

    const sortedClosedTrades = useMemo(() => {
        const sortableTrades = [...allClosedTrades];
        if (sortConfig !== null) {
            sortableTrades.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableTrades;
    }, [allClosedTrades, sortConfig]);

    const handleDownloadCSV = () => { /* ... implementation ... */ };

    const renderOpenTrades = () => (
        currentlyOpenTrades.length === 0 ? (
             <div className="flex items-center justify-center h-full text-base text-zinc-400">
                {t('open_trades_no_trades', { mode: tradingMode })}
            </div>
        ) : (
            <div className="text-xs">
                <div className="sticky top-0 grid grid-cols-12 gap-4 px-4 py-2 bg-zinc-800 backdrop-blur-sm font-semibold text-zinc-400 border-b border-zinc-700 z-10">
                    <div className="col-span-2">{t('header_pair')}</div>
                    <div className="col-span-3">{t('header_strategy')}</div>
                    <div className="col-span-1">{t('header_direction')}</div>
                    <div className="col-span-1 text-right">{t('header_entry')}</div>
                    <div className="col-span-1 text-right">{t('header_size')}</div>
                    <div className="col-span-2 text-right">{t('header_sl_tp')}</div>
                    <div className="col-span-1 text-right">{t('header_pnl')}</div>
                    <div className="col-span-1 text-right">{t('header_action')}</div>
                </div>
                <div className="divide-y divide-zinc-700/50">
                    {currentlyOpenTrades.map(trade => {
                        const [base, quote] = trade.pair.split('/');
                        const strategyName = trade.strategyName || t(trade.strategyNameKey!);
                        return (
                            <div key={trade.id} className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-zinc-900/50 transition-colors">
                                <div className="col-span-2">
                                    <button onClick={() => setActivePair(trade.pair)} className="text-left hover:text-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 rounded">
                                        <div className="font-semibold text-zinc-100">{base}</div>
                                        <div className="text-zinc-400">{quote}</div>
                                    </button>
                                </div>
                                <div className="col-span-3">
                                    <div className="font-semibold text-zinc-200">{strategyName}</div>
                                    <div className="text-zinc-400">Timeframe: {trade.timeframe}</div>
                                </div>
                                <div className={`col-span-1 flex items-center gap-1 font-semibold ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.direction === 'LONG' ? <ArrowLongUpIcon className="w-4 h-4"/> : <ArrowLongDownIcon className="w-4 h-4" />}
                                    {trade.direction}
                                </div>
                                <div className="col-span-1 text-right font-mono text-zinc-200">${trade.entryPrice.toFixed(4)}</div>
                                <div className="col-span-1 text-right font-mono text-zinc-200">${trade.positionSize.toFixed(2)}</div>
                                <div className="col-span-2 text-right font-mono">
                                    <div className="text-red-400">${trade.sl.toFixed(4)}</div>
                                    <div className="text-green-400">${trade.tp.toFixed(4)}</div>
                                </div>
                                <div className="col-span-1 text-right">
                                    <LivePnl trade={trade} candles={rawCandlesMap.get(trade.pair)} />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={() => manualCloseTrade(trade.id)}
                                        className="px-2 py-1 text-xs font-semibold text-zinc-900 bg-sky-500 hover:bg-sky-400 rounded-md shadow transition-colors"
                                        title={t('close_position_tooltip')}
                                    >
                                        {t('close_position_button')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    );

    const renderHistory = () => (
         sortedClosedTrades.length === 0 ? (
             <div className="flex items-center justify-center h-full text-base text-zinc-400">
                {t('history_no_trades')}
            </div>
        ) : (
            <div className="text-xs">
                <div className="sticky top-0 grid grid-cols-[1fr,2fr,1fr,2fr,1fr,2fr,1fr,2fr,1fr,24px] gap-4 px-4 py-2 bg-zinc-800 font-semibold text-zinc-400 border-b border-zinc-700 z-10">
                    <div className="col-span-2">{t('header_pair')}</div>
                    <div>{t('header_direction')}</div>
                    <div className="text-right">{t('header_entry_exit')}</div>
                    <div className="text-right">{t('header_size')}</div>
                    <div className="text-right">
                        <SortableHeader label={t('header_pnl')} sortKey="pnlAmount" sortConfig={sortConfig} setSortConfig={setSortConfig} className="justify-end"/>
                    </div>
                    <div className="text-right">
                        <SortableHeader label={t('header_rr')} sortKey="plannedRR" sortConfig={sortConfig} setSortConfig={setSortConfig} className="justify-end"/>
                    </div>
                    <div className="text-right">
                         <SortableHeader label={t('header_duration')} sortKey="durationMs" sortConfig={sortConfig} setSortConfig={setSortConfig} className="justify-end"/>
                    </div>
                    <div>{t('header_reason')}</div>
                    <div></div>
                </div>
                <div className="divide-y divide-zinc-700/50">
                    {sortedClosedTrades.map(trade => {
                        const strategyName = trade.strategyName || t(trade.strategyNameKey!);
                        return (
                         <React.Fragment key={trade.id}>
                            <div className="grid grid-cols-[1fr,2fr,1fr,2fr,1fr,2fr,1fr,2fr,1fr,24px] gap-4 px-4 py-2.5 items-center hover:bg-zinc-900/50 transition-colors">
                                <div className="col-span-2">
                                    <div className="font-semibold text-zinc-100">{trade.pair}</div>
                                    <div className="text-zinc-400">{strategyName}</div>
                                </div>
                                <div className={`flex items-center gap-1 font-semibold ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.direction === 'LONG' ? <ArrowLongUpIcon className="w-4 h-4"/> : <ArrowLongDownIcon className="w-4 h-4" />}
                                    {trade.direction}
                                </div>
                                <div className="text-right font-mono text-zinc-300">
                                    <div>${trade.entryPrice.toFixed(4)}</div>
                                    <div>${(trade.exitPrice || 0).toFixed(4)}</div>
                                </div>
                                <div className="text-right font-mono text-zinc-300">${trade.positionSize.toFixed(2)}</div>
                                <div className={`text-right font-mono font-semibold ${(trade.pnlAmount || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    <div>{(trade.pnlAmount || 0) >= 0 ? '+' : ''}${(trade.pnlAmount || 0).toFixed(2)}</div>
                                    <div className="text-xs">({(trade.pnl || 0).toFixed(2)}%)</div>
                                </div>
                                <div className="text-right font-mono text-zinc-300">
                                    <div>{trade.realizedRR?.toFixed(2)}</div>
                                    <div className="text-xs text-zinc-500">({trade.plannedRR?.toFixed(2)})</div>
                                </div>
                                <div className="text-right font-mono text-zinc-300">{trade.duration || 'N/A'}</div>
                                <div className="text-zinc-400">{trade.exitReason}</div>
                                <div className="flex justify-end">
                                    <button onClick={() => handleDebriefClick(trade.id)} title={t('debrief_button_tooltip')} className="p-1 text-zinc-400 hover:text-amber-400 rounded-full hover:bg-zinc-700 transition-colors">
                                        <LightBulbIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {debriefingTrade?.id === trade.id && (
                                <div className="animate-fade-in-down bg-zinc-900/70 p-4">
                                    {debriefingTrade.isLoading && <div className="flex items-center justify-center gap-2 text-sm text-zinc-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>{t('debrief_loading')}</div>}
                                    {debriefingTrade.error && <div className="flex items-center gap-2 text-sm text-red-400"><ExclamationTriangleIcon className="w-4 h-4"/>{debriefingTrade.error}</div>}
                                    {debriefingTrade.analysis && (
                                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-headings:text-amber-400" dangerouslySetInnerHTML={{ __html: debriefingTrade.analysis }} />
                                    )}
                                </div>
                            )}
                         </React.Fragment>
                    )})}
                </div>
            </div>
        )
    );
    
    const renderJournal = () => (
        sessionHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base text-zinc-400">
                {t('journal_no_sessions')}
            </div>
        ) : (
            <div className="text-xs">
                <div className="sticky top-0 grid grid-cols-10 gap-4 px-4 py-2 bg-zinc-800 font-semibold text-zinc-400 border-b border-zinc-700 z-10">
                    <div className="col-span-3">{t('header_date')}</div>
                    <div className="col-span-3">{t('header_strategy')}</div>
                    <div className="col-span-1">{t('header_mode')}</div>
                    <div className="col-span-1 text-right">{t('header_trades')}</div>
                    <div className="col-span-1 text-right">{t('header_win_rate')}</div>
                    <div className="col-span-1 text-right">{t('header_net_profit')}</div>
                </div>
                <div className="divide-y divide-zinc-700/50">
                    {sessionHistory.map(session => (
                        <button key={session.id} onClick={() => setSelectedSessionFromHistory(session)} className="w-full text-left grid grid-cols-10 gap-4 px-4 py-2.5 items-center hover:bg-zinc-900/50 transition-colors">
                            <div className="col-span-3 font-semibold">{new Date(session.startTime).toLocaleString('fr-FR')}</div>
                            <div className="col-span-3">{session.strategyName || t(session.strategyNameKey!)}</div>
                            <div className="col-span-1"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${getModeStyles(session.mode)}`}>{session.mode}</span></div>
                            <div className="col-span-1 text-right font-mono">{session.stats.totalTrades}</div>
                            <div className="col-span-1 text-right font-mono text-sky-400">{session.stats.winRate.toFixed(1)}%</div>
                            <div className={`col-span-1 text-right font-mono font-semibold ${session.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {session.stats.netProfit.toFixed(2)}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    );

    const renderBacktestsHistory = () => (
         <div className="flex flex-col h-full">
            {backtestHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-base text-zinc-400">
                    {t('backtests_no_backtests')}
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto">
                    <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-400 bg-zinc-800 border-b border-zinc-700">
                        <div className="col-span-1"></div>
                        <div className="col-span-3">{t('header_pair_strategy')}</div>
                        <div className="col-span-2">{t('header_date')}</div>
                        <div className="col-span-2 text-right">{t('header_net_profit')}</div>
                        <div className="col-span-2 text-right">{t('header_win_rate')}</div>
                        <div className="col-span-2 text-right">{t('header_trades')}</div>
                    </div>
                    <div className="divide-y divide-zinc-700/50">
                        {backtestHistory.map(session => (
                            <div key={session.id} className="grid grid-cols-12 gap-4 px-4 py-2 text-xs items-center hover:bg-zinc-900/50 transition-colors">
                                <div className="col-span-1">
                                    <input
                                        type="checkbox"
                                        checked={comparisonSessionIds.includes(session.id)}
                                        onChange={() => toggleComparisonSessionId(session.id)}
                                        className="rounded bg-zinc-700 border-zinc-600 text-sky-500 focus:ring-sky-500"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <button onClick={() => setSelectedBacktestSession(session)} className="font-semibold text-left hover:text-sky-400">
                                        <div>{session.pair} ({session.timeframe})</div>
                                        <div className="text-zinc-400">{session.strategyName || t(session.strategyNameKey!)}</div>
                                    </button>
                                </div>
                                <div className="col-span-2 text-zinc-400">{new Date(session.date).toLocaleDateString('fr-FR')}</div>
                                <div className={`col-span-2 text-right font-mono font-semibold ${session.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{session.stats.netProfit.toFixed(2)}</div>
                                <div className="col-span-2 text-right font-mono text-sky-400">{session.stats.winRate.toFixed(2)}%</div>
                                <div className="col-span-2 text-right font-mono">{session.stats.totalTrades}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <div className="flex-shrink-0 p-3 mt-auto border-t border-zinc-700/50">
                <button
                    onClick={() => setShowComparisonModal(true)}
                    disabled={comparisonSessionIds.length !== 2}
                    className="w-full px-4 py-2 text-sm font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
                >
                    {t('bottom_panel_compare_button')}
                </button>
            </div>
        </div>
    );

    const renderLogs = () => (
        logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base text-zinc-400">
                {t('logs_no_logs')}
            </div>
        ) : (
            <div className="text-xs font-mono">
                {logs.map((log, index) => {
                    let color = 'text-zinc-400';
                    if (log.type === 'signal') color = 'text-sky-400';
                    else if (log.type === 'trade') color = 'text-green-400';
                    else if (log.type === 'error' || log.type === 'risk') color = 'text-red-400';
                    
                    return (
                        <div key={index} className={`flex gap-3 px-4 py-1 border-b border-zinc-700/50 ${color}`}>
                            <span className="flex-shrink-0 text-zinc-500">{new Date(log.time).toLocaleTimeString('fr-FR')}</span>
                            <span className="flex-grow">{t(log.messageKey, log.messagePayload)}</span>
                        </div>
                    );
                })}
            </div>
        )
    );

    const renderSessionStats = () => {
        if (!activeSession) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-base text-zinc-400 gap-2 p-4 text-center">
                    <ChartPieIcon className="w-10 h-10 text-zinc-600" />
                    <span className="font-semibold">{t('session_no_session')}</span>
                    <span className="text-xs">{t('session_no_session_subtitle')}</span>
                </div>
            );
        }
        if (!sessionStats || sessionStats.totalTrades === 0) {
             return (
                 <div className="flex flex-col items-center justify-center h-full text-base text-zinc-400 gap-2 p-4 text-center">
                    <ChartPieIcon className="w-10 h-10 text-zinc-600" />
                    <span className="font-semibold">{t('session_waiting_for_trades')}</span>
                    <span className="text-xs">{t('session_waiting_for_trades_subtitle')}</span>
                </div>
             );
        }

        const winPercentage = sessionStats.winRate;
        const lossPercentage = 100 - sessionStats.winRate;

        return (
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label={t('stat_net_profit')} value={`$${sessionStats.netProfit.toFixed(2)}`} className={sessionStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                    <StatCard label={t('stat_profit_factor')} value={isFinite(sessionStats.profitFactor) ? sessionStats.profitFactor.toFixed(2) : '∞'} />
                    <StatCard label={t('stat_total_trades')} value={sessionStats.totalTrades} />
                    <StatCard label={t('stat_win_rate')} value={`${sessionStats.winRate.toFixed(2)}%`} className="text-sky-400" />
                </div>
                
                <div className="pt-2">
                    <div className="flex h-4 rounded-full overflow-hidden bg-zinc-900">
                        <div style={{ width: `${winPercentage}%`}} className="bg-green-500" title={`${t('stat_winners')}: ${winPercentage.toFixed(1)}%`}></div>
                        <div style={{ width: `${lossPercentage}%`}} className="bg-red-500" title={`${t('stat_losers')}: ${lossPercentage.toFixed(1)}%`}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-green-400">{sessionStats.winningTrades} {t('stat_winners')}</span>
                        <span className="text-red-400">{sessionStats.losingTrades} {t('stat_losers')}</span>
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard label={t('stat_avg_gain')} value={`+$${sessionStats.averageGain.toFixed(2)}`} className="text-green-400" />
                    <StatCard label={t('stat_avg_loss')} value={`-$${sessionStats.averageLoss.toFixed(2)}`} className="text-red-400" />
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'open': return renderOpenTrades();
            case 'history': return renderHistory();
            case 'session': return renderSessionStats();
            case 'journal': return renderJournal();
            case 'backtests': return renderBacktestsHistory();
            case 'logs': return renderLogs();
            default: return null;
        }
    }

    const handleClear = () => {
        if(isStrategyEngineRunning) return;

        let config: Parameters<typeof showConfirmation>[0] | null = null;

        if (activeTab === 'history') {
            config = {
                titleKey: 'confirm_clear_history_title',
                messageKey: 'confirm_clear_history_message',
                confirmAction: 'clearHistory',
                confirmButtonTextKey: 'delete',
                confirmButtonVariant: 'danger',
            };
        } else if (activeTab === 'backtests') {
            config = {
                titleKey: 'confirm_clear_backtests_title',
                messageKey: 'confirm_clear_backtests_message',
                confirmAction: 'clearBacktestHistory',
                confirmButtonTextKey: 'delete',
                confirmButtonVariant: 'danger',
            };
        } else if (activeTab === 'journal') {
            config = {
                titleKey: 'confirm_clear_journal_title',
                messageKey: 'confirm_clear_journal_message',
                confirmAction: 'clearSessionHistory',
                confirmButtonTextKey: 'delete',
                confirmButtonVariant: 'danger',
            };
        }

        if (config) {
            showConfirmation(config);
        }
    }

    return (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 h-full w-full flex flex-col shadow-inner overflow-hidden">
            {isBacktestModeActive && <BacktestControls />}

            <div className="p-3 flex justify-between items-center flex-shrink-0 border-b border-zinc-700/50">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setActiveTab('open')} 
                        title={t('bottom_panel_open_trades_tab')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'open' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        <RectangleGroupIcon className="w-4 h-4"/>
                        <span className="hidden lg:inline">{t('bottom_panel_open_trades_tab')}</span>
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-sky-500/20">{currentlyOpenTrades.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        title={t('bottom_panel_history_tab')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'history' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        <DocumentChartBarIcon className="w-4 h-4"/>
                        <span className="hidden lg:inline">{t('bottom_panel_history_tab')}</span>
                    </button>
                    {tradingMode !== 'Backtest' && (
                        <>
                            <button 
                                onClick={() => setActiveTab('session')}
                                title={t('bottom_panel_session_tab')}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'session' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                <ChartPieIcon className="w-4 h-4" />
                                <span className="hidden lg:inline">{t('bottom_panel_session_tab')}</span>
                            </button>
                             <button 
                                onClick={() => setActiveTab('journal')} 
                                title={t('bottom_panel_journal_tab')}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'journal' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                <span className="hidden lg:inline">{t('bottom_panel_journal_tab')}</span>
                            </button>
                        </>
                    )}
                     {tradingMode === 'Backtest' && (
                         <button 
                            onClick={() => setActiveTab('backtests')}
                            title={t('bottom_panel_backtests_tab')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'backtests' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            <ClockIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">{t('bottom_panel_backtests_tab')}</span>
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-sky-500/20">{backtestHistory.length}</span>
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        title={t('bottom_panel_logs_tab')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center gap-2 ${activeTab === 'logs' ? 'bg-sky-500/10 text-sky-400' : 'text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        <Bars3Icon className="w-4 h-4" />
                        <span className="hidden lg:inline">{t('bottom_panel_logs_tab')}</span>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {(['history', 'backtests', 'journal'].includes(activeTab)) && !isCollapsed && (
                        <>
                             <button 
                                onClick={handleClear}
                                disabled={isStrategyEngineRunning}
                                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-red-500 transition-colors disabled:text-zinc-600 disabled:cursor-not-allowed"
                                title={t(isStrategyEngineRunning ? 'clear_history_tooltip' : 'clear_history_tooltip_alt')}
                            >
                                <TrashIcon className="w-4 h-4" />
                                {t('clear_button')}
                            </button>
                        </>
                    )}
                    <button 
                        onClick={toggleBottomPanel}
                        className="p-1 text-sky-500 hover:text-sky-400 transition-colors"
                        aria-label={t(isCollapsed ? "expand_panel" : "collapse_panel")}
                    >
                        {isCollapsed ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
            
            <div className={`flex-grow overflow-y-auto min-h-0 ${isCollapsed ? 'hidden' : 'animate-fade-in'}`}>
                {renderContent()}
            </div>
        </div>
    );
};

export default React.memo(TradeHistoryPanel);