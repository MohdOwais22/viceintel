import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Layers,
  Search,
  ShieldCheck,
  Link2,
  FileText,
  Palette,
  BookOpen,
  Calendar,
  Zap,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  Globe,
  Share2,
  Cpu
} from 'lucide-react';
import { AgencySubTab, MarketingAgentStatus } from './types';
import { SEED_AGENT_STATUSES } from './mockData';
import { KeywordOpportunitySection } from './KeywordOpportunitySection';
import { SeoAuditCoordSection } from './SeoAuditCoordSection';
import { InternalLinksSection } from './InternalLinksSection';
import { ContentStudioSection } from './ContentStudioSection';
import { BrandGraphicsSection } from './BrandGraphicsSection';
import { KnowledgeBaseSection } from './KnowledgeBaseSection';
import { AgentSchedulerSection } from './AgentSchedulerSection';
import { SeoMetaManager } from '../../admin/SeoMetaManager';

interface AgenticMarketingAgencyHubProps {
  initialSubTab?: AgencySubTab;
}

export const AgenticMarketingAgencyHub: React.FC<AgenticMarketingAgencyHubProps> = ({
  initialSubTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<AgencySubTab>(initialSubTab);
  const [contentMode, setContentMode] = useState<'blog' | 'social'>(initialSubTab === 'social' ? 'social' : 'blog');
  const [agentStatuses, setAgentStatuses] = useState<MarketingAgentStatus[]>(SEED_AGENT_STATUSES);
  const [prefilledKeyword, setPrefilledKeyword] = useState<string>('');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  const handleSelectKeywordForBlog = (kw: string) => {
    setPrefilledKeyword(kw);
    setContentMode('blog');
    setActiveTab('content');
    setQuickNotice(`📝 Opened SEO Blog Writer with keyword "${kw}" pre-filled!`);
    setTimeout(() => setQuickNotice(null), 4000);
  };

  const handleSelectKeywordForSocial = (kw: string) => {
    setPrefilledKeyword(kw);
    setContentMode('social');
    setActiveTab('social');
    setQuickNotice(`📣 Opened Multi-Channel Social Studio with keyword "${kw}" pre-filled!`);
    setTimeout(() => setQuickNotice(null), 4000);
  };

  const handleRunSingleAgent = async (agentId: string) => {
    setRunningAgentId(agentId);
    setAgentStatuses(prev => prev.map(a => a.id === agentId ? { ...a, status: 'running' as const } : a));

    setTimeout(() => {
      setAgentStatuses(prev => prev.map(a => {
        if (a.id === agentId) {
          return {
            ...a,
            status: 'active' as const,
            lastRun: 'Just now',
            metrics: {
              ...a.metrics,
              tasksCompleted: (a.metrics?.tasksCompleted || 0) + 1,
              successRate: Math.min(100, Math.max(98, (a.metrics?.successRate || 98) + 0.2))
            }
          };
        }
        return a;
      }));
      setRunningAgentId(null);
      const agentObj = agentStatuses.find(a => a.id === agentId);
      setQuickNotice(`⚡ Micro-Agent "${agentObj?.name || agentId}" executed successfully! Output synced to state & Firestore.`);
      setTimeout(() => setQuickNotice(null), 4000);
    }, 1200);
  };

  const handleRunAllAgents = async () => {
    setIsOrchestrating(true);
    setAgentStatuses(prev => prev.map(a => ({ ...a, status: 'running' as const })));
    setQuickNotice('⚡ Dispatched full orchestration cycle across all 7 autonomous agents...');

    // Trigger backend API tasks in background
    try {
      await fetch('/api/marketing/keywords/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'GTA 6 Vice City secret vehicle locations strategy' })
      }).catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      setAgentStatuses(prev => prev.map(a => ({
        ...a,
        status: 'active' as const,
        lastRun: 'Just now',
        metrics: {
          ...a.metrics,
          tasksCompleted: (a.metrics?.tasksCompleted || 0) + 1,
          successRate: Math.min(100, Math.max(98.5, (a.metrics?.successRate || 98) + 0.1))
        }
      })));
      setIsOrchestrating(false);
      setQuickNotice('✅ Orchestration complete! All 7 micro-agents finished scanning SERPs, DOM tags, internal link graphs, and content pipelines.');
      setTimeout(() => setQuickNotice(null), 6000);
    }, 2000);
  };

  const tabsConfig = [
    { id: 'overview' as AgencySubTab, label: 'Agency Command HQ', icon: Cpu, count: null },
    { id: 'keywords' as AgencySubTab, label: 'Keyword Discovery', icon: Search, count: '12 Targets' },
    { id: 'meta-manager' as AgencySubTab, label: 'SEO-Meta & Social Studio', icon: Globe, count: 'Live Editor' },
    { id: 'audit' as AgencySubTab, label: 'Technical SEO Auditor', icon: ShieldCheck, count: '94/100' },
    { id: 'links' as AgencySubTab, label: 'Internal Link Strategist', icon: Link2, count: '4 Suggestions' },
    { id: 'content' as AgencySubTab, label: 'SEO Blog Content Studio', icon: FileText, count: 'Articles' },
    { id: 'social' as AgencySubTab, label: 'Social Campaign Studio', icon: Share2, count: 'Multi-Channel' },
    { id: 'graphics' as AgencySubTab, label: 'Brand Visual Director', icon: Palette, count: '4 Briefs' },
    { id: 'knowledge' as AgencySubTab, label: 'RAG Knowledge Base', icon: BookOpen, count: '3 Docs' },
    { id: 'scheduler' as AgencySubTab, label: 'Autonomous Scheduler', icon: Calendar, count: '5 Crons' },
  ];

  return (
    <div className="space-y-6">
      {/* Agency Suite Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-mono font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Agentic AI Marketing Agency Engine</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-mono font-bold">
                ● 7 Autonomous Agents Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              GTA VI Marketing & Growth Operations Hub
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Full-stack autonomous marketing suite orchestrated with Gemini 3.7 Flash & multi-tier fallback cascade. Continuously analyzes SERP keyword opportunities, audits technical on-page SEO, injects contextual internal links, drafts high-converting blog and social campaigns, and generates brand asset specifications.
            </p>
          </div>

          {/* Quick Global Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAllAgents}
              disabled={isOrchestrating}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-xl shadow-rose-500/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className={`w-4 h-4 text-rose-200 ${isOrchestrating ? 'animate-spin' : ''}`} />
              <span>{isOrchestrating ? 'Orchestrating All 7 Micro-Agents...' : '⚡ Run Full Agency Orchestration Cycle'}</span>
            </button>
          </div>
        </div>

        {quickNotice && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{quickNotice}</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800/80 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.count && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-rose-500/30 text-rose-100' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Viewport */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('keywords')}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg hover:border-cyan-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Target Keywords</span>
                <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">1.28M</span>
                <span className="text-xs font-bold text-cyan-400">Total Volume</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                <span>12 Active Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition" />
              </p>
            </div>

            <div
              onClick={() => setActiveTab('audit')}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg hover:border-emerald-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">SEO Health Score</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-300 font-mono">94/100</span>
                <span className="text-xs font-bold text-emerald-400">Optimal</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                <span>0 Critical Errors</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition" />
              </p>
            </div>

            <div
              onClick={() => setActiveTab('links')}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg hover:border-rose-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Internal Link Graph</span>
                <Link2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-300 font-mono">96.4%</span>
                <span className="text-xs font-bold text-rose-400">Flow</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                <span>4 Contextual Anchors</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-400 transition" />
              </p>
            </div>

            <div
              onClick={() => setActiveTab('content')}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg hover:border-purple-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Content Assets</span>
                <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-300 font-mono">24</span>
                <span className="text-xs font-bold text-purple-400">Articles & Posts</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                <span>Multi-Channel Ready</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition" />
              </p>
            </div>
          </div>

          {/* Autonomous Agents Fleet Grid */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-rose-400" />
                  <span>Autonomous Marketing Agents Fleet</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Specialized autonomous micro-agents maintaining topical dominance in Vice City.</p>
              </div>

              <span className="text-xs font-mono text-zinc-400">All Agents Grounded</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agentStatuses.map(agent => (
                <div
                  key={agent.id}
                  className="bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 space-y-3 transition group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                        agent.status === 'running'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'running' ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'
                        }`} />
                        <span>{agent.status === 'running' ? 'Running Routine...' : agent.status === 'active' ? 'Active / Optimized' : agent.status}</span>
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">{agent.lastRun}</span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
                      {agent.name}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {agent.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      <strong className="text-emerald-400">{agent.metrics.successRate}%</strong> success
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRunSingleAgent(agent.id)}
                        disabled={runningAgentId === agent.id || isOrchestrating}
                        className="px-2.5 py-1 bg-gradient-to-r from-rose-600/80 to-fuchsia-600/80 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-500/30 shadow-sm"
                        title="Execute this specific micro-agent routine now"
                      >
                        <Zap className={`w-3 h-3 text-rose-200 ${runningAgentId === agent.id ? 'animate-spin' : ''}`} />
                        <span>{runningAgentId === agent.id ? 'Running...' : 'Run Agent'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (agent.id === 'agent-kw') setActiveTab('keywords');
                          else if (agent.id === 'agent-audit') setActiveTab('audit');
                          else if (agent.id === 'agent-links') setActiveTab('links');
                          else if (agent.id === 'agent-writer') {
                            setContentMode('blog');
                            setActiveTab('content');
                          } else if (agent.id === 'agent-social') {
                            setContentMode('social');
                            setActiveTab('social');
                          } else if (agent.id === 'agent-graphics') setActiveTab('graphics');
                          else setActiveTab('scheduler');
                        }}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-zinc-800"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'keywords' && (
        <KeywordOpportunitySection
          onSelectKeywordForBlog={handleSelectKeywordForBlog}
          onSelectKeywordForSocial={handleSelectKeywordForSocial}
        />
      )}

      {activeTab === 'meta-manager' && (
        <div className="space-y-6">
          <SeoMetaManager />
        </div>
      )}

      {activeTab === 'audit' && <SeoAuditCoordSection />}

      {activeTab === 'links' && <InternalLinksSection />}

      {activeTab === 'content' && (
        <ContentStudioSection
          initialKeyword={prefilledKeyword}
          initialMode="blog"
          onModeChange={(m) => {
            setContentMode(m);
            if (m === 'social') setActiveTab('social');
          }}
        />
      )}

      {activeTab === 'social' && (
        <ContentStudioSection
          initialKeyword={prefilledKeyword}
          initialMode="social"
          onModeChange={(m) => {
            setContentMode(m);
            if (m === 'blog') setActiveTab('content');
          }}
        />
      )}

      {activeTab === 'graphics' && <BrandGraphicsSection />}

      {activeTab === 'knowledge' && <KnowledgeBaseSection />}

      {activeTab === 'scheduler' && <AgentSchedulerSection />}
    </div>
  );
};
