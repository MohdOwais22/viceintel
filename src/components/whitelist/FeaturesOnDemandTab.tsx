import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Send, 
  MessageSquare, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  ChevronRight, 
  Filter, 
  Trash2, 
  ExternalLink,
  Code2,
  Cpu,
  FileCode,
  Info
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FeatureFollowupThread } from './FeatureFollowupThread';

export interface OnDemandFeatureRequest {
  id: string;
  serverSlug: string;
  serverName: string;
  ownerUid: string;
  ownerGamerTag: string;
  ownerEmail: string;
  title: string;
  category: 'custom_script' | 'discord_bot' | 'cad_mdt_extension' | 'vehicle_physics' | 'ui_theme' | 'economy_plugin' | 'custom_integration';
  urgency: 'standard' | 'high' | 'vip_fast_track';
  budgetEstimate: string;
  specs: string;
  status: 'pending' | 'under_review' | 'in_development' | 'ready_for_testing' | 'delivered' | 'rejected';
  adminNotes?: string;
  estimatedDelivery?: string;
  quotePrice?: string;
  createdAt: string;
  updatedAt?: string;
  lastFollowupAt?: string;
  lastFollowupSender?: string;
  lastFollowupSnippet?: string;
}

interface FeaturesOnDemandTabProps {
  serverSlug: string;
  serverName?: string;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  onOpenAuth?: () => void;
}

const CATEGORIES = [
  { id: 'custom_script', label: 'Custom QBCore/ESX Lua Script', icon: Code2, desc: 'Gang territory, custom heist, or job mechanics' },
  { id: 'discord_bot', label: 'Discord Bot & Automation Module', icon: Bot, desc: 'Custom slash commands, auto-roles, or webhook logs' },
  { id: 'ui_theme', label: 'Custom HUD / NUI Web Interface', icon: Layers, desc: 'Custom server logo overlay, speedometer, or NUI menus' },
  { id: 'vehicle_physics', label: 'Vehicle Physics & Handling Tuning', icon: Cpu, desc: 'handling.meta tuning, drift balance, or top speed curves' },
  { id: 'custom_integration', label: 'Custom API & Webhook Service', icon: Zap, desc: 'Tebex store sync, live server status, or website widget' },
  { id: 'database_migration', label: 'Database & SQL Optimization', icon: Terminal, desc: 'Player data migration, SQL index tuning, or table cleanup' },
];

