import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import LightweightChart from './LightweightChart';
import TradingViewWidget from './TradingViewWidget';
import type { StrategyDefinition, Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SparklesIcon } from './icons/Icons';
import { analyzeChartData } from '../services/geminiService';

const TradingChart: React.FC = () => {
    const t = useTranslation();
    const {
        indicatorSettings, activeStrategyId,
        timeframe, tradingMode, openTrades, activePair, backtestClosedTrades,
        strategySettingsMap, strategyDefinitions, strategyStateMap,
        backtestHistoricalData, backtestCandleIndex, processedCandlesMap,
        backtestPlaybackState, isDataLoading,
    } = useAppStore(state => ({
        indicatorSettings: state.indicatorSettings,
        activeStrategyId: state.activeStrategyId,
        timeframe: state.timeframe,
        tradingMode: state.tradingMode,
        openTrades: state.openTrades.get(state.tradingMode) || [], // CONTEXT-AWARE SELECTOR
        activePair: state.activePair,
        backtestClosedTrades: state.backtestClosedTrades,
        strategySettingsMap: state.strategySettingsMap,
        strategyDefinitions: state.strategyDefinitions,
        strategyStateMap: state.strategyStateMap,
        backtestHistoricalData: state.backtestHistoricalData,
        backtestCandleIndex: state.backtestCandleIndex,
        processedCandlesMap: state.processedCandlesMap,
        backtestPlaybackState: state.backtestPlaybackState,
        isDataLoading: state.isDataLoading,
    }));
  
    const chartData = useMemo(() => {
        if (tradingMode === 'Backtest') {
            return backtestHistoricalData;
        }
        return processedCandlesMap.get(activePair) || [];
    }, [tradingMode, backtestHistoricalData, processedCandlesMap, activePair]);

    const activeStrategy = useMemo(() => strategyDefinitions.get(activeStrategyId), [strategyDefinitions, activeStrategyId]) as StrategyDefinition;
    const activeStrategyState = useMemo(() => strategyStateMap.get(activePair) || { steps: [], alert: null }, [strategyStateMap, activePair]);
    const strategySettings = useMemo(() => {
        const activeSettingsKey = `${activeStrategyId}-${timeframe}`;
        return strategySettingsMap[activeSettingsKey] || activeStrategy.defaultSettings;
    }, [strategySettingsMap, activeStrategyId, timeframe, activeStrategy]);

    const handleAnalysisRequest = async () => {
        const { setAiState, setShowAiAnalysisPanel } = useAppStore.getState();
        setAiState({ isLoading: true, error: '' });
        setShowAiAnalysisPanel(true);
        try {
            const { processedCandlesMap, tradingMode, backtestHistoricalData, backtestCandleIndex, timeframe, activePair, indicatorSettings, language } = useAppStore.getState();
            
            const getActiveCandles = () => {
              if (tradingMode === 'Backtest') {
                  if (backtestHistoricalData.length === 0) return [];
                  const startIndex = Math.max(0, backtestCandleIndex - 250);
                  return backtestHistoricalData.slice(startIndex, backtestCandleIndex + 1);
              }
              return processedCandlesMap.get(activePair) || [];
            };
            const activeCandles = getActiveCandles();

            if (activeCandles.length === 0) {
                throw new Error(t('gemini_no_chart_data', { pair: activePair, timeframe }));
            }
            
            const lastCandle = activeCandles[activeCandles.length - 1];
            const localeMap: Record<Language, string> = {
                en: 'en-US', fr: 'fr-FR',
            };
            const locale = localeMap[language];

            let prompt = `${t('gemini_analysis_for', { pair: activePair, timeframe })}. ${t('gemini_last_close', { price: lastCandle.close.toFixed(2) })}\n\n`;

            const recentCandles = activeCandles.slice(-20);
            prompt += t('gemini_recent_events');
            recentCandles.forEach((c) => {
                let events = [];
                if (indicatorSettings.showOB && c.isOB) events.push(t('gemini_event_ob'));
                if (indicatorSettings.showFVG && c.fvgRange) events.push(t('gemini_event_fvg', { bottom: c.fvgRange.bottom.toFixed(2), top: c.fvgRange.top.toFixed(2) }));
                if (indicatorSettings.showLiquidityGrabs && c.isLiquidityGrab) events.push(t('gemini_event_liquidity_grab'));
                
                if (events.length > 0) {
                    prompt += `- ${t('gemini_candle_date', { date: new Date(c.time).toLocaleString(locale) })}: ${events.join(', ')}\n`;
                }
            });

            const systemInstruction = t('gemini_system_instruction', { pair: activePair, timeframe });
            
            const analysis = await analyzeChartData(prompt, systemInstruction);
            setAiState({ analysis, isLoading: false, error: '' });
        } catch (err: any) {
            const messageKey = err.message || 'unknownError';
            setAiState({ analysis: '', isLoading: false, error: t(messageKey, { message: err.message }) });
        }
    };

    if (!activeStrategy || !strategySettings) {
        return <div className="w-full h-full flex items-center justify-center text-zinc-500">{t('chart_loading_strategy')}</div>;
    }

    const isBacktestLoading = tradingMode === 'Backtest' && backtestPlaybackState === 'loading';
    const isLoading = isBacktestLoading || isDataLoading;
    const loadingMessage = isBacktestLoading ? t('chart_loading_backtest_data') : t('chart_loading_market_data');

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4 animate-fade-in">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <p className="text-lg font-semibold">{loadingMessage}</p>
            </div>
        );
    }

  return (
    <div className="w-full h-full relative">
        <button 
            onClick={handleAnalysisRequest}
            className="absolute top-2 right-2 z-10 p-2 bg-indigo-500/50 hover:bg-indigo-500/80 text-white rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg"
            title={t('analyze_with_ai_tooltip')}
        >
            <SparklesIcon className="w-5 h-5" />
        </button>

       {activeStrategy.chartRenderer === 'tradingview' ? (
           <TradingViewWidget
               activePair={activePair}
               timeframe={timeframe}
               strategySettings={strategySettings}
               activeStrategy={activeStrategy}
               indicatorSettings={indicatorSettings}
           />
       ) : (
           <LightweightChart
               data={chartData}
               backtestCandleIndex={backtestCandleIndex}
               indicatorSettings={indicatorSettings}
               activeStrategy={activeStrategy}
               strategyData={activeStrategyState}
               timeframe={timeframe}
               tradingMode={tradingMode}
               openTrades={openTrades.filter(t => t.pair === activePair)}
               activePair={activePair}
               backtestClosedTrades={backtestClosedTrades}
               strategySettings={strategySettings}
           />
       )}
    </div>
  );
};

export default TradingChart;