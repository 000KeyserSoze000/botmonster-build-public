import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ArrowUturnLeftIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const ReviewModeBanner: React.FC = () => {
    const t = useTranslation();
    const { previousTradingMode, exitReviewMode, activePair } = useAppStore(state => ({
        previousTradingMode: state.previousTradingMode,
        exitReviewMode: state.exitReviewMode,
        activePair: state.activePair,
    }));

    if (!previousTradingMode) {
        return null;
    }

    const modeKey = `${previousTradingMode.toLowerCase()}Mode` as const;
    const modeText = t(modeKey);

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-indigo-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-b-lg shadow-lg flex items-center gap-4 animate-fade-in-down">
            <p className="text-sm font-semibold">
                {t('reviewModeBanner_title')} <span className="font-mono bg-indigo-500/50 px-1.5 py-0.5 rounded">{activePair}</span>
            </p>
            <button
                onClick={exitReviewMode}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 hover:bg-indigo-400 rounded-md text-xs font-bold transition-colors"
            >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                {t('reviewModeBanner_button', { mode: modeText })}
            </button>
        </div>
    );
};

export default ReviewModeBanner;