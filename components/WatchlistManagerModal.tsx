
import React, { useState, useEffect, useMemo } from 'react';
import { TrashIcon, ListBulletIcon, PlusIcon, CheckCircleIcon } from './icons/Icons';
import { useAppStore } from '../store/useAppStore';
import { fetch24hTickerData } from '../services/binanceService.ts';
import type { AppState, MarketData, WatchlistCollection } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface WatchlistManagerModalProps {
    show: boolean;
}

const SortButton: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
    >
        {label}
    </button>
);


export const WatchlistManagerModal: React.FC<WatchlistManagerModalProps> = ({ show }) => {
    const t = useTranslation();
    const { allWatchlists, activeWatchlistName, quoteAsset, updateWatchlists, setShowWatchlistModal, onboardingStep, nextOnboardingStep } = useAppStore(state => ({
        allWatchlists: state.allWatchlists,
        activeWatchlistName: state.activeWatchlistName,
        quoteAsset: state.quoteAsset,
        updateWatchlists: state.updateWatchlists,
        setShowWatchlistModal: state.setShowWatchlistModal,
        onboardingStep: state.onboardingStep,
        nextOnboardingStep: state.nextOnboardingStep,
    }));
    
    const [localWatchlists, setLocalWatchlists] = useState<WatchlistCollection>(allWatchlists);
    const [localActiveWatchlistName, setLocalActiveWatchlistName] = useState<string>(activeWatchlistName);
    
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'volume' | 'gainers' | 'losers'>('volume');

    const [isCreating, setIsCreating] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState("");

    useEffect(() => {
        if (show) {
            setLocalWatchlists(allWatchlists);
            setLocalActiveWatchlistName(activeWatchlistName);
            setIsCreating(false); // Reset creation state on open
        }
    }, [allWatchlists, activeWatchlistName, show]);

    useEffect(() => {
        if (show) {
            const loadData = async () => {
                setIsLoading(true);
                const rawData: any[] = await fetch24hTickerData();
                const leveragedPatterns = ['UP', 'DOWN', 'BULL', 'BEAR', '3L', '3S', '5L', '5S'];
                const filteredData = rawData
                    .filter(d => 
                        d.symbol.endsWith(quoteAsset) &&
                        !leveragedPatterns.some(p => d.symbol.includes(p))
                    )
                    .map((d): MarketData => ({
                        symbol: d.symbol,
                        baseAsset: d.symbol.replace(quoteAsset, ''),
                        quoteAsset: quoteAsset,
                        lastPrice: d.lastPrice,
                        priceChangePercent: d.priceChangePercent,
                        quoteVolume: d.quoteVolume,
                    }));
                setMarketData(filteredData);
                setIsLoading(false);
            };
            loadData();
        }
    }, [show, quoteAsset]);
    
    const activeWatchlistAssets = localWatchlists[localActiveWatchlistName] || [];

    const watchlistWithData = useMemo(() => {
        return activeWatchlistAssets.map(baseAsset => {
            const data = marketData.find(d => d.baseAsset === baseAsset);
            return {
                baseAsset,
                performance: data ? parseFloat(data.priceChangePercent) : 0,
            }
        });
    }, [activeWatchlistAssets, marketData]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...marketData];
        if (searchTerm) {
            data = data.filter(d => d.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        switch (sortBy) {
            case 'volume':
                data.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
                break;
            case 'gainers':
                data.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
                break;
            case 'losers':
                data.sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent));
                break;
        }
        return data;
    }, [marketData, searchTerm, sortBy]);

    const handleAddTopBy = (criteria: 'volume' | 'gainers' | 'losers') => {
        if (!marketData || marketData.length === 0) return;

        const sortedData = [...marketData].sort((a, b) => {
            if (criteria === 'volume') {
                return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
            }
            if (criteria === 'gainers') {
                return parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent);
            }
            return parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent);
        });

        const top10BaseAssets = sortedData.slice(0, 10).map(d => d.baseAsset);
        
        setLocalWatchlists(prev => {
            const currentAssets = new Set(prev[localActiveWatchlistName] || []);
            top10BaseAssets.forEach(asset => currentAssets.add(asset));
            return {
                ...prev,
                [localActiveWatchlistName]: Array.from(currentAssets)
            };
        });
    };
    
    const handleAddAsset = (baseAsset: string) => {
        if (baseAsset && !activeWatchlistAssets.includes(baseAsset)) {
            setLocalWatchlists(prev => ({
                ...prev,
                [localActiveWatchlistName]: [baseAsset, ...(prev[localActiveWatchlistName] || [])]
            }));
        }
    };
    
    const handleRemoveAsset = (assetToRemove: string) => {
        setLocalWatchlists(prev => ({
            ...prev,
            [localActiveWatchlistName]: (prev[localActiveWatchlistName] || []).filter(a => a !== assetToRemove)
        }));
    };

    const confirmCreateWatchlist = () => {
        const trimmedName = newWatchlistName.trim();
        if (trimmedName && !localWatchlists[trimmedName]) {
            setLocalWatchlists(prev => ({ ...prev, [trimmedName]: [] }));
            setLocalActiveWatchlistName(trimmedName);
            setIsCreating(false);
            setNewWatchlistName("");
        }
    };

    const handleDeleteWatchlist = () => {
        if (Object.keys(localWatchlists).length <= 1) {
            alert(t('error_delete_last_watchlist'));
            return;
        }
        if (window.confirm(t('confirm_delete_watchlist', { name: localActiveWatchlistName }))) {
            const newWatchlists = { ...localWatchlists };
            delete newWatchlists[localActiveWatchlistName];
            setLocalWatchlists(newWatchlists);
            setLocalActiveWatchlistName(Object.keys(newWatchlists)[0]);
        }
    };

    const handleSave = () => {
        updateWatchlists(localWatchlists, localActiveWatchlistName);
        setShowWatchlistModal(false);
        // If the user is in the first step of onboarding, saving the watchlist advances the tour.
        if (onboardingStep === 0) {
            nextOnboardingStep();
        }
    };
    
    const onClose = () => setShowWatchlistModal(false);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 w-full max-w-4xl p-4 md:p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 mb-4">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <ListBulletIcon className="w-6 h-6"/>
                        {t('watchlist_title')}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">{t('watchlist_subtitle')}</p>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
                    {/* Watchlist Column */}
                    <div className="w-full md:w-1/3 flex flex-col">
                        <div className="mb-2">
                            <label className="text-sm font-medium text-zinc-400 mb-1 block">{t('watchlist_active')}</label>
                            {isCreating ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newWatchlistName}
                                        onChange={(e) => setNewWatchlistName(e.target.value)}
                                        placeholder={t('watchlist_new_name_placeholder')}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={confirmCreateWatchlist} 
                                            disabled={!newWatchlistName.trim() || !!localWatchlists[newWatchlistName.trim()]}
                                            className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-sky-500 text-white hover:bg-sky-600 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                        >
                                            {t('create')}
                                        </button>
                                        <button 
                                            onClick={() => setIsCreating(false)} 
                                            className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select 
                                        value={localActiveWatchlistName} 
                                        onChange={(e) => setLocalActiveWatchlistName(e.target.value)}
                                        className="flex-grow bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        {Object.keys(localWatchlists).map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                    <button onClick={() => setIsCreating(true)} className="p-2 bg-zinc-700 hover:bg-sky-500 rounded-md text-zinc-200 hover:text-white transition-colors" title={t('watchlist_create_new_tooltip')}>
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={handleDeleteWatchlist} className="p-2 bg-zinc-700 hover:bg-red-500 rounded-md text-zinc-200 hover:text-white transition-colors" title={t('watchlist_delete_tooltip')}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow bg-zinc-900/50 rounded-lg p-2 flex flex-col border border-zinc-700/50 min-h-[200px]">
                            <h4 className="text-base font-semibold mb-2 text-zinc-300 flex-shrink-0">{t('watchlist_content_title', { count: activeWatchlistAssets.length })}</h4>
                            {activeWatchlistAssets.length > 0 ? (
                                <div className="flex-grow overflow-y-auto thin-scrollbar pr-1">
                                    {watchlistWithData.map(({ baseAsset, performance }) => (
                                        <div key={baseAsset} className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800">
                                            <div>
                                                <span className="font-semibold text-zinc-200">{baseAsset}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono text-xs ${performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{performance.toFixed(2)}%</span>
                                                <button onClick={() => handleRemoveAsset(baseAsset)} className="text-zinc-500 hover:text-red-500">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-grow flex items-center justify-center text-center text-zinc-500 text-sm p-4">
                                    <p>{t('watchlist_empty')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Discovery Column */}
                    <div className="w-full md:w-2/3 flex flex-col">
                        <h4 className="text-base font-semibold mb-2 text-zinc-300 flex-shrink-0">{t('discover_pairs_title')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <button onClick={() => handleAddTopBy('volume')} className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-zinc-700 text-zinc-200 hover:bg-sky-500">{t('add_top_10_volume')}</button>
                            <button onClick={() => handleAddTopBy('gainers')} className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-zinc-700 text-zinc-200 hover:bg-green-500">{t('add_top_10_gainers')}</button>
                            <button onClick={() => handleAddTopBy('losers')} className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-zinc-700 text-zinc-200 hover:bg-red-500">{t('add_top_10_losers')}</button>
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_pair_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm mb-2"
                        />
                        <div className="flex gap-2 mb-2">
                            <SortButton label={t('sort_volume')} active={sortBy === 'volume'} onClick={() => setSortBy('volume')} />
                            <SortButton label={t('sort_gainers')} active={sortBy === 'gainers'} onClick={() => setSortBy('gainers')} />
                            <SortButton label={t('sort_losers')} active={sortBy === 'losers'} onClick={() => setSortBy('losers')} />
                        </div>
                        <div className="flex-grow bg-zinc-900/50 rounded-lg border border-zinc-700/50 flex flex-col">
                           <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold text-zinc-400 border-b border-zinc-700 flex-shrink-0">
                               <div className="col-span-4">{t('header_pair')}</div>
                               <div className="col-span-3 text-right">{t('header_price')}</div>
                               <div className="col-span-3 text-right">{t('header_change_24h')}</div>
                               <div className="col-span-2 text-right"></div>
                           </div>
                           <div className="flex-grow overflow-y-auto thin-scrollbar">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full text-zinc-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                                    </div>
                                ) : (
                                    filteredAndSortedData.map(d => (
                                        <div key={d.symbol} className="grid grid-cols-12 gap-4 px-3 py-2 text-sm items-center hover:bg-zinc-800">
                                            <div className="col-span-4 font-semibold text-zinc-200">{d.baseAsset}</div>
                                            <div className="col-span-3 text-right font-mono text-zinc-300">{parseFloat(d.lastPrice).toFixed(4)}</div>
                                            <div className={`col-span-3 text-right font-mono ${parseFloat(d.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{parseFloat(d.priceChangePercent).toFixed(2)}%</div>
                                            <div className="col-span-2 flex justify-end">
                                                <button onClick={() => handleAddAsset(d.baseAsset)} disabled={activeWatchlistAssets.includes(d.baseAsset)} className="p-1.5 bg-zinc-700 rounded-md text-zinc-200 hover:bg-sky-500 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed" title={activeWatchlistAssets.includes(d.baseAsset) ? t('scanner_already_in_watchlist_tooltip') : t('scanner_add_to_watchlist_tooltip')}>
                                                    {activeWatchlistAssets.includes(d.baseAsset) ? <CheckCircleIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                           </div>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 sm:flex sm:flex-row-reverse gap-3">
                     <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm transition-colors"
                        onClick={handleSave}
                    >
                        {t('saveAndClose')}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
