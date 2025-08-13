import React from 'react';
import type { PortfolioBacktestSession, Language } from '../types';
import { ChartPieIcon, XMarkIcon } from './icons/Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

interface PortfolioSummaryModalProps {
    session: PortfolioBacktestSession | null;
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; className?: string; helpText?: string; }> = ({ label, value, className, helpText }) => (
    <div className="bg-zinc-900/50 p-3 rounded-lg" title={helpText}>
        <div className="text-sm text-zinc-400">{label}</div>
        <div className={`text-xl font-bold ${className}`}>{value}</div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  const t = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 p-2 border border-zinc-700 rounded-md shadow-lg">
        <p className="label text-sm text-zinc-400">{`${new Date(label).toLocaleString()}`}</p>
        <p className="intro text-base font-bold text-sky-400">{`${t('backtest_summary_equity_tooltip', { value: payload[0].value.toFixed(2) })}`}</p>
      </div>
    );
  }
  return null;
};

export const PortfolioSummaryModal: React.FC<PortfolioSummaryModalProps> = ({ session, onClose }) => {
    const t = useTranslation();
    const { language } = useAppStore(state => ({ language: state.language }));
    if (!session) return null;
    const { globalStats, performanceByPair } = session.stats;
    const sortedPairs = Object.entries(performanceByPair).sort(([,a], [,b]) => b.netProfit - a.netProfit);
    const localeMap: Record<Language, string> = {
        en: 'en-US', fr: 'fr-FR',
    };
    const locale = localeMap[language] || 'en-US';
    const strategyName = session.strategyName || t(session.strategyNameKey!);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-5xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                            <ChartPieIcon className="w-6 h-6 text-indigo-500"/>
                            {t('strategies_run_portfolio_backtest')}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Watchlist: {session.watchlistName} - Stratégie: {strategyName} - {new Date(session.date).toLocaleString(locale)}
                        </p>
                    </div>
                     <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow pr-2 -mr-2 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <div className="h-64 mb-4 bg-zinc-900/50 p-4 rounded-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={globalStats.equityCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="equityColorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.7}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                        <XAxis dataKey="time" tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="value" orientation="right" tickFormatter={(value) => `$${Math.round(value/1000)}k`} stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#equityColorPortfolio)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label={t('stat_net_profit')} value={`${globalStats.netProfit.toFixed(2)}`} className={globalStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                                <StatCard label={t('stat_profit_factor')} value={isFinite(globalStats.profitFactor) ? globalStats.profitFactor.toFixed(2) : '∞'} />
                                <StatCard label={t('stat_total_trades')} value={globalStats.totalTrades} />
                                <StatCard label={t('stat_win_rate')} value={`${globalStats.winRate.toFixed(2)}%`} className="text-sky-400" />
                            </div>
                        </div>
                        <div className="col-span-1 bg-zinc-900/50 p-3 rounded-lg flex flex-col">
                            <h4 className="text-base font-semibold text-zinc-200 mb-2 flex-shrink-0">{t('stat_performance_title')}</h4>
                            <div className="flex-grow overflow-y-auto">
                                <div className="sticky top-0 grid grid-cols-3 gap-2 text-xs font-semibold text-zinc-400 bg-zinc-900/50 py-2">
                                    <span>{t('header_pair')}</span>
                                    <span className="text-right">{t('stat_net_profit')}</span>
                                    <span className="text-right">{t('stat_win_rate')}</span>
                                </div>
                                <div className="divide-y divide-zinc-700/50">
                                {sortedPairs.map(([pair, stats]) => (
                                    <div key={pair} className="grid grid-cols-3 gap-2 py-2 text-sm">
                                        <span className="font-semibold text-zinc-100">{pair.split('/')[0]}</span>
                                        <span className={`font-mono text-right ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{stats.netProfit.toFixed(2)}</span>
                                        <span className="font-mono text-right text-sky-400">{stats.winRate.toFixed(1)}%</span>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 text-right">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};