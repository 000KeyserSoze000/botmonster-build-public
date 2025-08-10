import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { BacktestSession, StrategySettings, Language } from '../types';
import { XMarkIcon, ChartPieIcon } from './icons/Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';

interface ComparisonModalProps {
    show: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const t = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 p-2 border border-zinc-700 rounded-md shadow-lg text-sm">
        <p className="label text-zinc-400">{`${new Date(label).toLocaleString()}`}</p>
        {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.color }}>
                {`${t(p.dataKey === 'A' ? 'comparison_session_a' : 'comparison_session_b')}: $${p.value.toFixed(2)}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatRow: React.FC<{ label: string; valueA: React.ReactNode; valueB: React.ReactNode; classNameA?: string; classNameB?: string; }> = ({ label, valueA, valueB, classNameA, classNameB }) => (
    <div className="flex justify-between items-center py-2 border-b border-zinc-700/50">
        <span className="text-zinc-400">{label}</span>
        <div className="flex gap-4 w-1/2">
            <span className={`w-1/2 text-right font-mono font-semibold ${classNameA}`}>{valueA}</span>
            <span className={`w-1/2 text-right font-mono font-semibold ${classNameB}`}>{valueB}</span>
        </div>
    </div>
);

const SettingsTable: React.FC<{ settingsA: StrategySettings, settingsB: StrategySettings }> = ({ settingsA, settingsB }) => {
    const t = useTranslation();
    const allKeys = Array.from(new Set([...Object.keys(settingsA), ...Object.keys(settingsB)]));

    const formatSettingLabel = (key: string): string => {
        const result = key.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
    };
    
    const formatSettingValue = (value: any): string => {
        if (typeof value === 'boolean') return value ? t('setting_value_enabled') : t('setting_value_disabled');
        return String(value);
    };

    return (
        <div className="bg-zinc-900/50 p-3 rounded-lg">
            <h4 className="text-base font-semibold text-zinc-200 mb-2">{t('comparison_settings_title')}</h4>
            {allKeys.filter(key => key !== 'strategyId' && key !== 'enabled').map(key => {
                const valueA = (settingsA as any)[key];
                const valueB = (settingsB as any)[key];
                const isDifferent = String(valueA) !== String(valueB);
                return (
                    <div key={key} className={`flex justify-between items-center py-1.5 text-sm ${isDifferent ? 'bg-sky-500/10' : ''}`}>
                        <span className="text-zinc-400">{formatSettingLabel(key)}:</span>
                        <div className="flex gap-4 w-1/2">
                            <span className="w-1/2 text-right font-mono text-zinc-100">{formatSettingValue(valueA)}</span>
                            <span className="w-1/2 text-right font-mono text-zinc-100">{formatSettingValue(valueB)}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};


const ComparisonModal: React.FC<ComparisonModalProps> = ({ show }) => {
    const t = useTranslation();
    const { 
        sessionIds, 
        backtestHistory, 
        setShowComparisonModal,
        language
    } = useAppStore(state => ({
        sessionIds: state.comparisonSessionIds,
        backtestHistory: state.backtestHistory,
        setShowComparisonModal: state.setShowComparisonModal,
        language: state.language
    }));
    
    const localeMap: Record<Language, string> = {
        en: 'en-US', fr: 'fr-FR',
    };
    const locale = localeMap[language] || 'en-US';

    const [sessionA, sessionB] = useMemo(() => {
        return backtestHistory.filter(s => sessionIds.includes(s.id)).sort((a,b) => a.date - b.date);
    }, [sessionIds, backtestHistory]);

    const combinedEquityData = useMemo(() => {
        if (!sessionA || !sessionB) return [];
        const combined = new Map<number, { time: number; A?: number; B?: number }>();
        
        const alignToStart = (curve: {time: number, value: number}[]) => {
            if (curve.length === 0) return [];
            const startTime = curve[0].time;
            return curve.map(point => ({...point, time: point.time - startTime }));
        };
        
        const alignedA = alignToStart(sessionA.stats.equityCurve);
        const alignedB = alignToStart(sessionB.stats.equityCurve);
        
        alignedA.forEach(point => {
            combined.set(point.time, { time: point.time, A: point.value });
        });
        alignedB.forEach(point => {
            const existing = combined.get(point.time) || { time: point.time };
            combined.set(point.time, { ...existing, B: point.value });
        });
        
        const sortedData = Array.from(combined.values()).sort((a, b) => a.time - b.time);
        
        // Forward fill missing data points
        for(let i = 1; i < sortedData.length; i++) {
            if (sortedData[i].A === undefined) sortedData[i].A = sortedData[i-1].A;
            if (sortedData[i].B === undefined) sortedData[i].B = sortedData[i-1].B;
        }

        return sortedData;
    }, [sessionA, sessionB]);

    if (!show || !sessionA || !sessionB) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-5xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <ChartPieIcon className="w-6 h-6 text-sky-500"/>
                        {t('comparison_modal_title')}
                    </h3>
                    <button onClick={() => setShowComparisonModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow pr-2 -mr-2 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="bg-zinc-900/50 p-3 rounded-lg">
                            <h4 className="font-semibold text-zinc-200">{t('comparison_session_a')}</h4>
                            <p className="text-xs text-zinc-400">{sessionA.pair} - {sessionA.strategyName || t(sessionA.strategyNameKey!)}</p>
                            <p className="text-xs text-zinc-400">{new Date(sessionA.date).toLocaleString(locale)}</p>
                        </div>
                        <div className="bg-zinc-900/50 p-3 rounded-lg">
                            <h4 className="font-semibold text-zinc-200">{t('comparison_session_b')}</h4>
                            <p className="text-xs text-zinc-400">{sessionB.pair} - {sessionB.strategyName || t(sessionB.strategyNameKey!)}</p>
                            <p className="text-xs text-zinc-400">{new Date(sessionB.date).toLocaleString(locale)}</p>
                        </div>
                    </div>

                     <div className="h-64 mb-4 bg-zinc-900/50 p-4 rounded-lg">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={combinedEquityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                                <XAxis dataKey="time" tick={false} axisLine={false} />
                                <YAxis orientation="right" tickFormatter={(value) => `$${Math.round(value/1000)}k`} stroke="#a1a1aa" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} name={t('comparison_session_a')} />
                                <Area type="monotone" dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name={t('comparison_session_b')} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="text-sm">
                        <StatRow label={t('stat_net_profit')} valueA={sessionA.stats.netProfit.toFixed(2)} valueB={sessionB.stats.netProfit.toFixed(2)} classNameA={sessionA.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} classNameB={sessionB.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                        <StatRow label={t('stat_win_rate')} valueA={`${sessionA.stats.winRate.toFixed(2)}%`} valueB={`${sessionB.stats.winRate.toFixed(2)}%`} classNameA="text-sky-400" classNameB="text-sky-400" />
                        <StatRow label={t('stat_total_trades')} valueA={sessionA.stats.totalTrades} valueB={sessionB.stats.totalTrades} />
                        <StatRow label={t('stat_profit_factor')} valueA={isFinite(sessionA.stats.profitFactor) ? sessionA.stats.profitFactor.toFixed(2) : '∞'} valueB={isFinite(sessionB.stats.profitFactor) ? sessionB.stats.profitFactor.toFixed(2) : '∞'} />
                        <StatRow label={t('stat_max_drawdown')} valueA={`${sessionA.stats.maxDrawdown.toFixed(2)}%`} valueB={`${sessionB.stats.maxDrawdown.toFixed(2)}%`} classNameA="text-yellow-500" classNameB="text-yellow-500" />
                    </div>

                    <div className="mt-6">
                        <SettingsTable settingsA={sessionA.settings} settingsB={sessionB.settings} />
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 text-right">
                    <button onClick={() => setShowComparisonModal(false)} className="px-4 py-2 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-600">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;