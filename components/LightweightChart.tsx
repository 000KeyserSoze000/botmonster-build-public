import React, { useEffect, useRef, useMemo, memo, useCallback, useState } from 'react';
import {
    createChart,
    ColorType,
    LineStyle,
    CrosshairMode,
    Time,
    UTCTimestamp,
    IPriceLine,
    IChartApi,
    Logical,
    PriceLineSource,
    ISeriesApi,
    CandlestickData,
    HistogramData,
    LineData,
    SeriesMarker,
    ChartOptions,
    DeepPartial,
    WhitespaceData,
    CandlestickSeriesOptions,
} from 'lightweight-charts';
import type { Candle, StrategyState, Trade, StrategyDefinition, StrategySettings, TradingMode, OrderFlowSettings, IndicatorSettings, VolumeAnomalySettings, ScalpingSettings, RsiDivergenceSettings } from '../types';
import { findAllSwingHighs, findAllSwingLows, calculateVolumeProfile, calculatePivotPoints } from '../services/tradingLogicService';
import ChartCountdown from './ChartCountdown';

interface LightweightChartProps {
  data: Candle[];
  backtestCandleIndex: number;
  indicatorSettings: IndicatorSettings;
  strategyData: StrategyState;
  timeframe: string;
  tradingMode: TradingMode;
  openTrades: Trade[];
  backtestClosedTrades: Trade[];
  activeStrategy: StrategyDefinition;
  strategySettings: StrategySettings;
  activePair: string;
}

interface HoveredData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const chartOptions: DeepPartial<ChartOptions> = {
	layout: {
		background: { type: ColorType.Solid, color: '#18181b' }, // zinc-900
		textColor: '#d4d4d8', // zinc-300
	},
	grid: {
		vertLines: { color: '#27272a' }, // zinc-800
		horzLines: { color: '#27272a' }, // zinc-800
	},
    crosshair: { 
        mode: CrosshairMode.Normal,
        vertLine: {
            width: 1 as const,
            color: '#a1a1aa', // zinc-400
            style: LineStyle.Dashed,
            labelBackgroundColor: '#3f3f46', // zinc-700
        },
        horzLine: {
            width: 1 as const,
            color: '#a1a1aa', // zinc-400
            style: LineStyle.Dashed,
            labelBackgroundColor: '#3f3f46',
        },
    },
    rightPriceScale: { 
        borderColor: '#3f3f46', // zinc-700
        borderVisible: true,
    },
    timeScale: { 
        borderColor: '#3f3f46', // zinc-700
        timeVisible: true, 
        secondsVisible: false,
        rightOffset: 25,
        barSpacing: 10,
    },
};

const candleStickSeriesOptions = {
    upColor: '#22c55e', downColor: '#ef4444',
    borderDownColor: '#ef4444', borderUpColor: '#22c55e',
    wickDownColor: '#ef4444', wickUpColor: '#22c55e',
    priceLineVisible: false, // Disabled to use a custom animated one
    priceLineSource: PriceLineSource.LastVisible,
};

const drawingColors = {
    fvgFill: 'rgba(168, 85, 247, 0.2)',
    fvgBorder: 'rgba(168, 85, 247, 0.5)',
    obFill: 'rgba(245, 158, 11, 0.2)',
    obBorder: 'rgba(245, 158, 11, 0.5)',
    mitigatedFill: 'rgba(82, 82, 91, 0.15)',
    vpFill: 'rgba(113, 113, 122, 0.3)',
    pocFill: 'rgba(14, 165, 233, 0.2)',
    pocBorder: '#0ea5e9',
    trendEma: '#0ea5e9',
    fastEma: '#0ea5e9',
    slowEma: '#f59e0b',
    pivot: '#f59e0b',
    support: '#22c55e',
    resistance: '#ef4444',
    rsiLine: '#a855f7',
    macdLine: '#0ea5e9',
    macdSignal: '#f59e0b',
    atrLine: '#a855f7',
    divergenceLine: '#f59e0b',
    trendLineUp: 'rgba(14, 165, 233, 0.8)',
    trendLineDown: 'rgba(239, 68, 68, 0.8)',
};

