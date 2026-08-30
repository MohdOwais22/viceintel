/**
 * Centralized Environment Variable Accessor Module
 * Provides typed access and fallback defaults for all runtime environment variables.
 */

// Helper to access environment variables safely in both browser (import.meta.env) and server (process.env)
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Check import.meta.env for Vite client-side exposed vars
  const meta = import.meta as any;
  if (meta && meta.env) {
    const val = meta.env[key];
    if (val !== undefined && val !== '') return val;
  }
  // Check process.env for Node server-side vars
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val !== undefined && val !== '') return val;
  }
  return defaultValue;
}

export const ENV = {
  /** Application display name */
  APP_NAME: getEnvVar('APP_NAME', 'viceintel'),
  
  /** Google Analytics GA4 Measurement ID */
  GA_MEASUREMENT_ID: getEnvVar('GA_MEASUREMENT_ID', 'G-VICE2026INTEL'),
  
  /** Base application URL for self-referential links & share URLs */
  APP_URL: getEnvVar('APP_URL', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  
  /** Google AdSense & GPT Ad Network Keys */
  ADSENSE_CLIENT_ID: getEnvVar('ADSENSE_CLIENT_ID', 'ca-pub-4929828472918402'),
  ADS_KEY: getEnvVar('ADS_KEY', 'ca-pub-4929828472918402'),
  GPT_NETWORK_CODE: getEnvVar('GPT_NETWORK_CODE', '/218471928/ViceCityCentral_Display'),

  /** Payment Tier Values (USD) */
  VIP_PRICE: parseFloat(getEnvVar('VIP_PRICE', '3.99')),
  PAYMENT_PRICE_12: parseFloat(getEnvVar('PAYMENT_PRICE_12', '12.00')),
  PAYMENT_PRICE_29: parseFloat(getEnvVar('PAYMENT_PRICE_29', '29.00')),
  B2B_SPONSOR_PRICE: parseFloat(getEnvVar('B2B_SPONSOR_PRICE', '49.00')),
  PAYMENT_PRICE_49: parseFloat(getEnvVar('PAYMENT_PRICE_49', '49.00')),
  PAYMENT_PRICE_99: parseFloat(getEnvVar('PAYMENT_PRICE_99', '99.00')),
  PAYMENT_PRICE_199: parseFloat(getEnvVar('PAYMENT_PRICE_199', '199.00')),

  /** Rate Limiting Configuration */
  RATE_LIMIT_WINDOW_MS: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  
  /** Discord Integration Client ID */
  DISCORD_CLIENT_ID: getEnvVar('DISCORD_CLIENT_ID', '1540025117470621759'),
  
  /** Discord Integration OAuth2 Redirect URI */
  DISCORD_REDIRECT_URI: getEnvVar('DISCORD_REDIRECT_URI', ''),
  
  /** Default Locale for Number & Date Formatting */
  DEFAULT_LOCALE: getEnvVar('DEFAULT_LOCALE', 'en-US'),
  
  /** Admin & Staff Security Passkeys (Server secrets) */
  ADMIN_PASSKEY: getEnvVar('ADMIN_PASSKEY', 'VICE2026_L4'),
  STAFF_PASSKEY: getEnvVar('STAFF_PASSKEY', 'VICE2026_L3'),
  
  /** Midnight Automated Web Search & pSEO Configuration */
  CRON_SECRET_KEY: getEnvVar('CRON_SECRET_KEY', 'vice_midnight_cron_secret_2026'),
  AUTO_PSEO_ENABLED: getEnvVar('AUTO_PSEO_ENABLED', 'true') === 'true',
  NEWS_SEARCH_QUERY: getEnvVar('NEWS_SEARCH_QUERY', 'GTA 6 Rockstar Games Vice City news leaks updates'),
  
  /** Subdomain Deployment & Multi-Tenant Routing (For future isolated deployments) */
  ENABLE_SUBDOMAIN_ROUTING: getEnvVar('ENABLE_SUBDOMAIN_ROUTING', 'false') === 'true',
  DOCS_SUBDOMAIN_URL: getEnvVar('DOCS_SUBDOMAIN_URL', ''),
  ADMIN_SUBDOMAIN_URL: getEnvVar('ADMIN_SUBDOMAIN_URL', ''),
  MARKETAGENCY_SUBDOMAIN_URL: getEnvVar('MARKETAGENCY_SUBDOMAIN_URL', 'https://ai-agents-marketing.vercel.app').replace(/\/\$0$/, '').replace(/\$0$/, ''),
  MAIN_PORTAL_URL: getEnvVar('MAIN_PORTAL_URL', '') || getEnvVar('PORTAL_URL', ''),

  /** Transactional Email Webhook URL */
  EMAIL_WEBHOOK_URL: getEnvVar('EMAIL_WEBHOOK_URL', ''),
  
  /** Server Port */
  PORT: parseInt(getEnvVar('PORT', '3000'), 10),
};

export function getFormattedVipPrice(interval: string = '/mo'): string {
  const price = isNaN(ENV.VIP_PRICE) ? 3.99 : ENV.VIP_PRICE;
  return `$${price.toFixed(2)}${interval}`;
}

export function getFormattedSponsorPrice(interval: string = '/mo'): string {
  const price = isNaN(ENV.B2B_SPONSOR_PRICE) ? 49.00 : ENV.B2B_SPONSOR_PRICE;
  return `$${price.toFixed(2)}${interval}`;
}
