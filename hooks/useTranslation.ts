import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n';

/**
 * A reactive hook that provides the `t` function and re-renders components
 * when the application's language changes.
 */
export const useTranslation = () => {
    // Subscribe to language changes to trigger re-renders in components using this hook.
    useAppStore(state => state.language);
    return t;
};