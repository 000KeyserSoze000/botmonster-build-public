import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ExclamationTriangleIcon } from './icons/Icons';
import type { TradingMode } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface RobotStopModalProps {
    show: boolean;
}

const RobotStopModal: React.FC<RobotStopModalProps> = ({ show }) => {
    const t = useTranslation();
    const { 
        tradingMode, 
        openTrades,
        stopRobotAndCloseTrades,
        stopRobotAndKeepTrades,
        setShowRobotStopModal
    } = useAppStore(state => ({
        tradingMode: state.tradingMode,
        openTrades: state.openTrades.get(state.tradingMode) || [],
        stopRobotAndCloseTrades: state.stopRobotAndCloseTrades,
        stopRobotAndKeepTrades: state.stopRobotAndKeepTrades,
        setShowRobotStopModal: state.setShowRobotStopModal
    }));
    
    if (!show) {
        return null;
    }

    const tradeCount = openTrades.length;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-lg w-full p-6 m-4">
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/20 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold leading-6 text-zinc-100" id="modal-title">
                            {t('robot_stop_title')}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-zinc-400">
                                {t('robot_stop_p1', { count: tradeCount, mode: tradingMode })}
                            </p>
                            <p className="mt-2 text-sm text-zinc-400">
                                {t('robot_stop_p2')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 space-y-3">
                     <button
                        type="button"
                        className="w-full text-left p-3 rounded-md border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        onClick={stopRobotAndCloseTrades}
                    >
                        <p className="font-semibold text-red-400">{t('robot_stop_option1_title')}</p>
                        <p className="text-xs text-zinc-400">{t('robot_stop_option1_desc')}</p>
                    </button>
                     <button
                        type="button"
                        className="w-full text-left p-3 rounded-md border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-700/50 transition-colors"
                        onClick={stopRobotAndKeepTrades}
                    >
                        <p className="font-semibold text-zinc-200">{t('robot_stop_option2_title')}</p>
                        <p className="text-xs text-zinc-400">{t('robot_stop_option2_desc')}</p>
                    </button>
                </div>
                 <div className="mt-4 text-right">
                     <button
                        type="button"
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                        onClick={() => setShowRobotStopModal(false)}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RobotStopModal;