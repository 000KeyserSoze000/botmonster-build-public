import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { SparklesIcon, ExclamationTriangleIcon, XMarkIcon } from './icons/Icons';
import type { AppState } from '../types';
import DOMPurify from 'dompurify';
import { useTranslation } from '../hooks/useTranslation';
import { marked } from 'marked';

interface AiAnalysisPanelProps {
    onClose: () => void;
}

const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({ onClose }) => {
    const t = useTranslation();
    const { analysis, isLoading, error } = useAppStore(state => state.aiState);
    // The 'analysis' state now contains raw markdown. We process it here.
    const safeAnalysis = analysis ? DOMPurify.sanitize(marked(analysis) as string) : '';

    return (
        <div className="mx-4 mb-4 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-700 shadow-lg animate-fade-in-down">
            <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="flex items-center text-lg font-semibold text-sky-400">
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        {t('ai_panel_title')}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isLoading && <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div></div>}
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                
                {safeAnalysis && (
                    <div 
                        className="prose prose-sm prose-invert prose-p:text-zinc-300 prose-strong:text-white prose-headings:text-sky-400 prose-ul:list-disc prose-ul:ml-4 max-h-[200px] overflow-y-auto pr-2"
                        dangerouslySetInnerHTML={{ __html: safeAnalysis }}
                    ></div>
                )}
            </div>
        </div>
    );
};

export default AiAnalysisPanel;