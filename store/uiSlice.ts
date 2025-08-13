
import type { StateCreator } from 'zustand';
import type { AppState, UiSlice, ConfirmationModalConfig } from '../types';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import { t } from '../i18n';

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  isSidebarCollapsed: false,
  isScannerPanelCollapsed: false,
  isBottomPanelCollapsed: false,
  isWatchlistBarOpen: true,
  latestAlert: null,
  confirmationModalConfig: {
    isOpen: false,
    titleKey: '',
    messageKey: '',
    confirmAction: null,
    confirmActionPayload: undefined,
    confirmButtonTextKey: 'confirm',
    confirmButtonVariant: 'primary',
  },
  showWatchlistModal: false,
  showSettingsModal: false,
  showStrategyInfoModal: false,
  showAiAnalysisPanel: false,
  showRobotStopModal: false,
  showAiStrategyGeneratorModal: false,
  showStrategyManagerModal: false,
  onboardingStep: -1,
  hasCompletedOnboarding: false,
  showWelcomeModal: false,
  isMobileLeftPanelOpen: false,
  isMobileRightPanelOpen: false,
  isMobileBottomPanelOpen: false,
  isHelpModalOpen: false,
  activeHelpArticleId: null,

  toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleScannerPanel: () => set(state => ({ isScannerPanelCollapsed: !state.isScannerPanelCollapsed })),
  toggleBottomPanel: () => set(state => ({ isBottomPanelCollapsed: !state.isBottomPanelCollapsed })),
  setIsWatchlistBarOpen: (isOpen) => set({ isWatchlistBarOpen: isOpen }),
  setLatestAlert: async (alert) => {
    set({ latestAlert: alert });

    // --- Tauri Desktop Notification ---
    if (alert && (alert.type === 'entry' || alert.type === 'short-entry')) {
      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }
        if (permissionGranted) {
          await sendNotification({
            title: t('alertPopup_entryTitle'),
            body: t(alert.messageKey, alert.messagePayload),
          });
        }
      } catch (error) {
        // This will fail gracefully in a non-Tauri environment (e.g., web browser)
        console.error("Failed to send desktop notification:", error);
      }
    }
  },
  
  showConfirmation: (config) => {
      set({ confirmationModalConfig: { ...config, isOpen: true } });
  },
  
  hideConfirmation: () => {
      set(state => ({
          confirmationModalConfig: {
              ...state.confirmationModalConfig,
              isOpen: false,
              // Reset config after closing to prevent accidental re-triggering
              titleKey: '',
              messageKey: '',
              confirmAction: null,
              confirmActionPayload: undefined,
          }
      }));
  },
  
  executeConfirmation: () => {
    const { confirmationModalConfig } = get();
    if (confirmationModalConfig.isOpen && confirmationModalConfig.confirmAction) {
        const actionToExecute = (get() as any)[confirmationModalConfig.confirmAction];
        if (typeof actionToExecute === 'function') {
            actionToExecute(confirmationModalConfig.confirmActionPayload);
        } else {
            console.error(`Confirmation failed: Action "${confirmationModalConfig.confirmAction}" is not a function in the store.`);
        }
    }
    // The action itself (e.g., clearHistory) will call hideConfirmation
  },
  
  setShowWatchlistModal: (show) => set({ showWatchlistModal: show }),
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  setShowStrategyInfoModal: (show) => set({ showStrategyInfoModal: show }),
  setShowAiAnalysisPanel: (show) => set({ showAiAnalysisPanel: show }),
  setShowRobotStopModal: (show) => set({ showRobotStopModal: show }),
  setShowAiStrategyGeneratorModal: (show) => set({ showAiStrategyGeneratorModal: show }),
  setShowStrategyManagerModal: (show) => set({ showStrategyManagerModal: show }),
  startOnboarding: () => set({ showWelcomeModal: false, onboardingStep: 0 }),
  nextOnboardingStep: () => set(state => ({ onboardingStep: state.onboardingStep + 1 })),
  endOnboarding: () => set({ showWelcomeModal: false, onboardingStep: -1, hasCompletedOnboarding: true }),
  setShowWelcomeModal: (show) => set({ showWelcomeModal: show }),
  
  toggleMobileLeftPanel: () => set(state => ({ isMobileLeftPanelOpen: !state.isMobileLeftPanelOpen, isMobileRightPanelOpen: false, isMobileBottomPanelOpen: false })),
  toggleMobileRightPanel: () => set(state => ({ isMobileRightPanelOpen: !state.isMobileRightPanelOpen, isMobileLeftPanelOpen: false, isMobileBottomPanelOpen: false })),
  toggleMobileBottomPanel: () => set(state => ({ isMobileBottomPanelOpen: !state.isMobileBottomPanelOpen, isMobileLeftPanelOpen: false, isMobileRightPanelOpen: false })),
  closeMobilePanels: () => set({ isMobileLeftPanelOpen: false, isMobileRightPanelOpen: false, isMobileBottomPanelOpen: false }),

  openHelpModal: (articleId) => set({ isHelpModalOpen: true, activeHelpArticleId: articleId }),
  closeHelpModal: () => set({ isHelpModalOpen: false, activeHelpArticleId: null }),
});