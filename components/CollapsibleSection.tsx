
import React from 'react';
import { ChevronDownIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClick: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onClick }) => {
    const t = useTranslation();

    return (
        <div className="border-b border-zinc-700">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center p-3 text-left text-base font-semibold text-zinc-200 hover:bg-zinc-800/50"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="animate-fade-in-down">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
