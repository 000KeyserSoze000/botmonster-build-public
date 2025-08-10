import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { XMarkIcon, LightBulbIcon } from './icons/Icons';
import { getArticleById } from '../services/helpContent';
import { useTranslation } from '../hooks/useTranslation';

const HelpArticleModal: React.FC = () => {
    const t = useTranslation();
    const { isOpen, articleId, onClose } = useAppStore(state => ({
        isOpen: state.isHelpModalOpen,
        articleId: state.activeHelpArticleId,
        onClose: state.closeHelpModal,
    }));

    if (!isOpen || !articleId) {
        return null;
    }
    
    const article = getArticleById(articleId);

    if (!article) {
        console.error(`Help article with id "${articleId}" not found.`);
        onClose();
        return null;
    }
    
    const translatedContent = t(article.contentKey);
    const translatedTitle = t(article.titleKey);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-2xl w-full p-6 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6 text-amber-400" />
                        {t('help_modal_title', { title: translatedTitle })}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow pr-2 -mr-2 overflow-y-auto thin-scrollbar">
                    <div 
                        className="text-sm text-zinc-300 space-y-3 prose prose-sm prose-invert prose-p:text-zinc-300 prose-strong:text-white prose-headings:text-sky-400 prose-ul:list-disc prose-ul:ml-4"
                        dangerouslySetInnerHTML={{ __html: translatedContent }}
                    >
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

export default HelpArticleModal;