export const FeaturesOnDemandTab: React.FC<FeaturesOnDemandTabProps> = ({
  serverSlug,
  serverName = 'RP Server',
  currentUser,
  onOpenAuth
}) => {
  const [requests, setRequests] = useState<OnDemandFeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OnDemandFeatureRequest['category']>('custom_script');
  const [urgency, setUrgency] = useState<OnDemandFeatureRequest['urgency']>('standard');
  const [budgetEstimate, setBudgetEstimate] = useState('$75 - $175 (Custom Feature Module)');
  const [specs, setSpecs] = useState('');

  // 1. Subscribe to Firestore Feature Requests
  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, 'onDemandFeatureRequests')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: OnDemandFeatureRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as OnDemandFeatureRequest;
            // Filter by this server slug or user ownership
            if (
              data.serverSlug === serverSlug ||
              (currentUser && data.ownerUid === currentUser.uid)
            ) {
              list.push({ ...data, id: docSnap.id });
            }
          });

          // Sort by creation date desc
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore onDemandFeatureRequests listener error, falling back to local state:', error);
          // Fallback to local storage
          const localData = localStorage.getItem(`vice_features_ondemand_${serverSlug}`);
          if (localData) {
            try {
              setRequests(JSON.parse(localData));
            } catch (e) {
              setRequests([]);
            }
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore listener for feature requests:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [serverSlug, currentUser]);

  // Handle New Submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !specs.trim()) return;

    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    const newId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReq: OnDemandFeatureRequest = {
      id: newId,
      serverSlug,
      serverName,
      ownerUid: currentUser?.uid || 'guest_owner',
      ownerGamerTag: currentUser?.displayName || 'Server Owner',
      ownerEmail: currentUser?.email || '',
      title: title.trim(),
      category,
      urgency,
      budgetEstimate,
      specs: specs.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: 'Application logged in developer queue. Staff review in progress.'
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, 'onDemandFeatureRequests', newId), newReq);

      // Also cache locally
      const updatedList = [newReq, ...requests];
      localStorage.setItem(`vice_features_ondemand_${serverSlug}`, JSON.stringify(updatedList));
      setRequests(updatedList);

      setSuccessBanner(`Feature Request "${title}" submitted successfully! Developer queue synced.`);
      setTimeout(() => setSuccessBanner(null), 5000);

      // Reset form & close modal
      setTitle('');
      setSpecs('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting feature request to Firestore:', err);
      // Local fallback
      const updatedList = [newReq, ...requests];
      localStorage.setItem(`vice_features_ondemand_${serverSlug}`, JSON.stringify(updatedList));
      setRequests(updatedList);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Request
  const handleDeleteRequest = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'onDemandFeatureRequests', reqId));
    } catch (e) {
      console.warn('Firestore deletion fallback to local state:', e);
    }
    const updated = requests.filter(r => r.id !== reqId);
    setRequests(updated);
    try {
      localStorage.setItem(`vice_features_ondemand_${serverSlug}`, JSON.stringify(updated));
      localStorage.removeItem(`vice_followups_${reqId}`);
    } catch (e) {
      // ignore
    }
    setConfirmDeleteId(null);
    setSuccessBanner('Feature request cancelled and removed from queue.');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const getStatusBadge = (status: OnDemandFeatureRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Staff Review
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Under Spec Review
          </span>
        );
      case 'in_development':
        return (
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> In Active Development
          </span>
        );
      case 'ready_for_testing':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Ready for Testing
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Delivered & Live
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Request Declined / Revision
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-indigo-500/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" /> Bespoke Engineering Desk
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" /> Paid Commission Quotes
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bespoke Development & Feature Commission Desk
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">
              Need custom QBCore/ESX Lua scripts, custom vehicle handling physics, NUI interfaces, or Discord bot integrations for <strong>{serverName}</strong>? Submit technical specifications to our developer desk. We evaluate your scope, provide a formal binding quote, and deliver tested code.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition flex items-center gap-2 shrink-0 cursor-pointer border border-indigo-400/40 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-cyan-200" />
            <span>Request Development Quote</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Requests</div>
          <div className="text-2xl font-black text-white mt-1">{requests.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Pending / Review</div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {requests.filter(r => r.status === 'pending' || r.status === 'under_review').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">In Development</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">
            {requests.filter(r => r.status === 'in_development' || r.status === 'ready_for_testing').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Delivered & Live</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {requests.filter(r => r.status === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Requests Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-400 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter:
          </span>
          {['all', 'pending', 'under_review', 'in_development', 'delivered'].map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition cursor-pointer ${
                activeFilter === filterKey
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white bg-zinc-950/60'
              }`}
            >
              {filterKey === 'all' ? 'All Requests' : filterKey.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-400 font-medium">
          Real-Time Control Panel Sync Active
        </div>
      </div>

      {/* Request Applications Cards List */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <Clock className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm text-zinc-400 font-semibold">Syncing feature requests from cloud database...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Wand2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">No Development Quotes Requested Yet</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Need a custom Lua script, bot automation, or NUI interface for {serverName}? Click below to submit your technical specifications for an estimate quote.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request First Development Quote</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const catInfo = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[0];
            const IconComp = catInfo.icon;

            return (
              <div 
                key={req.id}
                className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-700">
                        <IconComp className="w-3.5 h-3.5 text-cyan-400" />
                        {catInfo.label}
                      </span>
                      {req.urgency === 'vip_fast_track' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-rose-400" /> VIP Rush (3-5 Days) • +75% Express Fee
                        </span>
                      )}
                      {req.urgency === 'high' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                          High Priority (5-7 Days) • Express
                        </span>
                      )}
                      {req.urgency === 'standard' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700">
                          Standard Pipeline (10-14 Days)
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{req.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                    {confirmDeleteId === req.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/60 px-2 py-1 rounded-xl shadow-lg animate-fadeIn">
                        <span className="text-[11px] font-bold text-rose-300 mr-1">Delete?</span>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(req.id)}
                        title="Delete Feature Request"
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Specs Box */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-sans space-y-1">
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Specifications & Scope:</div>
                  <div className="whitespace-pre-line">{req.specs}</div>
                </div>

                {/* Staff Response / Admin Feedback Sync */}
                {req.adminNotes && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Staff & Developer Notes
                      </span>
                      {req.estimatedDelivery && (
                        <span className="text-[11px] text-cyan-300 font-mono font-bold">
                          Est. Delivery: {req.estimatedDelivery}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-200 leading-relaxed">{req.adminNotes}</p>
                    {req.quotePrice && (
                      <div className="text-[11px] text-amber-300 font-bold pt-1 border-t border-indigo-500/20">
                        Price / Estimate Quote: {req.quotePrice}
                      </div>
                    )}
                  </div>
                )}

                {/* Real-time Follow-up & Admin Communication Thread */}
                <FeatureFollowupThread
                  requestId={req.id}
                  requestTitle={req.title}
                  requestOwnerUid={req.ownerUid}
                  requestOwnerGamerTag={req.ownerGamerTag}
                  serverSlug={serverSlug}
                  currentUser={currentUser}
                  onOpenAuth={onOpenAuth}
                  defaultExpanded={false}
                />

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
                  <div>
                    Requested by: <strong className="text-zinc-300">{req.ownerGamerTag}</strong> • Budget Range: <strong className="text-emerald-400">{req.budgetEstimate}</strong>
                  </div>
                  <div>
                    Submitted: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW REQUEST APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Request Custom Development Quote</h3>
                  <p className="text-xs text-zinc-400">Bespoke technical commissioning for {serverName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Paid Commission Policy Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-amber-200">Paid Development & Scope Estimate Policy</div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed font-normal">
                  All custom development projects require technical scope evaluation. Once submitted, our developers review your specs and provide a binding quote and milestone timeline before any coding begins. Urgent fast-track requests require an express developer rush fee.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-5">
              {/* Feature Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Commission / Script Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Custom Gang Territory Control Script with Discord Webhooks"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Category / Development Module</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                          category === cat.id
                            ? 'bg-indigo-950/80 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <CatIcon className={`w-4 h-4 mt-0.5 shrink-0 ${category === cat.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <div className="space-y-0.5">
                          <div className="text-xs font-extrabold">{cat.label}</div>
                          <div className="text-[10px] text-zinc-500 leading-tight">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Urgency & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Priority Pipeline & Turnaround</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="standard">Standard Pipeline (10-14 Business Days) — Standard Rate</option>
                    <option value="high">High Priority (5-7 Business Days) — +35% Express Fee</option>
                    <option value="vip_fast_track">VIP Rush Pipeline (3-5 Business Days) — +75% Priority Rush Fee</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Budget Range / Target Investment</label>
                  <select
                    value={budgetEstimate}
                    onChange={(e) => setBudgetEstimate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="$35 - $75 (Minor Fix / Script Adjustment)">$35 - $75 (Minor Fix / Script Adjustment)</option>
                    <option value="$75 - $175 (Custom Feature Module)">$75 - $175 (Custom Feature Module)</option>
                    <option value="$175 - $350 (Advanced Multi-Module Script)">$175 - $350 (Advanced Multi-Module Script / Bot)</option>
                    <option value="$350 - $750+ (Bespoke Enterprise System)">$350 - $750+ (Bespoke Enterprise System)</option>
                    <option value="Custom Scope (Request Binding Staff Quote)">Custom Scope (Request Binding Staff Quote)</option>
                  </select>
                </div>
              </div>

              {/* Detailed Specs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Detailed Specifications & Requirements</label>
                <textarea
                  required
                  rows={4}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder={`Describe exact functionality, QBCore/ESX framework needs, database tables, or Discord command triggers required...`}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Submitting Scope for Quote...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Scope for Binding Quote</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
