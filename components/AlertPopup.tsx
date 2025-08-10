import React, { useState, useEffect, useRef } from 'react';
import type { Alert } from '../types';
import { BoltIcon, CrosshairIcon } from './icons/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface AlertPopupProps {
  alert: Alert;
  onClose: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ alert, onClose }) => {
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  const t = useTranslation();

  // Keep the ref updated with the latest onClose function without re-triggering the main effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Call the close handler after the fade-out transition
      setTimeout(() => {
        onCloseRef.current();
      }, 300);
    }, 3000); // Alert disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [alert]); // Dependency is only on `alert`, so the timer is not reset on re-renders

  const isEntry = alert.type === 'entry' || alert.type === 'short-entry';
  const bgColor = isEntry ? 'bg-sky-500/90' : 'bg-indigo-500/90';
  const iconColor = isEntry ? 'text-sky-200' : 'text-indigo-200';
  const Icon = isEntry ? CrosshairIcon : BoltIcon;
  const title = isEntry ? t('alertPopup_entryTitle') : t('alertPopup_grabTitle');

  const handleManualClose = () => {
    setVisible(false);
    setTimeout(() => {
        onCloseRef.current();
      }, 300);
  }

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
    >
      <div
        className={`flex items-center gap-4 pl-4 pr-5 py-3 rounded-lg shadow-2xl shadow-black/50 border border-black/20 text-white backdrop-blur-md ${bgColor}`}
      >
        <div className={`p-1.5 rounded-full ${iconColor} bg-white/10`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col max-w-sm">
          <span className="font-bold text-base">{title}</span>
          <span className="text-sm opacity-90 break-words">{t(alert.messageKey, alert.messagePayload)}</span>
        </div>
        <button onClick={handleManualClose} className="ml-4 text-white/70 hover:text-white">&times;</button>
      </div>
    </div>
  );
};

export default AlertPopup;