import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ExclamationTriangleIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

const ConfirmationModal: React.FC = () => {
    const t = useTranslation();
    const { config, hideConfirmation, executeConfirmation } = useAppStore(state => ({
        config: state.confirmationModalConfig,
        hideConfirmation: state.hideConfirmation,
        executeConfirmation: state.executeConfirmation,
    }));

    if (!config.isOpen) {
        return null;
    }

    const handleConfirm = () => {
        executeConfirmation();
        // The execute function will hide the modal
    };

    const isDanger = config.confirmButtonVariant === 'danger';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-md w-full p-6 m-4">
                <div className="flex items-start gap-4">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDanger ? 'bg-red-500/20' : 'bg-sky-500/20'}`}>
                        <ExclamationTriangleIcon className={`h-6 w-6 ${isDanger ? 'text-red-400' : 'text-sky-400'}`} aria-hidden="true" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold leading-6 text-zinc-100" id="modal-title">
                            {t(config.titleKey)}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-zinc-400" dangerouslySetInnerHTML={{ __html: t(config.messageKey, config.messagePayload) }} />
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:w-auto sm:text-sm transition-colors ${
                            isDanger 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
                        }`}
                        onClick={handleConfirm}
                    >
                        {t(config.confirmButtonTextKey)}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-800 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                        onClick={hideConfirmation}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;