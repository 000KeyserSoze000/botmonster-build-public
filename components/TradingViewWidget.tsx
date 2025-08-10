
import React, { useEffect, useRef, memo } from 'react';
import type { StrategySettings, StrategyDefinition, IndicatorSettings, ScalpingSettings } from '../types';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  activePair: string;
  timeframe: string;
  strategySettings: StrategySettings;
  activeStrategy: StrategyDefinition;
  indicatorSettings: IndicatorSettings;
}

const mapTimeframeToTradingView = (tf: string): string => {
    const value = parseInt(tf.slice(0, -1));
    const unit = tf.slice(-1).toLowerCase();

    if (unit === 'm') return String(value);
    if (unit === 'h') return String(value * 60);
    if (unit === 'd') return 'D';
    if (unit === 'w') return 'W';
    return '60'; // fallback to 1H
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ activePair, timeframe, strategySettings, activeStrategy, indicatorSettings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activePair || typeof window.TradingView === 'undefined') {
      return;
    }
    
    // Build the studies array based on current settings.
    const studies = [];

    if (indicatorSettings.showPivots) {
        studies.push("PivotPointsStandard@tv-basicstudies");
    }

    if (activeStrategy.id === 'scalping-ema-cross') {
        const s = strategySettings as ScalpingSettings;
        
        if (indicatorSettings.showFastEma) {
            studies.push({
                id: 'MAExp@tv-basicstudies',
                inputs: { length: s.fastEmaPeriod },
                styles: { "plot_0": { "color": "#0ea5e9" } } // Sky Blue
            });
        }
        if (indicatorSettings.showSlowEma) {
            studies.push({
                id: 'MAExp@tv-basicstudies',
                inputs: { length: s.slowEmaPeriod },
                styles: { "plot_0": { "color": "#f59e0b" } } // Amber/Yellow
            });
        }
    }

    const widgetOptions = {
        autosize: true,
        symbol: `BINANCE:${activePair.replace('/', '')}`,
        interval: mapTimeframeToTradingView(timeframe),
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "fr",
        toolbar_bg: "#27272a",
        enable_publishing: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        container: container,
        studies: studies,
        overrides: {
            "paneProperties.background": "#18181b",
            "paneProperties.vertGridProperties.color": "#27272a",
            "paneProperties.horzGridProperties.color": "#27272a",
            "scalesProperties.textColor": "#e4e4e7",
            "paneProperties.backgroundType": "solid",
            "symbolWatermarkProperties.transparency": 90,
            "mainSeriesProperties.candleStyle.upColor": "#22c55e",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
            "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
        },
    };
    
    widgetRef.current = new window.TradingView.widget(widgetOptions);
    
    return () => {
        // The container may have been removed from the DOM by React before this cleanup function runs.
        // Check if the widget reference and the container's parent node exist before removal.
        if (widgetRef.current && containerRef.current?.parentNode) {
            try {
                widgetRef.current.remove();
            } catch (error) {
                console.error("Error removing TradingView widget on cleanup:", error);
            }
        }
        widgetRef.current = null;
    };
    
  }, [activePair, timeframe, indicatorSettings, strategySettings, activeStrategy.id]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default memo(TradingViewWidget);
