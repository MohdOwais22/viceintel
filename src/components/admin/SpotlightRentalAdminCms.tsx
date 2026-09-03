'use client';
import React, { useState, useEffect } from 'react';
import {
  Crown,
  Calendar,
  DollarSign,
  Sparkles,
  Server,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Sliders,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  Flame,
  ShieldCheck,
  Check
} from 'lucide-react';
import { RpServer, SpotlightRentalBooking, SpotlightPricingConfig } from '../../types';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { logStaffActivity } from '../../lib/staffAuditLogger';

interface SpotlightRentalAdminCmsProps {
  servers: RpServer[];
  isActorL4Admin?: boolean;
}

export const SpotlightRentalAdminCms: React.FC<SpotlightRentalAdminCmsProps> = ({
  servers,
  isActorL4Admin = true
}) => {
  const saasServers = servers.filter(
    (s) => s.origin === 'saas' || s.deployedThroughSaaS === true || s.id?.startsWith('rp_') || s.id?.startsWith('srv_') || s.id === 'rp1' || s.id === 'rp4'
  );

  const [bookings, setBookings] = useState<SpotlightRentalBooking[]>([]);
  const [pricing, setPricing] = useState<SpotlightPricingConfig>({
    dailyRateUsd: 12.0,
    enabled: true,
    currency: 'USD',
    headline: '🌟 Reserve #1 Top Spotlight Position ($12/Day)'
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'cancelled'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Grant Modal / Drawer Form State
  const [showManualGrantModal, setShowManualGrantModal] = useState(false);
  const [grantServerId, setGrantServerId] = useState<string>(saasServers[0]?.id || '');
  const [grantDate, setGrantDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [grantBadge, setGrantBadge] = useState('🌟 #1 FEATURED SPOTLIGHT SERVER');
  const [grantIsComplimentary, setGrantIsComplimentary] = useState(true);
  const [grantNotes, setGrantNotes] = useState('Admin manual complimentary feature');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  // Edit Rate State
  const [editDailyRate, setEditDailyRate] = useState<number>(12.0);
  const [isSavingRate, setIsSavingRate] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch from server API + Firestore onSnapshot
  const fetchRentalData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spotlight-rentals/all');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.data)) setBookings(data.data);
        if (data.pricing) {
          setPricing(data.pricing);
          setEditDailyRate(data.pricing.dailyRateUsd || 12.0);
        }
      }
    } catch (err) {
      console.warn('Failed to load rentals from server API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalData();

    // 1. Firestore listener for real-time spotlight pricing configuration
    let unsubPricing: (() => void) | null = null;
    try {
      unsubPricing = onSnapshot(doc(db, 'system_config', 'spotlight_pricing'), (docSnap) => {
        if (docSnap.exists()) {
          const pData = docSnap.data();
          if (pData && typeof pData.dailyRateUsd === 'number' && pData.dailyRateUsd > 0) {
            setPricing((prev) => ({
              ...prev,
              ...pData,
              dailyRateUsd: pData.dailyRateUsd,
              headline: pData.headline || `🌟 Reserve #1 Top Spotlight Position ($${pData.dailyRateUsd.toFixed(2)}/Day)`
            }));
            setEditDailyRate(pData.dailyRateUsd);
          }
        }
      }, (err) => console.warn('Pricing config onSnapshot warning:', err));
    } catch (e) {
      // offline
    }

    // 2. Firestore listener for real-time bookings updates
    let unsubBookings: (() => void) | null = null;
    try {
      const bookingsQ = query(collection(db, 'spotlight_rentals'), orderBy('date', 'desc'), limit(10));
      unsubBookings = onSnapshot(bookingsQ, (snapshot) => {
        const list: SpotlightRentalBooking[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as SpotlightRentalBooking);
        });
        if (list.length > 0) {
          // Sort by date descending
          list.sort((a, b) => b.date.localeCompare(a.date));
          setBookings(list);
        }
      }, (err) => console.warn('Spotlight rentals onSnapshot warning:', err));
    } catch (e) {
      // offline fallback
    }

    return () => {
      if (unsubPricing) unsubPricing();
      if (unsubBookings) unsubBookings();
    };
  }, []);

  // Update selected grant server if servers list updates
  useEffect(() => {
    if (!grantServerId && saasServers.length > 0) {
      setGrantServerId(saasServers[0].id);
    }
  }, [saasServers, grantServerId]);

  // Derived Metrics
  const activeTodayBooking = bookings.find((b) => b.date === todayStr && b.status !== 'cancelled');
  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled' && !b.isComplimentary)
    .reduce((sum, b) => sum + (b.pricePaid || 0), 0);
  const upcomingCount = bookings.filter((b) => b.date >= todayStr && b.status !== 'cancelled').length;

  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      b.serverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.date.includes(searchTerm) ||
      (b.ownerDiscordId && b.ownerDiscordId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? b.date === todayStr && b.status !== 'cancelled'
        : statusFilter === 'scheduled'
        ? b.date > todayStr && b.status !== 'cancelled'
        : b.status === 'cancelled';
    return matchSearch && matchStatus;
  });

  // Handle 1-Click Apply to Today's Spotlight
  const handleFeatureToday = async (server: RpServer) => {
    try {
      const targetDate = todayStr;
      const payload = {
        date: targetDate,
        serverId: server.id,
        serverSlug: server.serverSlug || server.id,
        serverName: server.name,
        framework: server.framework,
        region: server.region,
        connectUrl: server.connectUrl,
        description: server.description,
        customBadge: '🌟 #1 FEATURED VICE CITY SPOTLIGHT',
        accentColor: 'amber',
        pricePaid: 0,
        currency: 'USD',
        ownerDiscordId: server.ownerDiscordId || 'AdminOverride',
        ownerUid: auth.currentUser?.uid || 'admin',
        ownerEmail: auth.currentUser?.email || '',
        stripePaymentId: `admin_override_${Date.now()}`,
        isComplimentary: true,
        notes: `Admin 1-Click Today Spotlight Override by ${auth.currentUser?.email || 'Staff'}`
      };

      const res = await fetch('/api/spotlight-rentals/admin-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        logStaffActivity({
          actionType: 'SPOTLIGHT_OVERRIDE_TODAY',
          actionCategory: 'Content Moderation',
          targetId: server.id,
          targetName: server.name,
          targetType: 'rp_server_spotlight',
          severity: 'MEDIUM',
          details: `Admin assigned server "${server.name}" to today's active #1 spotlight position.`
        }).catch(() => {});

        setActionNotice(`✅ Server "${server.name}" successfully activated as today's #1 Spotlight!`);
        fetchRentalData();
      } else {
        setActionNotice(`❌ Error: ${data.error || 'Failed to activate spotlight'}`);
      }
    } catch (err: any) {
      setActionNotice(`❌ Error: ${err?.message || 'Network error'}`);
    }
  };

  // Handle Cancel / Release Booking
  const handleCancelBooking = async (bookingId: string, serverName: string, date: string) => {
    if (!confirm(`Are you sure you want to cancel the spotlight booking for "${serverName}" on ${date}? This will free up the date in the directory calendar.`)) {
      return;
    }

    try {
      const res = await fetch('/api/spotlight-rentals/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();

      if (data.success) {
        // Also update Firestore directly
        try {
          await updateDoc(doc(db, 'spotlight_rentals', bookingId), {
            status: 'cancelled',
            cancelledAt: Date.now(),
            cancelledBy: auth.currentUser?.email || 'admin'
          });
        } catch (e) {
          // fallback
        }

        logStaffActivity({
          actionType: 'SPOTLIGHT_BOOKING_CANCELLED',
          actionCategory: 'Content Moderation',
          targetId: bookingId,
          targetName: serverName,
          targetType: 'spotlight_booking',
          severity: 'HIGH',
          details: `Admin cancelled spotlight rental for date ${date}.`
        }).catch(() => {});

        setActionNotice(`✅ Spotlight booking for ${date} cancelled and released.`);
        fetchRentalData();
      } else {
        setActionNotice(`❌ ${data.error || 'Failed to cancel booking'}`);
      }
    } catch (err: any) {
      setActionNotice(`❌ Error: ${err?.message || 'Network error'}`);
    }
  };

  // Handle Manual Grant Form Submission
  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetServer = saasServers.find((s) => s.id === grantServerId);
    if (!targetServer || !grantDate) {
      alert('Please select a valid SaaS server and date.');
      return;
    }

    setIsSubmittingGrant(true);
    setActionNotice(null);

    const payload = {
      date: grantDate,
      serverId: targetServer.id,
      serverSlug: targetServer.serverSlug || targetServer.id,
      serverName: targetServer.name,
      framework: targetServer.framework,
      region: targetServer.region,
      connectUrl: targetServer.connectUrl,
      description: targetServer.description,
      customBadge: grantBadge,
      accentColor: 'amber',
      pricePaid: grantIsComplimentary ? 0 : pricing.dailyRateUsd,
      currency: 'USD',
      ownerDiscordId: targetServer.ownerDiscordId || 'AdminGranted',
      ownerUid: auth.currentUser?.uid || 'admin',
      ownerEmail: auth.currentUser?.email || '',
      stripePaymentId: grantIsComplimentary ? `admin_grant_${Date.now()}` : `admin_manual_paid_${Date.now()}`,
      isComplimentary: grantIsComplimentary,
      notes: grantNotes
    };

    try {
      const res = await fetch('/api/spotlight-rentals/admin-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        // Also persist to Firestore
        const bookingId = `rent_${grantDate.replace(/-/g, '_')}_${targetServer.id}`;
        try {
          await setDoc(doc(db, 'spotlight_rentals', bookingId), {
            id: bookingId,
            ...payload,
            status: 'active',
            createdAt: Date.now()
          }, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore grant write notice:', fsErr);
        }

        logStaffActivity({
          actionType: 'SPOTLIGHT_ADMIN_GRANT',
          actionCategory: 'Content Moderation',
          targetId: targetServer.id,
          targetName: targetServer.name,
          targetType: 'spotlight_rental',
          severity: 'MEDIUM',
          details: `Admin granted spotlight rental to "${targetServer.name}" for date ${grantDate} (Complimentary: ${grantIsComplimentary}).`
        }).catch(() => {});

        setActionNotice(`✅ Spotlight position successfully booked for ${targetServer.name} on ${grantDate}!`);
        setShowManualGrantModal(false);
        fetchRentalData();
      } else {
        setActionNotice(`❌ Error: ${data.error || 'Failed to grant booking'}`);
      }
    } catch (err: any) {
      setActionNotice(`❌ Error: ${err?.message || 'Network error'}`);
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  // Handle Save Pricing Rate
  const handleSaveDailyRate = async () => {
    setIsSavingRate(true);
    setActionNotice(null);
    try {
      const parsedRate = typeof editDailyRate === 'string' ? parseFloat(editDailyRate) : Number(editDailyRate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        setActionNotice('❌ Please enter a valid daily rate greater than $0.00');
        setIsSavingRate(false);
        return;
      }

      // 1. Direct Firestore Persistence
      try {
        await setDoc(doc(db, 'system_config', 'spotlight_pricing'), {
          dailyRateUsd: parsedRate,
          enabled: true,
          currency: 'USD',
          headline: `🌟 Reserve #1 Top Spotlight Position ($${parsedRate.toFixed(2)}/Day)`,
          updatedAt: Date.now(),
          updatedBy: auth.currentUser?.email || 'Admin'
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Direct Firestore pricing write notice:', fsErr);
      }

      // 2. Server API Update
      const res = await fetch('/api/spotlight-rentals/update-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyRateUsd: parsedRate,
          headline: `🌟 Reserve #1 Top Spotlight Position ($${parsedRate.toFixed(2)}/Day)`,
          updatedBy: auth.currentUser?.email || 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPricing((prev) => ({
          ...prev,
          dailyRateUsd: parsedRate,
          headline: `🌟 Reserve #1 Top Spotlight Position ($${parsedRate.toFixed(2)}/Day)`
        }));
        logStaffActivity({
          actionType: 'SPOTLIGHT_RATE_UPDATE',
          actionCategory: 'System Operations',
          targetId: 'spotlight_pricing',
          targetName: 'Daily Rental Rate',
          targetType: 'pricing_config',
          severity: 'HIGH',
          details: `Admin updated daily spotlight rate to $${parsedRate.toFixed(2)} USD.`
        }).catch(() => {});
        setActionNotice(`✅ Daily Spotlight rental rate permanently updated to $${parsedRate.toFixed(2)}/day.`);
      } else {
        setActionNotice(`❌ Error: ${data.error || 'Failed to update rate'}`);
      }
    } catch (err: any) {
      setActionNotice(`❌ Error: ${err?.message || 'Network error'}`);
    } finally {
      setIsSavingRate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-indigo-500/10 rounded-2xl border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ⭐ Top Position Rental CMS
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                ${pricing.dailyRateUsd.toFixed(2)} / Day Standard Rate
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Top Spotlight Position Booking & Schedule HQ
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage paid ${pricing.dailyRateUsd.toFixed(2)}/day rental reservations, grant complimentary spots, and feature servers in the #1 directory position.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchRentalData}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualGrantModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book / Grant Spotlight</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 flex items-center justify-between gap-2 shadow-lg">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-zinc-400 hover:text-white text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 4 KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Today */}
        <div className="p-4 bg-zinc-900 rounded-2xl border border-amber-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> Today's Active Spotlight
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-300 font-bold">
              {todayStr}
            </span>
          </div>
          <div>
            <h3 className="text-base font-black text-white truncate">
              {activeTodayBooking ? activeTodayBooking.serverName : 'No Active Booking'}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {activeTodayBooking ? (
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live on #1 Spotlight
                </span>
              ) : (
                <span className="text-amber-400 font-mono">Open Reservation Slot</span>
              )}
            </p>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="p-4 bg-zinc-900 rounded-2xl border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Total Rental Revenue
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">USD</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-400 font-mono">
              ${totalRevenue.toFixed(2)}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              From {bookings.filter((b) => b.status !== 'cancelled').length} scheduled spotlight days
            </p>
          </div>
        </div>

        {/* KPI 3: Upcoming Bookings */}
        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Upcoming Scheduled Days
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-mono">{upcomingCount} Days</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Next 30 calendar days</p>
          </div>
        </div>

        {/* KPI 4: Daily Rate Editor */}
        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Daily Rental Rate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500 font-bold">$</span>
              <input
                type="number"
                step="0.50"
                min="1.00"
                value={editDailyRate}
                onChange={(e) => setEditDailyRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              disabled={isSavingRate}
              onClick={handleSaveDailyRate}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition cursor-pointer"
            >
              {isSavingRate ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* 1-Click Fast Feature Panel for SaaS Servers */}
      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>1-Click Feature SaaS Server to Today's Spotlight</span>
          </h3>
          <span className="text-xs text-zinc-400">{saasServers.length} SaaS Deployed Servers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {saasServers.slice(0, 6).map((server) => {
            const isFeaturedToday = activeTodayBooking?.serverId === server.id;

            return (
              <div
                key={server.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                  isFeaturedToday
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="truncate flex-1">
                  <div className="font-bold text-xs text-white truncate">{server.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {server.framework} • {server.region}
                  </div>
                </div>

                {isFeaturedToday ? (
                  <span className="px-2 py-1 text-[10px] font-black uppercase rounded bg-amber-500 text-black shrink-0">
                    ⭐ Active #1
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFeatureToday(server)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Feature Today
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings & Reservations Table */}
      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
        {/* Table Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by server name, date (YYYY-MM-DD), discord ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'scheduled'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'cancelled'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-3">Date (YYYY-MM-DD)</th>
                <th className="py-3 px-3">Server Name</th>
                <th className="py-3 px-3">Framework & Region</th>
                <th className="py-3 px-3">Rate Paid</th>
                <th className="py-3 px-3">Owner / Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const isToday = b.date === todayStr;
                  const isCancelled = b.status === 'cancelled';
                  const isPast = b.date < todayStr;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-zinc-800/40 transition ${
                        isToday && !isCancelled ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{b.date}</span>
                          {isToday && !isCancelled && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-black">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        <div className="truncate max-w-[200px]">{b.serverName}</div>
                        <div className="text-[10px] text-amber-400 truncate max-w-[200px]">
                          {b.customBadge || '🌟 Spotlight Featured'}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {b.framework} • {b.region}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {b.isComplimentary ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                            Complimentary
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-400">
                            ${(b.pricePaid || 12).toFixed(2)} USD
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[150px]">
                        {b.ownerDiscordId ? `@${b.ownerDiscordId}` : b.ownerEmail || 'SaaS Owner'}
                      </td>

                      <td className="py-3 px-3">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Cancelled
                          </span>
                        ) : isToday ? (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit animate-pulse">
                            <Flame className="w-3 h-3 text-amber-400" /> Active Today
                          </span>
                        ) : isPast ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800 text-zinc-400">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Scheduled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id, b.serverName, b.date)}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition cursor-pointer"
                            title="Cancel & Release Date"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                    No rental bookings found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Grant Modal */}
      {showManualGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Manual / Complimentary Spotlight Booking</h3>
              </div>
              <button
                onClick={() => setShowManualGrantModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-300">Select SaaS Deployed Server:</label>
                <select
                  value={grantServerId}
                  onChange={(e) => setGrantServerId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {saasServers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.framework} • {s.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300">Spotlight Date (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={grantDate}
                  onChange={(e) => setGrantDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300">Custom Badge Title:</label>
                <input
                  type="text"
                  value={grantBadge}
                  onChange={(e) => setGrantBadge(e.target.value)}
                  placeholder="e.g. 🌟 #1 FEATURED SPOTLIGHT SERVER"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300">Internal Staff Notes:</label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="e.g. Partnership promo slot"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="grant-comp"
                  checked={grantIsComplimentary}
                  onChange={(e) => setGrantIsComplimentary(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="grant-comp" className="font-bold text-zinc-300 cursor-pointer">
                  Complimentary ($0.00 Fee)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowManualGrantModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrant}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmittingGrant ? 'Booking...' : 'Confirm Spotlight Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
