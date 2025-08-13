
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { StrategyState, StrategySettings, StrategyStep, StepStatus, StrategyDefinition, SettingConfig, IndicatorSettings, IndicatorConfig, OptimizationParameterConfig, AiCopilotSuggestion, DeclarativeStrategyLogic } from '../types';
import { 
    CheckCircleIcon,
    ClockIcon,
    CheckBadgeIcon,
    LightBulbIcon,
    SparklesIcon,
    EyeIcon,
    EyeSlashIcon,
    Cog8ToothIcon,
    ChartPieIcon,
    ChevronRightIcon,
    QuestionMarkCircleIcon,
} from './icons/Icons';
import CollapsibleSection from './CollapsibleSection';
import { useTranslation } from '../hooks/useTranslation';

interface StrategyPanelProps {
}

const getStatusIcon = (status: StepStatus, stepName: string, t: (key: string) => string) => {
    switch (status) {
        case 'met': 
            return stepName === t('strategy_step_entry_confirmation')
                ? <CheckBadgeIcon className="w-6 h-6 text-sky-400"/>
                : <CheckCircleIcon className="w-6 h-6 text-green-500" />;
        case 'waiting': return <ClockIcon className="w-6 h-6 text-sky-400 animate-pulse" />;
        case 'pending': return <div className="w-5 h-5 border-2 rounded-full border-zinc-500"></div>;
        case 'unmet': return <div className="w-5 h-5 border-2 rounded-full border-zinc-700"></div>;
        default: return null;
    }
}

const StrategyStepView: React.FC<{ step: StrategyStep, isLastStep: boolean, isFirstStep: boolean }> = ({ step, isLastStep, isFirstStep }) => {
    const t = useTranslation();
    const stepName = step.name || t(step.nameKey || '');
    const stepDetails = step.details || t(step.detailsKey || 'orderFlow_step_pending_details', step.detailsPayload);
    const isFinalSignal = isLastStep && step.status === 'met';
    const bgColor = isFinalSignal ? 'bg-green-500/20' : 'bg-transparent';
    const textColor = isFinalSignal ? 'text-green-400' : 'text-zinc-100';

    return (
        <div className={`flex gap-4 p-2 relative`}>
            {/* Connecting line */}
            {!isFirstStep && <div className="absolute left-[14px] top-0 h-1/2 w-0.5 bg-zinc-700" />}
            {!isLastStep && <div className="absolute left-[14px] top-1/2 h-1/2 w-0.5 bg-zinc-700" />}

            <div className={`flex-shrink-0 pt-0.5 z-10 bg-zinc-900`}>
                {getStatusIcon(step.status, stepName, t)}
            </div>
            <div className={`pl-2 pr-2.5 py-1.5 rounded-lg transition-colors duration-300 w-full -mt-1 ${bgColor}`}>
                <h4 className={`font-semibold ${textColor}`}>{stepName}</h4>
                <p className="text-xs text-zinc-400">{stepDetails}</p>
            </div>
        </div>
    );
};

const OptimizationPopover: React.FC<{
    paramId: keyof StrategySettings;
    onConfigure: (config: OptimizationParameterConfig) => void;
    onClose: () => void;
}> = ({ paramId, onConfigure, onClose }) => {
    const t = useTranslation();
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [step, setStep] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleConfirm = () => {
        onConfigure({
            id: paramId,
            start: parseFloat(start),
            end: parseFloat(end),
            step: parseFloat(step)
        });
        onClose();
    };

    return (
        <div ref={popoverRef} className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-3 z-20 animate-fade-in-down">
            <h4 className="font-semibold text-sm mb-2 text-sky-400">{t('opt_popover_title')}</h4>
            <div className="space-y-2">
                <input type="number" value={start} onChange={e => setStart(e.target.value)} placeholder={t('opt_popover_start')} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm" />
                <input type="number" value={end} onChange={e => setEnd(e.target.value)} placeholder={t('opt_popover_end')} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm" />
                <input type="number" value={step} onChange={e => setStep(e.target.value)} placeholder={t('opt_popover_step')} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm" />
            </div>
            <div className="mt-3 flex justify-end">
                <button onClick={handleConfirm} className="px-3 py-1 text-xs font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600">{t('confirm')}</button>
            </div>
        </div>
    );
};

