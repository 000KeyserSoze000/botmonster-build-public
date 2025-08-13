import React from 'react';
import type { BacktestSession, Language } from '../types';
import { ChartPieIcon, XMarkIcon } from './icons/Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

interface BacktestSummaryModalProps {
    session: BacktestSession | null;
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; className?: string; helpText?: string; isRow?: boolean }> = ({ label, value, className, helpText, isRow }) => (
    <div className={`bg-zinc-900/50 p-3 rounded-lg flex ${isRow ? 'flex-row items-center justify-between' : 'flex-col'}`} title={helpText}>
        <div className="text-sm text-zinc-400">{label}</div>
        <div className={`font-bold ${className} ${isRow ? 'text-lg' : 'text-xl'}`}>{value}</div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  const t = useTranslation();
  const { language } = useAppStore.getState();
  const localeMap: Record<Language, string> = {
    en: 'en-US', fr: 'fr-FR',
  };
  const locale = localeMap[language];
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 p-2 border border-zinc-700 rounded-md shadow-lg">
        <p className="label text-sm text-zinc-400">{`${new Date(label).toLocaleString(locale)}`}</p>
        <p className="intro text-base font-bold text-sky-400">{t('backtest_summary_equity_tooltip', { value: payload[0].value.toFixed(2) })}</p>
      </div>
    );
  }
  return null;
};

const formatSettingLabel = (key: string): string => {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const formatSettingValue = (value: any, t: (key: string, variables?: Record<string, string | number>) => string): string => {
    if (typeof value === 'boolean') {
        return value ? t('setting_value_enabled') : t('setting_value_disabled');
    }
    return String(value);
};


export const BacktestSummaryModal: React.FC<BacktestSummaryModalProps> = ({ session, onClose }) => {
    const t = useTranslation();
    const { language } = useAppStore.getState();
    const localeMap: Record<Language, string> = {
        en: 'en-US', fr: 'fr-FR',
    };
    const locale = localeMap[language];

    if (!session) return null;
    const stats = session.stats;
    const strategyName = session.strategyName || t(session.strategyNameKey!);
    
    const winPercentage = stats.winRate;
    const lossPercentage = 100 - stats.winRate;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-4xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                            <ChartPieIcon className="w-6 h-6 text-sky-500"/>
                            {t('backtest_summary_title')}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {session.pair} ({session.timeframe}) - {strategyName} - {new Date(session.date).toLocaleString(locale)}
                        </p>
                    </div>
                     <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow pr-2 -mr-2 overflow-y-auto">
                    {stats.totalTrades === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <p>{t('backtest_summary_no_trades')}</p>
                        </div>
                    ) : (
                    <>
                        <div className="h-64 mb-4 bg-zinc-900/50 p-4 rounded-lg">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.equityCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="equityColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                    <XAxis 
                                        dataKey="time" 
                                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} 
                                        stroke="#a1a1aa"
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        dataKey="value"
                                        orientation="right"
                                        tickFormatter={(value) => `$${Math.round(value/1000)}k`} 
                                        stroke="#a1a1aa"
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#equityColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                         <div className="mt-6">
                            <h4 className="text-base font-semibold text-zinc-200 mb-2">{t('backtest_summary_pnl_dist_title')}</h4>
                            <div className="h-48 bg-zinc-900/50 p-4 rounded-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.pnlDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                        <XAxis dataKey="bucket" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} allowDecimals={false} />
                                        <Tooltip cursor={{fill: 'rgba(113, 113, 122, 0.2)'}} contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}/>
                                        <Bar dataKey="count" name={t('backtest_summary_pnl_dist_label')}>
                                            {stats.pnlDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={parseFloat(entry.bucket) < 0 ? '#ef4444' : '#22c55e'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <StatCard label={t('stat_net_profit')} value={`${stats.netProfit.toFixed(2)}`} className={stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-zinc-900/50 p-3 rounded-lg space-y-2">
                                <h4 className="text-sm font-semibold text-zinc-300">{t('stat_duration_title')}</h4>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_avg_duration')}</span> <span className="font-mono text-zinc-200">{stats.averageDuration}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_avg_win_duration')}</span> <span className="font-mono text-green-400">{stats.averageWinDuration}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_avg_loss_duration')}</span> <span className="font-mono text-red-400">{stats.averageLossDuration}</span></div>
                            </div>
                             <div className="bg-zinc-900/50 p-3 rounded-lg space-y-2">
                                <h4 className="text-sm font-semibold text-zinc-300">{t('stat_performance_title')}</h4>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_best_trade')}</span> <span className="font-mono text-green-400">+{stats.bestTradePnl.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_worst_trade')}</span> <span className="font-mono text-red-400">{stats.worstTradePnl.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-400">{t('stat_avg_rr')}</span> <span className="font-mono text-sky-400">{stats.averageRR.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <StatCard label={t('stat_win_streak')} value={stats.longestWinningStreak} className="text-green-400" />
                           <StatCard label={t('stat_loss_streak')} value={stats.longestLosingStreak} className="text-red-400" />
                        </div>

                         <div className="mt-6 bg-zinc-900/50 p-4 rounded-lg">
                            <h4 className="text-base font-semibold text-zinc-200 mb-2">{t('backtest_summary_settings_title')}</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {Object.entries(session.settings).filter(([key]) => key !== 'strategyId' && key !== 'enabled').map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="text-zinc-400">{formatSettingLabel(key)}:</span>
                                        <span className="font-mono text-zinc-100">{formatSettingValue(value, t)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 text-right">
                     <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};