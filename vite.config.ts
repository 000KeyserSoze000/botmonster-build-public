<<<<<<< HEAD
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
=======
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // The define block for VITE_APP_VERSION has been removed
  // as it was causing issues in the no-build execution environment.
  // The version is now fetched dynamically within the Header component.
});
>>>>>>> 5611a383835355478ce2f9664b79ce8c0d75787a
