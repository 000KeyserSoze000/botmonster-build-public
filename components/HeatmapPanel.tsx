import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';

const HEATMAP_TIMEFRAMES = ['15m', '1H', '4H', '1D'];

const HeatmapCell: React.FC<{ pair: string, timeframe: string }> = ({ pair, timeframe }) => {
    const t = useTranslation();
    const { heatmapData, setActivePair, setTimeframe } = useAppStore(state => ({
        heatmapData: state.heatmapData,
        setActivePair: state.setActivePair,
        setTimeframe: state.setTimeframe,
    }));

    const data = heatmapData.get(`${pair}-${timeframe}`);
    
    const handleClick = () => {
        setActivePair(pair);
        setTimeframe(timeframe);
    };

    if (!data) {
        return <td className="p-1"><div className="w-full h-10 bg-zinc-700/50 rounded-md animate-pulse"></div></td>;
    }

    const getBackgroundColor = (score: number) => {
        if (score > 2) return 'bg-green-500/60 hover:bg-green-500/80';
        if (score > 0.5) return 'bg-green-500/40 hover:bg-green-500/60';
        if (score < -2) return 'bg-red-500/60 hover:bg-red-500/80';
        if (score < -0.5) return 'bg-red-500/40 hover:bg-red-500/60';
        return 'bg-zinc-700/50 hover:bg-zinc-700/80';
    };

    return (
        <td className="p-1">
            <button 
                onClick={handleClick}
                title={t(data.statusTextKey, data.statusTextPayload)}
                className={`relative w-full h-10 rounded-md transition-colors duration-300 flex items-center justify-center text-white font-bold text-xs ${getBackgroundColor(data.score)}`}
            >
                {data.isHot && (
                    <span className="absolute inset-0 rounded-md ring-2 ring-offset-2 ring-offset-zinc-900 ring-amber-400 animate-pulse"></span>
                )}
                <div className="flex flex-col items-center">
                    <span>{`${(data.trendStrength * 100).toFixed(1)}%`}</span>
                    <div className="w-3/4 h-1 bg-black/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${data.signalProgress * 100}%`}}></div>
                    </div>
                </div>
            </button>
        </td>
    );
};

const HeatmapPanel: React.FC = () => {
    const t = useTranslation();
    const { allWatchlists, activeWatchlistName, quoteAsset } = useAppStore(state => ({
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        quoteAsset: state.quoteAsset,
    }));

    const watchedPairs = (allWatchlists[activeWatchlistName] || []).map(base => `${base}/${quoteAsset}`);

    if (watchedPairs.length === 0) {
        return <div className="p-4 text-center text-zinc-500 text-sm">{t('watchlist_empty')}</div>
    }

    return (
        <div>
            <h3 className="text-base font-semibold text-zinc-200 mb-2 px-1">{t('heatmap_panel_title')}</h3>
            <table className="w-full border-separate" style={{ borderSpacing: '0 0.25rem' }}>
                <thead>
                    <tr className="text-xs text-zinc-400">
                        <th className="p-1 text-left font-semibold">{t('heatmap_pair_header')}</th>
                        {HEATMAP_TIMEFRAMES.map(tf => <th key={tf} className="p-1 w-1/5 font-semibold">{tf}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {watchedPairs.map(pair => (
                        <tr key={pair}>
                            <td className="p-1 font-semibold text-sm text-zinc-300">{pair.split('/')[0]}</td>
                            {HEATMAP_TIMEFRAMES.map(tf => <HeatmapCell key={tf} pair={pair} timeframe={tf} />)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HeatmapPanel;