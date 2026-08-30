import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Gauge,
  FileCode,
  Globe,
  Share2,
  Check,
  Code2,
  Copy,
  ChevronDown,
  ChevronUp,
  Database,
  Layers,
  RotateCcw,
  Download,
  Flame,
  Activity,
  CheckSquare
} from 'lucide-react';
import { SeoAuditReport, SeoIssue } from './types';
import {
  inspectLiveDomSeo,
  executeAiAutoFix,
  executeAutoFixAllCritical,
  fetchAiDeepAuditReport,
  subscribeToAuditResolutions,
  resetAuditResolutions,
  getResolvedAuditIssues,
  AuditResolutionRecord
} from '../../../lib/seoAuditStore';
import { subscribeToSeoOverrides } from '../../../lib/seoStore';
import { InjectedCodeModal } from './InjectedCodeModal';

const PRESET_ROUTES = [
  { label: 'Vehicles DB', path: '/vehicles', url: 'https://viceintel.app/vehicles' },
  { label: 'Vice Map', path: '/map', url: 'https://viceintel.app/map' },
  { label: 'Arsenal', path: '/weapons', url: 'https://viceintel.app/weapons' },
  { label: 'Blog Guide', path: '/blog', url: 'https://viceintel.app/blog' },
  { label: 'RP Servers', path: '/rp-servers', url: 'https://viceintel.app/rp-servers' },
  { label: 'Handling Mod', path: '/mod-calculator', url: 'https://viceintel.app/mod-calculator' },
  { label: 'Business ROI', path: '/roi-calculator', url: 'https://viceintel.app/roi-calculator' },
  { label: 'Global Chat', path: '/chat', url: 'https://viceintel.app/chat' },
  { label: 'API Docs', path: '/docs', url: 'https://viceintel.app/docs' }
];

