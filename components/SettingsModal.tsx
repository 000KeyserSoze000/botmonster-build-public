import React, { useState, useEffect } from 'react';
import type { SoundSettings, SoundName, GlobalRiskSettings, Language, SocialSettings } from '../types';
import { useAppStore } from '../store/useAppStore';
import { XMarkIcon, Cog8ToothIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from './icons/Icons';
import { soundService } from '../services/soundService';
import { useTranslation } from '../hooks/useTranslation';
import { exportLogsToTxt } from '../services/exportService';

interface SettingsModalProps {
    show: boolean;
}

const soundOptions: { name: SoundName; labelKey: string }[] = [
    { name: 'none', labelKey: 'sound_none' },
    { name: 'chime', labelKey: 'sound_chime' },
    { name: 'notify', labelKey: 'sound_notify' },
    { name: 'success', labelKey: 'sound_success' },
    { name: 'buzz', labelKey: 'sound_buzz' },
];

const alertEvents: { id: keyof SoundSettings; labelKey: string }[] = [
    { id: 'entry', labelKey: 'sound_on_entry' },
    { id: 'grab', labelKey: 'sound_on_grab' },
    { id: 'tp', labelKey: 'sound_on_tp' },
    { id: 'sl', labelKey: 'sound_on_sl' },
];

const languages: { code: Language, label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ show }) => {
    const t = useTranslation();
    const { 
        soundSettings, setSoundSettings, 
        globalRiskSettings, setGlobalRiskSettings,
        socialSettings, setSocialSettings,
        language, setLanguage, logs,
        isTauri, geminiApiKey, binanceApiKey, binanceApiSecret, setApiKeys,
        setShowSettingsModal 
    } = useAppStore(state => ({
        soundSettings: state.soundSettings,
        setSoundSettings: state.setSoundSettings,
        globalRiskSettings: state.globalRiskSettings,
        setGlobalRiskSettings: state.setGlobalRiskSettings,
        socialSettings: state.socialSettings,
        setSocialSettings: state.setSocialSettings,
        language: state.language,
        setLanguage: state.setLanguage,
        logs: state.logs,
        isTauri: state.isTauri,
        geminiApiKey: state.geminiApiKey,
        binanceApiKey: state.binanceApiKey,
        binanceApiSecret: state.binanceApiSecret,
        setApiKeys: state.setApiKeys,
        setShowSettingsModal: state.setShowSettingsModal
    }));
    
    const [localSoundSettings, setLocalSoundSettings] = useState<SoundSettings>(soundSettings);
    const [localRiskSettings, setLocalRiskSettings] = useState<GlobalRiskSettings>(globalRiskSettings);
    const [localSocialSettings, setLocalSocialSettings] = useState<SocialSettings>(socialSettings);
    const [localLanguage, setLocalLanguage] = useState<Language>(language);
    const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
    const [localBinanceKey, setLocalBinanceKey] = useState(binanceApiKey || '');
    const [localBinanceSecret, setLocalBinanceSecret] = useState(binanceApiSecret || '');

    const [activeTab, setActiveTab] = useState<'general' | 'risk' | 'social' | 'api'>('general');

    useEffect(() => {
        if(show) {
            setLocalSoundSettings(soundSettings);
            setLocalRiskSettings(globalRiskSettings);
            setLocalSocialSettings(socialSettings);
            setLocalLanguage(language);
            setLocalGeminiKey(geminiApiKey || '');
            setLocalBinanceKey(binanceApiKey || '');
            setLocalBinanceSecret(binanceApiSecret || '');
            setActiveTab('general');
        }
    }, [show, soundSettings, globalRiskSettings, socialSettings, language, geminiApiKey, binanceApiKey, binanceApiSecret]);

    if (!show) return null;

    const handleSave = () => {
        setSoundSettings(localSoundSettings);
        setGlobalRiskSettings(localRiskSettings);
        setSocialSettings(localSocialSettings);
        setLanguage(localLanguage);
        if (isTauri) {
            setApiKeys({
                gemini: localGeminiKey,
                binanceKey: localBinanceKey,
                binanceSecret: localBinanceSecret
            });
        }
        setShowSettingsModal(false);
    };

    const handleRiskChange = (key: keyof GlobalRiskSettings, value: string | number | boolean) => {
        if (typeof value === 'boolean' || typeof value === 'string') {
            setLocalRiskSettings(prev => ({ ...prev, [key]: value }));
        } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
                setLocalRiskSettings(prev => ({ ...prev, [key]: numValue }));
            }
        }
    };
    
    const renderGeneralSettings = () => (
        <div className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-zinc-200">{t('settings_language_label')}</label>
                <p className="text-xs text-zinc-400 mb-2">{t('settings_language_help')}</p>
                <select
                    id="language-select"
                    value={localLanguage}
                    onChange={(e) => setLocalLanguage(e.target.value as Language)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"
                >
                    {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>
            </div>
            <div>
                <h4 className="text-sm font-medium text-zinc-200 mb-2">{t('settings_tab_sound')}</h4>
                <div className="space-y-3">
                    {alertEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between">
                            <label className="text-sm text-zinc-300">{t(event.labelKey)}</label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={localSoundSettings[event.id]}
                                    onChange={(e) => setLocalSoundSettings(prev => ({ ...prev, [event.id]: e.target.value as SoundName }))}
                                    className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm"
                                >
                                    {soundOptions.map(opt => <option key={opt.name} value={opt.name}>{t(opt.labelKey)}</option>)}
                                </select>
                                <button onClick={() => soundService.play(localSoundSettings[event.id])} className="px-2 py-1 text-xs bg-zinc-700 rounded hover:bg-zinc-600">{t('settings_sound_test')}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                 <h4 className="text-sm font-medium text-zinc-200">{t('settings_logs_title')}</h4>
                 <p className="text-xs text-zinc-400 mb-2">{t('settings_logs_help')}</p>
                 <button onClick={() => exportLogsToTxt(logs, t)} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-md">
                    <ArrowDownTrayIcon className="w-5 h-5"/>
                    {t('settings_logs_download_button')}
                 </button>
            </div>
        </div>
    );
    
    const renderRiskSettings = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">{t('settings_confirm_trades_label')}</label>
                <button onClick={() => handleRiskChange('confirmTrades', !localRiskSettings.confirmTrades)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localRiskSettings.confirmTrades ? 'bg-sky-500' : 'bg-zinc-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localRiskSettings.confirmTrades ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">{t('settings_bnb_fees_label')}</label>
                <button onClick={() => handleRiskChange('useBnbFees', !localRiskSettings.useBnbFees)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localRiskSettings.useBnbFees ? 'bg-sky-500' : 'bg-zinc-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localRiskSettings.useBnbFees ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_capital_label')}</label>
                <input type="number" value={localRiskSettings.totalCapital} onChange={(e) => handleRiskChange('totalCapital', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                <p className="text-xs text-zinc-500 mt-1">{t('settings_capital_help')}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_capital_mode_label')}</label>
                <div className="flex items-center bg-zinc-900/50 p-1 rounded-md">
                    <button onClick={() => handleRiskChange('riskManagementMode', 'pro')} className={`flex-1 text-xs font-semibold py-1 rounded-sm transition-colors ${localRiskSettings.riskManagementMode === 'pro' ? 'bg-sky-500 text-white' : 'hover:bg-zinc-700'}`}>{t('settings_capital_mode_pro')}</button>
                    <button onClick={() => handleRiskChange('riskManagementMode', 'simple')} className={`flex-1 text-xs font-semibold py-1 rounded-sm transition-colors ${localRiskSettings.riskManagementMode === 'simple' ? 'bg-sky-500 text-white' : 'hover:bg-zinc-700'}`}>{t('settings_capital_mode_simple')}</button>
                </div>
            </div>
            {localRiskSettings.riskManagementMode === 'pro' ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_risk_per_trade_label')}</label>
                        <input type="number" step="0.1" value={localRiskSettings.riskPerTrade} onChange={(e) => handleRiskChange('riskPerTrade', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_max_concurrent_risk_label')}</label>
                        <input type="number" step="0.5" value={localRiskSettings.maxConcurrentRisk} onChange={(e) => handleRiskChange('maxConcurrentRisk', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                    </div>
                </>
            ) : (
                 <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_fixed_amount_label')}</label>
                    <input type="number" step="10" value={localRiskSettings.fixedPositionAmount} onChange={(e) => handleRiskChange('fixedPositionAmount', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_max_positions_label')}</label>
                <input type="number" step="1" value={localRiskSettings.maxOpenPositions} onChange={(e) => handleRiskChange('maxOpenPositions', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
            </div>
        </div>
    );

    const renderSocialSettings = () => (
        <fieldset disabled className="space-y-4 animate-fade-in group relative">
            <div className="absolute inset-0 bg-zinc-800/50 flex items-center justify-center rounded-lg z-10">
                <span className="bg-zinc-900 px-4 py-2 rounded-md font-semibold text-zinc-400">{t('coming_soon')}</span>
            </div>
            <div className="group-disabled:opacity-20 space-y-4">
                <p className="text-sm text-zinc-400">{t('settings_social_help')}</p>
                <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">Telegram</label>
                    <input type="text" value={localSocialSettings.telegramHandle} onChange={(e) => setLocalSocialSettings(p => ({ ...p, telegramHandle: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">X (Twitter)</label>
                    <input type="text" value={localSocialSettings.twitterHandle} onChange={(e) => setLocalSocialSettings(p => ({ ...p, twitterHandle: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">Instagram</label>
                    <input type="text" value={localSocialSettings.instagramHandle} onChange={(e) => setLocalSocialSettings(p => ({ ...p, instagramHandle: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
                </div>
            </div>
        </fieldset>
    );
    
    const renderApiSettings = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-zinc-900/50 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5"/>
                <span>{t('settings_api_warning')}</span>
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_api_gemini_label')}</label>
                <input type="password" value={localGeminiKey} onChange={(e) => setLocalGeminiKey(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_api_binance_key_label')}</label>
                <input type="password" value={localBinanceKey} onChange={(e) => setLocalBinanceKey(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">{t('settings_api_binance_secret_label')}</label>
                <input type="password" value={localBinanceSecret} onChange={(e) => setLocalBinanceSecret(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"/>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700 max-w-lg w-full p-6 m-4 flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold leading-6 text-zinc-100 flex items-center gap-2"><Cog8ToothIcon className="w-6 h-6 text-sky-400"/>{t('settings_title')}</h3>
                    <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center bg-zinc-900/50 rounded-md p-1 my-2 flex-shrink-0 border border-zinc-700/50">
                    <button onClick={() => setActiveTab('general')} className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'general' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>{t('settings_tab_general')}</button>
                    <button onClick={() => setActiveTab('risk')} className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'risk' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>{t('settings_tab_risk')}</button>
                    {isTauri && <button onClick={() => setActiveTab('api')} className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'api' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>{t('settings_tab_api')}</button>}
                    <button onClick={() => setActiveTab('social')} className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'social' ? 'bg-zinc-700 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>{t('settings_tab_social')}</button>
                </div>
                <div className="flex-grow pr-2 -mr-2 overflow-y-auto pt-4 relative">
                   {activeTab === 'general' && renderGeneralSettings()}
                   {activeTab === 'risk' && renderRiskSettings()}
                   {activeTab === 'social' && renderSocialSettings()}
                   {isTauri && activeTab === 'api' && renderApiSettings()}
                </div>
                <div className="flex-shrink-0 mt-6 sm:flex sm:flex-row-reverse gap-3">
                     <button type="button" onClick={handleSave} className="w-full inline-flex justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 sm:w-auto sm:text-sm">{t('saveAndClose')}</button>
                     <button type="button" onClick={() => setShowSettingsModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-base font-medium text-zinc-200 shadow-sm hover:bg-zinc-600 sm:mt-0 sm:w-auto sm:text-sm">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;