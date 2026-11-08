
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'recharts'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    }
  };
});
