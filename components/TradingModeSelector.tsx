
import React from 'react';
import type { TradingMode } from '../types';
import { WalletIcon, DocumentChartBarIcon, ClockIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface TradingModeSelectorProps {
    currentMode: TradingMode;
    onModeChange: (mode: TradingMode) => void;
}

const TradingModeSelector: React.FC<TradingModeSelectorProps> = ({ currentMode, onModeChange }) => {
    const t = useTranslation();

    const modes: { id: TradingMode; labelKey: string; icon: React.ReactNode; }[] = [
        {
            id: 'Backtest',
            labelKey: 'backtestMode',
            icon: <ClockIcon className="w-4 h-4" />,
        },
        {
            id: 'Paper',
            labelKey: 'paperMode',
            icon: <DocumentChartBarIcon className="w-4 h-4" />,
        },
        {
            id: 'Live',
            labelKey: 'liveMode',
            icon: <WalletIcon className="w-4 h-4" />,
        }
    ];

    return (
        <div className="flex items-center bg-zinc-800 rounded-md p-0.5">
            {modes.map(mode => (
                <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${
                        currentMode === mode.id
                        ? 'bg-sky-500 text-white'
                        : 'text-zinc-400 hover:bg-zinc-700'
                    }`}
                >
                    {mode.icon}
                    <span className="hidden xl:inline">{t(mode.labelKey)}</span>
                </button>
            ))}
        </div>
    );
}

export default TradingModeSelector;