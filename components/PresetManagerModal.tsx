import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { XMarkIcon, TrashIcon, CheckCircleIcon } from './icons/Icons';
import type { ScannerPreset, ScannerFilters, ScannerTimeframe, TrendDirection, StrategyDefinition } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const PresetManagerModal: React.FC = () => {
    const t = useTranslation();
    const {
        isOpen,
        closeModal,
        presets,
        strategyDefinitions,
        saveScannerPreset,
        deleteScannerPreset,
        setScannerFilters
    } = useAppStore(state => ({
        isOpen: state.isPresetManagerOpen,
        closeModal: () => state.setIsPresetManagerOpen(false),
        presets: state.scannerPresets,
        strategyDefinitions: state.strategyDefinitions,
        saveScannerPreset: state.saveScannerPreset,
        deleteScannerPreset: state.deleteScannerPreset,
        setScannerFilters: state.setScannerFilters,
    }));

    const [selectedPresetName, setSelectedPresetName] = useState<string | null>(presets.length > 0 ? presets[0].name : null);
    const [editedFilters, setEditedFilters] = useState<ScannerFilters | null>(null);
    const [editedName, setEditedName] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

    useEffect(() => {
        if (isOpen && presets.length > 0 && !selectedPresetName) {
            setSelectedPresetName(presets[0].name);
        }
        if (!isOpen) {
            setSaveState('idle');
        }
    }, [isOpen, presets, selectedPresetName]);
    
    useEffect(() => {
        if (selectedPresetName) {
            const preset = presets.find(p => p.name === selectedPresetName);
            if (preset) {
                setEditedFilters(preset.filters);
                setEditedName(preset.name);
                setIsCreatingNew(false);
            }
        }
    }, [selectedPresetName, presets]);

    const handleCreateNew = () => {
        const newFilters: ScannerFilters = { minVolume24h: 10_000_000, trendTimeframes: [], trendDirection: 'any' };
        setSelectedPresetName(null);
        setEditedFilters(newFilters);
        setEditedName(t('new_preset_default_name'));
        setIsCreatingNew(true);
    };

    const handleFilterChange = (update: Partial<ScannerFilters>) => {
        if (editedFilters) {
            let newFilters = { ...editedFilters, ...update };
            if (update.strategyId !== undefined) {
                newFilters.strategyStep = undefined;
            }
            setEditedFilters(newFilters);
        }
    };

    const handleSave = () => {
        if (editedFilters && editedName.trim()) {
            const finalName = editedName.trim();
            saveScannerPreset(finalName, editedFilters);
            setSaveState('saved');
            if (isCreatingNew) {
                setSelectedPresetName(finalName);
                setIsCreatingNew(false);
            }
            setTimeout(() => setSaveState('idle'), 2000);
        }
    };
    
    const handleDelete = () => {
        if (!isCreatingNew && selectedPresetName && window.confirm(t('confirm_delete_watchlist', { name: selectedPresetName }))) {
            deleteScannerPreset(selectedPresetName);
            const nextPreset = presets.find(p => p.name !== selectedPresetName);
            setSelectedPresetName(nextPreset ? nextPreset.name : null);
            if (!nextPreset) {
                setEditedFilters(null);
                setEditedName('');
            }
        }
    };

    const strategyList = Array.from(strategyDefinitions.values());
    const trendTimeframes: ScannerTimeframe[] = ['15m', '1H', '4H', '1D'];
    const selectedStrategy = editedFilters?.strategyId ? strategyDefinitions.get(editedFilters.strategyId) : null;
    const strategySteps = selectedStrategy?.getInitialSteps ? selectedStrategy.getInitialSteps() : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100">
                        {t('preset_manager_title')}
                    </h3>
                    <button onClick={closeModal} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow flex gap-6 overflow-hidden">
                    <div className="w-1/3 flex flex-col border-r border-zinc-700 pr-4">
                         <button onClick={handleCreateNew} className="w-full text-center py-2 bg-sky-500 text-white text-sm font-bold rounded-lg hover:bg-sky-600 mb-2">
                            {t('preset_manager_new_preset_button')}
                        </button>
                        <div className="flex-grow overflow-y-auto space-y-1">
                            {presets.map(p => (
                                <button key={p.name} onClick={() => setSelectedPresetName(p.name)} className={`w-full text-left p-2 rounded-md text-sm font-semibold transition-colors ${selectedPresetName === p.name ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-2/3 flex flex-col">
                        {editedFilters ? (
                             <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">{t('preset_name_label')}</label>
                                    <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                                </div>
                                <hr className="border-zinc-700" />
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">{t('preset_manager_volume_label')}</label>
                                    <input type="text" value={editedFilters.minVolume24h.toLocaleString('en-US')} onChange={e => handleFilterChange({ minVolume24h: parseInt(e.target.value.replace(/,/g, ''), 10) || 0 })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">{t('preset_manager_trend_filter_label')}</label>
                                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-md">
                                        {trendTimeframes.map(tf => (<button key={tf} onClick={() => handleFilterChange({ trendTimeframes: editedFilters.trendTimeframes.includes(tf) ? editedFilters.trendTimeframes.filter(t => t !== tf) : [...editedFilters.trendTimeframes, tf] })} className={`flex-1 text-xs font-semibold py-1 rounded-sm transition-colors ${editedFilters.trendTimeframes.includes(tf) ? 'bg-sky-500 text-white' : 'hover:bg-zinc-700'}`}>{tf}</button>))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5" role="radiogroup">
                                        {(['any', 'bullish'] as TrendDirection[]).map(dir => (<button key={dir} onClick={() => handleFilterChange({ trendDirection: dir })} className={`flex-1 text-xs font-semibold py-1 rounded-sm transition-colors ${editedFilters.trendDirection === dir ? 'bg-sky-500/30 text-sky-300' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{t(`preset_manager_trend_direction_${dir}` as any)}</button>))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">{t('strategy_state_filter_label')}</label>
                                    <div className="space-y-2">
                                        <select value={editedFilters.strategyId || ''} onChange={(e) => handleFilterChange({ strategyId: e.target.value || undefined })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm">
                                            <option value="">{t('preset_manager_strategy_filter_none')}</option>
                                            {strategyList.map((s: StrategyDefinition) => <option key={s.id} value={s.id}>{s.name || t(s.nameKey!)}</option>)}
                                        </select>
                                        {selectedStrategy && (
                                            <select value={editedFilters.strategyStep ?? ''} onChange={(e) => handleFilterChange({ strategyStep: e.target.value ? parseInt(e.target.value, 10) : undefined })} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm">
                                                <option value="">{t('preset_manager_strategy_filter_any_step')}</option>
                                                {strategySteps.map((step, index) => (
                                                    <option key={index} value={index + 1}>
                                                        {t('preset_manager_strategy_filter_step_label', { step: index + 1, name: step.name || t(step.nameKey!) })}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-zinc-500">
                                <p>{t('preset_manager_select_prompt')}</p>
                            </div>
                        )}
                         <div className="flex-shrink-0 mt-6 flex gap-3">
                            <button onClick={handleSave} disabled={!editedFilters || !editedName.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors">
                                {saveState === 'saved' ? <CheckCircleIcon className="w-5 h-5"/> : (isCreatingNew ? t('create') : t('update'))}
                                {saveState === 'saved' && (isCreatingNew ? `${t('create')}d !` : `${t('update')}d !`)}
                            </button>
                            {!isCreatingNew && selectedPresetName && <button onClick={handleDelete} className="py-2 px-4 text-sm font-bold bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"><TrashIcon className="w-5 h-5"/></button>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PresetManagerModal;