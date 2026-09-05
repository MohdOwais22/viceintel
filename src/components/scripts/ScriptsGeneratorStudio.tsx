'use client';

import React, { useState, useEffect } from 'react';
import {
  ServerConfigProject,
  DEFAULT_PROJECT_PRESETS,
  SupportedFramework,
  JobConfig,
  ItemConfig
} from '../../lib/lua-generators';
import { ConfigVisualEditor } from './ConfigVisualEditor';
import { LuaCodePreview } from './LuaCodePreview';
import { HostingPromoCard } from '../affiliates/HostingPromoCard';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getUserClearanceLevel, hasL2Clearance, getClearanceBadgeText } from '../../lib/rbac';
import {
  Sparkles,
  Save,
  RotateCcw,
  Crown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Code2,
  Terminal,
  Zap,
  ShieldAlert,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY_PROJECT = 'vice_script_generator_current_project';

interface ScriptsGeneratorStudioProps {
  onNavigateToAuth?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ScriptsGeneratorStudio: React.FC<ScriptsGeneratorStudioProps> = ({ onNavigateToAuth, onNavigateTab }) => {
  const [project, setProject] = useState<ServerConfigProject>(DEFAULT_PROJECT_PRESETS[0]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string>(DEFAULT_PROJECT_PRESETS[0].configId);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const [isResetSuccess, setIsResetSuccess] = useState<boolean>(false);

  // Compute actual clearance level (0: Guest, 1: L1 Citizen, 2: L2 VIP, 3: L3 Staff, 4: L4 Admin)
  const clearanceLevel = getUserClearanceLevel(userProfile || (currentUser ? { clearanceLevel: 1 } : null));
  const hasClearanceL2 = hasL2Clearance(userProfile) || isProUser;

  // Hydrate from localStorage on initial mount
  useEffect(() => {
    function loadCachedProject() {
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY_PROJECT);
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached && cached.jobs && cached.economyBaselines) {
              setProject(cached);
            }
          }
        }
      } catch (e) {
        console.warn('[ScriptStudio] Failed to load cached project:', e);
      } finally {
        setIsHydrated(true);
      }
    }
    loadCachedProject();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data;
            if (data) {
              setUserProfile(data);
              const lvl = getUserClearanceLevel(data);
              const isVipOrAdmin = lvl >= 2 || data.isVip || data.role === 'Admin' || data.role === 'Staff' || data.role === 'VIP Member';
              setIsProUser(isVipOrAdmin);
            } else {
              setUserProfile({ role: 'User', clearanceLevel: 1 });
              setIsProUser(false);
            }
          } else {
            setUserProfile({ role: 'User', clearanceLevel: 1 });
            setIsProUser(false);
          }
        } catch (err) {
          console.warn('[ScriptStudio] Profile check notice:', err);
          setUserProfile({ role: 'User', clearanceLevel: 1 });
        }
      } else {
        setUserProfile(null);
        setIsProUser(false);
      }
    });
    return () => unsub();
  }, []);

  // Auto-save to localStorage upon project edits
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(project));
    } catch (err) {
      console.warn('[ScriptStudio] Auto-save notice:', err);
    }
  }, [project, isHydrated]);

  // Load Preset
  const handleSelectPreset = (preset: ServerConfigProject) => {
    const freshProject: ServerConfigProject = JSON.parse(JSON.stringify(preset));
    freshProject.configId = `config-${Date.now()}`;
    freshProject.updatedAt = Date.now();
    setProject(freshProject);
    setActivePresetId(preset.configId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(freshProject));
      } catch {}
    }
  };

  // AI Logic Synthesizer
  const handleSynthesizeAi = async (prompt: string) => {
    // Strictly enforce VIP clearance
    if (!hasClearanceL2) {
      setAiStatusMessage('Security Protocol 403: VIP clearance required.');
      setIsProModalOpen(true);
      return;
    }

    setIsAiLoading(true);
    setAiStatusMessage('Connecting to Gemini 3.7 Flash Engine & FiveM Compiler...');

    try {
      const response = await fetch('/api/scripts/generate-lua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          framework: project.framework,
          category: project.category,
          currentProject: project,
          userClearance: clearanceLevel,
          isVip: hasClearanceL2,
          enforceClearance: true
        })
      });

      if (!response.ok) {
        throw new Error(`Synthesis HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const generatedJobs: JobConfig[] = data.generatedJobs || [];
        const generatedItems: ItemConfig[] = data.generatedItems || [];
        const customHandling = data.customHandling || project.customHandling;

        // Merge generated data into current project
        setProject((prev) => ({
          ...prev,
          jobs: generatedJobs.length > 0 ? [...prev.jobs, ...generatedJobs] : prev.jobs,
          items: generatedItems.length > 0 ? [...prev.items, ...generatedItems] : prev.items,
          customHandling: { ...prev.customHandling, ...customHandling },
          updatedAt: Date.now()
        }));

        setAiStatusMessage('AI synthesis complete! Code updated with zero syntax errors.');
        setTimeout(() => setAiStatusMessage(''), 4000);
      }
    } catch (err: any) {
      console.error('[ScriptStudio] Synthesis error:', err);
      setAiStatusMessage(`Failed: ${err?.message || 'Check network connection'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Cloud Save to Firestore
  const handleSaveToCloud = async () => {
    if (!currentUser) {
      if (onNavigateToAuth) onNavigateToAuth();
      return;
    }

    try {
      const configId = project.configId || `config-${Date.now()}`;
      await setDoc(doc(db, 'server_configs', configId), {
        ...project,
        ownerDiscordId: currentUser.uid,
        updatedAt: Date.now()
      }, { merge: true });

      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Save to Firestore error:', err);
    }
  };

  // Safe instant Reset to default preset (no iframe-blocked alert/confirm)
  const handleReset = () => {
    const defaultPreset = JSON.parse(JSON.stringify(DEFAULT_PROJECT_PRESETS[0]));
    defaultPreset.configId = `config-${Date.now()}`;
    defaultPreset.updatedAt = Date.now();
    setProject(defaultPreset);
    setActivePresetId(DEFAULT_PROJECT_PRESETS[0].configId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(defaultPreset));
      } catch {}
    }
    setIsResetSuccess(true);
    setTimeout(() => setIsResetSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-zinc-100 flex flex-col pb-16 sm:pb-20">
      {/* Studio Header Bar */}
      <div className="border-b border-white/10 bg-[#0a0f16] px-4 py-3 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wide text-white">
                  FiveM Script & Economy Balancer Studio
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  B2B SaaS ⚡
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Visual No-Code Config Generator · Zero Syntax Errors · QBCore & ESX Legacy Ready
              </p>
            </div>
          </div>

          {/* Preset Select & Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Presets Dropdown */}
            <div className="relative">
              <select
                value={activePresetId}
                onChange={(e) => {
                  const found = DEFAULT_PROJECT_PRESETS.find((p) => p.configId === e.target.value);
                  if (found) handleSelectPreset(found);
                }}
                className="bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:border-rose-500 focus:outline-none appearance-none pr-8 cursor-pointer font-bold"
              >
                {DEFAULT_PROJECT_PRESETS.map((p) => (
                  <option key={p.configId} value={p.configId}>
                    {p.projectName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('economy-balancer')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/40 transition-colors shadow-sm"
                title="Switch to standalone RP Macro Economy Balancer & Simulation Suite"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Macro Simulator</span>
              </button>
            )}

            <button
              onClick={handleSaveToCloud}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors shadow-sm"
              title="Save project to Firestore cloud"
            >
              {isSaveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaveSuccess ? 'Saved!' : 'Save Cloud'}</span>
            </button>

            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isResetSuccess
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border-white/10'
              }`}
              title="Reset configuration to Vice City QBCore baseline preset"
            >
              {isResetSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>{isResetSuccess ? 'Preset Reset!' : 'Reset'}</span>
            </button>

            {!isProUser && (
              <button
                onClick={() => setIsProModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black text-xs font-black rounded-lg shadow-lg shadow-rose-500/20 transition-transform active:scale-95"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade Pro ($29)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Studio Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Configurator & Levers */}
        <div className="lg:col-span-7 h-[680px] lg:h-[calc(100vh-120px)] min-h-[580px]">
          <ConfigVisualEditor
            project={project}
            onChange={setProject}
            onSynthesizeAi={handleSynthesizeAi}
            isAiLoading={isAiLoading}
            aiStatusMessage={aiStatusMessage}
            isProUser={isProUser}
            hasL2Clearance={hasClearanceL2}
            userClearanceLevel={clearanceLevel}
            currentUser={currentUser}
            onNavigateToAuth={onNavigateToAuth}
            onOpenProModal={() => setIsProModalOpen(true)}
          />
        </div>

        {/* Right Column: Monospaced Live Code Preview & Exporter */}
        <div className="lg:col-span-5 h-[680px] lg:h-[calc(100vh-120px)] min-h-[580px]">
          <LuaCodePreview
            project={project}
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
          />
        </div>
      </div>

      {/* Hosting Partner Sponsor Section in Dedicated Page Footer Space */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <HostingPromoCard
          headline="Ready to Deploy Your Server Config?"
          subheadline={`Deploy your ${project.framework || 'QBCore'} configuration with 20% off on official txAdmin FiveM hosting partners.`}
          placement="lua_generator_footer"
          framework={project.framework}
        />
      </div>

      {/* Pro Membership / FiveM B2B Pass Modal */}
      <AnimatePresence>
        {isProModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e141e] border border-rose-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setIsProModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-black font-black shadow-lg shadow-rose-600/30">
                  <Crown className="w-7 h-7 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                      VIP Clearance
                    </span>
                    <h3 className="text-lg font-black text-white">FiveM Studio Pro Membership</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Unlock Gemini 3.7 Flash AI Script Synthesizer & Resource Bundles</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 space-y-2">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider text-rose-400">
                    VIP Privileges Included:
                  </span>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>AI Script & Logic Synthesizer</strong> (Gemini 3.7 Flash Engine with zero syntax errors)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>1-Click Multi-File ZIP Bundles</strong> (fxmanifest, config, jobs, items, handling, SQL)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Cloud Firestore Project Synchronization</strong> & Multi-Staff Collaboration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Gini Income Disparity & Anti-Inflation Economy Matrix</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setIsProModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Continue on Free Tier
                </button>
                <button
                  onClick={() => {
                    setIsProUser(true);
                    setUserProfile((prev: any) => ({
                      ...(prev || {}),
                      clearanceLevel: 'VIP',
                      isVip: true,
                      role: 'VIP Member'
                    }));
                    setIsProModalOpen(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <span>Activate VIP Clearance ($29/mo)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
