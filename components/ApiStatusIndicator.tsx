import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { BoltIcon } from './icons/Icons';

const ApiStatusIndicator: React.FC = () => {
    const t = useTranslation();
    const { usedWeight, limit } = useAppStore(state => state.binanceApiStatus);
    
    const percentage = (usedWeight / limit) * 100;

    let barColor = 'bg-green-500';
    if (percentage > 80) {
        barColor = 'bg-red-500';
    } else if (percentage > 50) {
        barColor = 'bg-yellow-500';
    }
    
    const tooltipText = t('api_status_tooltip', { used: usedWeight, limit });

    return (
        <div className="group relative flex items-center gap-2 text-xs" title={tooltipText}>
            <BoltIcon className="w-4 h-4 text-zinc-400" />
            <div className="w-24 bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                ></div>
            </div>
            <span className="font-mono w-20 text-left">{usedWeight} / {limit}</span>
        </div>
    );
};

export default ApiStatusIndicator;