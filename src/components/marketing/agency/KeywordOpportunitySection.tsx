import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Filter,
  Download,
  Copy,
  Check,
  ArrowUpRight,
  Zap,
  Target,
  BarChart3,
  Layers,
  Plus
} from 'lucide-react';
import { KeywordOpportunity, SearchIntent } from './types';
import { SEED_KEYWORDS } from './mockData';

interface KeywordOpportunitySectionProps {
  onSelectKeywordForBlog?: (keyword: string) => void;
  onSelectKeywordForSocial?: (keyword: string) => void;
}

export const KeywordOpportunitySection: React.FC<KeywordOpportunitySectionProps> = ({
  onSelectKeywordForBlog,
  onSelectKeywordForSocial
}) => {
  const [keywords, setKeywords] = useState<KeywordOpportunity[]>(SEED_KEYWORDS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIntent, setSelectedIntent] = useState<SearchIntent | 'All'>('All');
  const [selectedCluster, setSelectedCluster] = useState<string>('All');
  const [newSeedQuery, setNewSeedQuery] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique clusters
  const clusters = ['All', ...Array.from(new Set(keywords.map(k => k.cluster)))];

  const filteredKeywords = keywords.filter(item => {
    const matchesSearch = item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.cluster.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIntent = selectedIntent === 'All' || item.intent === selectedIntent;
    const matchesCluster = selectedCluster === 'All' || item.cluster === selectedCluster;
    return matchesSearch && matchesIntent && matchesCluster;
  });

  const totalVolume = keywords.reduce((acc, curr) => acc + curr.searchVolume, 0);
  const avgDifficulty = Math.round(keywords.reduce((acc, curr) => acc + curr.difficulty, 0) / keywords.length);
  const totalPotentialTraffic = keywords.reduce((acc, curr) => acc + curr.potentialTraffic, 0);

  const handleCopyKeyword = (kw: KeywordOpportunity) => {
    navigator.clipboard.writeText(kw.keyword);
    setCopiedId(kw.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = 'Keyword,Search Volume,Difficulty,Intent,CPC (USD),SERP Score,Cluster,Potential Traffic\n';
    const rows = filteredKeywords.map(k => 
      `"${k.keyword}",${k.searchVolume},${k.difficulty},"${k.intent}",$${k.cpc.toFixed(2)},${k.serpScore},"${k.cluster}",${k.potentialTraffic}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `viceintel_keyword_opportunities_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDiscoverNewKeywords = async () => {
    if (!newSeedQuery.trim()) return;
    setIsDiscovering(true);

    try {
      // Call backend API if available
      const response = await fetch('/api/marketing/keywords/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newSeedQuery })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.keywords && Array.isArray(data.keywords)) {
          setKeywords(prev => [...data.keywords, ...prev]);
          setNewSeedQuery('');
          setIsDiscovering(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API error, using local generator fallback:', err);
    }

    // Fallback simulation generator
    setTimeout(() => {
      const generated: KeywordOpportunity[] = [
        {
          id: `kw-${Date.now()}-1`,
          keyword: `${newSeedQuery.toLowerCase().trim()} secret location guide`,
          searchVolume: Math.floor(Math.random() * 45000) + 15000,
          difficulty: Math.floor(Math.random() * 35) + 20,
          intent: 'Informational',
          cpc: 2.15,
          serpScore: 89,
          cluster: 'Exploration & Strategy',
          priority: 'High',
          potentialTraffic: 14500,
          notes: 'High intent discovery keyword.'
        },
        {
          id: `kw-${Date.now()}-2`,
          keyword: `best ${newSeedQuery.toLowerCase().trim()} setup 2026`,
          searchVolume: Math.floor(Math.random() * 30000) + 8000,
          difficulty: Math.floor(Math.random() * 25) + 15,
          intent: 'Transactional',
          cpc: 3.80,
          serpScore: 93,
          cluster: 'Vehicle Physics & Tuning',
          priority: 'High',
          potentialTraffic: 18200,
          notes: 'High conversion commercial keyword.'
        },
        {
          id: `kw-${Date.now()}-3`,
          keyword: `${newSeedQuery.toLowerCase().trim()} vs pegassi tempesta comparison`,
          searchVolume: Math.floor(Math.random() * 20000) + 5000,
          difficulty: Math.floor(Math.random() * 30) + 18,
          intent: 'Commercial',
          cpc: 2.90,
          serpScore: 84,
          cluster: 'Comparison Matrix',
          priority: 'Medium',
          potentialTraffic: 9400,
          notes: 'Comparison matrix target.'
        }
      ];

      setKeywords(prev => [...generated, ...prev]);
      setNewSeedQuery('');
      setIsDiscovering(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4.5 shadow-lg backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Total Search Volume</span>
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalVolume.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-400">/ mo</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Aggregated target SERP volume</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4.5 shadow-lg backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Average Difficulty</span>
            <BarChart3 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-300 font-mono">{avgDifficulty}</span>
            <span className="text-xs font-bold text-zinc-400">/ 100</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Medium competition niche target</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4.5 shadow-lg backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Potential Monthly Traffic</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300 font-mono">~{totalPotentialTraffic.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-400">Visits</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Top-3 SERP rank capture estimate</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4.5 shadow-lg backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-bold">Indexed Clusters</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">{clusters.length - 1}</span>
            <span className="text-xs font-bold text-zinc-400">Categories</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Semantic topical authority map</p>
        </div>
      </div>

      {/* AI Discovery Input Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
            <input
              type="text"
              value={newSeedQuery}
              onChange={(e) => setNewSeedQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDiscoverNewKeywords()}
              placeholder="Enter seed topic (e.g. 'Ocean Drive Supercars', 'FiveM Roleplay Server Whitelists', 'Everglades Secret Weapons')..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 focus:border-rose-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition shadow-inner font-medium"
            />
          </div>
          <button
            onClick={handleDiscoverNewKeywords}
            disabled={isDiscovering || !newSeedQuery.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer shrink-0"
          >
            <Zap className={`w-3.5 h-3.5 text-rose-200 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span>{isDiscovering ? 'Analyzing SERP Opportunities...' : '⚡ Discover Keywords with AI'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Action Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter keywords or clusters..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          {/* Intent Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(['All', 'Informational', 'Commercial', 'Transactional'] as const).map(intent => (
              <button
                key={intent}
                onClick={() => setSelectedIntent(intent)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedIntent === intent
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>

          {/* Cluster Filter */}
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            {clusters.map(cluster => (
              <option key={cluster} value={cluster}>
                Cluster: {cluster}
              </option>
            ))}
          </select>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Keywords Table Matrix */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4 font-bold">Keyword Target</th>
                <th className="py-3.5 px-3 font-bold">Search Volume</th>
                <th className="py-3.5 px-3 font-bold">Difficulty</th>
                <th className="py-3.5 px-3 font-bold">Intent</th>
                <th className="py-3.5 px-3 font-bold">Est. CPC</th>
                <th className="py-3.5 px-3 font-bold">Cluster</th>
                <th className="py-3.5 px-4 font-bold text-right">Quick AI Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs">
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-zinc-300">No matching keyword opportunities found.</p>
                    <p className="text-xs text-zinc-400 mt-1">Try broadening your search term or discover new targets with the AI search bar above.</p>
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((item) => {
                  const getDifficultyColor = (diff: number) => {
                    if (diff < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                    if (diff < 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                  };

                  const getIntentBadge = (intent: SearchIntent) => {
                    switch (intent) {
                      case 'Informational':
                        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
                      case 'Commercial':
                        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
                      case 'Transactional':
                        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                      case 'Navigational':
                        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                    }
                  };

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors group">
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyKeyword(item)}
                            className="text-zinc-400 hover:text-rose-400 transition cursor-pointer p-1 rounded hover:bg-zinc-800"
                            title="Copy keyword"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-bold text-zinc-100 group-hover:text-rose-300 transition-colors">
                            {item.keyword}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-zinc-300">
                        {item.searchVolume.toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${getDifficultyColor(item.difficulty)}`}>
                            {item.difficulty}
                          </span>
                          <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                item.difficulty < 30 ? 'bg-emerald-500' : item.difficulty < 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.difficulty}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getIntentBadge(item.intent)}`}>
                          {item.intent}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-zinc-300 font-bold">
                        ${item.cpc.toFixed(2)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 rounded text-[10px] font-medium">
                          {item.cluster}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectKeywordForBlog && (
                            <button
                              onClick={() => onSelectKeywordForBlog(item.keyword)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Generate SEO Blog Post with this keyword"
                            >
                              <Sparkles className="w-3 h-3 text-rose-400" />
                              <span>Draft Blog</span>
                            </button>
                          )}
                          {onSelectKeywordForSocial && (
                            <button
                              onClick={() => onSelectKeywordForSocial(item.keyword)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Generate Social Campaign with this keyword"
                            >
                              <TrendingUp className="w-3 h-3 text-cyan-400" />
                              <span>Social Post</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