const AiCopilotSuggestionCard: React.FC<{ suggestion: AiCopilotSuggestion, currentSettings: StrategySettings }> = ({ suggestion, currentSettings }) => {
    const t = useTranslation();
    const { applyOptimizationSettings } = useAppStore.getState();

    const changedSettings = Object.entries(suggestion.settings).filter(
        ([key, value]) => (currentSettings as any)[key] !== value
    );

    return (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 animate-fade-in space-y-2">
            <div>
                <h5 className="font-semibold text-sky-400 text-sm">{t('copilot_ai_reasoning')}</h5>
                <p className="text-xs text-zinc-300">{suggestion.rationale}</p>
            </div>
            {changedSettings.length > 0 && (
                <div>
                    <h5 className="font-semibold text-zinc-300 text-sm">{t('copilot_setting_changes')}</h5>
                    <div className="text-xs space-y-1 mt-1">
                        {changedSettings.map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                                <span className="text-zinc-400">{t(`setting_label_${key}` as any, {})}</span>
                                <div className="font-mono flex items-center gap-2">
                                    <span className="text-zinc-500">{(currentSettings as any)[key]}</span>
                                    <span>→</span>
                                    <span className="text-sky-400 font-bold">{value as any}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex gap-2 pt-2">
                <button 
                    onClick={() => applyOptimizationSettings({ ...currentSettings, ...suggestion.settings } as StrategySettings)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600"
                >
                    {t('copilot_apply_button')}
                </button>
            </div>
        </div>
    );
};


const StrategyPanel: React.FC<StrategyPanelProps> = () => {
    const t = useTranslation();
    const { 
        isCollapsed, activeStrategyId, setActiveStrategyId, 
        activePair, strategyStateMap, strategyDefinitions, 
        indicatorSettings, setIndicatorSettings, tradingMode, 
        isBacktestMode, timeframe, updateStrategySettings, 
        strategySettingsMap, resetStrategySettings,
        startOptimization, startVisualBacktest, startQuickBacktest, startPortfolioBacktest,
        isBacktestRunning, isLoading, isOptimizing,
        setShowStrategyInfoModal,
        isCopilotLoading, aiCopilotSuggestions, requestCopilotSuggestions, clearCopilotSuggestions, aiCopilotError,
        setShowStrategyManagerModal,
    } = useAppStore(state => ({
        isCollapsed: state.isSidebarCollapsed,
        activeStrategyId: state.activeStrategyId,
        setActiveStrategyId: state.setActiveStrategyId,
        activePair: state.activePair,
        strategyStateMap: state.strategyStateMap,
        strategyDefinitions: state.strategyDefinitions,
        indicatorSettings: state.indicatorSettings,
        setIndicatorSettings: state.setIndicatorSettings,
        tradingMode: state.tradingMode,
        isBacktestMode: state.tradingMode === 'Backtest',
        timeframe: state.timeframe,
        updateStrategySettings: state.updateStrategySettings,
        strategySettingsMap: state.strategySettingsMap,
        resetStrategySettings: state.resetStrategySettings,
        startOptimization: state.startOptimization,
        startVisualBacktest: state.startBacktest,
        startQuickBacktest: state.runQuickBacktest,
        startPortfolioBacktest: state.runPortfolioBacktest,
        isBacktestRunning: state.backtestPlaybackState !== 'idle',
        isLoading: state.backtestLoadingProgress.isLoading,
        isOptimizing: state.isOptimizing,
        setShowStrategyInfoModal: state.setShowStrategyInfoModal,
        isCopilotLoading: state.isCopilotLoading,
        aiCopilotSuggestions: state.aiCopilotSuggestions,
        requestCopilotSuggestions: state.requestCopilotSuggestions,
        clearCopilotSuggestions: state.clearCopilotSuggestions,
        aiCopilotError: state.aiCopilotError,
        setShowStrategyManagerModal: state.setShowStrategyManagerModal,
    }));
    
    const timeframes = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];
    const setActiveTimeframe = useAppStore(state => state.setTimeframe);

    const [optimizationParams, setOptimizationParams] = useState<OptimizationParameterConfig[]>([]);
    const [activePopover, setActivePopover] = useState<keyof StrategySettings | null>(null);
    const [backtestPeriod, setBacktestPeriod] = useState<string>('default');
    const [copilotPrompt, setCopilotPrompt] = useState('');

    const [openSections, setOpenSections] = useState({
        liveStatus: true,
        settings: true,
        indicators: true,
        optimization: true,
        launch: true,
        copilot: false,
    });
    const handleSectionToggle = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const activeStrategy = useMemo(() => strategyDefinitions.get(activeStrategyId)!, [strategyDefinitions, activeStrategyId]);
    
    const strategyState = useMemo(() => {
        if (!activeStrategy) return { steps: [], alert: null };
        const currentState = strategyStateMap.get(activePair);
        if (currentState) return currentState;

        const initialSteps = activeStrategy.getInitialSteps ? activeStrategy.getInitialSteps() : [];
        return { steps: initialSteps, alert: null };

    }, [strategyStateMap, activePair, activeStrategy]);

    const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
    const currentSettings = strategySettingsMap[activeSettingsKey] || activeStrategy?.defaultSettings;
    
    useEffect(() => {
        clearCopilotSuggestions();
    }, [activeStrategyId, clearCopilotSuggestions]);

    if (!activeStrategy || !currentSettings) {
        return null;
    }

    const handleSettingsChange = (id: keyof StrategySettings, value: number | boolean) => {
        updateStrategySettings(prev => ({ ...prev, [id]: value }));
    };

    const handleIndicatorToggle = (id: keyof IndicatorSettings) => {
        setIndicatorSettings(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const handleOptimizationConfigure = (config: OptimizationParameterConfig) => {
        setOptimizationParams(prev => {
            const existingIndex = prev.findIndex(p => p.id === config.id);
            if (existingIndex > -1) {
                const newParams = [...prev];
                newParams[existingIndex] = config;
                return newParams;
            }
            return [...prev, config];
        });
    };

    const handleClearOptimizationParam = (paramId: keyof StrategySettings) => {
        setOptimizationParams(prev => prev.filter(p => p.id !== paramId));
    };

    const runAction = async (action: 'visual' | 'quick' | 'portfolio' | 'optimize') => {
        if (isLoading || isBacktestRunning || isOptimizing) return;
        try {
            const identifier = activeStrategy.name || activeStrategy.nameKey!;
            switch(action) {
                case 'visual': await startVisualBacktest(activePair, timeframe, backtestPeriod); break;
                case 'quick': await startQuickBacktest(activePair, timeframe, backtestPeriod, identifier); break;
                case 'portfolio': await startPortfolioBacktest(timeframe, backtestPeriod, identifier); break;
                case 'optimize': await startOptimization(optimizationParams); break;
            }
        } catch (e: any) {
            useAppStore.getState().setLatestAlert({ type: 'info', messageKey: e.message || 'unknownError', time: Date.now() });
        }
    }
    
    const getButtonText = () => {
        if (isLoading) return t('strategies_loading_in_progress');
        if (isBacktestRunning) return t('strategies_backtest_in_progress');
        if (isOptimizing) return t('strategies_optimization_in_progress');
        return '';
    }

    const handleRequestCopilot = () => {
        const { language, strategyDefinitions, activeStrategyId, strategySettingsMap, timeframe, activePair } = useAppStore.getState();
        const strategy = strategyDefinitions.get(activeStrategyId);
        const settings = strategySettingsMap[`${activeStrategyId}-${timeframe}`] || strategy?.defaultSettings;
        if (!strategy || !settings) return;
        
        const strategyName = strategy.name || t(strategy.nameKey || '');
        const systemInstruction = t('gemini_system_instruction_copilot', {
            strategyName: strategyName,
            pair: activePair,
            timeframe: timeframe,
            settings: JSON.stringify(settings),
            language
        });
        
        requestCopilotSuggestions(copilotPrompt, systemInstruction);
    }

    const backtestPeriods = [
        { id: 'default', labelKey: 'backtest_period_default' },
        { id: '3m', labelKey: 'backtest_period_3m' },
        { id: '1y', labelKey: 'backtest_period_1y' },
        { id: '2y', labelKey: 'backtest_period_2y' },
        { id: 'all', labelKey: 'backtest_period_all' },
    ];

    return (
        <div className={`flex flex-col h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="p-4 border-b border-zinc-700 flex-shrink-0">
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Cog8ToothIcon className="w-6 h-6 text-sky-400" />
                    {tradingMode === 'Backtest' ? t('strategies_workshop_title') : t('strategies_title')}
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto thin-scrollbar">
                <div className="p-3 space-y-4">
                     <div className="xl:hidden space-y-1">
                        <label className="text-sm font-semibold text-zinc-400">{t('timeframe_label')}</label>
                        <div className="flex flex-wrap gap-1">
                            {timeframes.map(tf => (
                                <button 
                                    key={tf}
                                    onClick={() => setActiveTimeframe(tf)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${
                                        timeframe === tf 
                                        ? 'bg-sky-500 text-white' 
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-zinc-400 flex justify-between items-center">
                            {t('strategies_section_active')}
                            <button onClick={() => setShowStrategyInfoModal(true)} className="text-xs font-semibold text-sky-500 hover:text-sky-400">{t('info_button')}</button>
                        </label>
                        <div className="flex gap-2">
                            <select 
                                value={activeStrategyId} 
                                onChange={(e) => setActiveStrategyId(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                            >
                                {Array.from(strategyDefinitions.values()).map((s: StrategyDefinition) => <option key={s.id} value={s.id}>{s.name || t(s.nameKey!)}</option>)}
                            </select>
                            <button onClick={() => setShowStrategyManagerModal(true)} className="p-2.5 bg-zinc-700 hover:bg-sky-500 rounded-md text-zinc-200 hover:text-white transition-colors" title={t('strategy_manager_title')}>
                                <Cog8ToothIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>

                    {/* Live/Paper Mode Sections */}
                    {!isBacktestMode && (
                        <>
                            <CollapsibleSection title={t('strategies_section_live_status')} isOpen={openSections.liveStatus} onClick={() => handleSectionToggle('liveStatus')}>
                                <div className="p-3 space-y-2">
                                    {strategyState.steps.map((step, i) => (
                                        <StrategyStepView key={i} step={step} isFirstStep={i === 0} isLastStep={i === strategyState.steps.length - 1} />
                                    ))}
                                </div>
                            </CollapsibleSection>
                            <CollapsibleSection title={t('copilot_title')} isOpen={openSections.copilot} onClick={() => handleSectionToggle('copilot')}>
                               <div className="p-3 space-y-3">
                                    <textarea 
                                        className="w-full h-20 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm placeholder:text-zinc-500"
                                        placeholder={t('copilot_prompt_placeholder')}
                                        value={copilotPrompt}
                                        onChange={e => setCopilotPrompt(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleRequestCopilot} 
                                        disabled={isCopilotLoading || !copilotPrompt}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-md py-2 transition-colors"
                                    >
                                        {isCopilotLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                {t('copilot_generating')}
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5"/>
                                                {t('copilot_generate_button')}
                                            </>
                                        )}
                                    </button>
                                    {aiCopilotError && <p className="text-xs text-red-400">{t(aiCopilotError)}</p>}
                                    {aiCopilotSuggestions && (
                                        <div className="space-y-2 pt-2">
                                            {aiCopilotSuggestions.map((suggestion, i) => (
                                                <AiCopilotSuggestionCard key={i} suggestion={suggestion} currentSettings={currentSettings} />
                                            ))}
                                        </div>
                                    )}
                               </div>
                            </CollapsibleSection>
                            <CollapsibleSection title={t('strategies_section_settings')} isOpen={openSections.settings} onClick={() => handleSectionToggle('settings')}>
                                <div className="p-3 space-y-3">
                                    {(activeStrategy.settingsConfig || []).map(config => (
                                        <div key={config.id} className="text-sm">
                                            <label className="flex justify-between items-center text-zinc-300">
                                                <span>{config.label || t(config.labelKey!)}</span>
                                                {config.type === 'number' && <input type="number" step={config.step} min={config.min} max={config.max} value={(currentSettings as any)[config.id]} onChange={e => handleSettingsChange(config.id as any, parseFloat(e.target.value))} className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-right font-mono" />}
                                                {config.type === 'toggle' && <button onClick={() => handleSettingsChange(config.id as any, !(currentSettings as any)[config.id])} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 ${(currentSettings as any)[config.id] ? 'bg-sky-500' : 'bg-zinc-600'}`}> <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(currentSettings as any)[config.id] ? 'translate-x-5' : 'translate-x-0'}`}/> </button>}
                                            </label>
                                        </div>
                                    ))}
                                    <button onClick={resetStrategySettings} className="w-full text-center text-xs text-zinc-500 hover:text-sky-400 mt-2">{t('restore_settings')}</button>
                                </div>
                            </CollapsibleSection>
                            <CollapsibleSection title={t('strategies_section_visual_indicators')} isOpen={openSections.indicators} onClick={() => handleSectionToggle('indicators')}>
                                <div className="p-3 grid grid-cols-2 gap-2">
                                    {(activeStrategy.indicatorConfig || []).map(ind => (
                                        <button key={ind.id} onClick={() => handleIndicatorToggle(ind.id)} className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${indicatorSettings[ind.id] ? 'bg-sky-500/20 text-sky-300' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                            {indicatorSettings[ind.id] ? <EyeIcon className="w-5 h-5"/> : <EyeSlashIcon className="w-5 h-5"/>}
                                            {ind.label || t(ind.labelKey!)}
                                        </button>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        </>
                    )}

                    {/* Backtest Mode Sections */}
                    {isBacktestMode && (
                        <>
                            <CollapsibleSection title={t('strategies_config_title')} isOpen={openSections.settings} onClick={() => handleSectionToggle('settings')}>
                                <div className="p-3 space-y-3">
                                {(activeStrategy.settingsConfig || []).filter(c => c.type === 'number').map(config => (
                                    <div key={config.id} className="text-sm">
                                        <label className="flex justify-between items-center text-zinc-300">
                                            <span className="flex items-center gap-1.5">{config.label || t(config.labelKey!)}
                                                <span title={config.helpText || t(config.helpTextKey!)}>
                                                    <QuestionMarkCircleIcon className="w-4 h-4 text-zinc-500" />
                                                </span>
                                            </span>
                                            <input type="number" step={config.step} min={config.min} max={config.max} value={(currentSettings as any)[config.id]} onChange={e => handleSettingsChange(config.id as any, parseFloat(e.target.value))} className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-right font-mono" />
                                        </label>
                                    </div>
                                ))}
                                </div>
                            </CollapsibleSection>
                            <CollapsibleSection title={t('strategies_optimization_center_title')} isOpen={openSections.optimization} onClick={() => handleSectionToggle('optimization')}>
                                <div className="p-3 space-y-3">
                                    {(activeStrategy.settingsConfig || []).filter(c => c.type === 'number').map(config => {
                                        const param = optimizationParams.find(p => p.id === config.id);
                                        return (
                                        <div key={config.id} className="text-sm">
                                            <label className="flex justify-between items-center text-zinc-300">
                                                <span>{config.label || t(config.labelKey!)}</span>
                                                <div className="flex items-center gap-2 relative">
                                                    {param && <span className="text-xs text-sky-400 font-semibold">{t('setting_optimized')}</span>}
                                                    <button onClick={() => setActivePopover(activePopover === config.id ? null : config.id as any)} className={`p-1 rounded-md ${activePopover === config.id ? 'bg-sky-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-sky-500'}`}><ChartPieIcon className="w-4 h-4" /></button>
                                                    {param && <button onClick={() => handleClearOptimizationParam(config.id as any)} className="text-zinc-500 hover:text-red-500 text-xs font-bold">X</button>}
                                                    {activePopover === config.id && <OptimizationPopover paramId={config.id as any} onConfigure={handleOptimizationConfigure} onClose={() => setActivePopover(null)} />}
                                                </div>
                                            </label>
                                        </div>
                                    )})}
                                </div>
                            </CollapsibleSection>
                            <CollapsibleSection title={t('strategies_launch_title')} isOpen={openSections.launch} onClick={() => handleSectionToggle('launch')}>
                                <div className="p-3 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-400 mb-1">{t('strategies_data_period_label')}</label>
                                        <select value={backtestPeriod} onChange={e => setBacktestPeriod(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500">
                                            {backtestPeriods.map(p => <option key={p.id} value={p.id}>{t(p.labelKey)}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => runAction('visual')} disabled={isLoading || isBacktestRunning || isOptimizing} className="px-3 py-2 text-sm font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-zinc-700 disabled:cursor-not-allowed">{isLoading || isBacktestRunning ? getButtonText() : t('strategies_run_visual_backtest')}</button>
                                        <button onClick={() => runAction('quick')} disabled={isLoading || isBacktestRunning || isOptimizing} className="px-3 py-2 text-sm font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-zinc-700 disabled:cursor-not-allowed">{isLoading ? getButtonText() : t('strategies_run_quick_backtest')}</button>
                                        <button onClick={() => runAction('optimize')} disabled={isLoading || isBacktestRunning || isOptimizing || optimizationParams.length === 0} className="col-span-2 px-3 py-2 text-sm font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-zinc-700 disabled:cursor-not-allowed">{isOptimizing ? getButtonText() : t('strategies_run_optimization', {count: optimizationParams.length})}</button>
                                        <button onClick={() => runAction('portfolio')} disabled={isLoading || isBacktestRunning || isOptimizing} className="col-span-2 px-3 py-2 text-sm font-semibold bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:bg-zinc-700 disabled:cursor-not-allowed">{isOptimizing ? getButtonText() : t('strategies_run_portfolio_backtest')}</button>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategyPanel;
