
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const BacktestControls: React.FC = () => {
    const t = useTranslation();
    const {
        playbackState,
        setPlaybackState,
        setCandleIndex,
        currentIndex,
        totalCandles,
        speed,
        setSpeed
    } = useAppStore(state => ({
        playbackState: state.backtestPlaybackState,
        setPlaybackState: state.setBacktestPlaybackState,
        setCandleIndex: state.setBacktestCandleIndex,
        currentIndex: state.backtestCandleIndex,
        totalCandles: state.backtestHistoricalData.length,
        speed: state.backtestSpeed,
        setSpeed: state.setBacktestSpeed,
    }));

    const onPlayPause = () => setPlaybackState(playbackState === 'playing' ? 'paused' : 'playing');
    const onStepForward = () => setCandleIndex(Math.min(currentIndex + 1, totalCandles - 1));
    const onStepBackward = () => setCandleIndex(Math.max(currentIndex - 1, 0));
    const onTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => setCandleIndex(Number(e.target.value));

    const speeds = [
        { label: 'x1', value: 200 },
        { label: 'x2', value: 100 },
        { label: 'x4', value: 50 },
        { label: 'x8', value: 25 },
    ];
    
    return (
        <div className="flex-shrink-0 bg-zinc-900/70 backdrop-blur-sm border-t border-b border-zinc-700 px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-4 text-zinc-300">
            <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={onStepBackward} className="p-2 hover:bg-zinc-700 rounded-full" title={t('step_backward')}>
                    <BackwardIcon className="w-5 h-5" />
                </button>
                <button onClick={onPlayPause} className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600" title={playbackState === 'playing' ? t('pause') : t('play')}>
                    {playbackState === 'playing' ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                <button onClick={onStepForward} className="p-2 hover:bg-zinc-700 rounded-full" title={t('step_forward')}>
                    <ForwardIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max={totalCandles > 0 ? totalCandles - 1 : 0}
                    value={currentIndex}
                    onChange={onTimelineChange}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-sm"
                />
                <span className="hidden sm:block text-xs font-mono w-28 text-right">{currentIndex + 1} / {totalCandles}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-semibold">{t('backtest_controls_speed')}</span>
                <div className="flex items-center bg-zinc-800 rounded-md p-0.5">
                    {speeds.map(s => (
                        <button key={s.label} onClick={() => setSpeed(s.value)} className={`px-2 py-0.5 text-xs font-semibold rounded-sm transition-colors ${speed === s.value ? 'bg-sky-500 text-white' : 'hover:bg-zinc-700'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BacktestControls;
