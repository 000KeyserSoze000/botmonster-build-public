import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';

// Session times in UTC hours
const SESSIONS = {
    tokyo: { start: 0, end: 9, nameKey: 'session_tokyo', color: 'bg-purple-500' },
    london: { start: 8, end: 17, nameKey: 'session_london', color: 'bg-sky-500' },
    ny: { start: 13, end: 22, nameKey: 'session_ny', color: 'bg-amber-500' },
};

const MarketSessionsIndicator: React.FC = () => {
    const t = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const { tooltipInfo } = useMemo(() => {
        const currentHourUTC = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
        
        const active = Object.values(SESSIONS).filter(s => currentHourUTC >= s.start && currentHourUTC < s.end);
        const overlaps = [];
        if (currentHourUTC >= 8 && currentHourUTC < 9) overlaps.push({ nameKey: 'session_overlap_tky_ldn', volatilityKey: 'session_volatility_medium' });
        if (currentHourUTC >= 13 && currentHourUTC < 17) overlaps.push({ nameKey: 'session_overlap_ldn_ny', volatilityKey: 'session_volatility_high' });
        
        let info = { title: '', volatility: '' };
        if (overlaps.length > 0) {
            info.title = t(overlaps[0].nameKey);
            info.volatility = t(overlaps[0].volatilityKey);
        } else if (active.length > 0) {
            info.title = t(active[0].nameKey);
            info.volatility = t('session_volatility_low');
        } else {
             info.title = t('session_off_hours');
             info.volatility = t('session_volatility_very_low');
        }

        return { tooltipInfo: info };
    }, [currentTime, t]);

    return (
        <div className="group relative flex-grow max-w-[200px] h-6 flex items-center cursor-pointer">
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                {/* Session bars */}
                {Object.values(SESSIONS).map(s => (
                    <div key={s.nameKey} className={`absolute h-full ${s.color}`} style={{ left: `${(s.start / 24) * 100}%`, width: `${((s.end - s.start) / 24) * 100}%` }} />
                ))}
                {/* Overlap gradients */}
                 <div className="absolute h-full bg-gradient-to-r from-purple-500 to-sky-500" style={{ left: `${(8 / 24) * 100}%`, width: `${(1 / 24) * 100}%` }} />
                 <div className="absolute h-full bg-gradient-to-r from-sky-500 to-amber-500" style={{ left: `${(13 / 24) * 100}%`, width: `${(4 / 24) * 100}%` }} />
            </div>
            
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max p-2 text-xs bg-zinc-900 border border-zinc-700 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="font-bold text-sky-400">{tooltipInfo.title}</div>
                <div>{tooltipInfo.volatility}</div>
            </div>
        </div>
    );
};

export default MarketSessionsIndicator;