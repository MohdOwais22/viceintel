import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Zap,
  Activity,
  Binary,
  ShieldCheck,
  BarChart3,
  Clock,
  Terminal,
  Database,
  Sliders
} from 'lucide-react';
import { globalGamerTagEngine } from '../../lib/bloomFilterGamerTagEngine';
import { checkGamerTagUniqueness, searchGamerTags } from '../../lib/gamertagUtils';

export const BloomFilterTelemetryCms: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [testHandle, setTestHandle] = useState('Tommy_Vercetti');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState('Vice');
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [benchmarkRuns, setBenchmarkRuns] = useState<Array<{ name: string; latency: number; level: string }>>([]);

  const refreshStats = () => {
    const localStats = globalGamerTagEngine.getDiagnostics();
    setStats(localStats);
  };

  useEffect(() => {
    refreshStats();
    handleSearchPrefix(prefixSearch);
  }, []);

  const handleTestLookup = async () => {
    if (!testHandle.trim()) return;
    setIsTesting(true);
    const start = performance.now();
    const result = await checkGamerTagUniqueness(testHandle);
    const elapsed = performance.now() - start;

    setTestResult({
      ...result,
      measuredElapsedMs: Number(elapsed.toFixed(3)),
      timestamp: new Date().toLocaleTimeString()
    });

    setBenchmarkRuns((prev) => [
      {
        name: testHandle,
        latency: Number(elapsed.toFixed(3)),
        level: result.level || 'L1_BLOOM'
      },
      ...prev.slice(0, 7)
    ]);

    setIsTesting(false);
    refreshStats();
  };

  const handleSearchPrefix = (val: string) => {
    setPrefixSearch(val);
    if (!val.trim()) {
      setAutocompleteResults([]);
      return;
    }
    const matches = searchGamerTags(val, 8);
    setAutocompleteResults(matches);
  };

  return (
    <div id="bloom-filter-telemetry-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                <Binary className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">
                Meta-Grade GamerTag Bloom Filter & Radix Trie Engine
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Real-time probabilistic set membership engine using <span className="text-rose-400 font-mono font-bold">Kirsch-Mitzenmacher Double-Hashing (MurmurHash3 + FNV-1a)</span> and <span className="text-cyan-400 font-mono font-bold">Compressed Patricia Radix Trie</span> for sub-millisecond $O(1)$ uniqueness verification with zero false negatives.
            </p>
          </div>

          <button
            onClick={refreshStats}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Primary Mathematical KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bit Array Capacity</span>
            <Database className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.bloom?.capacity?.toLocaleString() || '200,000'}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Max GamerTag Sizing Target
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Allocated Bitset</span>
            <Binary className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {stats?.bloom?.bitSize?.toLocaleString() || '2,875,518'} bits
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {stats?.bloom?.bitsAllocatedBytes ? `${(stats.bloom.bitsAllocatedBytes / 1024).toFixed(1)} KB RAM` : '359 KB RAM'}
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hash Functions (k)</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            k = {stats?.bloom?.hashCount || '10'}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            Murmur3 + i * FNV-1a
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">False Positive Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            p ≤ 0.1%
          </div>
          <div className="text-[10px] text-emerald-500/80 font-mono font-bold">
            0.0% False Negatives Guaranteed
          </div>
        </div>
      </div>

      {/* Interactive Live Benchmark & Search Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Uniqueness Verification Benchmark */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Interactive $O(1)$ Uniqueness Benchmark
              </h3>
            </div>
            <span className="text-[10px] bg-rose-950/80 border border-rose-800/40 text-rose-300 font-mono px-2 py-0.5 rounded-full">
              L1 Bloom Filter
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 block">
              Test GamerTag Handle
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-xs">@</span>
                <input
                  type="text"
                  value={testHandle}
                  onChange={(e) => setTestHandle(e.target.value.replace(/\s+/g, '_'))}
                  placeholder="Enter handle..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>
              <button
                onClick={handleTestLookup}
                disabled={isTesting}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Verify
              </button>
            </div>
          </div>

          {/* Test Result Card */}
          {testResult && (
            <div className={`p-4 rounded-xl border ${testResult.isUnique ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-rose-950/30 border-rose-800/50'} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResult.isUnique ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className={`text-xs font-bold font-mono ${testResult.isUnique ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {testResult.isUnique ? 'AVAILABLE & UNIQUE' : 'TAKEN / COLLISION DETECTED'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {testResult.measuredElapsedMs}ms elapsed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-zinc-500 block text-[9px]">RESOLUTION TIER</span>
                  <span className="text-white font-bold">{testResult.level || 'L1_BLOOM'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">TIME COMPLEXITY</span>
                  <span className="text-cyan-400 font-bold">{testResult.level === 'L1_BLOOM' ? 'O(1)' : 'O(L)'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">VERIFIED AT</span>
                  <span className="text-zinc-300">{testResult.timestamp}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Benchmark Runs Feed */}
          {benchmarkRuns.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Recent Verification Runs
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {benchmarkRuns.map((run, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-xs font-mono">
                    <span className="text-zinc-300">@{run.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{run.level}</span>
                      <span className="text-[10px] text-rose-400 font-bold">{run.latency}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Radix Trie Autocomplete & Search Visualizer */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Radix Trie Prefix Autocomplete ($O(L)$)
              </h3>
            </div>
            <span className="text-[10px] bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono px-2 py-0.5 rounded-full">
              L2 Radix Trie
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 block">
              Prefix Search Query
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={prefixSearch}
                onChange={(e) => handleSearchPrefix(e.target.value)}
                placeholder="Search prefix (e.g. Vice, Lucia, Jason)..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Autocomplete Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>MATCHED HANDLES IN TRIE</span>
              <span>{autocompleteResults.length} matches</span>
            </div>

            {autocompleteResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {autocompleteResults.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-200 font-bold truncate">@{match}</span>
                    <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/30">
                      Trie Match
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 font-mono">
                No active handles matching prefix &ldquo;{prefixSearch}&rdquo; in local Trie index
              </div>
            )}
          </div>

          {/* Architecture Tier Explainer */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5 text-[11px] text-zinc-400">
            <div className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-rose-400" /> Tiered Resolution Architecture:
            </div>
            <ul className="space-y-1 pl-4 list-disc text-zinc-400 font-mono text-[10px]">
              <li><strong className="text-rose-300">L1 Bloom:</strong> $O(1)$ bits check in &lt;0.05ms (Zero False Negatives)</li>
              <li><strong className="text-cyan-300">L2 Trie:</strong> $O(L)$ exact handle resolution &amp; prefix matching</li>
              <li><strong className="text-emerald-300">L3 Firestore:</strong> Background replication to persistent store</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
