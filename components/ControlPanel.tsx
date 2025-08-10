
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { OptimizationResult, StrategySettings } from '../types';
import { XMarkIcon, ChartPieIcon, ChevronUpIcon, ChevronDownIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

type SortableKeys = 'netProfit' | 'winRate' | 'totalTrades' | 'profitFactor' | 'maxDrawdown';

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortableKeys;
    sortConfig: { key: SortableKeys; direction: 'asc' | 'desc' } | null;
    setSortConfig: (config: { key: SortableKeys; direction: 'asc' | 'desc' }) => void;
}> = ({ label, sortKey, sortConfig, setSortConfig }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;

    const handleClick = () => {
        const newDirection = direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key: sortKey, direction: newDirection });
    };

    return (
        <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={handleClick}>
            <div className="flex items-center">
                {label}
                {isSorted && (direction === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />)}
            </div>
        </th>
    );
};

const OptimizationSummaryModal: React.FC = () => {
    const t = useTranslation();
    const { results, clearOptimizationResults, applyOptimizationSettings } = useAppStore(state => ({
        results: state.optimizationResults,
        clearOptimizationResults: state.clearOptimizationResults,
        applyOptimizationSettings: state.applyOptimizationSettings,
    }));
    
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'netProfit', direction: 'desc' });

    const sortedResults = useMemo(() => {
        if (!results) return [];
        const sorted = [...results].sort((a, b) => {
            const aValue = a.stats[sortConfig.key];
            const bValue = b.stats[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [results, sortConfig]);

    if (!results) return null;

    const optimizedParams = Object.keys(results[0].settings).filter(key => {
        // A parameter is considered optimized if its value is not the same across all results.
        const firstValue = results[0].settings[key as keyof StrategySettings];
        return results.some(r => r.settings[key as keyof StrategySettings] !== firstValue);
    });

    const formatSettingLabel = (key: string): string => {
        const result = key.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-6xl w-full p-4 md:p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <ChartPieIcon className="w-6 h-6 text-amber-500" />
                        {t('opt_title')}
                    </h3>
                    <button onClick={clearOptimizationResults} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-zinc-700">
                        <thead className="bg-zinc-900/50 sticky top-0">
                            <tr>
                                {optimizedParams.map(param => (
                                    <th key={param} className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{formatSettingLabel(param)}</th>
                                ))}
                                <SortableHeader label={t('opt_profit_net')} sortKey="netProfit" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                                <SortableHeader label={t('opt_win_rate')} sortKey="winRate" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                                <SortableHeader label={t('opt_trades')} sortKey="totalTrades" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                                <SortableHeader label={t('opt_profit_factor')} sortKey="profitFactor" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                                <SortableHeader label={t('opt_max_drawdown')} sortKey="maxDrawdown" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('opt_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-zinc-800 divide-y divide-zinc-700/50">
                            {sortedResults.map((result, index) => (
                                <tr key={index} className="hover:bg-zinc-700/50 transition-colors">
                                    {optimizedParams.map(param => (
                                        <td key={param} className="px-4 py-3 whitespace-nowrap text-sm font-mono text-zinc-300">{(result.settings as any)[param]}</td>
                                    ))}
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-mono font-semibold ${result.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{result.stats.netProfit.toFixed(2)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-sky-400">{result.stats.winRate.toFixed(2)}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-zinc-300">{result.stats.totalTrades}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-zinc-300">{isFinite(result.stats.profitFactor) ? result.stats.profitFactor.toFixed(2) : '∞'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-yellow-500">{result.stats.maxDrawdown.toFixed(2)}%</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <button onClick={() => applyOptimizationSettings(result.settings)} className="px-3 py-1 text-xs font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600">
                                            {t('opt_apply')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 mt-6 text-right">
                    <button onClick={clearOptimizationResults} className="px-4 py-2 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-600">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

export default OptimizationSummaryModal;
