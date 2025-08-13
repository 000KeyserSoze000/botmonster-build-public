import { resources } from './locales';
import type { Language } from './types';

let getLanguage: () => Language = () => 'fr'; // Langue par défaut

/**
 * Initialise le service i18n avec une fonction pour obtenir la langue actuelle.
 * Ceci est utilisé pour briser une dépendance circulaire entre le store et i18n.
 * @param langGetter Une fonction qui retourne le code de la langue actuelle.
 */
export const initializeI18n = (langGetter: () => Language) => {
    getLanguage = langGetter;
};

/**
 * La fonction de traduction principale (non réactive).
 * Elle récupère la langue actuelle via le langGetter et retourne la chaîne traduite.
 * @param key La clé de traduction (ex: 'scanner_title').
 * @param variables Variables optionnelles à interpoler dans la chaîne.
 * @returns La chaîne traduite ou la clé elle-même si non trouvée.
 */
export const t = (key: string, variables?: Record<string, string | number>): string => {
    const lang = getLanguage();
    const langResources = resources[lang] as Record<string, string>;

    let translation = langResources[key] || key;

    if (variables) {
        Object.entries(variables).forEach(([varKey, value]) => {
            const regex = new RegExp(`{{${varKey}}}`, 'g');
            translation = translation.replace(regex, String(value));
        });
    }

    return translation;
};