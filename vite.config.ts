import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.example') });

export default defineConfig(() => {
  const vipPrice = process.env.VIP_PRICE || '3.99';

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['APP_', 'GA_', 'VIP_', 'B2B_', 'PAYMENT_', 'ADS_', 'ADSENSE_', 'GPT_', 'DISCORD_', 'DEFAULT_', 'ENABLE_', 'DOCS_', 'ADMIN_', 'MARKETAGENCY_', 'PORTAL_', 'VITE_'],
    define: {
      'import.meta.env.VIP_PRICE': JSON.stringify(vipPrice),
      'import.meta.env.APP_NAME': JSON.stringify(process.env.APP_NAME || 'viceintel'),
      'import.meta.env.APP_URL': JSON.stringify(process.env.APP_URL || 'https://viceintel.app'),
      'import.meta.env.GA_MEASUREMENT_ID': JSON.stringify(process.env.GA_MEASUREMENT_ID || 'G-VICE2026INTEL'),
      'import.meta.env.DISCORD_CLIENT_ID': JSON.stringify(process.env.DISCORD_CLIENT_ID || '1540025117470621759'),
      'import.meta.env.B2B_SPONSOR_PRICE': JSON.stringify(process.env.B2B_SPONSOR_PRICE || '49.00'),
    },
    resolve: {
      alias: {
        'firebase/firestore': path.resolve(__dirname, 'src/lib/db/firestoreMongoAdapter.ts'),
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-libs';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
