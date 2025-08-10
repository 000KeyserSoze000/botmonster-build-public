
import React, { useState, useEffect } from 'react';

interface ChartCountdownProps {
    lastCandleTime: number;
    timeframe: string;
}

function getTimeStep(timeframe: string): number {
    if (!timeframe || timeframe.length < 2) return 60 * 60 * 1000;
    const unit = timeframe.slice(-1).toLowerCase();
    const value = parseInt(timeframe.slice(0, -1), 10);
    if (isNaN(value)) return 60 * 60 * 1000;

    switch(unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'w': return value * 7 * 24 * 60 * 60 * 1000;
        default: return 60 * 60 * 1000;
    }
}

const ChartCountdown: React.FC<ChartCountdownProps> = ({ lastCandleTime, timeframe }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!lastCandleTime) return;

            const timeStep = getTimeStep(timeframe);
            const nextCandleTime = lastCandleTime + timeStep;
            const now = Date.now();
            const remaining = nextCandleTime - now;

            if (remaining <= 0) {
                setTimeLeft('00:00');
                return;
            }

            const totalSeconds = Math.floor(remaining / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            let display = '';
            if (hours > 0) {
                display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                 display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            setTimeLeft(display);
        };
        
        calculateTimeLeft(); // Initial call
        const intervalId = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(intervalId);
    }, [lastCandleTime, timeframe]);
    
    return (
         <div className="bg-zinc-900/50 backdrop-blur-sm text-zinc-200 text-xs font-mono font-semibold px-2 py-0.5 rounded-md text-center border border-zinc-700">
            {timeLeft}
        </div>
    );
};

export default ChartCountdown;