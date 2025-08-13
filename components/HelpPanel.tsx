
import React from 'react';
import { helpContent, HelpTopic } from '../services/helpContent';
import { useTranslation } from '../hooks/useTranslation';
import { CompassIcon, BeakerIcon, WrenchScrewdriverIcon, BookOpenIcon } from './icons/Icons';
import { useAppStore } from '../store/useAppStore';

const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    CompassIcon, BeakerIcon, WrenchScrewdriverIcon, BookOpenIcon
};

const HelpPanel: React.FC = () => {
    const t = useTranslation();
    const openHelpModal = useAppStore(state => state.openHelpModal);

    const handleSelectTopic = (topic: HelpTopic) => {
        openHelpModal(topic.id);
    };

    return (
        <div className="h-full max-h-[60vh] md:max-h-full">
            <div className="w-full h-full overflow-y-auto thin-scrollbar">
                {helpContent.map(category => {
                    const Icon = iconMap[category.icon];
                    return (
                        <div key={category.id} className="mb-3">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 mb-1 px-2">
                                <Icon className="w-4 h-4" />
                                {t(category.titleKey)}
                            </h4>
                            <div className="space-y-1">
                                {category.topics.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => handleSelectTopic(topic)}
                                        className={`w-full text-left p-2 rounded-md text-sm font-semibold transition-colors text-zinc-300 hover:bg-zinc-800`}
                                    >
                                        {t(topic.titleKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HelpPanel;
