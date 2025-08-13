import React from 'react';
import { NavItem } from '../types';

interface TradingChartProps {
  activeView: NavItem;
}

export const TradingChart: React.FC<TradingChartProps> = ({ activeView }) => {
  const renderContent = () => {
    switch (activeView) {
      case NavItem.Releases:
        return (
          <>
            <p className="mt-4 text-zinc-400">
              Cette section est prête pour être connectée à une action GitHub.
            </p>
            <p className="mt-2 text-zinc-400">
              Vous pouvez configurer un workflow CI/CD dans <code>.github/workflows/main.yml</code> pour construire votre application Tauri et créer automatiquement des releases sur GitHub.
            </p>
            <a href="https://tauri.app/v1/guides/building/cross-platform" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded transition-colors">
              Voir la documentation Tauri
            </a>
          </>
        );
      case NavItem.Settings:
          return <p className="mt-4 text-zinc-400">Gérez ici les paramètres de votre application.</p>;
      case NavItem.Analytics:
          return <p className="mt-4 text-zinc-400">Visualisez les données et les analyses de l'application ici.</p>;
      case NavItem.Dashboard:
      default:
        return (
            <p className="mt-4 text-zinc-400">
                Bienvenue sur la base de votre projet. Vous pouvez commencer à construire votre application en modifiant les composants.
            </p>
        );
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-zinc-100">{activeView}</h1>
        <div className="mt-6 p-6 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};