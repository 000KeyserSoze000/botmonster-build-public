
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
<<<<<<< HEAD

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable.");
=======
import { initializeI18n } from './i18n';
import { useAppStore } from './store/useAppStore';

// Initialize the i18n system by providing it with a function to get the current language from the state store.
// This is done once at the application's entry point to break module-level circular dependencies.
initializeI18n(() => useAppStore.getState().language);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
<<<<<<< HEAD
);
=======
);
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
