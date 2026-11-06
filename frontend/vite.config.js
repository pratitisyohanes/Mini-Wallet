import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Proxying /api keeps the frontend and API on one origin in development,
      // so the httpOnly auth cookie works without cross-site cookie settings.
      proxy: {
        '/api': env.VITE_DEV_API_TARGET || 'http://localhost:4000',
      },
    },
  };
});
