'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Bot, 
  Shield, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Settings2, 
  Layers, 
  FileCode2, 
  Terminal, 
  ChevronRight, 
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Globe
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ENV } from '../lib/envConfig';
import { validateServerSlug, checkSlugAvailabilityApi } from '../lib/whitelist-service';

export const isDiscordSnowflakeValid = (id: string): boolean => {
  const trimmed = id.trim();
  return /^\d{17,21}$/.test(trimmed);
};

export const isDiscordWebhookUrlValid = (url: string): boolean => {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (parsed.hostname.includes('discord.com') || parsed.hostname.includes('discordapp.com') || parsed.hostname.includes('discord.gg')) &&
      parsed.pathname.includes('/api/webhooks/')
    );
  } catch {
    return false;
  }
};

interface ServerOnboardingWizardProps {
  initialServerSlug?: string;
  onNavigate?: (tab: string, targetId?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    discordUsername?: string;
    discordId?: string;
    gamerTag?: string;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerOnboardingWizard: React.FC<ServerOnboardingWizardProps> = ({
  initialServerSlug = '',
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [serverName, setServerName] = useState('');
  const [serverSlug, setServerSlug] = useState(initialServerSlug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'taken'>('idle');
  const [slugFeedback, setSlugFeedback] = useState('');
  const slugDebounceRef = useRef<any>(null);

  const [serverTier, setServerTier] = useState<'community' | 'mega_server' | 'enterprise'>('mega_server');
  const [serverDescription, setServerDescription] = useState('');
  const [serverRegion, setServerRegion] = useState('NA East');
  const [serverMaxPlayers, setServerMaxPlayers] = useState('128');
  const [serverFramework, setServerFramework] = useState('FiveM');
  const [connectString, setConnectString] = useState('');
  const [serverTags, setServerTags] = useState('');
  const [discordGuildId, setDiscordGuildId] = useState('');
  const [whitelistedRoleId, setWhitelistedRoleId] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [formTemplate, setFormTemplate] = useState<'standard' | 'strict_hardcore' | 'custom'>('strict_hardcore');
  const [autoRoleOnApproval, setAutoRoleOnApproval] = useState(true);
  const [aiLoreAuditEnabled, setAiLoreAuditEnabled] = useState(true);

  // Slug check effect
  useEffect(() => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);

    const trimmed = serverSlug.trim();
    if (!trimmed) {
      setSlugStatus('idle');
      setSlugFeedback('');
      return;
    }

    const localCheck = validateServerSlug(trimmed);
    if (!localCheck.valid) {
      setSlugStatus('invalid');
      setSlugFeedback(localCheck.error || 'Invalid URL format');
      return;
    }

    setSlugStatus('checking');
    setSlugFeedback('Checking availability...');

    slugDebounceRef.current = setTimeout(async () => {
      const res = await checkSlugAvailabilityApi(trimmed, currentUser?.uid, currentUser?.email);
      if (!res.valid) {
        setSlugStatus('invalid');
        setSlugFeedback(res.error || 'Invalid format');
      } else if (!res.available) {
        setSlugStatus('taken');
        setSlugFeedback(res.error || `Slug "${trimmed}" is already claimed by another server.`);
      } else {
        setSlugStatus('valid');
        setSlugFeedback(`URL is available: /servers/${trimmed}/apply`);
      }
    }, 350);

    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    };
  }, [serverSlug, currentUser?.uid, currentUser?.email]);

  const handleServerNameChange = (name: string) => {
    setServerName(name);
    if (!isSlugManuallyEdited) {
      const autoSlug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      setServerSlug(autoSlug);
    }
  };

  // Auto-detect URL query params (e.g. ?session_id=...&tier=...&server=...)
  useEffect(() => {
    window.scrollTo(0, 0);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tierParam = params.get('tier');
      const serverParam = params.get('server');
      const statusParam = params.get('status');

      if (tierParam === 'community' || tierParam === 'mega_server' || tierParam === 'enterprise') {
        setServerTier(tierParam);
      }
      if (serverParam) {
        setServerSlug(serverParam);
      }
      if (statusParam === 'success') {
        setCurrentStep(2); // Jump directly to Discord Bot configuration step
      }
    }
  }, []);

