import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
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
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
