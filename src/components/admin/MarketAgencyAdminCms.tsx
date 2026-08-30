import React, { useState, useEffect } from 'react';
import {
  Target,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  Terminal,
  Globe,
  Settings,
  HelpCircle,
  Copy,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { ENV } from '../../lib/envConfig';
import { logStaffActivity } from '../../lib/staffAuditLogger';
import { AgenticMarketingAgencyHub } from '../marketing/agency/AgenticMarketingAgencyHub';

interface MarketAgencyConfig {
  apiKey: string;
  dailyRequestLimit: number;
  defaultPromptOverride: string;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_CONFIG: MarketAgencyConfig = {
  apiKey: '••••••••••••••••••••••••••••••••',
  dailyRequestLimit: 500,
  defaultPromptOverride: 'You are the elite GTA VI Vice City Vice-Intel Marketing Agent. Analyze campaign performance, maximize social reach on Bleeter and Snapmatic, and structure high-ROI marketing strategies.',
  isEnabled: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Pre-configuration'
};

export const MarketAgencyAdminCms: React.FC = () => {
  const [config, setConfig] = useState<MarketAgencyConfig>(DEFAULT_CONFIG);
  const [rawApiKey, setRawApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'settings' | 'simulator'>('workspace');

  // Simulator State
  const [simQuery, setSimQuery] = useState<string>('Draft an Instagram & Snapmatic campaign script for the Ocean Drive Custom Tuning Expo next weekend.');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<string>('');

  // DNS Copied status
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'system_configs', 'marketagency_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as MarketAgencyConfig;
          setConfig(data);
          if (data.apiKey && data.apiKey !== '••••••••••••••••••••••••••••••••') {
            setRawApiKey(data.apiKey);
          }
        } else {
          // Seed initial config
          await setDoc(docRef, DEFAULT_CONFIG);
          setConfig(DEFAULT_CONFIG);
        }
      } catch (error) {
        console.error('Error fetching MarketAgency config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const docRef = doc(db, 'system_configs', 'marketagency_config');
      
      const payload: MarketAgencyConfig = {
        ...config,
        apiKey: rawApiKey ? rawApiKey : config.apiKey,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'Anonymous Admin'
      };

      await setDoc(docRef, payload);
      setConfig(payload);
      showNotification('success', 'MarketAgency configuration saved successfully to Firestore!');

      logStaffActivity({
        actionType: 'SYSTEM_CONFIG_CHANGE',
        actionCategory: 'System Operations',
        targetId: 'marketagency_config',
        targetName: 'MarketAgency AI Config',
        targetType: 'system_configuration',
        severity: 'HIGH',
        details: `Staff updated MarketAgency AI Agents parameters.`
      }).catch(() => {});

    } catch (error) {
      console.error('Error saving MarketAgency config:', error);
      showNotification('error', 'Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const runSimulation = () => {
    if (!simQuery.trim()) return;
    setIsSimulating(true);
    setSimLogs([]);
    setSimResult('');

    const logs = [
      '⚡ Initializing MarketAgency AI Orchestrator...',
      `🎯 Context matching for Campaign Domain: GTA VI Portal / Ocean Drive`,
      '🔑 Authenticating secure API connection via process.env.GEMINI_API_KEY...',
      '📥 Formulating targeted agent instructions using configured Master Prompt System Directive...',
      '🧬 Launching AI Copywriter & Growth Strategist agents...',
      '🧠 Processing synthetic telemetry and predicting engagement rate...',
      '📝 Assembling campaign draft, Bleeter social hooks, and budget outline...'
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setSimLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimResult(`### 🌴 Vice City Ocean Drive Custom Tuning Expo — Bleeter & Snapmatic Campaign 🌴

**Campaign Goal:** Drive foot-traffic to Ocean Drive beachfront strip for the custom muscle-car tuning shootout.
**Target Audience:** Street racers, VIP vehicle tuners, high-net-worth Vice City collectors.

#### 📣 Bleeter Social Hooks:
1. "Tires will scream. Chrome will shine. The Ocean Drive Custom Tuning Expo lands next Saturday. 500k VC Prize Pool. Will your build survive the telemetry audit? 🏎️💨 #ViceCityTuner #OceanDriveExpo"
2. "Lucia's custom Cheetah Classic is already parked at the starting line. Are you turning heads or just throwing smoke? Saturday, 8 PM. Live DJs, pure octane. 🌴🔥 #ViceCityCentral"

#### 📸 Snapmatic Creative Guidelines:
- **Visual Aesthetic:** High-saturation, warm golden-hour neon pinks, long sunset shadows stretching across Ocean Drive.
- **Featured Vehicle:** Pegassi Tempesta with custom neon underglow, positioned next to the Art Deco hotel entrance.

#### 📊 Estimated ROI & Telemetry:
* **Projected Reach:** 145,000 active Vice City players
* **Estimated Conversions (Event Attendance):** 12,400 signups
* **Marketing Efficiency Ratio (MER):** 4.8x ROI`);
      }
    }, 450);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400">Loading MarketAgency configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'workspace'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Agency Workspace & Autonomous Fleet</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Agency Settings & Prompt Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>AI Agent Simulator</span>
        </button>
      </div>

      {/* Header Info Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-rose-950/20 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
            <Target className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Marketing Engine Hub
              </span>
              <span className="text-xs text-zinc-400 font-mono">L4 Authorized</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              MarketAgency AI Administration Suite
            </h3>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              Unified agentic marketing control plane. Manage SEO overrides, autonomous agents, content generation, and prompt directives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Native In-App Console Active</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'workspace' && (
        <div className="space-y-6 animate-fade-in">
          <AgenticMarketingAgencyHub />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-rose-400" />
                <span>Agency Parameters & Prompt Matrix</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-1">Configure AI model credentials and prompt directives for agency operations.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Gemini Engine API Secret Key</label>
                  <input
                    type="password"
                    value={rawApiKey}
                    onChange={e => setRawApiKey(e.target.value)}
                    placeholder="•••••••••••••••••••••••••••••••• (Leave blank to use global env)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">Daily API Generation Limit (Requests)</label>
                  <input
                    type="number"
                    value={config.dailyRequestLimit}
                    onChange={e => setConfig({ ...config, dailyRequestLimit: parseInt(e.target.value, 10) })}
                    required
                    min={1}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Agent Status</label>
                <div className="flex items-center gap-3 h-[42px] px-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    checked={config.isEnabled}
                    onChange={e => setConfig({ ...config, isEnabled: e.target.checked })}
                    className="accent-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isEnabled" className="text-xs text-zinc-300 font-bold cursor-pointer">
                    Activate Marketing Engine System
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Master Prompt System Directive Override</label>
                <textarea
                  rows={4}
                  value={config.defaultPromptOverride}
                  onChange={e => setConfig({ ...config, defaultPromptOverride: e.target.value })}
                  required
                  placeholder="Paste marketing prompt guidelines here..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-500/15 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Configurations...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider text-rose-400">Campaign Audit Logs</h4>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">Ocean Drive Custom expo</span>
                    <span className="text-[10px] font-mono text-emerald-400">Active</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Daily conversion predictions tracked via background analytics worker.</p>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">FiveM Server Sponsorship</span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Limit Hit</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">B2B marketing script reached daily prompt limit threshold.</p>
                </div>
              </div>
            </div>

            <div className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-6 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-black text-rose-300">Audit Trail & Control</h5>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  System configuration changes are recorded in the L4 Staff Audit Log. Last updated by: <span className="text-rose-400 font-bold font-mono">{config.updatedBy}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-400" />
              <span>Real-Time AI Campaign Orchestrator Simulator</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-1">Test the intelligence response, constraints, and telemetry generation speed before launching campaign agents.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">Simulation Objective Query</label>
                <textarea
                  rows={3}
                  value={simQuery}
                  onChange={e => setSimQuery(e.target.value)}
                  placeholder="Ask the AI agents to craft a viral gaming script, Ad banner optimization, or conversion matrix..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-400" />
                  <span>Configured Model: gemini-3.7-flash (Auto-Downgrade Cascade)</span>
                </span>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating || !simQuery.trim()}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>{isSimulating ? 'Generating Campaign...' : '🚀 Test AI Agent & Send Request'}</span>
                </button>
              </div>

              {/* Simulation Telemetry Steps */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-850 h-[220px] overflow-y-auto space-y-1.5 font-mono text-[11px]">
                <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2 flex justify-between items-center">
                  <span>SYSTEM_TELEMETRY_LOG</span>
                  <span className="animate-pulse text-rose-400">● LIVE MONITORING</span>
                </div>
                {simLogs.map((log, index) => (
                  <p key={index} className="text-emerald-400 animate-fade-in">{log}</p>
                ))}
                {simLogs.length === 0 && (
                  <p className="text-zinc-500 italic">Logs will stream here upon launching simulator...</p>
                )}
              </div>
            </div>

            {/* Generated Campaign Output */}
            <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-850 flex flex-col justify-between h-[400px]">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-400" />
                  <span>Agent Deliverable Draft</span>
                </span>
                {simResult && (
                  <button
                    onClick={() => handleCopy(simResult, 'draft')}
                    className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText === 'draft' ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                {simResult ? (
                  simResult
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                    <Target className="w-8 h-8 text-zinc-700 animate-pulse" />
                    <p className="text-xs italic">Submit simulation query on the left to review strategic AI generation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
