import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // The define block for VITE_APP_VERSION has been removed
  // as it was causing issues in the no-build execution environment.
  // The version is now fetched dynamically within the Header component.
  build: {
    rollupOptions: {
      external: [
        'i18next'
      ]
    }
  }
});