  // Pre-fill Server Name, Slug, and Config from LocalStorage or Firestore so user NEVER re-types anything
  useEffect(() => {
    let loadedName = '';
    let loadedSlug = initialServerSlug || '';

    try {
      const pendingRaw = localStorage.getItem('viceintel_pending_server_onboarding');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending.serverName) loadedName = pending.serverName;
        if (pending.serverSlug) loadedSlug = pending.serverSlug;
      }

      if (loadedSlug && !loadedName) {
        const keyRaw = localStorage.getItem(`vice_server_${loadedSlug}`);
        if (keyRaw) {
          const sData = JSON.parse(keyRaw);
          if (sData.serverName) loadedName = sData.serverName;
        }
      }
    } catch (err) {
      console.warn('Failed to parse onboarding cache:', err);
    }

    if (loadedName && !serverName) {
      setServerName(loadedName);
    }
    if (loadedSlug && !serverSlug) {
      setServerSlug(loadedSlug);
      setIsSlugManuallyEdited(true);
      setSlugStatus('valid');
    }

    // Async Firestore check to pull existing server / form record
    const targetSlug = loadedSlug || initialServerSlug || serverSlug;
    if (targetSlug && db) {
      const cleanTargetSlug = targetSlug.toLowerCase().trim();
      const serverId = `srv_${cleanTargetSlug.replace(/[^a-z0-9]/g, '')}`;
      Promise.all([
        getDoc(doc(db, 'servers', cleanTargetSlug)).catch(() => null),
        getDoc(doc(db, 'servers', serverId)).catch(() => null),
        getDoc(doc(db, 'whitelist_forms', cleanTargetSlug)).catch(() => null),
        getDoc(doc(db, 'whitelist_forms', serverId)).catch(() => null)
      ]).then(([s1, s2, f1, f2]) => {
        const match = s1?.exists() ? s1.data() : s2?.exists() ? s2.data() : f1?.exists() ? f1.data() : f2?.exists() ? f2.data() : null;
        if (match) {
          const fn = match.serverName || match.name || match.communityName || '';
          const fs = match.serverSlug || match.slug || match.customSlug || cleanTargetSlug;
          if (fn) setServerName(fn);
          if (fs) {
            setServerSlug(fs);
            setIsSlugManuallyEdited(true);
            setSlugStatus('valid');
          }
          if (match.discordGuildId) setDiscordGuildId(match.discordGuildId);
          if (match.whitelistedRoleId) setWhitelistedRoleId(match.whitelistedRoleId);
          if (match.discordWebhookUrl) setDiscordWebhookUrl(match.discordWebhookUrl);
          if (match.description) setServerDescription(match.description);
          if (match.connectUrl) setConnectString(match.connectUrl);
        }
      }).catch(() => {});
    }
  }, [initialServerSlug]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const generatedApiKey = `vcc_live_${serverSlug.replace(/[^a-z0-9]/g, '').slice(0, 8)}_${Math.random().toString(36).substring(2, 10)}`;
  const portalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/servers/${serverSlug}/apply` 
    : `https://vicecitycentral.com/servers/${serverSlug}/apply`;

  const handleCompleteSetup = async () => {
    setIsSaving(true);
    try {
      const serverId = `srv_${serverSlug.replace(/[^a-z0-9]/g, '')}`;
      const serverRef = doc(db, 'servers', serverId);
      const whitelistFormRef = doc(db, 'whitelist_forms', serverId);

      const cleanConnectUrl = connectString.trim().replace(/^connect\s+/i, '');

      const payload = {
        id: serverId,
        serverId: serverId,
        ownerUid: currentUser?.uid || 'anonymous_owner',
        ownerDiscordId: currentUser?.uid || 'anonymous_owner',
        serverName,
        serverSlug,
        slug: serverSlug,
        name: serverName,
        description: serverDescription,
        region: serverRegion,
        maxPlayers: parseInt(serverMaxPlayers) || 128,
        framework: serverFramework,
        connectUrl: cleanConnectUrl,
        tags: serverTags ? serverTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        tier: serverTier,
        isSubscriptionActive: true,
        discordGuildId,
        whitelistedRoleId,
        discordRoleId: whitelistedRoleId,
        discordWebhookUrl,
        formTemplate,
        autoRoleOnApproval,
        aiLoreAuditEnabled,
        apiKey: generatedApiKey,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(serverRef, payload, { merge: true });
      await setDoc(whitelistFormRef, payload, { merge: true });

      // Synchronize in-memory backend state and other collections (rp_servers) via backend POST
      try {
        await fetch('/api/rp-servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: serverId,
            name: serverName,
            framework: serverFramework,
            region: serverRegion,
            maxPlayers: parseInt(serverMaxPlayers) || 128,
            connectUrl: cleanConnectUrl,
            cfxCode: cleanConnectUrl,
            description: serverDescription || 'High performance GTA 6 Vice City roleplay server with custom economy and jobs.',
            tags: serverTags ? serverTags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isWhitelisted: true,
            whitelistMode: 'ai_fast_track',
            planTier: serverTier,
            stripeSubscriptionId: 'sub_active_saas', // Mark active so it bypasses free lock
            isSubscriptionActive: true,
            ownerDiscordId: currentUser?.uid || 'anonymous_owner',
            ownerUsername: currentUser?.displayName || 'anonymous_owner',
            uid: currentUser?.uid
          })
        });
      } catch (postErr) {
        console.warn('Real-time backend synchronization warning:', postErr);
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        if (onNavigate) onNavigate('server-manage', serverSlug);
      }, 1500);
    } catch (err) {
      console.error('Error saving onboarding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Self-Serve Server Provisioning Wizard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Set Up Your Server in 4 Steps
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
            Configure your Discord bot gateway, bind whitelist roles, and deploy your custom applicant screening portal.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="mb-10 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          {[
            { step: 1, title: 'Plan & Identity' },
            { step: 2, title: 'Discord Bot & Roles' },
            { step: 3, title: 'Form & AI Rules' },
            { step: 4, title: 'Deploy & Credentials' }
          ].map((item, idx) => (
            <React.Fragment key={item.step}>
              <div 
                onClick={() => setCurrentStep(item.step as any)}
                className={`flex items-center gap-3 cursor-pointer group ${
                  currentStep === item.step ? 'text-cyan-400 font-bold' : currentStep > item.step ? 'text-emerald-400 font-medium' : 'text-slate-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === item.step
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : currentStep > item.step
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                }`}>
                  {currentStep > item.step ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <span className="text-xs hidden md:inline">{item.title}</span>
              </div>
              {idx < 3 && <div className="hidden sm:block flex-1 h-[2px] mx-3 bg-slate-800" />}
            </React.Fragment>
          ))}
        </div>

        {/* Wizard Card Body */}
        <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
          {/* STEP 1: Server Identity & Plan */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">Server Identity & Active Plan</h3>
                <p className="text-sm text-slate-400">Specify your community name, custom vanity slug, and billing tier.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Community / Server Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => handleServerNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Vice City Underground RP"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Portal URL Slug <span className="text-rose-400">*</span>
                    </label>
                    {slugStatus === 'checking' && (
                      <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                      </span>
                    )}
                    {slugStatus === 'valid' && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    )}
                    {slugStatus === 'taken' && (
                      <span className="text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Taken
                      </span>
                    )}
                    {slugStatus === 'invalid' && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Invalid format
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={serverSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true);
                        setServerSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')
                            .replace(/-+/g, '-')
                        );
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-cyan-400 font-mono text-sm focus:outline-none ${
                        slugStatus === 'valid' ? 'border-emerald-500/60' :
                        slugStatus === 'taken' ? 'border-rose-500/60' :
                        slugStatus === 'invalid' ? 'border-amber-500/60' :
                        'border-slate-700 focus:border-cyan-500'
                      }`}
                      placeholder="e.g. vice-city-underground"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block break-all">
                    {slugFeedback ? (
                      <span className={
                        slugStatus === 'valid' ? 'text-emerald-400' :
                        slugStatus === 'taken' ? 'text-rose-400' :
                        slugStatus === 'invalid' ? 'text-amber-400' : 'text-slate-400'
                      }>{slugFeedback}</span>
                    ) : (
                      <>Your portal: <code className="text-slate-400">/servers/{serverSlug || 'your-slug'}/apply</code></>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Server Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={serverDescription}
                    onChange={(e) => setServerDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500 h-24 resize-none"
                    placeholder="Describe your community, features, and lore..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Server IP / Domain / Join Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={connectString}
                    onChange={(e) => setConnectString(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. play.vicecity.rp or cfx.re/join/xxxx"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Your server hostname, IP, or cfx code (e.g. <code className="text-cyan-400 font-mono">play.vicecity.rp</code> or <code className="text-cyan-400 font-mono">cfx.re/join/abc123</code>)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Tags (Comma Separated) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={serverTags}
                    onChange={(e) => setServerTags(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Economy, Custom Cars, Hardcore"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Framework <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={serverFramework}
                    onChange={(e) => setServerFramework(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FiveM">FiveM</option>
                    <option value="VMP">VMP (Vice Multiplayer)</option>
                    <option value="Custom C#">Custom C# Engine</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Region
                    </label>
                    <select
                      value={serverRegion}
                      onChange={(e) => setServerRegion(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option value="NA East">NA East</option>
                      <option value="NA West">NA West</option>
                      <option value="EU Central">EU Central</option>
                      <option value="SA">SA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Max Players
                    </label>
                    <input
                      type="number"
                      value={serverMaxPlayers}
                      onChange={(e) => setServerMaxPlayers(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="128"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!serverName || !serverSlug || !serverDescription || !connectString || !serverTags}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span>Next: Configure Discord Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Discord Bot & Role Syncing */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">Discord Bot Authorization & Roles</h3>
                <p className="text-sm text-slate-400">Connect your server guild and assign automatic whitelisted roles upon approval.</p>
              </div>

              {/* Bot Invite Box - Fully responsive layout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm sm:text-base leading-snug">1. Invite Vice City Central Bot</h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Requires "Manage Roles" &amp; "Create Channels" permissions.</p>
                  </div>
                </div>
                <a
                  href={`https://discord.com/api/oauth2/authorize?client_id=${(!ENV.DISCORD_CLIENT_ID || ENV.DISCORD_CLIENT_ID === '1234567890') ? '1540025117470621759' : ENV.DISCORD_CLIENT_ID}&permissions=268435456&scope=bot`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  <span className="whitespace-nowrap">Authorize Bot</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              {/* Quick Help Box for finding IDs */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  How to find your Discord IDs
                </h5>
                <ol className="text-xs text-slate-400 space-y-2 pl-4 sm:pl-5 list-decimal">
                  <li>Open Discord Settings &rarr; Advanced &rarr; <strong>Enable Developer Mode</strong>.</li>
                  <li><strong>Guild ID:</strong> Right-click your server icon in the left sidebar and select "Copy Server ID".</li>
                  <li><strong>Role ID:</strong> Desktop: Right-click the role in Server Settings &rarr; Roles and select "Copy Role ID". <br/><span className="text-[11px] text-cyan-400 mt-0.5 block">Mobile/Tablet tip: Type <code>\@RoleName</code> in any chat channel, send it, and copy the numeric numbers inside the tag.</span></li>
                  <li><strong>Webhook URL:</strong> Go to Channel Settings &rarr; Integrations &rarr; Webhooks &rarr; New Webhook &rarr; "Copy Webhook URL".</li>
                </ol>
              </div>

              <div className="space-y-4">
                {/* Guild ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Discord Guild (Server) ID *
                    </label>
                    {discordGuildId.trim() && (
                      isDiscordSnowflakeValid(discordGuildId) ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid ID Format
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Must be 17-20 digits
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={discordGuildId}
                    onChange={(e) => setDiscordGuildId(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white font-mono text-sm focus:outline-none transition ${
                      !discordGuildId.trim()
                        ? 'border-slate-700 focus:border-cyan-500'
                        : isDiscordSnowflakeValid(discordGuildId)
                        ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                        : 'border-rose-500/80 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                    }`}
                    placeholder="e.g. 1198765432109876543"
                  />
                  {discordGuildId.trim() && !isDiscordSnowflakeValid(discordGuildId) ? (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Invalid Server ID. Letters and special characters are not allowed. Must be 17-20 numeric digits.
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">Right click your Discord server icon &rarr; Copy Server ID</span>
                  )}
                </div>

                {/* Whitelisted Role ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Whitelisted Member Role ID (To Assign on Approval) *
                    </label>
                    {whitelistedRoleId.trim() && (
                      isDiscordSnowflakeValid(whitelistedRoleId) ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Role Format
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Must be 17-20 digits
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={whitelistedRoleId}
                    onChange={(e) => setWhitelistedRoleId(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white font-mono text-sm focus:outline-none transition ${
                      !whitelistedRoleId.trim()
                        ? 'border-slate-700 focus:border-cyan-500'
                        : isDiscordSnowflakeValid(whitelistedRoleId)
                        ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                        : 'border-rose-500/80 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                    }`}
                    placeholder="e.g. 1198765432109876550"
                  />
                  {whitelistedRoleId.trim() && !isDiscordSnowflakeValid(whitelistedRoleId) ? (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Invalid Role ID. Letters and special characters are not allowed. Must be 17-20 numeric digits.
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">Right click the &apos;Citizen&apos; or &apos;Whitelisted&apos; role in Server Settings &rarr; Roles &rarr; Copy Role ID</span>
                  )}
                </div>

                {/* Webhook URL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Staff Review Queue Discord Webhook URL *
                    </label>
                    {discordWebhookUrl.trim() && (
                      isDiscordWebhookUrlValid(discordWebhookUrl) ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Webhook URL
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Invalid Webhook Endpoint
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white font-mono text-sm focus:outline-none transition ${
                      !discordWebhookUrl.trim()
                        ? 'border-slate-700 focus:border-cyan-500'
                        : isDiscordWebhookUrlValid(discordWebhookUrl)
                        ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                        : 'border-rose-500/80 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                    }`}
                    placeholder="https://discord.com/api/webhooks/123456789/abcdef..."
                  />
                  {discordWebhookUrl.trim() && !isDiscordWebhookUrlValid(discordWebhookUrl) ? (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Must be a valid Discord Webhook URL (e.g. https://discord.com/api/webhooks/...).
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">Incoming applications and staff actions will post rich embeds to this channel</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={
                    !isDiscordSnowflakeValid(discordGuildId) ||
                    !isDiscordSnowflakeValid(whitelistedRoleId) ||
                    !isDiscordWebhookUrlValid(discordWebhookUrl)
                  }
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span>Next: Form & AI Lore Grader</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Form Template & AI Screening */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">Whitelist Form & AI Lore Audit</h3>
                <p className="text-sm text-slate-400">Choose your question structure and configure automated rule audit rules.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div 
                  onClick={() => setFormTemplate('standard')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    formTemplate === 'standard'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white text-sm mb-1">Standard Civilian</div>
                  <p className="text-xs text-slate-400">Basic RP terms, backstory (100 words), microphone check, and age verification.</p>
                </div>

                <div 
                  onClick={() => setFormTemplate('strict_hardcore')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    formTemplate === 'strict_hardcore'
                      ? 'bg-rose-950/40 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white text-sm mb-1">Hardcore 100-Slot RP</div>
                  <p className="text-xs text-slate-400">Deep scenario questions, powergaming/metagaming tests, 250+ word backstory.</p>
                </div>

                <div 
                  onClick={() => setFormTemplate('custom')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    formTemplate === 'custom'
                      ? 'bg-amber-950/40 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white text-sm mb-1">Custom Builder</div>
                  <p className="text-xs text-slate-400">Customize every field, dropdown, and multi-choice question in the no-code builder.</p>
                </div>
              </div>

              {/* AI Rules Toggles */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">Gemini AI Lore & Plagiarism Audit</div>
                      <div className="text-xs text-slate-400">Flags ChatGPT copy-paste answers and rule violations automatically</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiLoreAuditEnabled}
                    onChange={(e) => setAiLoreAuditEnabled(e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer shrink-0 mt-1 sm:mt-0"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">Auto-Assign Discord Role on 90%+ AI Score</div>
                      <div className="text-xs text-slate-400">Instant approval without manual staff intervention for pristine applications</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRoleOnApproval}
                    onChange={(e) => setAutoRoleOnApproval(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 mt-1 sm:mt-0"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <span>Next: Deploy & Finalize</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Credentials & Deployment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">Deploy & Integration Credentials</h3>
                <p className="text-sm text-slate-400">Your portal is ready! Save your API key and share your live application link.</p>
              </div>

              {/* Portal URL Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-cyan-500/40">
                <div className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-2">Live Application Portal URL</div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 font-mono text-sm text-slate-200">
                  <span className="truncate flex-1 min-w-0 text-xs sm:text-sm">{portalUrl}</span>
                  <button
                    onClick={() => handleCopy(portalUrl, 'portal_url')}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'portal_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'portal_url' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Secret API Key Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-2">FiveM Server Sync API Key</div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 font-mono text-sm text-slate-200">
                  <span className="truncate flex-1 min-w-0 text-xs sm:text-sm">{generatedApiKey}</span>
                  <button
                    onClick={() => handleCopy(generatedApiKey, 'api_key')}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'api_key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'api_key' ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>

              {/* Ready Checklist */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5">
                <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Ready for Live Applicants
                </div>
                <div>• Automatic Discord role assignment active for guild ID: <code className="text-emerald-200 break-all">{discordGuildId || 'Configured'}</code></div>
                <div>• Notifications routing to your staff Discord webhook</div>
                <div>• QBCore/ESX zero-syntax generator enabled for export</div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteSetup}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>{isSaving ? 'Deploying Server...' : saveSuccess ? 'Deployed Successfully!' : 'Launch Whitelist Portal & Enter Dashboard'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
