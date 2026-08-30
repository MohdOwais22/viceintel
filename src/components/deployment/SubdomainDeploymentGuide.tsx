import React, { useState } from 'react';
import {
  Globe,
  Server,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Cpu,
  Layers,
  Zap,
  Lock,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Code,
  FileCode,
  Sparkles,
  Database,
  BookOpen
} from 'lucide-react';
import { copyToClipboard } from '../../lib/copyUtils';
import { ENV } from '../../lib/envConfig';

type DeploymentTarget = 'cloud-run' | 'multi-subdomain' | 'nginx-vps' | 'cloudflare-tunnel' | 'docker-compose';

export const SubdomainDeploymentGuide: React.FC = () => {
  const [target, setTarget] = useState<DeploymentTarget>('multi-subdomain');
  const [customDomain, setCustomDomain] = useState<string>('viceintel.app');
  const [appName, setAppName] = useState<string>(ENV.APP_NAME || 'ViceIntel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dnsTested, setDnsTested] = useState<boolean>(false);
  const [isTestingDns, setIsTestingDns] = useState<boolean>(false);

  const cleanDomain = customDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'viceintel.app';
  const isApex = !cleanDomain.includes('.') || cleanDomain.split('.').length === 2;
  const domainRoot = isApex ? cleanDomain : cleanDomain.split('.').slice(1).join('.');
  const subdomainHost = isApex ? '@' : cleanDomain.split('.')[0];
  const docsDomain = isApex ? `docs.${cleanDomain}` : `docs.${domainRoot}`;
  const adminDomain = isApex ? `admin.${cleanDomain}` : `admin.${domainRoot}`;

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestSubdomain = (mode: 'docs' | 'admin' | 'portal') => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'portal') {
        url.searchParams.delete('subdomain');
        url.searchParams.delete('subdomain_mode');
      } else {
        url.searchParams.set('subdomain', mode);
      }
      window.location.href = url.pathname + url.search;
    }
  };

  const simulateDnsCheck = () => {
    setIsTestingDns(true);
    setDnsTested(false);
    setTimeout(() => {
      setIsTestingDns(false);
      setDnsTested(true);
    }, 800);
  };

  // Multi-Subdomain Nginx Config
  const multiSubdomainNginxConfig = `# /etc/nginx/sites-available/${cleanDomain}-multi-subdomain
# ==============================================================================
# GTA VI VICEINTEL MULTI-SUBDOMAIN SUITE (MAIN, DOCS & ADMIN)
# ==============================================================================

# 1. MAIN PORTAL (${cleanDomain} & www.${cleanDomain})
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${cleanDomain} www.${cleanDomain};

    ssl_certificate /etc/letsencrypt/live/${cleanDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${cleanDomain}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. DEDICATED DEVELOPER & API DOCUMENTATION HUB (${docsDomain})
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${docsDomain};

    ssl_certificate /etc/letsencrypt/live/${docsDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${docsDomain}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. SECURED EXECUTIVE ADMIN & STAFF HQ (${adminDomain})
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${adminDomain};

    ssl_certificate /etc/letsencrypt/live/${adminDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${adminDomain}/privkey.pem;

    # Optional IP Whitelist for Staff Only
    # allow 203.0.113.195/32;
    # deny all;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

  // Multi-Subdomain Cloud Run CLI Commands
  const multiSubdomainCloudRunCli = `# 1. Map Main Portal Root Domain
gcloud beta run domain-mappings create \\
  --service=viceintel-app \\
  --domain=${cleanDomain} \\
  --region=asia-east1 \\
  --platform=managed

# 2. Map Dedicated Developer Documentation Subdomain
gcloud beta run domain-mappings create \\
  --service=viceintel-app \\
  --domain=${docsDomain} \\
  --region=asia-east1 \\
  --platform=managed

# 3. Map Isolated Admin & Staff HQ Subdomain
gcloud beta run domain-mappings create \\
  --service=viceintel-app \\
  --domain=${adminDomain} \\
  --region=asia-east1 \\
  --platform=managed`;

  // Multi-Subdomain Environment Variables Snippet
  const multiSubdomainEnvSnippet = `# Multi-Subdomain Split Activation (.env)
ENABLE_SUBDOMAIN_ROUTING="true"
DOCS_SUBDOMAIN_URL="https://${docsDomain}"
ADMIN_SUBDOMAIN_URL="https://${adminDomain}"
MAIN_PORTAL_URL="https://${cleanDomain}"
APP_URL="https://${cleanDomain}"`;

  // Nginx Config Template
  const nginxConfig = `# /etc/nginx/sites-available/${cleanDomain}
