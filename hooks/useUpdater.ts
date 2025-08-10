import { useEffect } from 'react';
import { checkUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';

/**
 * A hook to manage the application's auto-update process in a Tauri environment.
 * It checks for updates on startup and handles the update process using Tauri's built-in dialog.
 */
export const useUpdater = () => {
    useEffect(() => {
        // This function is defined inside useEffect to capture the current scope,
        // though it has no dependencies in this case.
        const checkForUpdates = async () => {
            try {
                // The onUpdaterEvent listens for events from the Tauri backend.
                // This is useful for logging or creating custom UI.
                const unlisten = await onUpdaterEvent(({ error, status }) => {
                    console.log('Updater event:', { error, status });
                });

                // checkUpdate will look at the endpoint configured in tauri.conf.json,
                // compare versions, and if an update is available and the dialog is enabled,
                // it will prompt the user to update.
                const { shouldUpdate, manifest } = await checkUpdate();

                if (shouldUpdate) {
                    console.log(`Update available: version ${manifest?.version} from ${manifest?.date}`);
                    // With the dialog enabled in tauri.conf.json, the user will be prompted
                    // automatically. The installation and relaunch are handled by Tauri's updater module.
                    // No further code is needed here for the default flow.
                } else {
                    console.log("Application is up to date.");
                }
                
                // It's good practice to clean up the listener, although in this startup hook,
                // it might not be strictly necessary if the app relaunches on update.
                return () => {
                    unlisten();
                };

            } catch (error) {
                console.error('Update check failed:', error);
            }
        };

        // We only want to run this logic in the Tauri desktop environment.
        if ((window as any).__TAURI__) {
            // Check for updates shortly after the app has initialized to avoid blocking startup.
            const timer = setTimeout(checkForUpdates, 5000); // 5-second delay
            return () => clearTimeout(timer);
        }
    }, []); // The empty dependency array ensures this effect runs only once on component mount.
};
