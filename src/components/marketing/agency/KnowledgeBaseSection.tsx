import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Trash2,
  CheckCircle2,
  Upload,
  Layers,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import { KnowledgeDoc } from './types';
import { SEED_KNOWLEDGE_DOCS } from './mockData';

export const KnowledgeBaseSection: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(SEED_KNOWLEDGE_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc>(SEED_KNOWLEDGE_DOCS[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<KnowledgeDoc['category']>('Platform Features');
  const [newContent, setNewContent] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('GTA VI, Strategy, Telemetry');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalTokens = docs.reduce((acc, curr) => acc + curr.tokenCount, 0);

  const handleSaveNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const docItem: KnowledgeDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      content: newContent,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      tokenCount: Math.round(newContent.length / 4),
      updatedAt: new Date().toISOString().slice(0, 10),
      author: 'Administrator'
    };

    setDocs(prev => [docItem, ...prev]);
    setSelectedDoc(docItem);
    setIsAddingNew(false);
    setNewTitle('');
    setNewContent('');
    setNotice('📚 Knowledge Base Document indexed and grounded into RAG context!');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedDoc.id === id && docs.length > 1) {
      setSelectedDoc(docs.find(d => d.id !== id) || docs[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Indexed Documents</span>
            <BookOpen className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{docs.length}</span>
            <span className="text-xs font-bold text-emerald-400">Grounded</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Direct context injection into AI agents</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Total Token Footprint</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">{totalTokens.toLocaleString()}</span>
            <span className="text-xs font-bold text-zinc-400">Tokens</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">High-density contextual grounding</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Context Relevance</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300 font-mono">99.8%</span>
            <span className="text-xs font-bold text-emerald-400">Exact Match</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Zero hallucinations on GTA VI physics</p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge documents or tags..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Document</span>
        </button>
      </div>

      {/* Add Document Modal/Card */}
      {isAddingNew && (
        <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-400" />
              <span>Upload / Ground Knowledge Base Document</span>
            </h4>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveNewDoc} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pegassi Tempesta Aero Physics Spec"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Game Lore & City">Game Lore & City</option>
                  <option value="Vehicle Tuning">Vehicle Tuning</option>
                  <option value="RP Server Standards">RP Server Standards</option>
                  <option value="Platform Features">Platform Features</option>
                  <option value="Brand Voice">Brand Voice</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Tags (comma separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Physics, Downforce, Ocean Drive, Telemetry"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Document Content / Knowledge Text</label>
              <textarea
                rows={6}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste reference text, telemetry formulas, or lore guidelines here..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Index & Save Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 px-1">
            Knowledge Docs ({filteredDocs.length})
          </h4>
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocs.map(docItem => (
              <div
                key={docItem.id}
                onClick={() => setSelectedDoc(docItem)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedDoc.id === docItem.id
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-md'
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">{docItem.category}</span>
                  <span>{docItem.tokenCount} tokens</span>
                </div>
                <h5 className="text-xs font-bold text-zinc-100 line-clamp-2">{docItem.title}</h5>
                <div className="flex items-center gap-1 flex-wrap mt-2">
                  {docItem.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Document Details */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-zinc-800 pb-4 flex items-start justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                {selectedDoc.category}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">{selectedDoc.title}</h3>
              <p className="text-xs text-zinc-400 font-mono">
                Last updated {selectedDoc.updatedAt} by {selectedDoc.author} • {selectedDoc.tokenCount} tokens
              </p>
            </div>

            <button
              onClick={() => handleDeleteDoc(selectedDoc.id)}
              className="p-2 bg-zinc-800 hover:bg-rose-600/30 text-zinc-400 hover:text-rose-300 rounded-xl text-xs transition cursor-pointer border border-zinc-700"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Grounded Reference Content
            </h4>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[420px] overflow-y-auto">
              {selectedDoc.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
