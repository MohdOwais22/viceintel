import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  Terminal, 
  MessageSquare, 
  Save, 
  Trash2, 
  Bot, 
  Code2, 
  Layers, 
  DollarSign, 
  Zap, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OnDemandFeatureRequest } from '../whitelist/FeaturesOnDemandTab';
import { FeatureFollowupThread } from '../whitelist/FeatureFollowupThread';

interface OnDemandFeatureAdminCmsProps {
  currentUser?: any;
}

export const OnDemandFeatureAdminCms: React.FC<OnDemandFeatureAdminCmsProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<OnDemandFeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit Form State
  const [editStatus, setEditStatus] = useState<OnDemandFeatureRequest['status']>('pending');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editEstDelivery, setEditEstDelivery] = useState('');
  const [editQuotePrice, setEditQuotePrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Subscribe to all onDemandFeatureRequests
  useEffect(() => {
    setLoading(true);
    let unsub = () => {};

    try {
      const q = query(collection(db, 'onDemandFeatureRequests'));
      unsub = onSnapshot(q, (snapshot) => {
        const list: OnDemandFeatureRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as OnDemandFeatureRequest);
        });

        // Sort by creation date desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(list);
        setLoading(false);
      }, (err) => {
        console.warn('Admin onDemandFeatureRequests listener fallback:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('Error connecting to onDemandFeatureRequests:', e);
      setLoading(false);
    }

    return () => unsub();
  }, []);

  // Select Request to edit
  const handleStartEdit = (req: OnDemandFeatureRequest) => {
    setEditingId(req.id);
    setEditStatus(req.status);
    setEditAdminNotes(req.adminNotes || '');
    setEditEstDelivery(req.estimatedDelivery || '');
    setEditQuotePrice(req.quotePrice || '');
  };

  // Save changes to Firestore / Database
  const handleSaveResponse = async (reqId: string) => {
    setSaving(true);
    try {
      const docRef = doc(db, 'onDemandFeatureRequests', reqId);
      await updateDoc(docRef, {
        status: editStatus,
        adminNotes: editAdminNotes,
        estimatedDelivery: editEstDelivery,
        quotePrice: editQuotePrice,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setRequests(prev => prev.map(r => r.id === reqId ? {
        ...r,
        status: editStatus,
        adminNotes: editAdminNotes,
        estimatedDelivery: editEstDelivery,
        quotePrice: editQuotePrice,
        updatedAt: new Date().toISOString()
      } : r));

      setToastMessage('Feature application updated & synced live to Server Owner Dashboard!');
      setTimeout(() => setToastMessage(null), 4000);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update feature request in database:', err);
      alert('Error updating database document: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Request
  const handleDelete = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'onDemandFeatureRequests', reqId));
    } catch (err) {
      console.warn('Error deleting request from Firestore:', err);
    }
    setRequests(prev => prev.filter(r => r.id !== reqId));
    setConfirmDeleteId(null);
    setToastMessage('Feature request removed from queue.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter requests
  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerGamerTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.specs.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> Executive Control Panel
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              Paid Commissions Desk
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Custom Development & Commission Quotes</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Review custom script, UI, physics, and bot commission requests submitted by RP Server Owners. Provide binding quotes, set milestone schedules, and sync progress to their dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">Pending Queue</div>
            <div className="text-xl font-black text-amber-400">
              {requests.filter(r => r.status === 'pending' || r.status === 'under_review').length}
            </div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">Active Dev</div>
            <div className="text-xl font-black text-cyan-400">
              {requests.filter(r => r.status === 'in_development').length}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by server, owner, or title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'pending', 'under_review', 'in_development', 'delivered'].map((stKey) => (
            <button
              key={stKey}
              onClick={() => setStatusFilter(stKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition cursor-pointer ${
                statusFilter === stKey
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white bg-zinc-950'
              }`}
            >
              {stKey === 'all' ? 'All' : stKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <Clock className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Loading requests from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
          <Wand2 className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Feature Requests Found</h3>
          <p className="text-xs text-zinc-500">No requests match the current search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isEditing = editingId === req.id;

            return (
              <div 
                key={req.id}
                className={`p-5 sm:p-6 rounded-3xl border transition shadow-lg space-y-4 ${
                  isEditing 
                    ? 'bg-zinc-900 border-indigo-500/80 ring-1 ring-indigo-500/50' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/30">
                        {req.serverName} ({req.serverSlug})
                      </span>
                      <span className="text-zinc-400">by @{req.ownerGamerTag}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400 font-bold">{req.budgetEstimate}</span>
                    </div>
                    <h3 className="text-lg font-black text-white">{req.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => isEditing ? setEditingId(null) : handleStartEdit(req)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isEditing 
                          ? 'bg-zinc-800 text-zinc-300' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      }`}
                    >
                      {isEditing ? 'Close Editor' : 'Manage & Respond'}
                    </button>
                    {confirmDeleteId === req.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/60 px-2 py-1 rounded-xl shadow-lg animate-fadeIn">
                        <span className="text-[11px] font-bold text-rose-300 mr-1">Delete?</span>
                        <button
                          onClick={() => handleDelete(req.id)}
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
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Specs Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-xs text-zinc-300 leading-relaxed font-sans space-y-1 border border-zinc-800/60">
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Specifications:</div>
                  <div className="whitespace-pre-line">{req.specs}</div>
                </div>

                {/* Inline Response Editor */}
                {isEditing ? (
                  <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-4">
                    <div className="text-xs font-black text-indigo-300 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Developer & Admin Response Editor</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-300">Update Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="pending">Pending Staff Review</option>
                          <option value="under_review">Under Spec Review</option>
                          <option value="in_development">In Active Development</option>
                          <option value="ready_for_testing">Ready for Testing</option>
                          <option value="delivered">Delivered & Live</option>
                          <option value="rejected">Rejected / Needs Revision</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-300">Est. Delivery Date</label>
                        <input
                          type="text"
                          value={editEstDelivery}
                          onChange={(e) => setEditEstDelivery(e.target.value)}
                          placeholder="e.g. Sept 18, 2026 (5-7 Business Days)"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-300">Quote / Cost Note</label>
                        <input
                          type="text"
                          value={editQuotePrice}
                          onChange={(e) => setEditQuotePrice(e.target.value)}
                          placeholder="e.g. Included in Pro SaaS ($0)"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-300">Staff Response & Instructions for Server Owner</label>
                      <textarea
                        rows={3}
                        value={editAdminNotes}
                        onChange={(e) => setEditAdminNotes(e.target.value)}
                        placeholder="Write developer progress update or setup instructions..."
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveResponse(req.id)}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save & Sync to Owner'}</span>
                      </button>
                    </div>
                  </div>
                ) : req.adminNotes ? (
                  <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                    <div className="text-[10px] text-indigo-400 font-extrabold flex items-center justify-between">
                      <span>Staff Response Note:</span>
                      {req.estimatedDelivery && <span className="text-zinc-500 font-mono">Est: {req.estimatedDelivery}</span>}
                    </div>
                    <p className="text-zinc-300">{req.adminNotes}</p>
                  </div>
                ) : null}

                {/* Real-time Follow-up Thread between Owner and Admin */}
                <FeatureFollowupThread
                  requestId={req.id}
                  requestTitle={req.title}
                  requestOwnerUid={req.ownerUid}
                  requestOwnerGamerTag={req.ownerGamerTag}
                  serverSlug={req.serverSlug}
                  currentUser={currentUser}
                  isAdminView={true}
                  defaultExpanded={false}
                />

                {/* Footer status row */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
                  <div>Status: <span className="text-amber-400 uppercase font-bold">{req.status}</span></div>
                  <div>Submitted: {new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
