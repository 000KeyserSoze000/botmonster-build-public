import React, { useState, useLayoutEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { OnboardingStepConfig } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const onboardingSteps: OnboardingStepConfig[] = [
    {
        targetId: 'watchlist-manager-button',
        titleKey: 'onboarding_step1_title',
        contentKey: 'onboarding_step1_content',
        placement: 'bottom',
        isActionable: true,
    },
    {
        targetId: 'left-panel',
        titleKey: 'onboarding_step2_title',
        contentKey: 'onboarding_step2_content',
        placement: 'right',
    },
    {
        targetId: 'right-panel',
        titleKey: 'onboarding_step3_title',
        contentKey: 'onboarding_step3_content',
        placement: 'left',
    },
    {
        targetId: 'bottom-panel',
        titleKey: 'onboarding_step4_title',
        contentKey: 'onboarding_step4_content',
        placement: 'top',
    },
    {
        targetId: 'master-switch-button',
        titleKey: 'onboarding_step5_title',
        contentKey: 'onboarding_step5_content',
        placement: 'bottom',
    },
];

const OnboardingOverlay: React.FC = () => {
    const t = useTranslation();
    const { step, nextStep, endTour, openWatchlistModal } = useAppStore(state => ({
        step: state.onboardingStep,
        nextStep: state.nextOnboardingStep,
        endTour: state.endOnboarding,
        openWatchlistModal: () => state.setShowWatchlistModal(true),
    }));

    const [spotlightRect, setSpotlightRect] = useState({ top: 0, left: 0, width: 0, height: 0, ready: false });
    const [tooltipStyle, setTooltipStyle] = useState({});
    const [isPaused, setIsPaused] = useState(false);

    const currentStepConfig = onboardingSteps[step];

    useLayoutEffect(() => {
        if (!currentStepConfig) {
            if (step > -1) endTour();
            return;
        }

        // Unpause when the step changes (e.g., after watchlist is saved)
        setIsPaused(false);

        const target = document.getElementById(currentStepConfig.targetId);
        if (target) {
            const rect = target.getBoundingClientRect();
            const padding = 8;
            
            setSpotlightRect({
                width: rect.width + padding,
                height: rect.height + padding,
                top: rect.top - padding / 2,
                left: rect.left - padding / 2,
                ready: true
            });
            
            let top = 0, left = 0;
            switch(currentStepConfig.placement) {
                case 'bottom': top = rect.bottom + padding; left = rect.left + rect.width / 2; break;
                case 'top': top = rect.top - padding; left = rect.left + rect.width / 2; break;
                case 'left': top = rect.top + rect.height / 2; left = rect.left - padding; break;
                case 'right': top = rect.top + rect.height / 2; left = rect.right + padding; break;
            }
            setTooltipStyle({ top, left });
        } else {
             setSpotlightRect(prev => ({ ...prev, ready: false }));
        }
    }, [step, currentStepConfig, endTour]);

    if (!currentStepConfig) return null;
    
    const handleNext = () => {
        const isLastStep = step === onboardingSteps.length - 1;
        if (isLastStep) {
            endTour();
            return;
        }

        if (currentStepConfig.isActionable) {
            if (currentStepConfig.targetId === 'watchlist-manager-button') {
                setIsPaused(true); // Pause the tour to allow interaction with the modal
                openWatchlistModal();
            }
        } else {
            nextStep();
        }
    };

    if (isPaused) return null;

    const isLastStep = step === onboardingSteps.length - 1;
    
    const overlayStyle: React.CSSProperties = {
        clipPath: `path('M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z M ${spotlightRect.left} ${spotlightRect.top} H ${spotlightRect.left + spotlightRect.width} V ${spotlightRect.top + spotlightRect.height} H ${spotlightRect.left} Z')`,
        transition: 'clip-path 0.3s ease-in-out',
    };

    return (
        <div className="fixed inset-0 z-[150] transition-opacity duration-300">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                style={spotlightRect.ready ? overlayStyle : {}}
            ></div>
            {spotlightRect.ready && (
                 <div 
                    className={`absolute w-72 p-4 bg-zinc-800 rounded-lg shadow-xl text-zinc-200 animate-fade-in transition-all duration-300 ease-in-out transform
                        ${currentStepConfig.placement === 'bottom' ? '-translate-x-1/2' : ''}
                        ${currentStepConfig.placement === 'top' ? '-translate-x-1/2 -translate-y-full' : ''}
                        ${currentStepConfig.placement === 'left' ? '-translate-x-full -translate-y-1/2' : ''}
                        ${currentStepConfig.placement === 'right' ? '-translate-y-1/2' : ''}
                    `}
                    style={tooltipStyle}
                >
                    <h4 className="font-bold text-sky-400 mb-2">{t(currentStepConfig.titleKey)}</h4>
                    <p className="text-sm text-zinc-300">{t(currentStepConfig.contentKey)}</p>
                    <div className="mt-4 flex justify-between items-center">
                        <button onClick={endTour} className="text-xs text-zinc-400 hover:text-white">{t('skip_tour')}</button>
                        <button onClick={handleNext} className="px-3 py-1.5 text-sm font-semibold bg-sky-500 text-white rounded-md hover:bg-sky-600">
                            {isLastStep ? t('finish') : (currentStepConfig.isActionable ? t('open') : t('next'))}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingOverlay;