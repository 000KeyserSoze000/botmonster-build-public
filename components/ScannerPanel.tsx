
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CompassIcon, PlusIcon, RadarIcon, BoltIcon, CheckBadgeIcon, CheckCircleIcon, XMarkIcon, Cog8ToothIcon, QuestionMarkCircleIcon, RectangleGroupIcon } from './icons/Icons';
import type { AlertEvent, AlertEventType, MarketData, TrendStatusValue } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import HelpPanel from './HelpPanel';
import HeatmapPanel from './HeatmapPanel';
import CollapsibleSection from './CollapsibleSection';

const formatVolume = (volume: string) => {
    const volNum = parseFloat(volume);
    if (volNum >= 1_000_000_000) return `${(volNum / 1_000_000_000).toFixed(2)}B`;
    if (volNum >= 1_000_000) return `${(volNum / 1_000_000).toFixed(1)}M`;
    if (volNum >= 1_000) return `${(volNum / 1_000).toFixed(1)}K`;
    return volNum.toFixed(0);
};

const TrendIndicator: React.FC<{ status: TrendStatusValue }> = ({ status }) => {
    let bgColor = 'bg-zinc-600';
    if (status === 'bullish') bgColor = 'bg-green-500';
    else if (status === 'bearish') bgColor = 'bg-red-500';
    else if (status === 'loading') bgColor = 'bg-zinc-700 animate-pulse';
    
    return <div className={`w-3 h-3 rounded-sm ${bgColor}`}></div>;
};

const getAlertIcon = (type: AlertEventType) => {
    switch (type) {
        case 'signal': return <CheckBadgeIcon className="w-5 h-5 text-sky-400" />;
        case 'grab': return <BoltIcon className="w-5 h-5 text-amber-400" />;
        case 'tp': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
        case 'sl': return <XMarkIcon className="w-5 h-5 text-red-400" />;
        case 'step': default: return <RadarIcon className="w-5 h-5 text-zinc-400" />;
    }
};

