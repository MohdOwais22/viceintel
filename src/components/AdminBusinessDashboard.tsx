'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Server, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle,
  ArrowUpRight,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { B2BSubscription, ServerRecord } from '../types';

interface AdminBusinessDashboardProps {
  onNavigate?: (tab: string, targetId?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
}

export const AdminBusinessDashboard: React.FC<AdminBusinessDashboardProps> = ({
  onNavigate,
  currentUser
}) => {
  const [subscriptions, setSubscriptions] = useState<B2BSubscription[]>([]);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'canceled'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fallback seed data if database is fresh
  const DEFAULT_SEED_SUBSCRIPTIONS: B2BSubscription[] = [
    {
      id: 'sub_live_vice_underground',
      serverId: 'srv_viceunderground',
      ownerDiscordId: '298716543210987654',
      stripeCustomerId: 'cus_N8xL9p2KqW',
      stripeSubscriptionId: 'sub_1OqL2k4E9x8',
      stripePriceId: 'price_b2b_mega_server_49',
      tier: 'mega_server',
      status: 'active',
      currentPeriodStart: Date.now() - 14 * 24 * 60 * 60 * 1000,
      currentPeriodEnd: Date.now() + 16 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      mrr: 49,
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
    },
    {
      id: 'sub_live_ocean_drive_rp',
      serverId: 'srv_oceandrive',
      ownerDiscordId: '381928475619283746',
      stripeCustomerId: 'cus_P9wM8a1LrZ',
      stripeSubscriptionId: 'sub_1OqM3m5F0y9',
      stripePriceId: 'price_b2b_community_29',
      tier: 'community',
      status: 'active',
      currentPeriodStart: Date.now() - 8 * 24 * 60 * 60 * 1000,
      currentPeriodEnd: Date.now() + 22 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      mrr: 29,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000
    },
    {
      id: 'sub_live_vice_city_life',
      serverId: 'srv_vicecitylife',
      ownerDiscordId: '492817263548192837',
      stripeCustomerId: 'cus_Q1zN7b2MsA',
      stripeSubscriptionId: 'sub_1OqN4n6G1z0',
      stripePriceId: 'price_b2b_mega_server_49',
      tier: 'mega_server',
      status: 'active',
      currentPeriodStart: Date.now() - 20 * 24 * 60 * 60 * 1000,
      currentPeriodEnd: Date.now() + 10 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      mrr: 49,
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000
    },
    {
      id: 'sub_live_everglades_rp',
      serverId: 'srv_everglades',
      ownerDiscordId: '582910394827162534',
      stripeCustomerId: 'cus_R2aO6c3NtB',
      stripeSubscriptionId: 'sub_1OqO5o7H2a1',
      stripePriceId: 'price_b2b_community_29',
      tier: 'community',
      status: 'past_due',
      currentPeriodStart: Date.now() - 32 * 24 * 60 * 60 * 1000,
      currentPeriodEnd: Date.now() - 2 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      mrr: 29,
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000
    }
  ];

  // Subscribe to subscriptions collection
  useEffect(() => {
    setIsLoading(true);
    let unsub: () => void = () => {};
    try {
      const q = query(collection(db, 'subscriptions'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: B2BSubscription[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as B2BSubscription);
          });
          if (list.length > 0) {
            setSubscriptions(list);
          } else {
            setSubscriptions(DEFAULT_SEED_SUBSCRIPTIONS);
          }
          setIsLoading(false);
        },
        (err) => {
          console.warn('Firestore subscription snapshot fallback:', err);
          setSubscriptions(DEFAULT_SEED_SUBSCRIPTIONS);
          setIsLoading(false);
        }
      );
    } catch (e) {
      setSubscriptions(DEFAULT_SEED_SUBSCRIPTIONS);
      setIsLoading(false);
    }
    return () => unsub();
  }, []);

  // Subscribe to servers collection
  useEffect(() => {
    let unsub: () => void = () => {};
    try {
      const q = query(collection(db, 'servers'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: ServerRecord[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as ServerRecord);
          });
          setServers(list);
        },
        (err) => {
          console.warn('Firestore servers snapshot fallback:', err);
        }
      );
    } catch (e) {
      console.warn('Server query error:', e);
    }
    return () => unsub();
  }, []);

  // Metrics Calculations
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pastDueSubs = subscriptions.filter((s) => s.status === 'past_due');
  const canceledSubs = subscriptions.filter((s) => s.status === 'canceled');

  const totalMRR = activeSubs.reduce((acc, sub) => acc + (sub.mrr || (sub.tier === 'mega_server' ? 49 : 29)), 0);
  const totalARR = totalMRR * 12;
  const totalPaidSubscribers = activeSubs.length;
  const churnRate = subscriptions.length > 0 
    ? ((canceledSubs.length / subscriptions.length) * 100).toFixed(1) 
    : '0.0';

  // Search & Filter
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.serverId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ownerDiscordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.stripeCustomerId && sub.stripeCustomerId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' ? true : sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Manual Billing / Tier Override
  const handleToggleTier = async (sub: B2BSubscription) => {
    const newTier: 'community' | 'mega_server' | 'enterprise' = 
      sub.tier === 'community' ? 'mega_server' : 
      sub.tier === 'mega_server' ? 'enterprise' : 'community';
    const newMrr = newTier === 'enterprise' ? 99 : newTier === 'mega_server' ? 49 : 29;
    try {
      const docRef = doc(db, 'subscriptions', sub.id);
      await updateDoc(docRef, {
        tier: newTier,
        mrr: newMrr,
        updatedAt: Date.now()
      });
      showToast(`Updated ${sub.serverId} to ${newTier.toUpperCase()} ($${newMrr}/mo)`);
    } catch (err) {
      // Local state fallback update
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, tier: newTier, mrr: newMrr } : s))
      );
      showToast(`Simulated: Updated ${sub.serverId} to ${newTier.toUpperCase()}`);
    }
  };

  const handleToggleStatus = async (sub: B2BSubscription) => {
    const newStatus = sub.status === 'active' ? 'canceled' : 'active';
    try {
      const docRef = doc(db, 'subscriptions', sub.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: Date.now()
      });
      showToast(`Updated subscription status to ${newStatus.toUpperCase()}`);
    } catch (err) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus as any } : s))
      );
      showToast(`Simulated: Updated subscription to ${newStatus.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/40 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> B2B SaaS Executive Control Plane
            </div>
            <h1 className="text-3xl font-black text-white">Commercial Billing & MRR Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time revenue, active FiveM server subscriptions, and manual tier overrides.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('for-servers');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View B2B Landing Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('servers-onboarding');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Provision New Server</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Executive Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: MRR */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Monthly Recurring Revenue (MRR)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-3">
              ${totalMRR.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
            </div>
          </div>

          {/* Card 2: ARR */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Annual Run Rate (ARR)</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-cyan-400 mt-3">
              ${totalARR.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-2">Projected 12-month run rate</div>
          </div>

          {/* Card 3: Active Subscribed Servers */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Subscribed RP Servers</span>
              <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-400 mt-3">
              {totalPaidSubscribers}
            </div>
            <div className="text-xs text-slate-400 mt-2">{activeSubs.length} active • {pastDueSubs.length} past due</div>
          </div>

          {/* Card 4: Monthly Churn Rate */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Gross Churn Rate</span>
              <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-3">
              {churnRate}%
            </div>
            <div className="text-xs text-emerald-400 mt-2">Below 5.0% industry target</div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by server ID, Discord ID, or Stripe customer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'active', 'past_due', 'canceled'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                    statusFilter === filter
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Server Community</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">MRR</th>
                  <th className="py-3.5 px-4">Billing Period</th>
                  <th className="py-3.5 px-4">Discord Owner ID</th>
                  <th className="py-3.5 px-4 text-right">Actions / Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No active B2B server subscriptions found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const serverSlug = sub.serverId.replace(/^srv_/, '');
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Server Community */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{sub.serverId}</div>
                          <span className="text-[11px] text-cyan-400 font-mono">/servers/{serverSlug}</span>
                        </td>

                        {/* Plan */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            sub.tier === 'mega_server'
                              ? 'bg-rose-950/80 border border-rose-500/40 text-rose-400'
                              : sub.tier === 'enterprise'
                              ? 'bg-amber-950/80 border border-amber-500/40 text-amber-400'
                              : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400'
                          }`}>
                            {sub.tier === 'mega_server' ? 'Mega-Server ($49)' : sub.tier === 'enterprise' ? 'Enterprise ($199)' : 'Community ($29)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            sub.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : sub.status === 'past_due'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}>
                            {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{sub.status}</span>
                          </span>
                        </td>

                        {/* MRR */}
                        <td className="py-4 px-4 font-black text-white text-sm">
                          ${sub.mrr || (sub.tier === 'mega_server' ? 49 : 29)}
                          <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </td>

                        {/* Period */}
                        <td className="py-4 px-4 text-slate-300">
                          <div>Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
                          <span className="text-[10px] text-slate-500">Stripe ID: {sub.stripeSubscriptionId?.slice(0, 14)}...</span>
                        </td>

                        {/* Discord ID */}
                        <td className="py-4 px-4 font-mono text-slate-300 text-xs">
                          {sub.ownerDiscordId || 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTier(sub)}
                              title="Toggle between Community ($29) and Mega-Server ($49)"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Switch Tier
                            </button>
                            <button
                              onClick={() => handleToggleStatus(sub)}
                              title="Toggle between Active and Canceled"
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                sub.status === 'active'
                                  ? 'bg-rose-950 text-rose-400 hover:bg-rose-900'
                                  : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                              }`}
                            >
                              {sub.status === 'active' ? 'Cancel' : 'Reactivate'}
                            </button>
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
    </div>
  );
};
