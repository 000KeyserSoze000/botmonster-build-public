import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ArrowLongUpIcon, ArrowLongDownIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

export const TradeConfirmationModal: React.FC = () => {
    const t = useTranslation();
    const { 
        pendingTrade, 
        confirmTrade, 
        setPendingTrade,
        globalRiskSettings,
    } = useAppStore(state => ({
        pendingTrade: state.pendingTrade,
        confirmTrade: state.confirmTrade,
        setPendingTrade: state.setPendingTrade,
        globalRiskSettings: state.globalRiskSettings,
    }));
    
    const [sizeMultiplier, setSizeMultiplier] = useState(1);

    if (!pendingTrade) {
        return null;
    }

    const handleConfirm = () => {
        // The type mismatch is intentional due to platform constraints.
        // The implementation in tradeSlice handles the optional payload.
        (confirmTrade as any)({ sizeMultiplier });
    };

    const handleCancel = () => {
        setPendingTrade(null);
    };

    const { pair, direction, entryPrice, sl, tp, strategyNameKey, positionSize, plannedRR } = pendingTrade;
    const isLong = direction === 'LONG';
    
    const finalPositionSize = positionSize * sizeMultiplier;
    const units = finalPositionSize > 0 && entryPrice > 0 ? finalPositionSize / entryPrice : 0;
    const riskedAmount = Math.abs(entryPrice - sl) * units;
    const potentialGain = Math.abs(tp - entryPrice) * units;
    const riskPercent = globalRiskSettings.totalCapital > 0 ? (riskedAmount / globalRiskSettings.totalCapital) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-md w-full p-6 m-4 flex flex-col">
                <div className="flex items-start gap-4">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isLong ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {isLong ? <ArrowLongUpIcon className="h-6 w-6 text-green-400" /> : <ArrowLongDownIcon className="h-6 w-6 text-red-400" />}
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold leading-6 text-zinc-100" id="modal-title">
                            {t('trade_confirm_title')}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{strategyNameKey ? t(strategyNameKey) : ''}</p>
                    </div>
                </div>

                <div className="mt-4 space-y-4 text-sm">
                    {/* Trade Details */}
                    <div className="border-t border-zinc-700 pt-3">
                        <div className="py-1 flex justify-between"><span className="text-zinc-400">{t('trade_confirm_pair')}</span> <span className="font-semibold">{pair}</span></div>
                        <div className="py-1 flex justify-between"><span className="text-zinc-400">{t('trade_confirm_direction')}</span> <span className={`font-semibold ${isLong ? 'text-green-400' : 'text-red-400'}`}>{direction}</span></div>
                        <div className="py-1 flex justify-between"><span className="text-zinc-400">{t('trade_confirm_entry')}</span> <span className="font-mono">${entryPrice.toFixed(4)}</span></div>
                    </div>

                    {/* Risk Analysis */}
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50 space-y-2">
                        <h4 className="font-semibold text-zinc-300">Analyse de Risque</h4>
                        <div className="flex justify-between"><span className="text-zinc-400">{t('trade_confirm_sl')}</span> <span className="font-mono text-red-400">${sl.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-400">{t('trade_confirm_tp')}</span> <span className="font-mono text-green-400">${tp.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-400">Ratio R:R</span> <span className="font-mono">{plannedRR?.toFixed(2) || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-400">Montant Risqué</span> <span className="font-mono text-red-400">${riskedAmount.toFixed(2)} ({riskPercent.toFixed(2)}%)</span></div>
                        <div className="flex justify-between"><span className="text-zinc-400">Gain Potentiel</span> <span className="font-mono text-green-400">${potentialGain.toFixed(2)}</span></div>
                    </div>
                    
                    {/* Position Sizing */}
                    <div className="space-y-2 pt-2">
                         <div className="flex justify-between items-baseline">
                            <label htmlFor="size-slider" className="font-semibold text-zinc-300">Taille de Position</label>
                            <span className="font-mono text-lg font-bold text-sky-400">${finalPositionSize.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500">10%</span>
                            <input
                                id="size-slider"
                                type="range"
                                min="0.1"
                                max="1.25"
                                step="0.05"
                                value={sizeMultiplier}
                                onChange={(e) => setSizeMultiplier(parseFloat(e.target.value))}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                             <span className="text-xs text-zinc-500">125%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm transition-colors"
                        onClick={handleConfirm}
                    >
                        {t('trade_confirm_button')}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                        onClick={handleCancel}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
