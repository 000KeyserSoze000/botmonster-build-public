import { writeTextFile, readTextFile, createDir, exists } from '@tauri-apps/api/fs';
import { appConfigDir } from '@tauri-apps/api/path';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

const STORAGE_FILE = 'botmonster.conf';
// IMPORTANT: In a real-world app, this should be derived from a user password
// or a machine-specific key. For this demo, it's hardcoded for simplicity.
const ENCRYPTION_KEY = 'do-not-use-this-in-production-botmonster-secret';

interface ApiKeys {
  gemini: string;
  binanceKey: string;
  binanceSecret: string;
}

const getStoragePath = async (): Promise<string> => {
    const configDir = await appConfigDir();
    return `${configDir}${STORAGE_FILE}`;
};

export const saveApiKeys = async (keys: ApiKeys): Promise<void> => {
    const configDir = await appConfigDir();
    // Ensure the directory exists
    if (!(await exists(configDir))) {
        await createDir(configDir, { recursive: true });
    }
    const filePath = await getStoragePath();
    const jsonString = JSON.stringify(keys);
    const encryptedData = AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    await writeTextFile(filePath, encryptedData);
};

export const loadApiKeys = async (): Promise<ApiKeys | null> => {
    const filePath = await getStoragePath();
    if (!(await exists(filePath))) {
        return null;
    }
    try {
        const encryptedData = await readTextFile(filePath);
        if (!encryptedData) return null;
        
        const bytes = AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedData = bytes.toString(Utf8);
        
        if (!decryptedData) return null;

        return JSON.parse(decryptedData) as ApiKeys;
    } catch (e) {
        console.error("Failed to load or decrypt API keys:", e);
        // Could be corrupted file or change in encryption
        return null;
    }
};
