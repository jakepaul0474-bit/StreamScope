import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to resolve TS error regarding missing 'cwd' property on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize the key from different common sources
  const apiKey = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the app code.
      // Ensure it is always a string, never undefined
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
      // Prevent "process is not defined" errors in browser if generic process access occurs
      'process.env': JSON.stringify({}), 
    },
  };
});