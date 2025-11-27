import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Replace process.env.API_KEY with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      // Do NOT define 'process.env': {} globally as it breaks React's access to NODE_ENV
    },
    build: {
      outDir: 'dist',
    },
  };
});