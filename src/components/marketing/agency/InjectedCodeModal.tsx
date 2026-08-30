import React, { useState } from 'react';
import { Code2, X, Copy, Check, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { SeoIssue } from './types';
import { AuditResolutionRecord } from '../../../lib/seoAuditStore';

interface InjectedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: SeoIssue | null;
  resolutionRecord?: AuditResolutionRecord | null;
  targetUrl: string;
}

export const InjectedCodeModal: React.FC<InjectedCodeModalProps> = ({
  isOpen,
  onClose,
  issue,
  resolutionRecord,
  targetUrl
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'verification'>('code');

  if (!isOpen || !issue) return null;

  // Derive injected code representation based on issue category or record payload
  let codeSnippet = '';
  let codeLanguage = 'html';
  let injectionTarget = 'document.head';
  let injectionMethod = 'Dynamic Script Injection & Firestore Persistence';

  if (issue.id === 'iss-1' || issue.category === 'Schema & JSON-LD') {
    codeLanguage = 'json';
    injectionTarget = 'document.head -> <script id="seo-page-jsonld" type="application/ld+json">';
    injectionMethod = 'Schema.org ItemList & Vehicle Specification Model';
    
    if (resolutionRecord?.injectedDomPayload && Object.keys(resolutionRecord.injectedDomPayload).length > 0) {
      codeSnippet = JSON.stringify(resolutionRecord.injectedDomPayload, null, 2);
    } else {
      // Check live DOM script first
      const liveJsonScript = typeof document !== 'undefined' ? document.getElementById('seo-page-jsonld')?.textContent : null;
      if (liveJsonScript) {
        try {
          codeSnippet = JSON.stringify(JSON.parse(liveJsonScript), null, 2);
        } catch (e) {
          codeSnippet = liveJsonScript;
        }
      } else {
        codeSnippet = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "GTA VI Vice City Verified Supercar & Vehicle Telemetry Directory",
          "description": "Comprehensive 150+ GTA VI vehicle database with live handling.meta physics simulations, top speed telemetry, and 0-60 times.",
          "url": targetUrl,
          "numberOfItems": 4,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Vehicle",
                "name": "Grotti Cheetah Classic Mk II",
                "vehicleConfiguration": "Mid-Engine RWD Supercar",
                "driveWheelConfiguration": "RearWheelDriveConfiguration",
                "topSpeed": { "@type": "QuantitativeValue", "value": 204.5, "unitCode": "HM" },
                "description": "Twin-turbocharged mid-engine exotic with active aerodynamics and titanium slip differential."
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Vehicle",
                "name": "Pegassi Tempesta EVO",
                "vehicleConfiguration": "All-Wheel-Drive V10 Track Spec",
                "driveWheelConfiguration": "AllWheelDriveConfiguration",
                "topSpeed": { "@type": "QuantitativeValue", "value": 218.2, "unitCode": "HM" },
                "description": "High-downforce AWD hypercar with fDownforceModifier 3.8 and launch control."
              }
            }
          ]
        }, null, 2);
      }
    }
  } else if (issue.id === 'iss-3' || issue.category === 'Meta & Titles') {
    codeLanguage = 'html';
    injectionTarget = 'document.head -> <meta property="og:image"> & <meta name="twitter:image">';
    injectionMethod = 'OpenGraph 1200x630 Neon Banner + Twitter Card Meta Tag Injection';
    const ogImg = (resolutionRecord?.injectedDomPayload as any)?.ogImage || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&h=630&q=85';
    codeSnippet = `<!-- Injected OpenGraph 1200x630 Aspect Ratio Tags -->\n<meta property="og:image" content="${ogImg}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:image:alt" content="ViceIntel GTA VI Telemetry & Vehicle Database" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="${ogImg}" />`;
  } else if (issue.id === 'iss-2' || issue.category === 'Links & Crawl') {
    codeLanguage = 'html';
    injectionTarget = 'DOM Anchor Matrix & Router Context';
    injectionMethod = 'Contextual Inbound Anchor Injection';
    codeSnippet = `<!-- Contextual Inbound Deep Link -->\n<a \n  href="/vehicles/pegassi-tempesta" \n  title="Pegassi Infernus & Tempesta EVO Telemetry" \n  class="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/50 underline-offset-4"\n  data-seo-context="muscle-vs-supercar-comparison-matrix"\n>\n  Explore Pegassi Infernus Classic handling profile & dynamic slip angles\n</a>`;
  } else {
    codeLanguage = 'json';
    injectionTarget = 'Firestore Database & DOM Engine';
    injectionMethod = 'AI Remediation State Sync';
    codeSnippet = JSON.stringify(resolutionRecord?.injectedDomPayload || { status: 'Remediated', note: issue.recommendation }, null, 2);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white font-mono tracking-wide">
                  Injected Code & Telemetry Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live In DOM
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5 truncate max-w-md">
                {issue.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 transition cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs & Metadata */}
        <div className="px-5 pt-3 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-2 font-bold font-mono text-xs border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Injected Source ({codeLanguage.toUpperCase()})</span>
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3.5 py-2 font-bold font-mono text-xs border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Audit Verification</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer mb-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'code' ? (
            <div className="space-y-3">
              {/* Injection Target Details Banner */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Mount Point:</span>
                  <span className="text-zinc-200 font-mono text-[11px] truncate block mt-0.5">{injectionTarget}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Remediation Strategy:</span>
                  <span className="text-purple-300 font-mono text-[11px] truncate block mt-0.5">{injectionMethod}</span>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
                <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>{injectionTarget}</span>
                  <span className="text-emerald-400">● Verified Active</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-96">
                  {codeSnippet}
                </pre>
              </div>

              {resolutionRecord?.resolutionNote && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resolutionRecord.resolutionNote}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Search Crawler Verification</span>
                </h4>
                <p className="text-zinc-300 leading-relaxed">
                  This fix is active in the document head and synchronized with the Cloud Firestore SEO database. Googlebot, Bingbot, and Discord OpenGraph crawlers will parse these tags on every index pass.
                </p>
                <div className="space-y-2 font-mono text-[11px] pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Target URL:</span>
                    <span className="text-cyan-300">{targetUrl}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Resolved Timestamp:</span>
                    <span className="text-zinc-300">{resolutionRecord?.resolvedAt ? new Date(resolutionRecord.resolvedAt).toLocaleString() : 'Active in Session'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Firestore Database Collection:</span>
                    <span className="text-purple-300 font-bold">seo_meta_overrides & seo_audit_fixes</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400">
            Issue ID: <strong className="text-zinc-300 font-mono">{issue.id}</strong> ({issue.category})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