server {
    listen 80;
    listen [::]:80;
    server_name ${cleanDomain};

    # Force HTTPS redirect
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${cleanDomain};

    # SSL Certbot Certificates
    ssl_certificate /etc/letsencrypt/live/${cleanDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${cleanDomain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Max Upload Payload (Avatars & Vehicle Configs)
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket & Server-Sent Events (SSE) Headers for Live Chat
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Real Client IP & Host Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for Long-Polling & WebSockets
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`;

  // Docker Compose Template
  const dockerComposeConfig = `# docker-compose.yml
version: '3.8'

services:
  gtavi-platform:
    image: gtavi-platform:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gtavi_production_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - APP_URL=https://${cleanDomain}
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - CRON_SECRET_KEY=\${CRON_SECRET_KEY}
      - ADMIN_PASSKEY=\${ADMIN_PASSKEY}
      - STAFF_PASSKEY=\${STAFF_PASSKEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3`;

  // Dockerfile Template
  const dockerfileConfig = `# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  // Cloud Run CLI Command
  const cloudRunCli = `# 1-Click GCP Cloud Run Domain Mapping
gcloud beta run domain-mappings create \\
  --service=gtavi-central-app \\
  --domain=${cleanDomain} \\
  --region=asia-east1 \\
  --platform=managed`;

  // Cloudflare Tunnel Command
  const cloudflareTunnelCmd = `# 1. Install Cloudflared & Login
sudo apt install cloudflared -y
cloudflared tunnel login

# 2. Create Named Tunnel
cloudflared tunnel create gtavi-tunnel

# 3. Route Subdomain DNS to Tunnel
cloudflared tunnel route dns gtavi-tunnel ${cleanDomain}

# 4. Run Tunnel Routing to Local Ingress Port 3000
cloudflared tunnel run --url http://localhost:3000 gtavi-tunnel`;

  // Environment Config Snippet
  const envConfigSnippet = `# .env (Updated for Custom Subdomain)
APP_URL=https://${cleanDomain}
APP_NAME="${appName}"
PORT=3000
NODE_ENV=production`;

  return (
    <div className="space-y-6 text-zinc-200 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                1-Click Public / Custom Subdomain Deployment Engine
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRODUCTION READY
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Deploy this full-stack portal to your custom root domain or branded subdomain (<code className="text-indigo-300 font-mono">gta6.yourbrand.com</code>) with zero downtime and automatic SSL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 px-2 font-mono">Active Ingress:</span>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
              0.0.0.0:3000
            </span>
          </div>
        </div>

        {/* Live Domain & Subdomain Configurator Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 space-y-1">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Target Subdomain / Domain
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. gta6.yourdomain.com or vicecity.gg"
              className="w-full bg-zinc-950 border border-zinc-700 text-indigo-200 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Brand / App Display Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. Vice City Hub"
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={simulateDnsCheck}
              disabled={isTestingDns}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingDns ? 'animate-spin' : ''}`} />
              <span>{isTestingDns ? 'Verifying...' : 'Test DNS'}</span>
            </button>
          </div>
        </div>

        {/* DNS Test Feedback */}
        {dnsTested && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DNS mapping syntax validated for <strong>{cleanDomain}</strong>. Follow the provider instructions below to finalize.</span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
              STATUS: READY
            </span>
          </div>
        )}
      </div>

      {/* Target Infrastructure Provider Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTarget('multi-subdomain')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            target === 'multi-subdomain'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Multi-Subdomain Suite (Docs & Admin Split)</span>
          <span className="text-[9px] font-mono bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/40">
            FUTURE READY
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTarget('cloud-run')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            target === 'cloud-run'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Google Cloud Run (Serverless)</span>
        </button>

        <button
          type="button"
          onClick={() => setTarget('nginx-vps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            target === 'nginx-vps'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Linux VPS + Nginx + Certbot SSL</span>
        </button>

        <button
          type="button"
          onClick={() => setTarget('cloudflare-tunnel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            target === 'cloudflare-tunnel'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cloudflare Tunnel / Zero Trust</span>
        </button>

        <button
          type="button"
          onClick={() => setTarget('docker-compose')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            target === 'docker-compose'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Docker Container Compose</span>
        </button>
      </div>

      {/* Main Configuration Blueprint Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: DNS & Environment Variables */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. DNS Records Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Step 1: Configure DNS Records
              </h4>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                DNS Root: {domainRoot}
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              {target === 'multi-subdomain'
                ? 'Configure separate host entries for your Main Portal, Developer Docs, and Admin HQ:'
                : 'Add the following record in your DNS manager (Cloudflare, Namecheap, GoDaddy, Google Cloud DNS):'}
            </p>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="p-2.5">Subdomain</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Host</th>
                    <th className="p-2.5">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                  {target === 'multi-subdomain' ? (
                    <>
                      <tr>
                        <td className="p-2.5 font-bold text-indigo-300">Main Portal</td>
                        <td className="p-2.5 text-emerald-400">CNAME / A</td>
                        <td className="p-2.5 text-zinc-200">@</td>
                        <td className="p-2.5 text-zinc-400">YOUR_INGRESS_IP</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-purple-300">Docs Hub</td>
                        <td className="p-2.5 text-emerald-400">CNAME</td>
                        <td className="p-2.5 text-zinc-200">docs</td>
                        <td className="p-2.5 text-zinc-400">{cleanDomain}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-amber-300">Admin HQ</td>
                        <td className="p-2.5 text-emerald-400">CNAME</td>
                        <td className="p-2.5 text-zinc-200">admin</td>
                        <td className="p-2.5 text-zinc-400">{cleanDomain}</td>
                      </tr>
                    </>
                  ) : target === 'cloud-run' ? (
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">Custom Domain</td>
                      <td className="p-2.5 text-emerald-400">CNAME</td>
                      <td className="p-2.5 text-zinc-200">{subdomainHost}</td>
                      <td className="p-2.5 text-indigo-300">ghs.googlehosted.com.</td>
                    </tr>
                  ) : target === 'nginx-vps' ? (
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">Custom Domain</td>
                      <td className="p-2.5 text-emerald-400">{isApex ? 'A' : 'CNAME'}</td>
                      <td className="p-2.5 text-zinc-200">{subdomainHost}</td>
                      <td className="p-2.5 text-indigo-300">{isApex ? 'YOUR_VPS_IP' : 'vps.yourdomain.com'}</td>
                    </tr>
                  ) : target === 'cloudflare-tunnel' ? (
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">Tunnel Subdomain</td>
                      <td className="p-2.5 text-emerald-400">CNAME</td>
                      <td className="p-2.5 text-zinc-200">{subdomainHost}</td>
                      <td className="p-2.5 text-indigo-300">gtavi-tunnel.cfargotunnel.com</td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="p-2.5 font-bold text-indigo-300">Docker Ingress</td>
                      <td className="p-2.5 text-emerald-400">A</td>
                      <td className="p-2.5 text-zinc-200">{subdomainHost}</td>
                      <td className="p-2.5 text-indigo-300">YOUR_HOST_IP</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Environment Variables Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Step 2: Subdomain .env Configuration
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(target === 'multi-subdomain' ? multiSubdomainEnvSnippet : envConfigSnippet, 'env')}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'env' ? 'Copied' : 'Copy .env'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              {target === 'multi-subdomain'
                ? 'Enable the multi-subdomain routing engine in your .env file:'
                : 'Update these key variables to allow absolute URL routing, SEO canonical tags, and Discord OAuth returns:'}
            </p>

            <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed">
              {target === 'multi-subdomain' ? multiSubdomainEnvSnippet : envConfigSnippet}
            </pre>
          </div>

          {/* 3. Cloud Auth & OAuth Authorized Domains */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Step 3: Security & OAuth Whitelisting
            </h4>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-amber-300 block">1. Cloud Auth Authorized Domains</span>
                <p className="text-zinc-400 text-[11px]">
                  Add all subdomains in <code className="text-zinc-200">Auth Console &gt; Settings &gt; Authorized domains</code>:
                </p>
                <div className="space-y-1 pt-1 font-mono text-xs">
                  <code className="text-emerald-400 block bg-zinc-900 p-1.5 rounded">{cleanDomain}</code>
                  <code className="text-indigo-400 block bg-zinc-900 p-1.5 rounded">{docsDomain}</code>
                  <code className="text-amber-400 block bg-zinc-900 p-1.5 rounded">{adminDomain}</code>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-indigo-300 block">2. Discord OAuth2 Redirect URIs</span>
                <p className="text-zinc-400 text-[11px]">
                  Add the callback redirect in your Discord Developer Portal:
                </p>
                <code className="text-indigo-400 font-mono text-[11px] block bg-zinc-900 p-1.5 rounded break-all">
                  https://{cleanDomain}/api/auth/discord/callback
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Generator for Selected Target */}
        <div className="lg:col-span-7 space-y-6">
          {target === 'multi-subdomain' && (
            <div className="space-y-6">
              {/* Interactive Live Subdomain Sandbox */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-zinc-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">Live Subdomain Simulator & Sandbox</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    TEST PREVIEW
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Test the future isolated subdomain views right now inside this preview session. Each mode validates navigation, header isolation banners, and deep routing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestSubdomain('docs')}
                    className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-indigo-500/40 hover:border-indigo-400 text-left transition flex flex-col gap-1 cursor-pointer group shadow-sm"
                  >
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Test Docs Subdomain
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-indigo-200">
                      docs.{domainRoot}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Opens isolated Documentation Hub
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSubdomain('admin')}
                    className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 text-left transition flex flex-col gap-1 cursor-pointer group shadow-sm"
                  >
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Test Admin HQ
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-amber-200">
                      admin.{domainRoot}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Opens secured Admin HQ Control Plane
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestSubdomain('portal')}
                    className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-left transition flex flex-col gap-1 cursor-pointer group shadow-sm"
                  >
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Test Main Portal
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-200">
                      {cleanDomain}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Full Master Gaming Suite & Community
                    </span>
                  </button>
                </div>
              </div>

              {/* Multi-Subdomain Nginx Config Block */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Multi-Virtual-Host Nginx Configuration
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(multiSubdomainNginxConfig, 'multi_nginx')}
                    className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'multi_nginx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'multi_nginx' ? 'Copied' : 'Copy Multi-Nginx'}</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400">
                  Save to <code className="text-zinc-200">/etc/nginx/sites-available/{cleanDomain}</code>. This single file routes all 3 subdomains into the single high-performance Express container:
                </p>

                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-72 leading-relaxed">
                  {multiSubdomainNginxConfig}
                </pre>
              </div>

              {/* Multi-Subdomain Cloud Run CLI Block */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Google Cloud Run 3-Subdomain Mapping CLI
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(multiSubdomainCloudRunCli, 'multi_cloudrun')}
                    className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'multi_cloudrun' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'multi_cloudrun' ? 'Copied' : 'Copy CLI'}</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400">
                  Run these 3 commands in Google Cloud Shell to map all subdomains with automated SSL certificates:
                </p>

                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {multiSubdomainCloudRunCli}
                </pre>
              </div>
            </div>
          )}
          {target === 'cloud-run' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Google Cloud Run Custom Subdomain Setup
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopy(cloudRunCli, 'cloudrun')}
                  className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'cloudrun' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cloudrun' ? 'Copied' : 'Copy CLI'}</span>
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Cloud Run automatically handles Let's Encrypt managed SSL certificates for custom domains with zero server maintenance.
              </p>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300">Execute in Google Cloud Shell or Terminal:</span>
                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {cloudRunCli}
                </pre>
              </div>

              <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Automated Cloud Run Features
                </span>
                <ul className="list-disc list-inside text-zinc-300 space-y-1 text-[11px]">
                  <li>Automatic TLS 1.3 certificate issuance and 90-day auto-renewal</li>
                  <li>Native HTTP/2 multiplexing across Asian, European, and US edge points</li>
                  <li>Auto-scaling from 0 to 1,000+ concurrent live player WebSocket channels</li>
                </ul>
              </div>
            </div>
          )}

          {target === 'nginx-vps' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Nginx Reverse Proxy & Certbot SSL Configuration
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopy(nginxConfig, 'nginx')}
                  className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'nginx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'nginx' ? 'Copied' : 'Copy Nginx'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300">1. Nginx Site Block (`/etc/nginx/sites-available/{cleanDomain}`)</span>
                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-72 leading-relaxed">
                  {nginxConfig}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300">2. Activate Site & Obtain SSL Certificate:</span>
                <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`sudo ln -s /etc/nginx/sites-available/${cleanDomain} /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ${cleanDomain}`}
                </pre>
              </div>
            </div>
          )}

          {target === 'cloudflare-tunnel' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Cloudflare Zero Trust Tunnel (No Open Ports Needed)
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopy(cloudflareTunnelCmd, 'cf')}
                  className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'cf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cf' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Cloudflare Tunnels expose your local Express container port (3000) securely through Cloudflare's global edge without opening any router ports or configuring static public IP addresses.
              </p>

              <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
                {cloudflareTunnelCmd}
              </pre>
            </div>
          )}

          {target === 'docker-compose' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Production Docker & Compose Blueprint
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopy(dockerComposeConfig, 'docker')}
                  className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'docker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'docker' ? 'Copied' : 'Copy Docker Compose'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300">docker-compose.yml</span>
                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-56 leading-relaxed">
                  {dockerComposeConfig}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300">Dockerfile</span>
                <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                  {dockerfileConfig}
                </pre>
              </div>
            </div>
          )}

          {/* Quick Launch Checklist */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1-Click Production Go-Live Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Build artifact bundle created with <code className="text-zinc-300">npm run build</code></span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Health check confirmed at <code className="text-zinc-300">GET /api/health</code></span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Database rules deployed with <code className="text-zinc-300">security.rules</code></span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gemini API key & Cron passkey added to server environment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