const LightweightChart: React.FC<LightweightChartProps> = ({ data, backtestCandleIndex, indicatorSettings, strategyData, timeframe, tradingMode, openTrades, backtestClosedTrades, activeStrategy, strategySettings, activePair }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const trendEmaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const fastEmaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const slowEmaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdSeriesRef = useRef<{ histogram: ISeriesApi<'Histogram'>, macdLine: ISeriesApi<'Line'>, signalLine: ISeriesApi<'Line'> } | null>(null);
    const atrSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const tradePriceLinesRef = useRef<{ [key: string]: { sl: IPriceLine, tp: IPriceLine, entry: IPriceLine } }>({});
    const pivotLinesRef = useRef<IPriceLine[]>([]);
    const lastPriceLineRef = useRef<IPriceLine | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawOverlayRef = useRef<(() => void) | null>(null);
    const [hoveredCandleData, setHoveredCandleData] = useState<HoveredData | null>(null);

    const processedData = data; 

    const drawOverlay = useCallback(() => {
        const chart = chartRef.current;
        const canvas = canvasRef.current;
        const ctx = overlayCanvasCtxRef.current;
        const candleSeries = candleSeriesRef.current;

        if (!chart || !canvas || !ctx || !candleSeries || !chartContainerRef.current) return;

        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, width, height);

        const timeScale = chart.timeScale();
        const logicalRange = timeScale.getVisibleLogicalRange();
        if (!logicalRange) return;

        const priceToY = (price: number) => candleSeries.priceToCoordinate(price);
        const timeToX = (time: Time) => timeScale.timeToCoordinate(time);
        
        const from = Math.max(0, Math.floor(logicalRange.from));
        const to = Math.min(processedData.length, Math.ceil(logicalRange.to));
        const dataSlice = processedData.slice(from, to);

        const drawBox = (x1: number, y1: number, x2: number, y2: number, fillColor: string, strokeColor: string) => {
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            const width = x2 - x1;
            const height = y2 - y1;
            ctx.fillRect(x1, y1, width, height);
            ctx.strokeRect(x1, y1, width, height);
        };
        
        dataSlice.forEach(candle => {
            const time = (candle.time / 1000) as UTCTimestamp;
            const x = timeToX(time);
            if (x === null) return;
            
            const nextCandleIndex = processedData.findIndex(c => c.time > candle.time);
            const nextCandle = nextCandleIndex > -1 ? processedData[nextCandleIndex] : null;
            const x2 = nextCandle ? timeToX((nextCandle.time / 1000) as UTCTimestamp) : x + timeScale.options().barSpacing / 2;
            if(x2 === null) return;

            if (indicatorSettings.showFVG && candle.fvgRange) {
                const y1 = priceToY(candle.fvgRange.top);
                const y2 = priceToY(candle.fvgRange.bottom);
                if (y1 !== null && y2 !== null) {
                    drawBox(x, y1, x2, y2, candle.fvgRange.mitigatedTime ? drawingColors.mitigatedFill : drawingColors.fvgFill, drawingColors.fvgBorder);
                }
            }

            if (indicatorSettings.showOB && candle.obRange) {
                const y1 = priceToY(candle.obRange.top);
                const y2 = priceToY(candle.obRange.bottom);
                if (y1 !== null && y2 !== null) {
                    drawBox(x, y1, x2, y2, drawingColors.obFill, drawingColors.obBorder);
                }
            }
        });

        if (indicatorSettings.showSwings) {
            const swingLookback = (strategySettings as OrderFlowSettings)?.swingLookback || 5;
            const swingHighs = findAllSwingHighs(processedData, swingLookback).filter(s => s.index >= logicalRange.from && s.index <= logicalRange.to);
            const swingLows = findAllSwingLows(processedData, swingLookback).filter(s => s.index >= logicalRange.from && s.index <= logicalRange.to);

            ctx.fillStyle = drawingColors.trendLineUp;
            swingHighs.forEach(swing => {
                const x = timeToX((swing.candle.time / 1000) as UTCTimestamp);
                const y = priceToY(swing.candle.high);
                if (x !== null && y !== null) { ctx.beginPath(); ctx.arc(x, y - 5, 3, 0, 2 * Math.PI); ctx.fill(); }
            });

            ctx.fillStyle = drawingColors.trendLineDown;
            swingLows.forEach(swing => {
                const x = timeToX((swing.candle.time / 1000) as UTCTimestamp);
                const y = priceToY(swing.candle.low);
                if (x !== null && y !== null) { ctx.beginPath(); ctx.arc(x, y + 5, 3, 0, 2 * Math.PI); ctx.fill(); }
            });
        }

        if (indicatorSettings.showLiquidityGrabs) {
            ctx.font = 'bold 14px Arial';
            dataSlice.forEach(candle => {
                if (candle.isLiquidityGrab) {
                    const x = timeToX((candle.time / 1000) as UTCTimestamp);
                    if (x !== null) {
                        if (candle.grabType === 'high') {
                            const y = priceToY(candle.high);
                            if (y !== null) { ctx.fillStyle = drawingColors.trendLineDown; ctx.fillText('⚡️', x - 6, y - 10); }
                        } else {
                            const y = priceToY(candle.low);
                            if (y !== null) { ctx.fillStyle = drawingColors.trendLineUp; ctx.fillText('⚡️', x - 6, y + 20); }
                        }
                    }
                }
            });
        }
        
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        
        dataSlice.forEach(candle => {
            if (candle.marketStructure) {
                const { type, direction, price, time } = candle.marketStructure;
                
                const y = priceToY(price);
                const breakCandleX = timeToX((time / 1000) as UTCTimestamp);
                
                if (breakCandleX === null || y === null) return;
                
                const brokenCandle = processedData.find(c => (c.high === price || c.low === price) && c.time < time);
                const startX = brokenCandle ? timeToX((brokenCandle.time / 1000) as UTCTimestamp) : breakCandleX - 100;

                if (startX === null) return;

                const endX = breakCandleX + 20;
                
                const isBullish = direction === 'bullish';
                ctx.strokeStyle = isBullish ? drawingColors.trendLineUp : drawingColors.trendLineDown;
                ctx.fillStyle = ctx.strokeStyle;
                
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
                ctx.stroke();
                ctx.setLineDash([]);
                
                const textY = isBullish ? y - 4 : y + 14;
                ctx.fillText(type, startX, textY);
            }
        });


        if (indicatorSettings.showVolumeProfile) {
            const { profile, maxVolume } = calculateVolumeProfile(dataSlice, 50);
            const vpWidthRatio = 0.2;
            profile.forEach(p => {
                const y1 = priceToY(p.price_high);
                const y2 = priceToY(p.price_low);
                if(y1 !== null && y2 !== null) {
                    const barWidth = (p.volume / maxVolume) * (width * vpWidthRatio);
                    ctx.fillStyle = drawingColors.vpFill;
                    ctx.fillRect(width - barWidth, y1, barWidth, y2 - y1);
                }
            });
        }
        
        if (indicatorSettings.showDivergence && strategyData.divergencePoints) {
            const { priceA, priceB, rsiA, rsiB } = strategyData.divergencePoints;
            const rsiSeries = rsiSeriesRef.current;
            if(rsiSeries) {
                const priceToY_RSI = (price: number) => rsiSeries.priceToCoordinate(price);
                const p1x = timeToX(priceA.time / 1000 as UTCTimestamp); const p1y = priceToY(priceA.value);
                const p2x = timeToX(priceB.time / 1000 as UTCTimestamp); const p2y = priceToY(priceB.value);
                const r1x = timeToX(rsiA.time / 1000 as UTCTimestamp); const r1y = priceToY_RSI(rsiA.value);
                const r2x = timeToX(rsiB.time / 1000 as UTCTimestamp); const r2y = priceToY_RSI(rsiB.value);

                ctx.strokeStyle = drawingColors.divergenceLine; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
                if(p1x && p1y && p2x && p2y) { ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke(); }
                if(r1x && r1y && r2x && r2y) { ctx.beginPath(); ctx.moveTo(r1x, r1y); ctx.lineTo(r2x, r2y); ctx.stroke(); }
                ctx.setLineDash([]);
            }
        }
    }, [processedData, indicatorSettings, strategyData, activeStrategy.id, strategySettings, data]);
    
    useEffect(() => { drawOverlayRef.current = drawOverlay; });

    useEffect(() => {
        if (!chartContainerRef.current || chartRef.current) return;

        const chart = createChart(chartContainerRef.current, chartOptions as ChartOptions) as any;
        chartRef.current = chart;

        // Apply watermark after creation to avoid strict type issues
        chart.applyOptions({
            watermark: {
                color: 'rgba(255, 255, 255, 0.06)',
                visible: true,
                text: `${activePair} ${timeframe}`,
                fontSize: 48,
                horzAlign: 'center',
                vertAlign: 'center',
            },
        });


        candleSeriesRef.current = chart.addCandlestickSeries(candleStickSeriesOptions);
        volumeSeriesRef.current = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'volume_pane_scale' });
        chart.priceScale('volume_pane_scale').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

        rsiSeriesRef.current = chart.addLineSeries({ color: drawingColors.rsiLine, lineWidth: 2, priceScaleId: 'rsi_pane_scale', lastValueVisible: true, priceLineVisible: false, });
        chart.priceScale('rsi_pane_scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        
        macdSeriesRef.current = {
            histogram: chart.addHistogramSeries({ priceScaleId: 'macd_pane_scale', lastValueVisible: false }),
            macdLine: chart.addLineSeries({ priceScaleId: 'macd_pane_scale', color: drawingColors.macdLine, lineWidth: 2, lastValueVisible: false, priceLineVisible: false }),
            signalLine: chart.addLineSeries({ priceScaleId: 'macd_pane_scale', color: drawingColors.macdSignal, lineWidth: 2, lastValueVisible: false, priceLineVisible: false }),
        };
        chart.priceScale('macd_pane_scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        
        atrSeriesRef.current = chart.addLineSeries({ color: drawingColors.atrLine, lineWidth: 2, priceScaleId: 'atr_pane_scale', lastValueVisible: true, priceLineVisible: false, });
        chart.priceScale('atr_pane_scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        trendEmaSeriesRef.current = chart.addLineSeries({ color: drawingColors.trendEma, lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
        fastEmaSeriesRef.current = chart.addLineSeries({ color: drawingColors.fastEma, lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
        slowEmaSeriesRef.current = chart.addLineSeries({ color: drawingColors.slowEma, lineWidth: 2, lastValueVisible: false, priceLineVisible: false });

        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '5';
        chartContainerRef.current.append(canvas);
        canvasRef.current = canvas;
        overlayCanvasCtxRef.current = canvas.getContext('2d');

        const callDrawOverlay = () => drawOverlayRef.current?.();
        const resizeObserver = new ResizeObserver(() => { chart.resize(chartContainerRef.current?.clientWidth ?? 0, chartContainerRef.current?.clientHeight ?? 0); callDrawOverlay(); });
        resizeObserver.observe(chartContainerRef.current);
        chart.timeScale().subscribeVisibleLogicalRangeChange(callDrawOverlay);

        chart.subscribeCrosshairMove((param: any) => {
            if (!param.point || !param.time || !candleSeriesRef.current || !volumeSeriesRef.current) {
                setHoveredCandleData(null);
                return;
            }
            const candleData = param.seriesData.get(candleSeriesRef.current);
            const volumeData = param.seriesData.get(volumeSeriesRef.current);
            if (candleData && 'open' in candleData && volumeData && 'value' in volumeData) {
                setHoveredCandleData({ ...candleData, volume: volumeData.value });
            } else {
                setHoveredCandleData(null);
            }
        });


        return () => { resizeObserver.disconnect(); chart.remove(); chartRef.current = null; };
    }, []);
    
    // Watermark must be updated via options on the chart object, not applyOptions on the series.
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.applyOptions({
                watermark: {
                    text: `${activePair} ${timeframe}`,
                },
            });
        }
    }, [activePair, timeframe]);

    useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        
        candleSeries.setData(processedData.map(d => ({ time: (d.time / 1000) as UTCTimestamp, open: d.open, high: d.high, low: d.low, close: d.close })));

        // FIX #2: Make indicator visibility strategy-aware
        const isIndicatorActive = (id: keyof IndicatorSettings) => !!indicatorSettings[id] && activeStrategy.indicatorConfig.some(ind => ind.id === id);

        const volumeData: HistogramData[] = processedData.map(d => {
            let color = d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
            if (isIndicatorActive('showVolumeAnomaly') && d.volume && d.volumeSma && d.volume > d.volumeSma * ((strategySettings as VolumeAnomalySettings).volumeFactor || 3)) {
                color = d.close >= d.open ? 'rgba(59, 130, 246, 0.7)' : 'rgba(244, 63, 94, 0.7)';
            }
            return { time: (d.time / 1000) as UTCTimestamp, value: d.volume, color };
        });
        volumeSeriesRef.current?.setData(volumeData);
        volumeSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showVolumeAnomaly') });
        
        const trendEmaData = processedData.filter(d => d.htfEma !== undefined).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.htfEma! }));
        trendEmaSeriesRef.current?.setData(trendEmaData);
        trendEmaSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showFastEma') }); // Uses fast EMA toggle intentionally
        
        const fastEmaData = processedData.filter(d => d.fastEma !== undefined).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.fastEma! }));
        fastEmaSeriesRef.current?.setData(fastEmaData);
        fastEmaSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showFastEma') });

        const slowEmaData = processedData.filter(d => d.slowEma !== undefined).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.slowEma! }));
        slowEmaSeriesRef.current?.setData(slowEmaData);
        slowEmaSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showSlowEma') });

        const rsiData = processedData.filter(d => d.rsi !== undefined).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.rsi! }));
        rsiSeriesRef.current?.setData(rsiData);
        rsiSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showRsi') });

        if (macdSeriesRef.current) {
            const macdHistogramData: HistogramData[] = processedData.filter(d => d.macd).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.macd!.histogram, color: d.macd!.histogram >= 0 ? drawingColors.support : drawingColors.resistance }));
            const macdLineData: LineData[] = processedData.filter(d => d.macd).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.macd!.macd }));
            const macdSignalData: LineData[] = processedData.filter(d => d.macd).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.macd!.signal }));
            macdSeriesRef.current.histogram.setData(macdHistogramData);
            macdSeriesRef.current.macdLine.setData(macdLineData);
            macdSeriesRef.current.signalLine.setData(macdSignalData);
            Object.values(macdSeriesRef.current).forEach(series => series.applyOptions({ visible: isIndicatorActive('showMacd') }));
        }

        const atrData = processedData.filter(d => d.atr !== undefined).map(d => ({ time: (d.time / 1000) as UTCTimestamp, value: d.atr! }));
        atrSeriesRef.current?.setData(atrData);
        atrSeriesRef.current?.applyOptions({ visible: isIndicatorActive('showAtr') });

        // Animated Price Line Logic
        if (tradingMode !== 'Backtest' && processedData.length > 0) {
            const lastCandle = processedData[processedData.length - 1];
            const prevCandle = processedData.length > 1 ? processedData[processedData.length - 2] : null;
            const color = !prevCandle || lastCandle.close >= prevCandle.close ? drawingColors.support : drawingColors.resistance;

            if (lastPriceLineRef.current) {
                lastPriceLineRef.current.applyOptions({ price: lastCandle.close, color });
            } else {
                lastPriceLineRef.current = candleSeries.createPriceLine({
                    price: lastCandle.close,
                    color,
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed as any,
                    axisLabelVisible: true,
                    title: '',
                });
            }
        } else {
            if (lastPriceLineRef.current) {
                candleSeries.removePriceLine(lastPriceLineRef.current);
                lastPriceLineRef.current = null;
            }
        }

    }, [processedData, activeStrategy.id, strategySettings, indicatorSettings, tradingMode]);
    
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || data.length === 0) return;

        requestAnimationFrame(() => {
            if (!chartRef.current) return;
            if (tradingMode === 'Backtest') {
                const to = backtestCandleIndex;
                const from = Math.max(0, to - 100); 
                chartRef.current.timeScale().setVisibleLogicalRange({ from: from as Logical, to: to as Logical });
            } else {
                const totalCandles = data.length;
                if (totalCandles > 0) {
                    const to = totalCandles - 1;
                    const from = Math.max(0, to - 100);
                    chartRef.current.timeScale().setVisibleLogicalRange({ from: from as Logical, to: to as Logical });
                }
            }
        });
    }, [data, tradingMode, backtestCandleIndex]);

    useEffect(() => { requestAnimationFrame(() => { drawOverlay(); }); }, [drawOverlay]);

    useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        const markers: SeriesMarker<Time>[] = [];
        const tradesToMark = tradingMode === 'Backtest' ? backtestClosedTrades : [];

        tradesToMark.forEach(trade => {
            const entryTime = (trade.time / 1000) as UTCTimestamp;
            const exitTime = (trade.exitTime! / 1000) as UTCTimestamp;
            const isProfit = (trade.pnl || 0) >= 0;
            markers.push({ time: entryTime, position: 'belowBar', color: '#a1a1aa', shape: 'arrowUp', text: `Entrée ${trade.direction}` });
            markers.push({ time: exitTime, position: 'aboveBar', color: isProfit ? '#22c55e' : '#ef4444', shape: 'arrowDown', text: `Sortie ${trade.exitReason}`});
        });
        (candleSeries as any).setMarkers(markers);
    }, [tradingMode, backtestClosedTrades]);

    useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;

        pivotLinesRef.current.forEach(line => candleSeries.removePriceLine(line));
        pivotLinesRef.current = [];
        
        if (!indicatorSettings.showPivots || data.length === 0) return;

        const pivots = calculatePivotPoints(data);
        if (!pivots) return;
        
        const createLine = (price: number, color: string, title: string) => candleSeries.createPriceLine({ price, color, lineWidth: 1, lineStyle: LineStyle.Dotted as any, axisLabelVisible: true, title });

        const newLines: IPriceLine[] = [
            createLine(pivots.P, drawingColors.pivot, 'P'),
            createLine(pivots.R1, drawingColors.resistance, 'R1'), createLine(pivots.S1, drawingColors.support, 'S1'),
            createLine(pivots.R2, drawingColors.resistance, 'R2'), createLine(pivots.S2, drawingColors.support, 'S2'),
            createLine(pivots.R3, drawingColors.resistance, 'R3'), createLine(pivots.S3, drawingColors.support, 'S3'),
        ];
        pivotLinesRef.current = newLines;
    }, [data, indicatorSettings.showPivots]);

     useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        const currentLineIds = Object.keys(tradePriceLinesRef.current);
        const openTradeIds = openTrades.map(t => t.id);

        currentLineIds.forEach(id => {
            if (!openTradeIds.includes(id)) {
                const lines = tradePriceLinesRef.current[id];
                if (lines) {
                    candleSeries.removePriceLine(lines.sl);
                    candleSeries.removePriceLine(lines.tp);
                    candleSeries.removePriceLine(lines.entry);
                }
                delete tradePriceLinesRef.current[id];
            }
        });

        openTrades.forEach(trade => {
            if (tradePriceLinesRef.current[trade.id]) {
                const lines = tradePriceLinesRef.current[trade.id];
                lines.sl.applyOptions({ price: trade.sl });
                lines.tp.applyOptions({ price: trade.tp });
                lines.entry.applyOptions({ price: trade.entryPrice });
            } else {
                const createLine = (price: number, color: string, title: string, style = LineStyle.Dashed) =>
                    candleSeries.createPriceLine({ price, color, lineWidth: 2, lineStyle: style as any, axisLabelVisible: true, title });

                const slLine = createLine(trade.sl, '#ef4444', 'SL');
                const tpLine = createLine(trade.tp, '#22c55e', 'TP');
                const entryLine = createLine(trade.entryPrice, '#a1a1aa', 'Entrée', LineStyle.Solid);
                
                tradePriceLinesRef.current[trade.id] = { sl: slLine, tp: tpLine, entry: entryLine };
            }
        });
    }, [openTrades]);
    
  return (
    <div ref={chartContainerRef} className="w-full h-full relative">
        {hoveredCandleData && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-x-5 gap-y-1 flex-wrap text-sm font-mono p-3 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 shadow-lg">
                <span className="font-sans font-bold text-base text-sky-400">{activePair}</span>
                <span>O: <span className="text-zinc-100">{hoveredCandleData.open.toFixed(4)}</span></span>
                <span>H: <span className="text-green-400">{hoveredCandleData.high.toFixed(4)}</span></span>
                <span>L: <span className="text-red-400">{hoveredCandleData.low.toFixed(4)}</span></span>
                <span>C: <span className="text-zinc-100">{hoveredCandleData.close.toFixed(4)}</span></span>
                <span>V: <span className="text-amber-400">{(hoveredCandleData.volume / 1000).toFixed(1)}k</span></span>
            </div>
        )}
        <div className="absolute top-2 right-14 z-20">
            {data.length > 0 && tradingMode !== 'Backtest' && <ChartCountdown lastCandleTime={data[data.length-1].time} timeframe={timeframe} />}
        </div>
    </div>
  );
};

export default memo(LightweightChart);
