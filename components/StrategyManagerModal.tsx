
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import type { StrategyDefinition } from '../types';
import { XMarkIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon, SparklesIcon, ExclamationTriangleIcon, LightBulbIcon } from './icons/Icons';

const BUILT_IN_STRATEGY_IDS = ["order-flow-smc", "scalping-ema-cross", "volume-anomaly-scalper", "rsi-divergence-hunter", "test-strategy"];

const availableIndicators = [
    'EMA', 'HTF_EMA', 'ADX', 'RSI', 'SMC', 'VolumeSMA', 'MACD', 'ATR', 
    'BollingerBands', 'Stochastic', 'Ichimoku', 'Supertrend', 'VWAP', 'OBV'
];

export const StrategyManagerModal: React.FC = () => {
    const t = useTranslation();
    const {
        show,
        closeModal,
        strategyDefinitions,
        activeStrategyId,
        deleteStrategy,
        importStrategy,
        generatorState,
        generateAiStrategy,
        clearGenerator,
    } = useAppStore(state => ({
        show: state.showStrategyManagerModal,
        closeModal: () => state.setShowStrategyManagerModal(false),
        strategyDefinitions: state.strategyDefinitions,
        activeStrategyId: state.activeStrategyId,
        deleteStrategy: state.deleteStrategy,
        importStrategy: state.importStrategy,
        generatorState: state.aiStrategyGeneratorState,
        generateAiStrategy: state.generateAiStrategy,
        clearGenerator: state.clearAiStrategyGenerator,
    }));

    const [selectedId, setSelectedId] = useState<string | null>(activeStrategyId);
    const [view, setView] = useState<'list' | 'add_ai' | 'add_import'>('list');
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset view when modal is re-opened or strategy selection changes
        if (show) {
            setView('list');
            setSelectedId(activeStrategyId);
        } else {
            clearGenerator();
        }
    }, [show, activeStrategyId, clearGenerator]);

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    importStrategy(text);
                }
            };
            reader.readAsText(file);
        }
    };
    
    const handleGenerate = () => {
        if (prompt.trim()) {
            generateAiStrategy(prompt);
        }
    };
    
    let generatedStrategy: StrategyDefinition | null = null;
    if (generatorState.generatedStrategyJson) {
        try { generatedStrategy = JSON.parse(generatorState.generatedStrategyJson); } catch (e) { /* ignore */ }
    }

    const allStrategies: StrategyDefinition[] = Array.from(strategyDefinitions.values());
    const builtInStrategies = allStrategies.filter(s => BUILT_IN_STRATEGY_IDS.includes(s.id));
    const myStrategies = allStrategies.filter(s => !BUILT_IN_STRATEGY_IDS.includes(s.id));
    const selectedStrategy = strategyDefinitions.get(selectedId || '');

    const renderStrategyList = () => (
        <>
            <div className="w-1/3 flex flex-col border-r border-zinc-700 pr-4">
                <button onClick={() => setView('add_ai')} className="w-full flex items-center justify-center gap-2 text-center py-2 bg-sky-500 text-white text-sm font-bold rounded-lg hover:bg-sky-600 mb-4">
                    <PlusIcon className="w-5 h-5"/>
                    {t('strategy_manager_add_button')}
                </button>
                <div className="flex-grow overflow-y-auto space-y-3">
                    <div>
                        <h4 className="text-xs font-bold uppercase text-zinc-500 mb-1 px-2">{t('strategy_manager_built_in')}</h4>
                        {builtInStrategies.map(s => (
                            <button key={s.id} onClick={() => setSelectedId(s.id)} className={`w-full text-left p-2 rounded-md text-sm font-semibold transition-colors ${selectedId === s.id ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                                {s.name || t(s.nameKey!)}
                            </button>
                        ))}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase text-zinc-500 mb-1 px-2">{t('strategy_manager_my_strategies')}</h4>
                        {myStrategies.length > 0 ? myStrategies.map(s => (
                            <button key={s.id} onClick={() => setSelectedId(s.id)} className={`w-full flex justify-between items-center text-left p-2 rounded-md text-sm font-semibold transition-colors ${selectedId === s.id ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                                <span>{s.name || t(s.nameKey!)}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteStrategy(s.id); }} className="p-1 text-zinc-500 hover:text-red-500 rounded-full hover:bg-zinc-900/50"><TrashIcon className="w-4 h-4"/></button>
                            </button>
                        )) : <p className="text-xs text-zinc-500 px-2">{t('watchlist_empty')}</p>}
                    </div>
                </div>
            </div>
            <div className="w-2/3 flex flex-col pl-4">
                {selectedStrategy ? (
                    <div className="flex-grow overflow-y-auto pr-2">
                        <h4 className="text-xl font-bold text-sky-400 mb-2">{selectedStrategy.name || t(selectedStrategy.nameKey!)}</h4>
                        <div className="text-sm text-zinc-300 space-y-3 prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: t(selectedStrategy.descriptionKey || '', {}) || selectedStrategy.description || ''}}></div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-zinc-500">
                        <p>{t('strategy_manager_select_prompt')}</p>
                    </div>
                )}
            </div>
        </>
    );
    
    const renderAddView = () => (
         <div className="flex-grow flex flex-col space-y-4">
            <div className="flex items-center bg-zinc-900/50 p-1 rounded-md border border-zinc-700">
                <button onClick={() => setView('add_ai')} className={`flex-1 text-sm font-semibold py-1 rounded-md transition-colors ${view === 'add_ai' ? 'bg-zinc-700 text-sky-400' : 'hover:bg-zinc-800'}`}>{t('ai_strategy_generator_trigger_button')}</button>
                <button onClick={() => setView('add_import')} className={`flex-1 text-sm font-semibold py-1 rounded-md transition-colors ${view === 'add_import' ? 'bg-zinc-700 text-sky-400' : 'hover:bg-zinc-800'}`}>{t('import_strategy_tooltip')}</button>
            </div>
            
            {view === 'add_ai' && (
                <div className="flex-grow flex flex-col space-y-3 animate-fade-in">
                    <p className="text-sm text-zinc-400">{t('ai_strategy_generator_subtitle')}</p>
                     <div className="flex flex-wrap gap-2">
                        {availableIndicators.map(ind => <span key={ind} className="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded-md">{ind}</span>)}
                    </div>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('ai_strategy_generator_prompt_placeholder')} className="w-full flex-grow bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm placeholder:text-zinc-500" disabled={generatorState.isLoading} />
                    {generatorState.error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded-lg text-sm flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5"/><span>{generatorState.error}</span></div>}
                    {generatedStrategy && (
                         <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50 space-y-2">
                            <p className="font-bold text-sky-400">{generatedStrategy.name}</p>
                        </div>
                    )}
                </div>
            )}
            
            {view === 'add_import' && (
                <div className="flex-grow flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-dashed border-zinc-700 rounded-lg p-6 animate-fade-in">
                    <ArrowDownTrayIcon className="w-10 h-10 text-zinc-500 mb-2"/>
                    <p className="text-zinc-400 mb-4">{t('import_strategy_subtitle')}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-bold bg-sky-500 text-white rounded-lg hover:bg-sky-600">
                        Select .json file
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden"/>
                </div>
            )}
        </div>
    );

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh] h-[700px]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6 text-sky-400"/>
                        {t('strategy_manager_title')}
                    </h3>
                    <button onClick={closeModal} className="text-zinc-400 hover:text-white transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="flex-grow flex gap-6 overflow-hidden">
                    {view === 'list' ? renderStrategyList() : renderAddView()}
                </div>
                
                <div className="flex-shrink-0 mt-6 flex justify-between items-center">
                    <div>
                        {view !== 'list' && <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-600">{t('cancel')}</button>}
                    </div>
                    <div>
                        {view === 'add_ai' && (
                            <div className="flex items-center gap-2">
                                {generatedStrategy && (
                                    <button onClick={() => importStrategy(generatorState.generatedStrategyJson!)} className="px-4 py-2 text-sm font-bold bg-green-600 text-white rounded-md hover:bg-green-700">{t('ai_strategy_generator_import_button')}</button>
                                )}
                                <button onClick={handleGenerate} disabled={!prompt.trim() || generatorState.isLoading} className="px-4 py-2 text-sm font-bold bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-zinc-600 flex items-center gap-2">
                                    {generatorState.isLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{t('ai_strategy_generator_generating_button')}</> : t('ai_strategy_generator_generate_button')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};