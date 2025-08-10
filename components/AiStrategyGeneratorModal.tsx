import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { XMarkIcon, SparklesIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';
import type { StrategyDefinition } from '../types';

const availableIndicators = [
    'EMA', 'HTF_EMA', 'ADX', 'RSI', 'SMC', 'VolumeSMA', 'MACD', 'ATR', 
    'BollingerBands', 'Stochastic', 'Ichimoku', 'Supertrend', 'VWAP', 'OBV'
];

const AiStrategyGeneratorModal: React.FC = () => {
    const t = useTranslation();
    const { 
        show, 
        closeModal,
        generatorState,
        generateAiStrategy,
        importStrategy,
        clearGenerator,
    } = useAppStore(state => ({
        show: state.showAiStrategyGeneratorModal,
        closeModal: () => state.setShowAiStrategyGeneratorModal(false),
        generatorState: state.aiStrategyGeneratorState,
        generateAiStrategy: state.generateAiStrategy,
        importStrategy: state.importStrategy,
        clearGenerator: state.clearAiStrategyGenerator,
    }));
    
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        // --- ROBUSTNESS: Cleanup effect ---
        // This function is returned by the effect and will be called when the component unmounts.
        // It ensures that if the modal is closed unexpectedly (e.g., by a parent component),
        // the generator's state (isLoading, error, etc.) is properly reset.
        return () => {
            clearGenerator();
        };
    }, [clearGenerator]); // Depends only on the stable clearGenerator function, so it runs once on mount.

    if (!show) return null;

    const handleGenerate = () => {
        if (prompt.trim()) {
            generateAiStrategy(prompt);
        }
    };

    const handleClose = () => {
        closeModal();
        // The cleanup effect will handle clearing the state.
    };

    const handleImport = () => {
        if (generatorState.generatedStrategyJson) {
            importStrategy(generatorState.generatedStrategyJson);
            handleClose();
        }
    };
    
    let generatedStrategy: StrategyDefinition | null = null;
    if (generatorState.generatedStrategyJson) {
        try {
            generatedStrategy = JSON.parse(generatorState.generatedStrategyJson);
        } catch (e) {
            console.error("Failed to parse generated strategy JSON", e);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-400"/>
                        {t('ai_strategy_generator_title')}
                    </h3>
                    <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    <p className="text-sm text-zinc-400">{t('ai_strategy_generator_subtitle')}</p>
                    
                    <div>
                        <h4 className="text-sm font-semibold text-zinc-300 mb-2">{t('ai_strategy_generator_available_indicators')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {availableIndicators.map(ind => (
                                <span key={ind} className="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded-md">{ind}</span>
                            ))}
                        </div>
                    </div>
                    
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={t('ai_strategy_generator_prompt_placeholder')}
                        className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={generatorState.isLoading}
                    />
                    
                    {generatorState.error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span>{t(generatorState.error)}</span>
                        </div>
                    )}

                    {generatedStrategy && (
                         <div className="animate-fade-in bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50 space-y-3">
                            <h4 className="text-base font-semibold text-zinc-200">{t('ai_strategy_generator_result_title')}</h4>
                            <div>
                                <p className="font-bold text-sky-400">{generatedStrategy.name}</p>
                                <p className="text-xs text-zinc-400 mt-1 truncate">{generatedStrategy.description?.split('\n')[0]}</p>
                            </div>
                            <button
                                onClick={handleImport}
                                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5"/>
                                {t('ai_strategy_generator_import_button')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium bg-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-600"
                        onClick={handleClose}
                    >
                        {t('cancel')}
                    </button>
                     <button
                        type="button"
                        className="px-4 py-2 text-sm font-bold bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || generatorState.isLoading}
                    >
                        {generatorState.isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {t('ai_strategy_generator_generating_button')}
                            </>
                        ) : (
                            t('ai_strategy_generator_generate_button')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiStrategyGeneratorModal;