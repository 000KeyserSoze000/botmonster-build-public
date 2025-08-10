import React from 'react';
import type { SessionSummary, Language } from '../types';
import { ChartPieIcon, XMarkIcon, ArrowDownTrayIcon } from './icons/Icons';
import { useAppStore } from '../store/useAppStore';
import { exportTradesToCSV } from '../services/exportService';
import { useTranslation } from '../hooks/useTranslation';

interface SessionSummaryModalProps {
    sessionSummary: SessionSummary | null;
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number; className?: string; helpText?: string }> = ({ label, value, className, helpText }) => (
    <div className="bg-zinc-800/50 p-3 rounded-lg" title={helpText}>
        <div className="text-sm text-zinc-400">{label}</div>
        <div className={`text-xl font-bold ${className}`}>{value}</div>
    </div>
);

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ sessionSummary, onClose }) => {
    const allTrades = useAppStore(state => state.trades);
    const t = useTranslation();
    const { language } = useAppStore(state => ({ language: state.language }));

    if (!sessionSummary) return null;

    const handleExport = () => {
        const sessionTrades = allTrades.filter(t => t.sessionId === sessionSummary.id);
        const enrichedTrades = sessionTrades.map(trade => ({
            ...trade,
            strategyName: trade.strategyName || t(trade.strategyNameKey!)
        }));
        const sessionName = `${sessionSummary.strategyName || t(sessionSummary.strategyNameKey!)}_${new Date(sessionSummary.startTime).toISOString()}`;
        exportTradesToCSV(enrichedTrades, sessionName);
    };

    const stats = sessionSummary.stats;
    const winPercentage = stats.winRate;
    const lossPercentage = 100 - stats.winRate;
    const strategyName = sessionSummary.strategyName || t(sessionSummary.strategyNameKey!);
    
    const localeMap: Record<Language, string> = {
        en: 'en-US', fr: 'fr-FR',
    };
    const locale = localeMap[language];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-2xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                            <ChartPieIcon className="w-6 h-6 text-sky-500"/>
                            {t('session_summary_title')}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                            {strategyName} ({sessionSummary.mode}) - {new Date(sessionSummary.startTime).toLocaleString(locale)}
                        </p>
                    </div>
                     <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow pr-2 overflow-y-auto">
                    {stats.totalTrades === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <p>{t('session_summary_no_trades')}</p>
                        </div>
                    ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label={t('stat_net_profit')} value={`$${stats.netProfit.toFixed(2)}`} className={stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                            <StatCard label={t('stat_profit_factor')} value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'} />
                            <StatCard label={t('stat_total_trades')} value={stats.totalTrades} />
                            <StatCard label={t('stat_win_rate')} value={`${stats.winRate.toFixed(2)}%`} className="text-sky-400" />
                        </div>
                        
                        <div className="mt-4">
                            <div className="flex h-4 rounded-full overflow-hidden bg-zinc-900">
                                <div style={{ width: `${winPercentage}%`}} className="bg-green-500" title={`${t('stat_winners')}: ${winPercentage.toFixed(1)}%`}></div>
                                <div style={{ width: `${lossPercentage}%`}} className="bg-red-500" title={`${t('stat_losers')}: ${lossPercentage.toFixed(1)}%`}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-green-400">{stats.winningTrades} {t('stat_winners')}</span>
                                <span className="text-red-400">{stats.losingTrades} {t('stat_losers')}</span>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <StatCard label={t('stat_avg_gain')} value={`+${stats.averageGain.toFixed(2)}`} className="text-green-400" />
                            <StatCard label={t('stat_avg_loss')} value={`-${stats.averageLoss.toFixed(2)}`} className="text-red-400" />
                            <StatCard label={t('stat_max_drawdown')} value={`${stats.maxDrawdown.toFixed(2)}%`} className="text-yellow-500" />
                        </div>
                    </>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 flex justify-between items-center">
                     <button
                        type="button"
                        onClick={handleExport}
                        disabled={stats.totalTrades === 0}
                        className="flex items-center gap-2 rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:text-sm transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5"/>
                        {t('download_log_button')}
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        {t('close')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SessionSummaryModal;