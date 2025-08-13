import { useState, useEffect } from 'react';

/**
 * A hook to dynamically fetch the application version from the public `version.txt` file.
 * This ensures the displayed version is always in sync with the single source of truth.
 * @returns The current application version string, or a placeholder if loading fails.
 */
export const useAppVersion = (): string => {
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        // This fetch call works for both local development and in the built Tauri app,
        // as `version.txt` will be part of the distributed assets.
        fetch('/version.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => setVersion(text.trim()))
            .catch(err => {
                console.error("Failed to load app version from version.txt:", err);
                setVersion('?.?.?'); // Fallback version
            });
    }, []); // Empty dependency array ensures this runs only once on mount.

    return version;
};
