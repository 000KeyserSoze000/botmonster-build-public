import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { LightBulbIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const OnboardingWelcomeModal: React.FC<{ show: boolean }> = ({ show }) => {
    const { startOnboarding, endOnboarding } = useAppStore(state => ({
        startOnboarding: state.startOnboarding,
        endOnboarding: state.endOnboarding,
    }));
    const t = useTranslation();

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-lg w-full p-6 m-4 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-500/20">
                    <LightBulbIcon className="h-7 w-7 text-sky-400" />
                </div>
                <h3 className="text-lg font-bold leading-6 text-zinc-100 mt-4">
                    {t('welcome_title')}
                </h3>
                <div className="mt-2 space-y-2 text-sm text-zinc-400">
                    <p>{t('welcome_p1')}</p>
                    <p>{t('welcome_p2')}</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 sm:w-auto sm:text-sm"
                        onClick={startOnboarding}
                    >
                        {t('welcome_start_tour')}
                    </button>
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:w-auto sm:text-sm"
                        onClick={endOnboarding}
                    >
                        {t('welcome_explore_self')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWelcomeModal;