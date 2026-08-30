'use client';
import React, { useState } from 'react';
import {
  BookOpen,
  Server,
  Terminal,
  Cpu,
  Database,
  Code2,
  CheckCircle2,
  Play,
  Copy,
  Check,
  Zap,
  Globe,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Compass,
  Network,
  ChevronRight,
  Search,
  Key,
  Filter,
  Sparkles,
  Info,
  Lock,
  Target,
  Users,
  Car,
  Radio,
  ArrowRight
} from 'lucide-react';

import { ActiveTab } from '../types';
import { copyToClipboard } from '../lib/copyUtils';
import { ENV } from '../lib/envConfig';
import { PseoArchitectureTab } from './PseoArchitectureTab';
import { WebsiteInteractiveModel } from './WebsiteInteractiveModel';
import { PlatformTreeModel } from './PlatformTreeModel';
import { WhitelistApiDocs } from './whitelist/WhitelistApiDocs';
import { SubdomainDeploymentGuide } from './deployment/SubdomainDeploymentGuide';

interface DocumentationTabProps {
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
}

export const DocumentationTab: React.FC<DocumentationTabProps> = ({ onNavigate }) => {
  // Primary Consolidated Categories
  const [activeCategory, setActiveCategory] = useState<'private-manifesto' | 'architecture' | 'api' | 'ai-seo' | 'devops' | 'deployment'>('private-manifesto');

  // Sub-navigation within each category
  const [archSubView, setArchSubView] = useState<'tree' | 'routes' | 'overview'>('tree');
  const [apiSubView, setApiSubView] = useState<'endpoints' | 'whitelist-api' | 'playground'>('endpoints');
  const [endpointCategoryFilter, setEndpointCategoryFilter] = useState<'ALL' | 'CORE' | 'DATABASE' | 'COMMUNITY' | 'AI_SEO' | 'WHITELIST' | 'PAYMENTS'>('ALL');
  const [endpointSearch, setEndpointSearch] = useState<string>('');
  const [aiSeoSubView, setAiSeoSubView] = useState<'gemini' | 'pseo'>('gemini');
  const [devopsSubView, setDevopsSubView] = useState<'env' | 'rp' | 'monetization' | 'deployment'>('env');
  const [envSearch, setEnvSearch] = useState<string>('');
  const [envCategoryFilter, setEnvCategoryFilter] = useState<'ALL' | 'CORE_AI' | 'SUBDOMAINS' | 'ADS' | 'PAYMENTS' | 'DISCORD' | 'SECURITY' | 'RUNTIME_DB' | 'CRON_SEO'>('ALL');
  const [envCopied, setEnvCopied] = useState<boolean>(false);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/health');
  const [testPayload, setTestPayload] = useState<string>('{\n  "prompt": "What is the best vehicle for drag racing on Vice Beach?",\n  "topic": "Tuning"\n}');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);

  const handleCopyCode = async (text: string, index: number) => {
    await copyToClipboard(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunPlayground = async () => {
    setIsTestRunning(true);
    setTestResponse(null);

    try {
      if (selectedEndpoint === 'GET /api/health') {
        const res = await fetch('/api/health');
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      } else if (selectedEndpoint === 'GET /api/vehicles') {
        const res = await fetch('/api/vehicles?category=Super');
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      } else if (selectedEndpoint === 'GET /api/chat') {
        const res = await fetch('/api/chat?channel=general');
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      } else if (selectedEndpoint === 'POST /api/ai/assistant') {
        const parsed = JSON.parse(testPayload);
        const res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      } else if (selectedEndpoint === 'POST /api/roi/calculate') {
        const res = await fetch('/api/roi/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: 'b_nightclub', includeUpgrades: true, hoursPerDay: 5 })
        });
        const data = await res.json();
        setTestResponse(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsTestRunning(false);
    }
  };

  const endpointsList = [
    {
      category: 'CORE',
      method: 'GET',
      path: '/api/health',
      description: 'Returns API server status, runtime environment, and current timestamp.',
      responseExample: '{\n  "status": "ok",\n  "system": "GTA VI Central API Server",\n  "version": "2.5.0",\n  "timestamp": "2026-08-22T08:00:00.000Z"\n}'
    },
    {
      category: 'CORE',
      method: 'GET',
      path: '/api/admin/env-health',
      description: 'Automated pre-build & runtime diagnostic checker. Validates all critical .env configurations and tests Cloud Database connectivity with latency metrics.',
      responseExample: '{\n  "success": true,\n  "status": "pass",\n  "score": 100,\n  "summary": "Environment and Cloud Database connectivity fully healthy.",\n  "timestamp": "2026-08-22T08:00:00.000Z",\n  "system": {\n    "nodeEnv": "production",\n    "port": 3000,\n    "databaseLatencyMs": 14,\n    "databaseConnected": true\n  },\n  "checks": [\n    { "key": "GEMINI_API_KEY", "status": "pass", "required": true, "message": "Key configured" }\n  ]\n}'
    },
    {
      category: 'DATABASE',
      method: 'GET',
      path: '/api/vehicles',
      description: 'Query vehicle database filtered by category, price range, or search keyword.',
      responseExample: '{\n  "success": true,\n  "count": 24,\n  "data": [\n    {\n      "id": "v1",\n      "name": "Grotti Cheetah Classic",\n      "category": "Super",\n      "price": 850000,\n      "topSpeedMph": 174,\n      "acceleration": 9.2,\n      "handling": 8.8\n    }\n  ]\n}'
    },
    {
      category: 'DATABASE',
      method: 'GET',
      path: '/api/vehicles/:id',
      description: 'Retrieve detailed telemetry, stock handling.meta physics parameters, and upgrade trees for a specific vehicle.',
      responseExample: '{\n  "success": true,\n  "data": {\n    "id": "v1",\n    "name": "Grotti Cheetah Classic",\n    "handling": {\n      "fMass": 1350,\n      "fInitialDriveForce": 0.38,\n      "fDriveBiasFront": 0.0,\n      "fInitialDragCoeff": 2.4,\n      "fDownforceModifier": 1.2\n    }\n  }\n}'
    },
    {
      category: 'DATABASE',
      method: 'GET',
      path: '/api/weapons',
      description: 'Armory catalog with DPS, muzzle velocities, effective ranges, and recoil scores.',
      responseExample: '{\n  "success": true,\n  "count": 18,\n  "data": [\n    {\n      "id": "w1",\n      "name": "Combat PDW MK II",\n      "category": "SMG",\n      "damage": 34,\n      "fireRateRpm": 800,\n      "dps": 453\n    }\n  ]\n}'
    },
    {
      category: 'DATABASE',
      method: 'POST',
      path: '/api/roi/calculate',
      description: 'Business profit and break-even calculation engine for Vice City operations.',
      responseExample: '{\n  "success": true,\n  "totalInvestment": 3200000,\n  "dailyRevenue": 480000,\n  "breakEvenDays": 7,\n  "netProfit30Days": 11200000\n}'
    },
    {
      category: 'DATABASE',
      method: 'POST',
      path: '/api/builds',
      description: 'Publish a custom vehicle mod setup to the community repository.',
      responseExample: '{\n  "success": true,\n  "message": "Build published successfully",\n  "data": { "id": "b_171230", "title": "Vice Beach Drag Spec", "author": "Apex_Drifter" }\n}'
    },
    {
      category: 'DATABASE',
      method: 'GET',
      path: '/api/builds',
      description: 'Query published community vehicle setups sorted by upvotes and performance rating.',
      responseExample: '{\n  "success": true,\n  "count": 12,\n  "data": [\n    { "id": "b_171230", "title": "Vice Beach Drag Spec", "upvotes": 42 }\n  ]\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'GET',
      path: '/api/chat',
      description: 'Retrieve live global player chat logs for specified channel.',
      responseExample: '{\n  "success": true,\n  "count": 2,\n  "data": [ { "username": "ViceRacer99", "text": "Who is racing at Ocean Drive tonight?" } ]\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'POST',
      path: '/api/chat',
      description: 'Post a new live message or rich asset attachment (vehicle setup, server link, weapon loadout). Requires authentication.',
      responseExample: '{\n  "success": true,\n  "data": {\n    "id": "c_17203912",\n    "text": "Check out my new drag setup!",\n    "attachment": {\n      "type": "vehicle",\n      "title": "Pegassi Ignus Custom",\n      "detail": "Turbo Stage 3 • 172 mph"\n    }\n  }\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'GET',
      path: '/api/squads/rooms',
      description: 'List active voice and screen comms tactical rooms with participant counts and security status.',
      responseExample: '{\n  "success": true,\n  "rooms": [\n    { "id": "squad_heist_1", "title": "Leonida Bank Vault Heist", "memberCount": 4, "isLocked": true }\n  ]\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'POST',
      path: '/api/squads/create',
      description: 'Create a new VIP or public squad comms room with optional PIN passkey.',
      responseExample: '{\n  "success": true,\n  "room": { "id": "squad_99", "title": "Nightclub Cargo Patrol", "pinProtected": true }\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'POST',
      path: '/api/squads/join',
      description: 'Verify room PIN credentials and register participant into squad comms session.',
      responseExample: '{\n  "success": true,\n  "token": "tok_squad_joined_99",\n  "activeStreamers": []\n}'
    },
    {
      category: 'AI_SEO',
      method: 'POST',
      path: '/api/ai/assistant',
      description: 'Server-side Gemini 3.7 Flash AI Tactical Advisor for GTA VI gaming guidance.',
      responseExample: '{\n  "success": true,\n  "answer": "• Upgrade Turbo Stage 3 and Lower Suspension for optimal drag times on Vice Beach.",\n  "isFallback": false\n}'
    },
    {
      category: 'AI_SEO',
      method: 'GET',
      path: '/api/seo/pages',
      description: 'Retrieve all auto-generated pSEO news articles stored in Cloud Database and server memory.',
      responseExample: '{\n  "success": true,\n  "count": 12,\n  "data": [ { "id": "gta6-midnight-news-2026-08-22-x8z2", "title": "GTA 6 Midnight Intel: Next-Gen Vehicle Handling Physics" } ]\n}'
    },
    {
      category: 'AI_SEO',
      method: 'GET',
      path: '/api/seo/pages/:slug',
      description: 'Retrieve individual pSEO topic page by slug with full sections, meta tags, and FAQ Schema.',
      responseExample: '{\n  "success": true,\n  "page": {\n    "slug": "gta-6-vehicle-handling-physics",\n    "title": "GTA 6 Vehicle Handling Physics Guide",\n    "metaDescription": "Comprehensive analysis of GTA 6 vehicle dynamics...",\n    "faq": [{ "q": "Are physics realistic?", "a": "Yes, enhanced tire slip models are simulated." }]\n  }\n}'
    },
    {
      category: 'AI_SEO',
      method: 'POST',
      path: '/api/seo/auto-generate',
      description: 'Trigger autonomous web search & Gemini AI synthesis to crawl latest GTA 6 news and create pSEO pages. Authenticated by CRON_SECRET_KEY.',
      responseExample: '{\n  "success": true,\n  "message": "GTA 6 News Engine executed successfully!",\n  "generatedPage": { "id": "gta6-midnight-news-2026-08-22-x8z2", "slug": "gta-6-vice-city-handling" }\n}'
    },
    {
      category: 'WHITELIST',
      method: 'GET',
      path: '/api/whitelist/v1/verify',
      description: 'FiveM server cfx.re Lua playerConnecting token verifier. Returns player clearance and status.',
      responseExample: '{\n  "allowed": true,\n  "gamerTag": "Leonida_Chief",\n  "status": "Approved",\n  "discordId": "123456789012345678",\n  "role": "L2_VIP"\n}'
    },
    {
      category: 'WHITELIST',
      method: 'POST',
      path: '/api/whitelist/v1/grade-lore',
      description: 'Gemini AI Character backstory & RP lore scenario automated grader. Evaluates originality and lore fit.',
      responseExample: '{\n  "grade": "A",\n  "score": 92,\n  "feedback": "Strong backstory with well-grounded Vice City lore and realistic character flaws.",\n  "recommendedAction": "APPROVE"\n}'
    },
    {
      category: 'WHITELIST',
      method: 'GET',
      path: '/api/whitelist/v1/servers/:slug/config',
      description: 'Retrieve dynamic question schema, minimum word counts, and Discord webhook configurations for a specific server.',
      responseExample: '{\n  "success": true,\n  "config": {\n    "serverName": "Vice City Underground RP",\n    "discordGuildId": "987654321098765432",\n    "questions": [{ "id": "q1", "type": "textarea", "prompt": "Character Backstory", "minWords": 100 }]\n  }\n}'
    },
    {
      category: 'WHITELIST',
      method: 'POST',
      path: '/api/whitelist/v1/servers/:slug/applications',
      description: 'Submit player whitelist application for FiveM community review with automated Discord notification dispatch.',
      responseExample: '{\n  "success": true,\n  "applicationId": "app_2026_0912",\n  "status": "Pending",\n  "message": "Application submitted to staff review queue."\n}'
    },
    {
      category: 'WHITELIST',
      method: 'POST',
      path: '/api/whitelist/v1/servers/:slug/applications/:id/decision',
      description: 'Staff decision engine. Updates application status (Approved/Rejected), grants whitelisted Discord role, and sends webhook embed.',
      responseExample: '{\n  "success": true,\n  "status": "Approved",\n  "message": "Decision recorded and Discord notification dispatched."\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'GET',
      path: '/api/auth/discord',
      description: 'Initiate Discord OAuth2 authorization flow for player identity linking.',
      responseExample: '{\n  "redirectUrl": "https://discord.com/oauth2/authorize?client_id=...&response_type=code&scope=identify%20email"\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'GET',
      path: '/api/auth/discord/callback',
      description: 'Exchange OAuth authorization code for Discord user profile and link to Cloud Database user account.',
      responseExample: '{\n  "success": true,\n  "discord": {\n    "id": "123456789012345678",\n    "username": "VicePlayer#0001",\n    "avatar": "https://cdn.discordapp.com/avatars/..."\n  }\n}'
    },
    {
      category: 'COMMUNITY',
      method: 'POST',
      path: '/api/discord/webhook',
      description: 'Dispatch rich formatted embeds to server Discord webhooks for new applications, approvals, and rejections.',
      responseExample: '{\n  "success": true,\n  "message": "Discord webhook notification dispatched successfully"\n}'
    },
    {
      category: 'PAYMENTS',
      method: 'GET',
      path: '/api/stripe/config',
      description: 'Retrieve live payment gateway publishable key, currency settings, and dynamic VIP / Pro Pass price tables.',
      responseExample: '{\n  "publishableKey": "pk_test_...",\n  "vipPrice": 3.99,\n  "b2bSponsorPrice": 49.00,\n  "proPassMonthly": 9.99,\n  "currency": "USD"\n}'
    },
    {
      category: 'PAYMENTS',
      method: 'POST',
      path: '/api/stripe/checkout',
      description: 'Create an official Checkout Session for VIP Pass ($3.99), Server Pro Pass ($9.99/mo), or B2B FiveM Server Sponsorship.',
      responseExample: '{\n  "sessionId": "cs_test_a1b2c3d4...",\n  "url": "https://checkout.stripe.com/c/pay/cs_test_..."\n}'
    },
    {
      category: 'PAYMENTS',
      method: 'POST',
      path: '/api/stripe/trial/activate',
      description: 'Activate 14-Day Free Server Pro Pass or VIP trial for registered community servers without upfront payment.',
      responseExample: '{\n  "success": true,\n  "message": "14-Day Pro Pass trial activated successfully!",\n  "expiresAt": "2026-09-04T10:30:00.000Z",\n  "planTier": "pro"\n}'
    },
    {
      category: 'CORE',
      method: 'POST',
      path: '/api/cron/challenges-payout',
      description: 'Weekly Tuning Championship payout engine. Evaluates leaderboard, awards 500+ VC credits & "Master Tuner" badge, and rotates event.',
      responseExample: '{\n  "success": true,\n  "message": "Challenge payout completed successfully!",\n  "archivedChallenge": "Ocean Drive Top Speed Run",\n  "winner": { "userName": "Apex_Drifter_99", "rewardVc": 500 }\n}'
    },
    {
      category: 'CORE',
      method: 'POST',
      path: '/api/cron/vip-alerts',
      description: 'Automated VIP subscription expiration notifier. Checks impending expirations and dispatches alerts.',
      responseExample: '{\n  "success": true,\n  "notifiedCount": 3,\n  "timestamp": "2026-08-22T08:00:00.000Z"\n}'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-indigo-500/30 rounded-2xl p-6 lg:p-8 space-y-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Enterprise System Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Full-Stack Express
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {ENV.APP_NAME} System & API Documentation
            </h1>
            <p className="text-xs lg:text-sm text-zinc-400 max-w-2xl mt-1">
              Complete technical specification for the Express REST server, Gemini AI integration, data models, and Cloud Run execution setup.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs">
            <Server className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-zinc-400 text-[10px] font-mono">NODE_ENV: production</p>
              <p className="text-emerald-400 font-bold">Port 3000 • Express + Vite</p>
            </div>
          </div>
        </div>

        {/* Consolidated Primary Navigation */}
        <div className="flex gap-2 border-t border-zinc-800/80 pt-4 overflow-x-auto scrollbar-none">
          {[
            { id: 'private-manifesto', label: 'Private Platform Spec & Purpose', icon: ShieldCheck, badge: 'Internal Spec' },
            { id: 'architecture', label: 'Platform Topology & Architecture', icon: Network, badge: '3 Modes' },
            { id: 'api', label: 'REST API Suite & Playground', icon: Code2, badge: `${endpointsList.length} Endpoints` },
            { id: 'ai-seo', label: 'AI Assistant & Autonomous SEO', icon: Bot, badge: 'Spider & GenAI' },
            { id: 'devops', label: 'DevOps, RP Gateway & Operations', icon: Terminal, badge: 'Config & Ad Engine' },
            { id: 'deployment', label: '1-Click Subdomain & Deploy', icon: Globe, badge: 'Public / DNS' }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800/90'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? 'bg-indigo-700/80 text-white' : 'bg-zinc-950 text-zinc-500'
                }`}>
                  {cat.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CATEGORY 0: PRIVATE PLATFORM MANIFESTO & SPECIFICATIONS */}
      {activeCategory === 'private-manifesto' && (
        <div className="space-y-8 animate-fade-in">
          {/* PRIVATE CLEARANCE BANNER */}
          <div className="bg-gradient-to-r from-zinc-950 via-indigo-950/60 to-zinc-900 border border-indigo-500/40 rounded-3xl p-6 lg:p-8 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/40">
                      INTERNAL SPECIFICATION • CLEARANCE LEVEL 3+
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Operational Ready
                    </span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mt-1">
                    Private Platform Architecture & Scope Manifesto
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCategory('api')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Explore REST APIs ({endpointsList.length})</span>
                </button>
              </div>
            </div>

            <p className="text-xs lg:text-sm text-zinc-300 leading-relaxed max-w-4xl relative z-10">
              This internal documentation specification defines the core purpose of <strong>{ENV.APP_NAME || 'ViceIntel'}</strong>, outlining target user personas, functional architecture, and the high-impact problems solved across the Grand Theft Auto VI and FiveM roleplay ecosystems.
            </p>
          </div>

          {/* THREE CORE SPECIFICATION PILLARS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PILLAR 1: WHAT THE PLATFORM IS FOR */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-5 hover:border-indigo-500/40 transition shadow-xl">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl w-fit border border-rose-500/30">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Pillar 01</span>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  1. What The Platform Is For
                </h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>{ENV.APP_NAME || 'ViceIntel'}</strong> is a unified, full-stack fan companion and enterprise community infrastructure platform. It integrates:
              </p>

              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Handling & Armory Data:</strong> Verified vehicle physics telemetry, 1v1 spec comparison matrices, and weapon damage rates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>3D Handling Physics Simulator:</strong> Real-time `handling.meta` tuning calculator with valid XML export capabilities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>FiveM Whitelist Gateway:</strong> No-code dynamic form creation, Discord OAuth identity linking, and AI lore grading.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Live Community Comms:</strong> WebRTC low-latency squad voice channels with camera, screen share, and Document PiP popout.</span>
                </li>
              </ul>
            </div>

            {/* PILLAR 2: WHO CAN USE IT */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-5 hover:border-indigo-500/40 transition shadow-xl">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl w-fit border border-cyan-500/30">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">Pillar 02</span>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  2. Who Can Use It
                </h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Categorized into four distinct operational user tiers:
              </p>

              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">Gamers</span>
                  <span><strong>GTA VI Gamers:</strong> Search vehicle stats, calculate business ROI yields, explore interactive map waypoints, and join live squads.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">Server Owners</span>
                  <span><strong>FiveM & RP Staff:</strong> Automate whitelist approvals, build custom applicant forms, and generate FiveM Lua scripts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">Creators</span>
                  <span><strong>Media & Agencies:</strong> Leverage AI news crawling, marketing campaign visualizers, and spotlight rental banners.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">Admins</span>
                  <span><strong>Community Staff:</strong> RBAC L1-L4 user profile management, annual GamerTag rules, and challenge leaderboards.</span>
                </li>
              </ul>
            </div>

            {/* PILLAR 3: WHAT PROBLEM WE ARE SOLVING */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-5 hover:border-indigo-500/40 transition shadow-xl">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit border border-amber-500/30">
                <Target className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Pillar 03</span>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  3. What Problem We Are Solving
                </h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Eliminating critical friction points across the community gaming lifecycle:
              </p>

              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Data Fragmentation:</strong> Unifies scattered forum leaks into a standardized, verified vehicle & armory telemetry catalog.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>RP Whitelist Friction:</strong> Replaces manual Google Forms & Discord DMs with automated Discord OAuth identity verification & AI lore grading.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Trial-and-Error Tuning:</strong> Simulates vehicle dynamics in real time before writing raw XML handling files.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Isolated Gaming:</strong> Provides built-in WebRTC voice channels and weekly tuning competitions with live leaderboards.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* DETAILED PROBLEMs & SOLUTIONS MATRIX TABLE */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>Comprehensive Problem vs. Platform Solution Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Domain / Area</th>
                    <th className="p-3.5">Industry Problem</th>
                    <th className="p-3.5">ViceIntel Platform Solution</th>
                    <th className="p-3.5 rounded-r-xl">Measurable Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  <tr className="hover:bg-zinc-800/30 transition">
                    <td className="p-3.5 font-bold text-white font-mono">Game Data & Telemetry</td>
                    <td className="p-3.5 text-zinc-400">Vehicle performance stats and weapon damage rates scattered across Reddit, YouTube, and unverified leaks.</td>
                    <td className="p-3.5 text-zinc-200">Centralized high-precision database with 1v1 spec comparison matrix and real-time handling telemetry.</td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">100% Single Source of Truth</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30 transition">
                    <td className="p-3.5 font-bold text-white font-mono">FiveM Server Onboarding</td>
                    <td className="p-3.5 text-zinc-400">Server staff waste hours manually reviewing Google Forms and sending Discord DMs.</td>
                    <td className="p-3.5 text-zinc-200">No-code form builder, Discord OAuth account linking, AI lore scenario grading, and automated webhook decision dispatches.</td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">95% Faster Applicant Processing</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30 transition">
                    <td className="p-3.5 font-bold text-white font-mono">Vehicle Physics Tuning</td>
                    <td className="p-3.5 text-zinc-400">Editing `handling.meta` XML files manually requires tedious trial-and-error game restarts.</td>
                    <td className="p-3.5 text-zinc-200">Web-based 3D physics editor that calculates top speed, 0-60 ET, slip angles, and downforce in real time before exporting XML.</td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">Instant Physics Verification</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30 transition">
                    <td className="p-3.5 font-bold text-white font-mono">Community Engagement</td>
                    <td className="p-3.5 text-zinc-400">Static companion sites offer no real-time interaction or multiplayer community features.</td>
                    <td className="p-3.5 text-zinc-200">Integrated WebRTC voice channels, live Firestore chat with deduplication, and weekly tuning competitions with automated leaderboards.</td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">Multi-Participant Live Sync</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30 transition">
                    <td className="p-3.5 font-bold text-white font-mono">SEO & News Crawling</td>
                    <td className="p-3.5 text-zinc-400">Game news updates require manual article creation and manual metadata entry.</td>
                    <td className="p-3.5 text-zinc-200">Autonomous midnight cron engine powered by Gemini AI web search generating structured pSEO articles with Schema.org JSON-LD.</td>
                    <td className="p-3.5 text-emerald-400 font-bold font-mono">Autonomous Midnight Search</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 1: PLATFORM TOPOLOGY & ARCHITECTURE */}
      {activeCategory === 'architecture' && (
        <div className="space-y-6">
          {/* Sub-navigation pills */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-fit overflow-x-auto">
            <button
              onClick={() => setArchSubView('tree')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                archSubView === 'tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Hierarchical Tree Model</span>
            </button>
            <button
              onClick={() => setArchSubView('routes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                archSubView === 'routes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Route Directory & Simulators</span>
            </button>
            <button
              onClick={() => setArchSubView('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                archSubView === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>System Tier Overview</span>
            </button>
          </div>

          {/* Sub-view Rendering */}
          {archSubView === 'tree' && <PlatformTreeModel onNavigate={onNavigate} />}
          {archSubView === 'routes' && <WebsiteInteractiveModel onNavigate={onNavigate} />}
          {archSubView === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit border border-indigo-500/20">
                    <Server className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Express API Server & Discord OAuth</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Single-port Express server (`server.ts`) running on port 3000 handling all REST endpoints under `/api/*`, Discord OAuth authorization flows, and production static assets.
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl w-fit border border-rose-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Server-Side Gemini 3.7 AI</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Integrated via `@google/genai` SDK using lazy initialization. Keeps API keys safely on the server for Vice City tactical advice and AI query responses.
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit border border-amber-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Realtime Sync & Secure Member Service</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Retains high-availability Cloud Storage for user profiles, real-time player chat channels, channel member moderation (kick/ban), notifications, and admin moderation logs.
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit border border-emerald-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Client Edge Offline Vault</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Caches large static datasets (vehicles, weapons, map locations, businesses, RP servers, blog posts, custom builds) locally for instant offline loading and PWA support (`/sw.js`).
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit border border-cyan-500/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">URL History Routing & SEO Schema</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Client-side `window.history.pushState` & `popstate` navigation mapping (`/vehicles`, `/weapons`, `/map`, `/docs`) with dynamic Schema.org JSON-LD tag injection in document head.
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit border border-purple-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Production Esbuild Bundle</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Bundled into CommonJS `dist/server.cjs` with `esbuild`, enabling fast startup and standalone execution without TypeScript runtime overhead.
                  </p>
                </div>
              </div>

              {/* Architecture Visual Diagram */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> Full-Stack Architecture Workflow
                </h3>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 font-mono text-xs text-zinc-300 space-y-4 overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-rose-400 font-bold block">Client (Browser)</span>
                      <p className="text-[11px] text-zinc-500">React 18 + Tailwind CSS + Lucide</p>
                      <p className="text-[10px] text-zinc-600">Calls /api/* endpoints</p>
                    </div>
                    <div className="bg-indigo-950/40 p-4 rounded-lg border border-indigo-500/30 space-y-1">
                      <span className="text-indigo-300 font-bold block">Express Server (server.ts)</span>
                      <p className="text-[11px] text-zinc-400">REST API Controllers + Business Logic</p>
                      <p className="text-[10px] text-indigo-400/80">Port 3000 Ingress Routing</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-emerald-400 font-bold block">Google Gemini AI Engine</span>
                      <p className="text-[11px] text-zinc-400 font-medium">gemini-3.7-flash (Cascade Fallback)</p>
                      <p className="text-[10px] text-zinc-500">Auto Rate-Limit Downgrade Engine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 2: REST API SUITE & PLAYGROUND */}
      {activeCategory === 'api' && (
        <div className="space-y-6">
          {/* Sub-navigation pills */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-fit overflow-x-auto">
            <button
              onClick={() => setApiSubView('endpoints')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                apiSubView === 'endpoints' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Registered Endpoints Specification</span>
            </button>
            <button
              onClick={() => setApiSubView('whitelist-api')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                apiSubView === 'whitelist-api' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>FiveM Whitelist API Gateway</span>
            </button>
            <button
              onClick={() => setApiSubView('playground')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                apiSubView === 'playground' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Endpoint Request Tester</span>
            </button>
          </div>

          {/* Sub-view: Whitelist API */}
          {apiSubView === 'whitelist-api' && (
            <WhitelistApiDocs onNavigate={onNavigate} />
          )}

          {/* Sub-view: Registered Endpoints */}
          {apiSubView === 'endpoints' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" /> Registered Express REST Endpoints
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {endpointsList.filter(ep => 
                        (endpointCategoryFilter === 'ALL' || ep.category === endpointCategoryFilter) &&
                        (endpointSearch === '' || ep.path.toLowerCase().includes(endpointSearch.toLowerCase()) || ep.description.toLowerCase().includes(endpointSearch.toLowerCase()))
                      ).length} / {endpointsList.length} Active
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Complete API catalog covering game databases, AI advisor, pSEO spider, Discord OAuth, and payment gateway billing.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={endpointSearch}
                    onChange={(e) => setEndpointSearch(e.target.value)}
                    placeholder="Search endpoints (e.g. /api/seo, payment, chat)..."
                    className="bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full sm:w-64 font-mono shadow-inner"
                  />
                  {endpointSearch && (
                    <button
                      type="button"
                      onClick={() => setEndpointSearch('')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 font-mono px-1.5 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'All Endpoints' },
                  { id: 'CORE', label: 'Core & Health' },
                  { id: 'DATABASE', label: 'Vehicles & Database' },
                  { id: 'COMMUNITY', label: 'Chat, Squads & Discord' },
                  { id: 'AI_SEO', label: 'Gemini AI & pSEO Spider' },
                  { id: 'WHITELIST', label: 'FiveM Whitelist Gateway' },
                  { id: 'PAYMENTS', label: 'Payment Gateway & VIP' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setEndpointCategoryFilter(pill.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      endpointCategoryFilter === pill.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {endpointsList
                  .filter(ep => 
                    (endpointCategoryFilter === 'ALL' || ep.category === endpointCategoryFilter) &&
                    (endpointSearch === '' || ep.path.toLowerCase().includes(endpointSearch.toLowerCase()) || ep.description.toLowerCase().includes(endpointSearch.toLowerCase()))
                  )
                  .map((ep, idx) => (
                  <div key={idx} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-black uppercase ${
                          ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">{ep.path}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                          {ep.category}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">{ep.description}</span>
                    </div>

                    <div className="bg-zinc-950 rounded-lg p-3 relative group">
                      <button
                        onClick={() => handleCopyCode(ep.responseExample, idx)}
                        className="absolute top-2.5 right-2.5 p-1 text-zinc-500 hover:text-white bg-zinc-900 rounded border border-zinc-800 transition cursor-pointer"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                        {ep.responseExample}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: API Playground */}
          {apiSubView === 'playground' && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-400" /> Live Endpoint Tester
                  </h3>
                  <p className="text-xs text-zinc-400">Test live backend requests directly against the Express server</p>
                </div>

                <button
                  onClick={handleRunPlayground}
                  disabled={isTestRunning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTestRunning ? 'Executing...' : 'Send Live Request'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Select Endpoint</label>
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => setSelectedEndpoint(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="GET /api/health">GET /api/health</option>
                      <option value="GET /api/vehicles">GET /api/vehicles?category=Super</option>
                      <option value="GET /api/chat">GET /api/chat?channel=general</option>
                      <option value="POST /api/roi/calculate">POST /api/roi/calculate</option>
                      <option value="POST /api/ai/assistant">POST /api/ai/assistant (Gemini AI)</option>
                    </select>
                  </div>

                  {selectedEndpoint.startsWith('POST') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">JSON Payload</label>
                      <textarea
                        rows={6}
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Server Response</label>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-emerald-400">
                    {testResponse ? (
                      <pre className="whitespace-pre-wrap">{testResponse}</pre>
                    ) : (
                      <span className="text-zinc-600">Click "Send Live Request" to view output...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 3: AI ASSISTANT & AUTONOMOUS SEO */}
      {activeCategory === 'ai-seo' && (
        <div className="space-y-6">
          {/* Sub-navigation pills */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-fit overflow-x-auto">
            <button
              onClick={() => setAiSeoSubView('gemini')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                aiSeoSubView === 'gemini' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Gemini 3.7 Server-Side Advisor</span>
            </button>
            <button
              onClick={() => setAiSeoSubView('pseo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                aiSeoSubView === 'pseo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Autonomous pSEO Spider Engine</span>
            </button>
          </div>

          {/* Sub-view: Gemini AI */}
          {aiSeoSubView === 'gemini' && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Full-Platform AI Tactical Intelligence Engine</h3>
                  <p className="text-xs text-zinc-400">Powered by Gemini 3.6 Flash via `@google/genai` with deep platform domain knowledge grounding</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Integrated Knowledge Domains</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-rose-400">🏎️ Vehicles & Handling Physics</span>
                    <p className="text-[11px] text-zinc-400">Telemetry for 30+ vehicles, drivetrain stats, handling.meta tuning variables, and drag launch optimization.</p>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-amber-400">🔫 Weapons & Ballistics TTK</span>
                    <p className="text-[11px] text-zinc-400">Damage profiles, fire rates, headshot multipliers, body armor penetration ratings, and attachment builds.</p>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-emerald-400">💼 Business ROI & Cashflow Models</span>
                    <p className="text-[11px] text-zinc-400">Nightclub safe income, Chop Shop vehicle dismantles, Acid Lab break-even payback days, and upgrade paths.</p>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-indigo-400">🗺️ Leonida Cartography & GPS</span>
                    <p className="text-[11px] text-zinc-400">District guides (Vice Beach, Port Gellhorn, Everglades), police response timers, and high-value spawns.</p>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-purple-400">🎭 FiveM Roleplay & Whitelist Engine</span>
                    <p className="text-[11px] text-zinc-400">Connection guides (F8 console connect), core RP protocols (NLR, FearRP, Metagaming, VDM, RDM), and form builders.</p>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-bold text-cyan-400">⚡ Platform Navigation & Tools</span>
                    <p className="text-[11px] text-zinc-400">Handling Editor, Mod Calculator, Comparison Matrix, Squad Radar, and Bug Reporting tools.</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mt-4">Security & Privacy Guardrails</h4>
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2 text-xs text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Protected Credentials Policy
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Administrative passkeys, staff credentials, database passwords, payment gateway secret keys, and internal API tokens are strictly excluded from AI knowledge grounding and prompt injection. Any user query attempting to solicit private credentials triggers a standard security refusal message.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: pSEO Architecture */}
          {aiSeoSubView === 'pseo' && <PseoArchitectureTab />}
        </div>
      )}

      {/* CATEGORY 4: DEVOPS, RP GATEWAY & OPERATIONS */}
      {activeCategory === 'devops' && (
        <div className="space-y-6">
          {/* Sub-navigation pills */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-fit overflow-x-auto">
            <button
              onClick={() => setDevopsSubView('env')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                devopsSubView === 'env' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Environment Variables (.env)</span>
            </button>
            <button
              onClick={() => setDevopsSubView('rp')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                devopsSubView === 'rp' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FiveM RP & Whitelist</span>
            </button>
            <button
              onClick={() => setDevopsSubView('monetization')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                devopsSubView === 'monetization' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Ads & Monetization</span>
            </button>
            <button
              onClick={() => setDevopsSubView('deployment')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                devopsSubView === 'deployment' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Build & Deploy</span>
            </button>
          </div>

          {/* Sub-view: Environment Variables */}
          {devopsSubView === 'env' && (() => {
            const allEnvVariables: Array<{
              name: string;
              scope: 'Server Only' | 'Client Only' | 'Server & Client' | 'Client & Server';
              category: 'CORE_AI' | 'SUBDOMAINS' | 'ADS' | 'PAYMENTS' | 'DISCORD' | 'SECURITY' | 'RUNTIME_DB' | 'CRON_SEO';
              categoryLabel: string;
              purpose: string;
              defaultOrExample: string;
              isSecret?: boolean;
            }> = [
              // 1. Google Gemini AI API Configuration
              {
                name: 'GEMINI_API_KEY',
                scope: 'Server Only',
                category: 'CORE_AI',
                categoryLabel: 'AI & Intelligence',
                purpose: 'Google AI Studio Gemini 3.7 Flash & 3.6 API key for server-side AI endpoints (/api/ai/*).',
                defaultOrExample: 'AIzaSyA1B2C3D4E5F6G7H8I9J0_ExampleKey',
                isSecret: true
              },
              // 2. Application Hosting & Base URLs
              {
                name: 'APP_URL',
                scope: 'Server & Client',
                category: 'CORE_AI',
                categoryLabel: 'Hosting & Base URLs',
                purpose: 'Base application deployment URL and ingress URL. Used for OAuth returns, webhooks, and canonical tags.',
                defaultOrExample: 'https://viceintel.app'
              },
              {
                name: 'APP_NAME',
                scope: 'Client & Server',
                category: 'CORE_AI',
                categoryLabel: 'Hosting & Base URLs',
                purpose: 'Application display name across header branding, page titles, and Schema.org metadata.',
                defaultOrExample: 'viceintel'
              },
              {
                name: 'GA_MEASUREMENT_ID',
                scope: 'Client Only',
                category: 'CORE_AI',
                categoryLabel: 'Hosting & Base URLs',
                purpose: 'Google Analytics 4 Measurement ID for traffic, engagement, and conversion tracking.',
                defaultOrExample: 'G-VICE2026INTEL'
              },

              // 3. Multi-Subdomain Routing & Future Isolation
              {
                name: 'ENABLE_SUBDOMAIN_ROUTING',
                scope: 'Client & Server',
                category: 'SUBDOMAINS',
                categoryLabel: 'Subdomain Routing',
                purpose: 'Toggle multi-subdomain routing engine ("false" uses unified in-app routing; "true" splits traffic).',
                defaultOrExample: 'false'
              },
              {
                name: 'DOCS_SUBDOMAIN_URL',
                scope: 'Client & Server',
                category: 'SUBDOMAINS',
                categoryLabel: 'Subdomain Routing',
                purpose: 'Dedicated external destination URL for Developer & API Documentation Hub.',
                defaultOrExample: 'https://docs.viceintel.app'
              },
              {
                name: 'ADMIN_SUBDOMAIN_URL',
                scope: 'Client & Server',
                category: 'SUBDOMAINS',
                categoryLabel: 'Subdomain Routing',
                purpose: 'Dedicated external destination URL for Staff & Executive Admin Control Plane.',
                defaultOrExample: 'https://admin.viceintel.app'
              },
              {
                name: 'MAIN_PORTAL_URL',
                scope: 'Client & Server',
                category: 'SUBDOMAINS',
                categoryLabel: 'Subdomain Routing',
                purpose: 'Base URL for main gaming tools and unified community portal.',
                defaultOrExample: 'https://viceintel.app'
              },

              // 4. Google AdSense & Publisher Networks
              {
                name: 'ADSENSE_CLIENT_ID',
                scope: 'Client Only',
                category: 'ADS',
                categoryLabel: 'Ad Networks',
                purpose: 'Google AdSense Publisher Account ID for display and responsive banner units.',
                defaultOrExample: 'ca-pub-4929828472918402'
              },
              {
                name: 'ADS_KEY',
                scope: 'Client Only',
                category: 'ADS',
                categoryLabel: 'Ad Networks',
                purpose: 'Ad network publisher account identifier fallback key.',
                defaultOrExample: 'ca-pub-4929828472918402'
              },
              {
                name: 'GPT_NETWORK_CODE',
                scope: 'Client Only',
                category: 'ADS',
                categoryLabel: 'Ad Networks',
                purpose: 'Google Publisher Tag (GPT) Ad Unit Path Code for direct ad server placement.',
                defaultOrExample: '/218471928/ViceCityCentral_Display'
              },

              // 5. Server & Environment Runtime
              {
                name: 'PORT',
                scope: 'Server Only',
                category: 'RUNTIME_DB',
                categoryLabel: 'Runtime & Database',
                purpose: 'Port bound by Express server (must be 3000 for Cloud Run container ingress proxy).',
                defaultOrExample: '3000'
              },
              {
                name: 'NODE_ENV',
                scope: 'Server & Client',
                category: 'RUNTIME_DB',
                categoryLabel: 'Runtime & Database',
                purpose: 'Application environment execution mode ("development", "production", or "test").',
                defaultOrExample: 'development'
              },
              {
                name: 'DATABASE_URL',
                scope: 'Server Only',
                category: 'RUNTIME_DB',
                categoryLabel: 'Runtime & Database',
                purpose: 'Optional PostgreSQL / Cloud SQL database connection string.',
                defaultOrExample: 'postgresql://gtavi_user:secretpass@localhost:5432/gtavi_central_db',
                isSecret: true
              },
              {
                name: 'DEFAULT_LOCALE',
                scope: 'Client & Server',
                category: 'RUNTIME_DB',
                categoryLabel: 'Runtime & Database',
                purpose: 'Default locale string for currency formatting ($) and date parsing.',
                defaultOrExample: 'en-US'
              },

              // 6. Security, Rate Limiting & Passkeys
              {
                name: 'RATE_LIMIT_WINDOW_MS',
                scope: 'Server Only',
                category: 'SECURITY',
                categoryLabel: 'Security & Access',
                purpose: 'API rate limiting sliding window duration in milliseconds.',
                defaultOrExample: '60000 (1 min)'
              },
              {
                name: 'RATE_LIMIT_MAX_REQUESTS',
                scope: 'Server Only',
                category: 'SECURITY',
                categoryLabel: 'Security & Access',
                purpose: 'Maximum allowed API requests per IP address within the rate limiting window.',
                defaultOrExample: '100'
              },
              {
                name: 'ADMIN_PASSKEY',
                scope: 'Server & Client',
                category: 'SECURITY',
                categoryLabel: 'Security & Access',
                purpose: 'Master passkey for Level 4 Admin HQ access and moderation control plane.',
                defaultOrExample: 'VICE2026_L4',
                isSecret: true
              },
              {
                name: 'STAFF_PASSKEY',
                scope: 'Server & Client',
                category: 'SECURITY',
                categoryLabel: 'Security & Access',
                purpose: 'Moderator passkey for Level 3 Staff HQ access and ticket review queue.',
                defaultOrExample: 'VICE2026_L3',
                isSecret: true
              },

              // 7. Payment Gateway & Tier Pricing
              {
                name: 'STRIPE_SECRET_KEY',
                scope: 'Server Only',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Payment checkout secret API key for processing VIP passes and B2B sponsor subscriptions.',
                defaultOrExample: 'sk_test_51Nx1234567890abcdefghijklmnopqrstuvwxyz',
                isSecret: true
              },
              {
                name: 'STRIPE_WEBHOOK_SECRET',
                scope: 'Server Only',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Signature verification secret for incoming payment webhook events (/api/stripe/webhook).',
                defaultOrExample: 'whsec_1234567890abcdefghijklmnopqrstuvwxyz',
                isSecret: true
              },
              {
                name: 'VIP_PRICE',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Monthly subscription price for B2C VIP Membership Pass (USD).',
                defaultOrExample: '3.99'
              },
              {
                name: 'PAYMENT_PRICE_12',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Micro Sponsor / Entry Tier Monthly Subscription Price (USD).',
                defaultOrExample: '12.00'
              },
              {
                name: 'PAYMENT_PRICE_29',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Starter Placement Tier Monthly Subscription Price (USD).',
                defaultOrExample: '29.00'
              },
              {
                name: 'B2B_SPONSOR_PRICE',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Monthly subscription price for B2B Sponsored RP Server Spot (USD).',
                defaultOrExample: '49.00'
              },
              {
                name: 'PAYMENT_PRICE_49',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Standard Featured Server Spot Monthly Price (USD).',
                defaultOrExample: '49.00'
              },
              {
                name: 'PAYMENT_PRICE_99',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Growth Sponsor / Featured Directory Tier Monthly Price (USD).',
                defaultOrExample: '99.00'
              },
              {
                name: 'PAYMENT_PRICE_199',
                scope: 'Client & Server',
                category: 'PAYMENTS',
                categoryLabel: 'Billing & Monetization',
                purpose: 'Enterprise Dominator Sponsor Tier Monthly Price (USD).',
                defaultOrExample: '199.00'
              },

              // 8. Third-Party Discord Integration & OAuth2
              {
                name: 'DISCORD_CLIENT_ID',
                scope: 'Server & Client',
                category: 'DISCORD',
                categoryLabel: 'Discord Integration',
                purpose: 'Discord Client ID for community bot, OAuth2 identity linking and server widgets.',
                defaultOrExample: '1540025117470621759'
              },
              {
                name: 'DISCORD_BOT_TOKEN',
                scope: 'Server Only',
                category: 'DISCORD',
                categoryLabel: 'Discord Integration',
                purpose: 'Bot token for automated role provisioning and direct messaging alerts.',
                defaultOrExample: 'MTE5ODc2NTQzMjEwOTg3NjU0Mw.Gz1234.abcdefghijklmnopqrstuvwxyz',
                isSecret: true
              },
              {
                name: 'DISCORD_CLIENT_SECRET',
                scope: 'Server Only',
                category: 'DISCORD',
                categoryLabel: 'Discord Integration',
                purpose: 'Discord OAuth2 Application Secret for authorization code token exchange.',
                defaultOrExample: 'your_discord_client_secret_here',
                isSecret: true
              },
              {
                name: 'DISCORD_REDIRECT_URI',
                scope: 'Server & Client',
                category: 'DISCORD',
                categoryLabel: 'Discord Integration',
                purpose: 'OAuth2 Redirect URI override (falls back to ${APP_URL}/api/auth/discord/callback).',
                defaultOrExample: 'https://viceintel.app/api/auth/discord/callback'
              },

              // 9. Midnight Automated Web Search & pSEO Spider
              {
                name: 'CRON_SECRET_KEY',
                scope: 'Server Only',
                category: 'CRON_SEO',
                categoryLabel: 'Automation & Webhooks',
                purpose: 'Secret bearer token for securing external midnight cron job webhooks (/api/cron/midnight-spider).',
                defaultOrExample: 'vice_midnight_cron_secret_2026',
                isSecret: true
              },
              {
                name: 'AUTO_PSEO_ENABLED',
                scope: 'Server Only',
                category: 'CRON_SEO',
                categoryLabel: 'Automation & Webhooks',
                purpose: 'Toggle background midnight news crawling and programmatic SEO article generation.',
                defaultOrExample: 'true'
              },
              {
                name: 'NEWS_SEARCH_QUERY',
                scope: 'Server Only',
                category: 'CRON_SEO',
                categoryLabel: 'Automation & Webhooks',
                purpose: 'Target search query keywords for Gemini web crawling and news synthesis.',
                defaultOrExample: 'GTA 6 Rockstar Games Vice City news leaks updates'
              },
              {
                name: 'EMAIL_WEBHOOK_URL',
                scope: 'Server Only',
                category: 'CRON_SEO',
                categoryLabel: 'Automation & Webhooks',
                purpose: 'Optional outbound webhook endpoint (SendGrid / Make / Zapier) for automated VIP expiration alerts.',
                defaultOrExample: 'https://hooks.zapier.com/hooks/catch/12345/abcde'
              }
            ];

            const filteredVars = allEnvVariables.filter((item) => {
              const matchesCategory = envCategoryFilter === 'ALL' || item.category === envCategoryFilter;
              const matchesSearch =
                item.name.toLowerCase().includes(envSearch.toLowerCase()) ||
                item.purpose.toLowerCase().includes(envSearch.toLowerCase()) ||
                item.defaultOrExample.toLowerCase().includes(envSearch.toLowerCase()) ||
                item.scope.toLowerCase().includes(envSearch.toLowerCase()) ||
                item.categoryLabel.toLowerCase().includes(envSearch.toLowerCase());
              return matchesCategory && matchesSearch;
            });

            const handleCopyFullEnv = async () => {
              const fullTemplate = `# ==============================================================================
# VICEINTEL — ENVIRONMENT CONFIGURATION & SECRETS SPECIFICATION
# ==============================================================================

# 1. GOOGLE GEMINI AI API CONFIGURATION
GEMINI_API_KEY="AIzaSyA1B2C3D4E5F6G7H8I9J0_ExampleKey"

# 2. APPLICATION HOSTING & BASE URLS
APP_URL="https://ais-dev-7zm3i4tqr2i53cmxkq7h3p-757893122598.asia-east1.run.app"
APP_NAME="viceintel"
GA_MEASUREMENT_ID="G-VICE2026INTEL"

# 2.1 MULTI-SUBDOMAIN ROUTING & FUTURE ISOLATION
ENABLE_SUBDOMAIN_ROUTING="false"
DOCS_SUBDOMAIN_URL="https://docs.viceintel.app"
ADMIN_SUBDOMAIN_URL="https://admin.viceintel.app"
MAIN_PORTAL_URL="https://viceintel.app"

# 3. GOOGLE ADSENSE & GPT AD NETWORKS
ADSENSE_CLIENT_ID="ca-pub-4929828472918402"
ADS_KEY="ca-pub-4929828472918402"
GPT_NETWORK_CODE="/218471928/ViceCityCentral_Display"

# 4. SERVER & ENVIRONMENT RUNTIME
PORT=3000
NODE_ENV="development"

# 5. API RATE LIMITING
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 6. PAYMENT GATEWAY INTEGRATION
STRIPE_SECRET_KEY="sk_test_51Nx1234567890abcdefghijklmnopqrstuvwxyz"
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnopqrstuvwxyz"

# 7. MONETIZATION & PRICING CONFIGURATION
VIP_PRICE=3.99
PAYMENT_PRICE_12=12.00
PAYMENT_PRICE_29=29.00
B2B_SPONSOR_PRICE=49.00
PAYMENT_PRICE_49=49.00
PAYMENT_PRICE_99=99.00
PAYMENT_PRICE_199=199.00

# 8. THIRD-PARTY DISCORD INTEGRATION & OAUTH2
DISCORD_CLIENT_ID="1540025117470621759"
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
DISCORD_CLIENT_SECRET="your_discord_client_secret_here"
DISCORD_REDIRECT_URI=""

# 9. DATABASE & PERSISTENCE
DATABASE_URL="postgresql://gtavi_user:secretpass@localhost:5432/gtavi_central_db"

# 10. LOCALE & REGION CONFIGURATION
DEFAULT_LOCALE="en-US"

# 11. ADMIN & STAFF SECURITY ACCESS PASSKEYS
ADMIN_PASSKEY="VICE2026_L4"
STAFF_PASSKEY="VICE2026_L3"

# 12. MIDNIGHT AUTOMATED WEB SEARCH & pSEO SPIDER
CRON_SECRET_KEY="vice_midnight_cron_secret_2026"
AUTO_PSEO_ENABLED="true"
NEWS_SEARCH_QUERY="GTA 6 Rockstar Games Vice City news leaks updates"

# 13. TRANSACTIONAL EMAIL NOTIFICATION WEBHOOK
EMAIL_WEBHOOK_URL=""
`;
              await copyToClipboard(fullTemplate);
              setEnvCopied(true);
              setTimeout(() => setEnvCopied(false), 2000);
            };

            return (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Environment Variables Specification & Registry</h3>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {allEnvVariables.length} VARIABLES
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">Complete declarations in `.env.example` with centralized accessor `/src/lib/envConfig.ts` (`ENV`)</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyFullEnv}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    {envCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{envCopied ? 'Copied Full .env.example' : 'Copy Full .env.example'}</span>
                  </button>
                </div>

                {/* Search & Category Filter Controls */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by variable name, purpose, scope, or default..."
                        value={envSearch}
                        onChange={(e) => setEnvSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 font-mono transition"
                      />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>ALL</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">{allEnvVariables.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('CORE_AI')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'CORE_AI'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>AI & Hosting</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">5</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('SUBDOMAINS')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'SUBDOMAINS'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-purple-300" />
                      <span>Subdomains</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('PAYMENTS')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'PAYMENTS'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>Billing & Pricing</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">9</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('ADS')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'ADS'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>AdSense & GPT</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">3</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('DISCORD')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'DISCORD'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>Discord OAuth</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('SECURITY')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'SECURITY'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>Security & Passkeys</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('RUNTIME_DB')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'RUNTIME_DB'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>Runtime & DB</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvCategoryFilter('CRON_SEO')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        envCategoryFilter === 'CRON_SEO'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>Spider & Webhooks</span>
                      <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full">4</span>
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Variable Name</th>
                        <th className="p-3">Runtime Scope</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Purpose & Description</th>
                        <th className="p-3">Default / Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                      {filteredVars.map((item) => (
                        <tr key={item.name} className="hover:bg-zinc-800/40 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-300">{item.name}</span>
                              {item.isSecret && (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 flex items-center gap-0.5">
                                  <Key className="w-2.5 h-2.5" /> Secret
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold border ${
                                item.scope === 'Server Only'
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                                  : item.scope === 'Client Only'
                                  ? 'bg-sky-950/60 text-sky-300 border-sky-800/50'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                              }`}
                            >
                              {item.scope}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 text-[11px] font-sans">
                            {item.categoryLabel}
                          </td>
                          <td className="p-3 text-zinc-300 text-xs font-sans max-w-sm leading-relaxed">
                            {item.purpose}
                          </td>
                          <td className="p-3 text-zinc-400 text-[11px]">
                            <code className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-emerald-400 block max-w-xs truncate" title={item.defaultOrExample}>
                              {item.defaultOrExample}
                            </code>
                          </td>
                        </tr>
                      ))}
                      {filteredVars.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-zinc-500 font-sans text-xs">
                            No environment variables match your search query: "{envSearch}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Centralized Code Usage Snippet */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Centralized Module Usage Example (`/src/lib/envConfig.ts`):</span>
                  <pre className="text-[11px] font-mono text-indigo-200 bg-zinc-900 p-3 rounded-lg border border-zinc-800 overflow-x-auto">
{`import { ENV, getFormattedVipPrice, isVipPricingLive } from '../lib/envConfig';

// Access strongly-typed environment variables
console.log("App Name:", ENV.APP_NAME);
console.log("Subdomain Routing Active:", ENV.ENABLE_SUBDOMAIN_ROUTING);
console.log("VIP Price:", getFormattedVipPrice()); // "$3.99/mo"
console.log("Admin Passkey Configured:", Boolean(ENV.ADMIN_PASSKEY));`}
                  </pre>
                </div>
              </div>
            );
          })()}

          {/* Sub-view: FiveM RP & Whitelist */}
          {devopsSubView === 'rp' && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">FiveM Server Directory & Whitelist Guide</h3>
                  <p className="text-xs text-zinc-400">Technical details on FiveM roleplay servers, application whitelist mechanics, and F8 console connect strings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> What is a Whitelisted RP Server?
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    A <strong>Whitelisted Server</strong> requires player applications prior to connection. Administrators review character backstories, RP experience, and Discord accounts to prevent "fail-RP" and ensure immersive roleplay experiences across Vice City.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-1.5 text-xs text-zinc-400">
                    <span className="font-bold text-zinc-200 block">Required Submission Data:</span>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300">
                      <li>In-Game Character Name & Age</li>
                      <li>Discord Tag & Steam Hex Identifier</li>
                      <li>Character Backstory & Vice City Occupation Plan</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> FiveM Console Connection Protocol
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Connecting to a custom server listed in the directory uses the standard FiveM console command line string:
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-indigo-300 space-y-2">
                    <p className="text-zinc-500">// Example F8 Console Command</p>
                    <p className="bg-zinc-950 p-2 rounded border border-zinc-800">connect cfx.re/join/v6vc77</p>
                    <ol className="list-decimal list-inside text-zinc-400 space-y-1 text-[11px] font-sans">
                      <li>Click <strong>Copy Command</strong> on any server card</li>
                      <li>Launch <strong>FiveM Application</strong></li>
                      <li>Press <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-white">F8</kbd> or <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-white">~</kbd></li>
                      <li>Paste (<kbd className="bg-zinc-800 px-1 py-0.5 rounded text-white">Ctrl+V</kbd>) and hit Enter</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> No-Code Whitelist Engine & Discord Integration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-1.5">
                    <span className="font-bold text-white block">1. Form Builder (/servers/[slug]/manage)</span>
                    <p className="text-zinc-400">Build custom question templates with type controls (text, textarea, dropdown, multiple choice), character minimums, and Discord guild/webhook bindings.</p>
                  </div>
                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-1.5">
                    <span className="font-bold text-white block">2. Player Portal (/servers/[slug]/apply)</span>
                    <p className="text-zinc-400">Seamless application portal with mandatory Discord OAuth identity linking and automatic Discord embed webhook dispatching upon submit.</p>
                  </div>
                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-1.5">
                    <span className="font-bold text-white block">3. Staff Queue (/servers/[slug]/review)</span>
                    <p className="text-zinc-400">Live review dashboard for staff with backstory inspection, reviewer notes, and 1-click Discord webhook approvals & rejections.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-400" /> Need FiveM Server API & Lua Script Documentation?
                    </h5>
                    <p className="text-[11px] text-zinc-400">View complete REST endpoints, playerConnecting Lua deferral scripts, and AI lore grader specifications.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCategory('api');
                      setApiSubView('whitelist-api');
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  >
                    <span>View Whitelist API Docs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Ads & Monetization */}
          {devopsSubView === 'monetization' && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ads, Monetization & Ad Injection Engine Architecture</h3>
                  <p className="text-xs text-zinc-400">Context-Aware Script Injector, Zero-CLS IAB Containers, Route Exclusion Matrix & Billing Gateway</p>
                </div>
              </div>

              {/* Core Offerings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> B2C VIP Pass ($3.99/mo)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Direct player subscriptions granting 100% ad-free portal access across all views, unlimited custom VIP chat hubs, custom animated GTA VI avatars, and priority AI queue times.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1 font-mono">
                    <p className="text-emerald-400 font-bold">Route: /api/stripe/checkout</p>
                    <p>Plan: "vip_monthly" ($3.99/mo)</p>
                    <p>Duration: 365-Day Rolling</p>
                  </div>
                </div>

                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Server Pro Pass ($9.99/mo)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Dedicated FiveM server dashboard with 14-day free trial, custom whitelist form builder, Discord OAuth integration, automated webhook routing, and AI lore applicant grader.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1 font-mono">
                    <p className="text-indigo-300 font-bold">Route: /api/stripe/trial/activate</p>
                    <p>Plan: "server_pro_pass"</p>
                    <p>Free Trial: 14 Days (No CC)</p>
                  </div>
                </div>

                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> B2B Server Sponsorship ($49.00/mo)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Top-tier pinned spots in the FiveM RP Directory with verified server badges, direct Discord join links, high-visibility player acquisition, and leaderboard banner slots.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1 font-mono">
                    <p className="text-rose-300 font-bold">Route: /api/stripe/checkout</p>
                    <p>Plan: "b2b_sponsored"</p>
                    <p>Impressions: ~125K / mo</p>
                  </div>
                </div>
              </div>

              {/* CONTEXT-AWARE AD INJECTION ENGINE */}
              <div className="bg-zinc-950 p-5 rounded-xl border border-indigo-500/20 space-y-4">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Context-Aware Ad Injection & Script Management Engine</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  The platform uses a centralized ad injection subsystem (<code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">src/components/ads</code>) designed specifically to eliminate Cumulative Layout Shift (CLS), enforce route exclusions, block ad network scripts for VIP users, and comply strictly with Google AdSense / NitroPay policy guidelines.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 1. Zero Cumulative Layout Shift (CLS = 0.00)
                    </span>
                    <p className="text-zinc-400 font-sans text-xs">
                      Containers are pre-allocated with fixed responsive aspect ratios (<code className="text-zinc-300">728/90</code>, <code className="text-zinc-300">300/250</code>, <code className="text-zinc-300">300/600</code>, <code className="text-zinc-300">970/250</code>) and animated shimmer skeletons to shield Core Web Vitals before scripts execute.
                    </p>
                  </div>

                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 2. VIP & Pro 0-Byte Suppression
                    </span>
                    <p className="text-zinc-400 font-sans text-xs">
                      When <code className="text-zinc-300">isUserAdFree</code> evaluates to true (VIP L2-L4, Server Pro Pass, or Staff), <code className="text-zinc-300">&lt;AdScriptLoader /&gt;</code> completely halts third-party script tags (<code className="text-zinc-300">adsbygoogle.js</code>, <code className="text-zinc-300">gpt.js</code>), consuming 0KB network bandwidth.
                    </p>
                  </div>

                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> 3. Route Exclusion Blacklist Engine
                    </span>
                    <p className="text-zinc-400 font-sans text-xs">
                      Mission-critical workflows (<code className="text-zinc-300">/servers/*/manage</code>, <code className="text-zinc-300">/servers/*/review</code>, <code className="text-zinc-300">/servers/*/apply</code>, <code className="text-zinc-300">/servers/*/status</code>, <code className="text-zinc-300">/checkout</code>, <code className="text-zinc-300">/admin*</code>) are automatically excluded via regex matchers in <code className="text-zinc-300">ad-config.ts</code>.
                    </p>
                  </div>

                  <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> 4. Interactive Map Dock Policy Safety
                    </span>
                    <p className="text-zinc-400 font-sans text-xs">
                      Docked banner units on the interactive Vice City map enforce an isolated floating box with a <strong className="text-zinc-200">24px minimum safety margin</strong> and event propagation barriers to prevent accidental map pin click penalties.
                    </p>
                  </div>
                </div>

                {/* TypeScript Code Usage Snippet */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-white block">Client Component Implementation Example:</span>
                  <pre className="text-[11px] font-mono text-indigo-200 bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 overflow-x-auto">
{`import { AdSlot, AdScriptLoader, useAdEligibility } from './components/ads';

// 1. Root Level Script Injector (App.tsx)
<AdScriptLoader user={{ isVip: userProfile?.isVip, isAdmin, isStaff }} />

// 2. Responsive Content Ad Unit (e.g. Vehicles / Weapons Database)
<AdSlot 
  slotType="leaderboard" 
  position="inline" 
  lazyOffset="200px" 
/>

// 3. Floating Map Dock with 24px Safety Clearance
<AdSlot 
  slotType="map_dock" 
  position="map_dock" 
/>`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Deployment */}
          {devopsSubView === 'deployment' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Production Build & Execution Scripts
                </h3>

                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    `package.json` scripts configured for production deployment on Cloud Run containers:
                  </p>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-emerald-300 space-y-2">
                    <p className="text-zinc-500">// package.json scripts</p>
                    <p>"dev": "tsx server.ts",</p>
                    <p>"validate:health": "node scripts/validate-env-health.js",</p>
                    <p>"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",</p>
                    <p>"start": "node dist/server.cjs"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                      <span className="font-bold text-white">1. Esbuild CommonJS Bundle</span>
                      <p className="text-zinc-400">Bundles server.ts to `dist/server.cjs` keeping external node_modules untouched, eliminating ESM import resolution errors at container boot.</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                      <span className="font-bold text-white">2. Ingress Port Binding</span>
                      <p className="text-zinc-400">Express binds strictly to `0.0.0.0:3000` as mandated by Cloud Run reverse proxy infrastructure.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subdomain & Custom Domain Deploy Suite */}
              <SubdomainDeploymentGuide />
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 5: 1-CLICK SUBDOMAIN & CUSTOM DEPLOYMENT SUITE */}
      {activeCategory === 'deployment' && (
        <SubdomainDeploymentGuide />
      )}
    </div>
  );
};
