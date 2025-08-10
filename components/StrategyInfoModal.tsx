import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { XMarkIcon, LightBulbIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const StrategyInfoModal: React.FC = () => {
    const t = useTranslation();
    const { show, activeStrategy, onClose } = useAppStore(state => ({
        show: state.showStrategyInfoModal,
        activeStrategy: state.strategyDefinitions.get(state.activeStrategyId),
        onClose: () => state.setShowStrategyInfoModal(false)
    }));

    if (!show || !activeStrategy) {
        return null;
    }
    
    const formatSettingValue = (value: any): string => {
        if (typeof value === 'boolean') {
            return value ? t('setting_value_enabled') : t('setting_value_disabled');
        }
        return String(value);
    };

    const strategyName = activeStrategy.name || t(activeStrategy.nameKey!);
    const descriptionText = activeStrategy.description || t(activeStrategy.descriptionKey!);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-2xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6 text-amber-400" />
                        {t('strategy_info_title')}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow pr-2 -mr-2 overflow-y-auto thin-scrollbar">
                    <h4 className="text-xl font-bold text-sky-400 mb-2">{strategyName}</h4>
                    <div className="text-sm text-zinc-300 space-y-3 prose prose-sm prose-invert prose-p:text-zinc-300 prose-strong:text-white prose-headings:text-sky-400 prose-ul:list-disc prose-ul:ml-4">
                        {descriptionText.trim().split('\n').map((line, index) => {
                            if (line.trim() === '') return null;
                            if (line.startsWith('###')) {
                                return <h4 key={index} className="text-base font-bold text-sky-400 pt-2 !mb-1">{line.replace(/###\s?/, '')}</h4>;
                            }
                            if (line.startsWith('####')) {
                                return <h5 key={index} className="font-semibold text-zinc-200 pt-1 !mb-1">{line.replace(/####\s?/, '')}</h5>;
                            }
                            if (line.startsWith('- **')) {
                                const parts = line.slice(2).split(':**');
                                return <p key={index} className="!my-1"><strong className="text-zinc-200">{parts[0]}</strong>:{parts[1]}</p>;
                            }
                            return <p key={index} className="!my-1">{line}</p>;
                        })}
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 text-right">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StrategyInfoModal;