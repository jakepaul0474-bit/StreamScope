import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize the key from different common sources
  const apiKey = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the app code.
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Prevent "process is not defined" errors in browser if generic process access occurs
      'process.env': JSON.stringify({}), 
    },
  };
});