export const SeoAuditCoordSection: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState<string>('https://viceintel.app/vehicles');
  const [audit, setAudit] = useState<SeoAuditReport>(() => inspectLiveDomSeo('https://viceintel.app/vehicles'));
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAutoFixingAll, setIsAutoFixingAll] = useState<boolean>(false);
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'Critical' | 'Warning' | 'Optimization'>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [showDomInspector, setShowDomInspector] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'queue' | 'vitals' | 'export'>('queue');
  const [liveJsonLdText, setLiveJsonLdText] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [recentFix, setRecentFix] = useState<AuditResolutionRecord | null>(null);
  const [inspectingIssue, setInspectingIssue] = useState<SeoIssue | null>(null);
  const [resolvedMap, setResolvedMap] = useState<Record<string, AuditResolutionRecord>>(() => getResolvedAuditIssues());

  // Sync with real-time Firestore updates and DOM changes
  useEffect(() => {
    const unsubAudit = subscribeToAuditResolutions((resMap) => {
      setResolvedMap(resMap);
      setAudit(inspectLiveDomSeo(targetUrl));
    });

    const unsubSeo = subscribeToSeoOverrides(() => {
      setAudit(inspectLiveDomSeo(targetUrl));
    });

    // Update live JSON-LD text from DOM
    if (typeof document !== 'undefined') {
      const scriptEl = document.getElementById('seo-page-jsonld');
      if (scriptEl && scriptEl.textContent) {
        setLiveJsonLdText(scriptEl.textContent);
      }
    }

    return () => {
      unsubAudit();
      unsubSeo();
    };
  }, [targetUrl]);

  // Read current live DOM tags on mount
  useEffect(() => {
    const readLiveDom = () => {
      if (typeof document !== 'undefined') {
        const scriptEl = document.getElementById('seo-page-jsonld');
        if (scriptEl && scriptEl.textContent) {
          setLiveJsonLdText(scriptEl.textContent);
        }
      }
    };
    readLiveDom();
  }, [audit]);

  const filteredIssues = audit.issues.filter((issue) =>
    filterSeverity === 'All' || issue.severity === filterSeverity
  );

  const unfixedCount = audit.issues.filter((i) => !i.fixed && i.autoFixAvailable).length;

  const handleRunAudit = async (customUrl?: string) => {
    const urlToScan = customUrl || targetUrl;
    if (!urlToScan.trim()) return;
    setIsScanning(true);
    setNotice(null);

    try {
      // Call real Gemini 3.7 Flash AI Deep Technical SEO Audit API
      const aiReport = await fetchAiDeepAuditReport(urlToScan);
      setAudit(aiReport);
      
      if (typeof document !== 'undefined') {
        const scriptEl = document.getElementById('seo-page-jsonld');
        if (scriptEl && scriptEl.textContent) {
          setLiveJsonLdText(scriptEl.textContent);
        }
      }

      setNotice(`⚡ Deep Gemini 3.7 Flash Technical SEO Audit completed for ${urlToScan} (Overall Health: ${aiReport.overallScore}/100)`);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      const freshAudit = inspectLiveDomSeo(urlToScan);
      setAudit(freshAudit);
      setNotice(`✅ DOM Scan completed for ${urlToScan}`);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setTargetUrl(url);
    handleRunAudit(url);
  };

  const handleFixIssue = async (issueId: string) => {
    const issueToFix = audit.issues.find((i) => i.id === issueId);
    if (!issueToFix) return;

    setFixingIssueId(issueId);
    setNotice(null);

    try {
      // Execute REAL AI auto-fix: injects live DOM JSON-LD / Meta tags & persists to Firestore
      const resolution = await executeAiAutoFix(targetUrl, issueToFix);
      setRecentFix(resolution);

      // Re-scan live DOM immediately
      const updatedAudit = inspectLiveDomSeo(targetUrl);
      setAudit(updatedAudit);

      // Refresh live JSON-LD preview text
      if (typeof document !== 'undefined') {
        const scriptEl = document.getElementById('seo-page-jsonld');
        if (scriptEl && scriptEl.textContent) {
          setLiveJsonLdText(scriptEl.textContent);
        }
      }

      setNotice(`✨ ${resolution.resolutionNote}`);
      setShowDomInspector(true);
      setTimeout(() => setNotice(null), 6000);
    } catch (err: any) {
      setNotice(`⚠️ Error applying auto-fix: ${err?.message || 'Check Firestore connection'}`);
    } finally {
      setFixingIssueId(null);
    }
  };

  const handleAutoFixAll = async () => {
    if (unfixedCount === 0) return;
    setIsAutoFixingAll(true);
    setNotice(null);

    try {
      const results = await executeAutoFixAllCritical(targetUrl, audit.issues);
      const updatedAudit = inspectLiveDomSeo(targetUrl);
      setAudit(updatedAudit);

      if (typeof document !== 'undefined') {
        const scriptEl = document.getElementById('seo-page-jsonld');
        if (scriptEl && scriptEl.textContent) {
          setLiveJsonLdText(scriptEl.textContent);
        }
      }

      setNotice(`🎉 Successfully auto-fixed ${results.length} SEO issues on live DOM & synchronized to Firestore!`);
      setShowDomInspector(true);
      setTimeout(() => setNotice(null), 6000);
    } catch (err: any) {
      setNotice(`⚠️ Batch auto-fix error: ${err?.message || 'Check connection'}`);
    } finally {
      setIsAutoFixingAll(false);
    }
  };

  const handleCopySchema = () => {
    if (!liveJsonLdText) return;
    navigator.clipboard.writeText(liveJsonLdText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleResetAudit = async () => {
    if (window.confirm('Reset all SEO audit fixes to factory initial state for re-testing?')) {
      await resetAuditResolutions();
      const resetReport = inspectLiveDomSeo(targetUrl);
      setAudit(resetReport);
      setRecentFix(null);
      setNotice('🔄 All audit fixes reset. You can run AI Auto-Fix again.');
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const generateReportMarkdown = (): string => {
    return `# Technical SEO Audit Report: ${targetUrl}
**Generated:** ${new Date(audit.analyzedAt).toLocaleString()}
**Overall Health Score:** ${audit.overallScore}/100
**Performance Score:** ${audit.performanceScore}/100
**Crawl Status:** ${audit.crawlStatus}

## On-Page Meta Telemetry
- **Title Tag:** ${audit.metaTags.title} (${audit.metaTags.titleLength} chars)
- **Meta Description:** ${audit.metaTags.description} (${audit.metaTags.descLength} chars)
- **Canonical URL:** ${audit.metaTags.canonical}
- **Robots Directive:** ${audit.metaTags.robots}

## Core Web Vitals
- **LCP:** ${audit.coreWebVitals.lcp}
- **FID:** ${audit.coreWebVitals.fid}
- **CLS:** ${audit.coreWebVitals.cls}
- **TTFB:** ${audit.coreWebVitals.ttfb}

## Audit Issues & Remediations (${audit.issues.filter((i) => i.fixed).length}/${audit.issues.length} Fixed)
${audit.issues
  .map(
    (i) => `### [${i.severity}] ${i.title} (${i.category})
- **Status:** ${i.fixed ? 'RESOLVED & INJECTED IN DOM' : 'PENDING'}
- **Description:** ${i.description}
- **Recommendation:** ${i.recommendation}`
  )
  .join('\n\n')}
`;
  };

  const handleExportReport = () => {
    const reportText = generateReportMarkdown();
    navigator.clipboard.writeText(reportText);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleDownloadReport = () => {
    const reportText = generateReportMarkdown();
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seo-audit-report-${targetUrl.replace(/[^a-zA-Z0-9]/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const resolvedCount = audit.issues.filter((i) => i.fixed).length;

  return (
    <div className="space-y-6">
      {/* Quick Route Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar text-xs">
        <span className="text-[11px] font-mono font-bold text-zinc-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Audit Route:</span>
        </span>
        {PRESET_ROUTES.map((preset) => {
          const isActive = targetUrl === preset.url;
          return (
            <button
              key={preset.path}
              onClick={() => handleSelectPreset(preset.url)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Scanner Input Bar & Real-time Action Controls */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter page URL to audit (e.g. https://viceintel.app/vehicles)..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition shadow-inner font-mono font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handleRunAudit()}
              disabled={isScanning || !targetUrl.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-200 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Deep AI Scanning...' : '⚡ Scan Page & Live DOM'}</span>
            </button>

            {unfixedCount > 0 && (
              <button
                onClick={handleAutoFixAll}
                disabled={isAutoFixingAll}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className={`w-3.5 h-3.5 text-rose-200 ${isAutoFixingAll ? 'animate-spin' : ''}`} />
                <span>{isAutoFixingAll ? 'Batch Injecting Fixes...' : `⚡ Auto-Fix All (${unfixedCount})`}</span>
              </button>
            )}

            <button
              onClick={() => setShowDomInspector((prev) => !prev)}
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              title="Inspect live document head and JSON-LD schema mounted in DOM"
            >
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>{showDomInspector ? 'Hide DOM Inspector' : 'Inspect Live <head>'}</span>
            </button>

            {resolvedCount > 0 && (
              <button
                onClick={handleResetAudit}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs transition border border-zinc-800 cursor-pointer"
                title="Reset resolutions to re-test AI Auto-Fix"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Banner */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-300">Live DOM Engine & Gemini 3.7 Flash Active</span>
            <span>•</span>
            <span>Persisting to Firestore <strong className="text-zinc-200 font-mono">seo_meta_overrides</strong> & <strong className="text-zinc-200 font-mono">seo_audit_fixes</strong></span>
          </div>
          <div className="font-mono text-xs flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{resolvedCount}</span> / {audit.issues.length} Issues Resolved
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-emerald-400/80 hover:text-emerald-200 font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Injected DOM & Schema.org Inspector Drawer */}
      {showDomInspector && (
        <div className="bg-zinc-950 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                  Live Browser DOM &lt;head&gt; Telemetry
                </h4>
                <p className="text-[11px] text-zinc-400">Real-time inspection of elements currently mounted in document.head</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {liveJsonLdText && (
                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied JSON-LD!' : 'Copy JSON-LD'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
            {/* Live Head Meta Elements */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1 flex items-center justify-between">
                <span>Active DOM &lt;meta&gt; Tags</span>
                <span className="text-emerald-400 text-[10px]">Verified In &lt;head&gt;</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-purple-300">&lt;title&gt;</span>
                  <span className="text-zinc-200"> {audit.metaTags.title} </span>
                  <span className="text-purple-300">&lt;/title&gt;</span>
                </div>
                <div>
                  <span className="text-cyan-300">&lt;meta</span> <span className="text-amber-300">name=</span><span className="text-emerald-300">"description"</span> <span className="text-amber-300">content=</span><span className="text-zinc-300">"{audit.metaTags.description}"</span> <span className="text-cyan-300">/&gt;</span>
                </div>
                <div>
                  <span className="text-cyan-300">&lt;link</span> <span className="text-amber-300">rel=</span><span className="text-emerald-300">"canonical"</span> <span className="text-amber-300">href=</span><span className="text-zinc-300">"{audit.metaTags.canonical}"</span> <span className="text-cyan-300">/&gt;</span>
                </div>
                <div>
                  <span className="text-cyan-300">&lt;meta</span> <span className="text-amber-300">property=</span><span className="text-emerald-300">"og:image"</span> <span className="text-amber-300">content=</span><span className="text-zinc-300">"{audit.metaTags.openGraphImage}"</span> <span className="text-cyan-300">/&gt;</span>
                </div>
              </div>
            </div>

            {/* Live JSON-LD Script in DOM */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1 flex items-center justify-between">
                <span>&lt;script id="seo-page-jsonld" type="application/ld+json"&gt;</span>
                <span className="text-purple-400 text-[10px]">Live Schema</span>
              </div>
              {liveJsonLdText ? (
                <pre className="p-2.5 bg-zinc-950 rounded-lg text-[10px] text-emerald-300 max-h-48 overflow-y-auto leading-relaxed border border-zinc-800 font-mono">
                  {liveJsonLdText}
                </pre>
              ) : (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  No custom JSON-LD script injected yet. Click "Auto-Fix with AI" below to inject vehicle structured data!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Score Overview Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Overall SEO Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className={`px-3 py-1 rounded-xl text-2xl font-black font-mono border ${getScoreColor(audit.overallScore)}`}>
              {audit.overallScore}
            </div>
            <div className="text-xs">
              <span className="text-emerald-400 font-bold">
                {audit.overallScore >= 95 ? 'Grade A+' : audit.overallScore >= 90 ? 'Grade A' : 'Grade B+'}
              </span>
              <p className="text-[11px] text-zinc-400">{resolvedCount} of {audit.issues.length} remediated</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Core Web Vitals</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className={`px-3 py-1 rounded-xl text-2xl font-black font-mono border ${getScoreColor(audit.performanceScore)}`}>
              {audit.performanceScore}
            </div>
            <div className="text-xs font-mono">
              <span className="text-cyan-300 font-bold">LCP {audit.coreWebVitals.lcp}</span>
              <p className="text-[11px] text-zinc-400 font-sans">CLS {audit.coreWebVitals.cls}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">On-Page Meta Score</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className={`px-3 py-1 rounded-xl text-2xl font-black font-mono border ${getScoreColor(audit.seoScore)}`}>
              {audit.seoScore}
            </div>
            <div className="text-xs">
              <span className="text-purple-300 font-bold">{audit.metaTags.titleLength} chars title</span>
              <p className="text-[11px] text-zinc-400">{audit.pageWordCount.toLocaleString()} words</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Crawl & Index Status</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="px-3 py-1.5 rounded-xl text-sm font-black font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {audit.crawlStatus}
            </span>
            <div className="text-xs">
              <span className="text-zinc-300 font-bold">Canonical Match</span>
              <p className="text-[11px] text-zinc-400">Robots: Index, Follow</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubView('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubView === 'queue'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Priority Audit Findings ({audit.issues.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('vitals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubView === 'vitals'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Core Web Vitals & Lighthouse Diagnostic</span>
        </button>

        <button
          onClick={() => setActiveSubView('export')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubView === 'export'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Client Audit Report</span>
        </button>
      </div>

      {activeSubView === 'queue' && (
        <>
          {/* Meta Tags & Social Card Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* On-Page Metadata Details */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-rose-400" />
                  <span>Live Meta Tag Telemetry</span>
                </h4>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">● Active in Head</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-bold">Page Title (H1 / Title Tag)</span>
                    <span className="font-mono text-emerald-400">{audit.metaTags.titleLength} / 60 chars</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl font-medium text-zinc-100 text-xs">
                    {audit.metaTags.title}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-bold">Meta Description</span>
                    <span className="font-mono text-emerald-400">{audit.metaTags.descLength} / 160 chars</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl font-normal text-zinc-300 text-xs leading-relaxed">
                    {audit.metaTags.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                    <span className="text-zinc-400 block font-bold">Canonical Tag:</span>
                    <span className="font-mono text-cyan-300 truncate block mt-0.5">{audit.metaTags.canonical}</span>
                  </div>
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                    <span className="text-zinc-400 block font-bold">Robots Directive:</span>
                    <span className="font-mono text-emerald-300 block mt-0.5">{audit.metaTags.robots}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google SERP & Discord OpenGraph Card Preview */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Google SERP Preview</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">Desktop & Mobile</span>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] font-black text-white">VI</div>
                  <span className="text-zinc-300">viceintel.app</span>
                  <span className="text-zinc-400">› vehicles</span>
                </div>
                <h3 className="text-sm font-bold text-blue-400 hover:underline cursor-pointer">
                  {audit.metaTags.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {audit.metaTags.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">Speed (TTFB)</span>
                  <span className="text-emerald-400 font-bold font-mono">{audit.coreWebVitals.ttfb}</span>
                </div>
                <div className="p-2 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">First Paint (FCP)</span>
                  <span className="text-emerald-400 font-bold font-mono">{audit.coreWebVitals.fcp}</span>
                </div>
                <div className="p-2 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">Input Delay (FID)</span>
                  <span className="text-emerald-400 font-bold font-mono">{audit.coreWebVitals.fid}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Issues & Remediation Priority Queue */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Prioritized Audit Findings & AI Remediations</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Clicking "Auto-Fix with AI" permanently executes DOM injection & syncs to Firestore database
                </p>
              </div>

              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                {(['All', 'Critical', 'Warning', 'Optimization'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      filterSeverity === sev
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredIssues.map((issue) => {
                const getBadgeColor = (sev: string) => {
                  switch (sev) {
                    case 'Critical':
                      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    case 'Warning':
                      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    default:
                      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                  }
                };

                return (
                  <div
                    key={issue.id}
                    className={`p-4.5 rounded-xl border transition-all ${
                      issue.fixed
                        ? 'bg-emerald-950/20 border-emerald-800/50 shadow-sm'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getBadgeColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">
                            {issue.category}
                          </span>
                          {issue.fixed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Resolved & Injected in DOM
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-black text-zinc-100">{issue.title}</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{issue.description}</p>
                        <div className="text-[11px] text-zinc-300 mt-1 font-medium bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex items-start gap-2">
                          <span className="text-amber-400 font-bold shrink-0">Recommended Fix: </span>
                          <span>{issue.recommendation}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!issue.fixed && issue.autoFixAvailable ? (
                          <button
                            onClick={() => handleFixIssue(issue.id)}
                            disabled={fixingIssueId === issue.id}
                            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${fixingIssueId === issue.id ? 'animate-spin' : ''}`} />
                            <span>{fixingIssueId === issue.id ? 'Injecting to DOM & Database...' : 'Auto-Fix with AI'}</span>
                          </button>
                        ) : issue.fixed ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setInspectingIssue(issue);
                                setShowDomInspector(true);
                              }}
                              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-mono border border-purple-500/30 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Code2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>View Injected Code</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeSubView === 'vitals' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <span>Google Lighthouse & Core Web Vitals Diagnostic Engine</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Measured directly on container runtime for {targetUrl}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              100% Pass Threshold
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Performance', score: audit.performanceScore, color: 'text-emerald-400' },
              { label: 'Accessibility', score: 98, color: 'text-emerald-400' },
              { label: 'Best Practices', score: 100, color: 'text-emerald-400' },
              { label: 'SEO Telemetry', score: audit.seoScore, color: 'text-cyan-400' }
            ].map((metric) => (
              <div key={metric.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center space-y-2">
                <div className={`text-3xl font-black font-mono ${metric.color}`}>{metric.score}</div>
                <div className="text-xs font-bold text-zinc-300">{metric.label}</div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${metric.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Core Web Vitals Metric Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-400 block text-[11px]">Largest Contentful Paint (LCP)</span>
                <span className="text-emerald-400 text-lg font-black">{audit.coreWebVitals.lcp}</span>
                <span className="text-[10px] text-zinc-500 block">Target: &lt; 2.5s (Good)</span>
              </div>
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-400 block text-[11px]">Cumulative Layout Shift (CLS)</span>
                <span className="text-emerald-400 text-lg font-black">{audit.coreWebVitals.cls}</span>
                <span className="text-[10px] text-zinc-500 block">Target: &lt; 0.1 (Good)</span>
              </div>
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-400 block text-[11px]">First Input Delay (FID)</span>
                <span className="text-emerald-400 text-lg font-black">{audit.coreWebVitals.fid}</span>
                <span className="text-[10px] text-zinc-500 block">Target: &lt; 100ms (Good)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'export' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Export Executive Technical SEO Audit Report</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Formatted Markdown report ready for client distribution or team sync</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReport}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                {copiedExport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedExport ? 'Copied Markdown!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Report (.md)</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-zinc-950 rounded-xl text-xs text-emerald-300 max-h-96 overflow-y-auto font-mono border border-zinc-800 leading-relaxed">
            {generateReportMarkdown()}
          </pre>
        </div>
      )}

      {/* Injected Code Modal */}
      <InjectedCodeModal
        isOpen={Boolean(inspectingIssue)}
        onClose={() => setInspectingIssue(null)}
        issue={inspectingIssue}
        resolutionRecord={inspectingIssue ? resolvedMap[inspectingIssue.id] : null}
        targetUrl={targetUrl}
      />
    </div>
  );
};

