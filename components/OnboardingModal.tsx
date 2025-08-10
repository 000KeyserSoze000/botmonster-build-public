
import React from 'react';
import { LightBulbIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface OnboardingModalProps {
    show: boolean;
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ show, onClose }) => {
    const t = useTranslation();
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-lg w-full p-6 m-4">
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-sky-500/20 sm:mx-0 sm:h-10 sm:w-10">
                        <LightBulbIcon className="h-6 w-6 text-sky-400" aria-hidden="true" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold leading-6 text-zinc-100" id="modal-title">
                            {t('onboarding_final_title')}
                        </h3>
                        <div className="mt-2 space-y-2 text-sm text-zinc-400">
                            <p>{t('onboarding_final_p1')}</p>
                            <p>{t('onboarding_final_p2')}</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li dangerouslySetInnerHTML={{ __html: t('onboarding_final_li1') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('onboarding_final_li2') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('onboarding_final_li3') }} />
                            </ul>
                            <p className="mt-3 font-semibold text-zinc-300" dangerouslySetInnerHTML={{ __html: t('onboarding_final_p3') }} />
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        {t('onboarding_final_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