const AlertsPanel: React.FC = () => {
    const t = useTranslation();
    const { alertFeed, reviewEventInChart } = useAppStore(state => ({
        alertFeed: state.alertFeed,
        reviewEventInChart: state.reviewEventInChart,
    }));

    const recentAlerts = useMemo(() => {
        return [...alertFeed].reverse().slice(0, 50);
    }, [alertFeed]);

    if (recentAlerts.length === 0) {
        return (
            <div className="p-3 text-center text-zinc-500 text-sm">
                <p className="font-semibold">{t('alerts_panel_empty_title')}</p>
                <p className="text-xs">{t('alerts_panel_empty_subtitle')}</p>
            </div>
        );
    }

    return (
        <div className="p-1 space-y-1">
            {recentAlerts.map(event => (
                <button 
                    key={event.id} 
                    onClick={() => reviewEventInChart(event)}
                    className="w-full flex items-center gap-3 p-2 text-left rounded-md hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex-shrink-0">{getAlertIcon(event.type)}</div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-zinc-200 text-sm">{event.pair}</span>
                            <span className="text-xs text-zinc-500">{new Date(event.time).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-zinc-400">{t(event.messageKey, event.messagePayload)}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};

const ScannerPanel: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
    const t = useTranslation();
    const [activeSection, setActiveSection] = useState<'analysis' | 'alerts' | 'help'>('analysis');

    const handleSectionClick = (section: 'analysis' | 'alerts' | 'help') => {
        setActiveSection(prev => prev === section ? '' as any : section);
    };
    
    return (
        <div className={`flex flex-col h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="p-4 border-b border-zinc-700 flex-shrink-0">
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <CompassIcon className="w-6 h-6 text-sky-400" />
                    {t('command_center_title')}
                </h2>
            </div>
            
            <div className="flex-grow overflow-y-auto thin-scrollbar">
                <CollapsibleSection
                    title={t('command_center_section_analysis')}
                    isOpen={activeSection === 'analysis'}
                    onClick={() => handleSectionClick('analysis')}
                >
                    <MarketAnalysisContent />
                </CollapsibleSection>

                <CollapsibleSection
                    title={t('command_center_section_alerts')}
                    isOpen={activeSection === 'alerts'}
                    onClick={() => handleSectionClick('alerts')}
                >
                    <AlertsPanel />
                </CollapsibleSection>
                
                <CollapsibleSection
                    title={t('command_center_section_help')}
                    isOpen={activeSection === 'help'}
                    onClick={() => handleSectionClick('help')}
                >
                    <div className="p-3">
                        <HelpPanel />
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};

const MarketAnalysisContent: React.FC = () => {
    const t = useTranslation();
    const [activeTab, setActiveTab] = useState<'scanner' | 'heatmap'>('scanner');
    return (
        <div className="p-3">
             <div className="flex items-center bg-zinc-800 p-1 mb-3 rounded-md border border-zinc-700">
                <button onClick={() => setActiveTab('scanner')} className={`flex-1 text-sm font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'scanner' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><RadarIcon className="w-4 h-4"/>{t('command_center_toggle_scanner')}</button>
                <button onClick={() => setActiveTab('heatmap')} className={`flex-1 text-sm font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'heatmap' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><RectangleGroupIcon className="w-4 h-4"/>{t('command_center_toggle_heatmap')}</button>
            </div>
            {activeTab === 'scanner' && <ScannerContent />}
            {activeTab === 'heatmap' && <HeatmapPanel />}
        </div>
    );
};


const ScannerContent: React.FC = () => {
    const { 
        isScanning, results, selectPairFromScanner, 
        allWatchlists, activeWatchlistName, updateWatchlists,
        runMarketScan, presets, loadPreset, activePresetName, setIsPresetManagerOpen
    } = useAppStore(state => ({
        isScanning: state.isScanning,
        results: state.scannerResults,
        selectPairFromScanner: state.selectPairFromScanner,
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        updateWatchlists: state.updateWatchlists,
        runMarketScan: state.runMarketScan,
        presets: state.scannerPresets,
        loadPreset: state.loadScannerPreset,
        activePresetName: state.activePresetName,
        setIsPresetManagerOpen: state.setIsPresetManagerOpen,
    }));
    
    const t = useTranslation();
    const activeWatchlistAssets = allWatchlists[activeWatchlistName] || [];
    
    const addAssetToWatchlist = (asset: string) => {
        const currentAssets = new Set(activeWatchlistAssets);
        currentAssets.add(asset);
        const newCollection = { ...allWatchlists, [activeWatchlistName]: Array.from(currentAssets) };
        updateWatchlists(newCollection, activeWatchlistName);
    };
    
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                 <select value={activePresetName || ""} onChange={(e) => loadPreset(e.target.value)} className="flex-grow w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm">
                    <option value="" disabled>{t('scanner_preset_label')}</option>
                    {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
                <button onClick={() => setIsPresetManagerOpen(true)} className="p-2 bg-zinc-700 hover:bg-sky-500 rounded-md text-zinc-200 hover:text-white transition-colors" title={t('manage_presets_tooltip')}>
                    <Cog8ToothIcon className="w-5 h-5"/>
                </button>
            </div>
            
            <button onClick={runMarketScan} disabled={isScanning || !activePresetName} className="w-full px-4 py-2 bg-sky-500 text-white text-sm font-bold rounded-lg hover:bg-sky-600 disabled:bg-zinc-700 disabled:text-zinc-500 flex items-center justify-center gap-2">
                {isScanning ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('scanner_run_scan')}
            </button>
            
            <div>
                 <h4 className="font-semibold text-zinc-300 mb-2">{t('scanner_results_title')}</h4>
                {isScanning && results.length === 0 && <div className="text-center text-zinc-500 py-4 text-sm">{t('scanner_in_progress')}</div>}
                {!isScanning && results.length === 0 && <div className="text-center text-zinc-500 py-4"><p className="text-sm">{t('scanner_no_results_title')}</p><p className="text-xs">{t('scanner_no_results_subtitle')}</p></div>}
                 <div className="space-y-1">
                    {results.map(d => (
                        <div key={d.symbol} className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800/50">
                            <button onClick={() => selectPairFromScanner(d)} className="text-left">
                                <span className="font-semibold text-zinc-200">{d.baseAsset}</span>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <span>${parseFloat(d.lastPrice).toFixed(4)}</span>
                                    <span className={parseFloat(d.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}>{parseFloat(d.priceChangePercent).toFixed(2)}%</span>
                                </div>
                            </button>
                            <div className="flex items-center gap-3">
                                {d.matchedStrategyState && (
                                    <div className="flex items-center gap-1" title={`${t('strategy_step_counter', { metSteps: d.matchedStrategyState.steps.filter(s => s.status === 'met').length })} / ${d.matchedStrategyState.steps.length}`}>
                                        {d.matchedStrategyState.steps.map((s, i) => <div key={i} className={`w-2 h-2 rounded-full ${s.status === 'met' ? 'bg-sky-500' : 'bg-zinc-600'}`}></div>)}
                                    </div>
                                )}
                                 {d.trendStatus && (
                                    <div className="flex items-center gap-1">
                                        {(['15m', '1H', '4H', '1D'] as const).map(tf => <TrendIndicator key={tf} status={d.trendStatus![tf]} />)}
                                    </div>
                                )}
                                <button onClick={() => addAssetToWatchlist(d.baseAsset)} disabled={activeWatchlistAssets.includes(d.baseAsset)} className="p-1.5 bg-zinc-700 rounded-md text-zinc-200 hover:bg-sky-500 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed" title={activeWatchlistAssets.includes(d.baseAsset) ? t('scanner_already_in_watchlist_tooltip') : t('scanner_add_to_watchlist_tooltip')}>
                                    {activeWatchlistAssets.includes(d.baseAsset) ? <CheckCircleIcon className="w-4 h-4"/> : <PlusIcon className="w-4 h-4"/>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScannerPanel;