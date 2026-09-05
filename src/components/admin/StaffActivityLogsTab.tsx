'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Users,
  Eye,
  Trash2,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  ArrowRight,
  Send,
  Database,
  Key,
  Shield,
  FileSpreadsheet,
  FileCode,
  Flame,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  StaffAuditLog,
  StaffActionType,
  StaffActionCategory,
  StaffAuditSeverity,
  StaffFieldChange
} from '../../types';
import {
  subscribeToStaffAuditLogs,
  reviewStaffAuditLog,
  purgeStaffAuditLog,
  exportAuditLogsToCsv,
  exportAuditLogsToJson,
  logStaffActivity,
  INITIAL_STAFF_AUDIT_LOGS
} from '../../lib/staffAuditLogger';
import { isAdminUser } from '../../lib/rbac';
import { auth } from '../../lib/firebase';

interface StaffActivityLogsTabProps {
  currentUser?: any;
  isAdmin?: boolean;
  isStaff?: boolean;
}

export const StaffActivityLogsTab: React.FC<StaffActivityLogsTabProps> = ({
  currentUser,
  isAdmin: propIsAdmin,
  isStaff: propIsStaff
}) => {
  const currentEmail = auth.currentUser?.email || currentUser?.email;
  const currentDisplayName = auth.currentUser?.displayName || currentUser?.displayName || 'Admin_L4_Lucia';
  
  // Strict L4 Admin Authorization Gate
  const isL4Admin = Boolean(propIsAdmin);

  const [logs, setLogs] = useState<StaffAuditLog[]>(INITIAL_STAFF_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'All' | 'Reviewed' | 'Pending'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal inspection states
  const [inspectingLog, setInspectingLog] = useState<StaffAuditLog | null>(null);
  const [reviewingLog, setReviewingLog] = useState<StaffAuditLog | null>(null);
  const [logToPurge, setLogToPurge] = useState<StaffAuditLog | null>(null);
  const [supervisorNoteInput, setSupervisorNoteInput] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Subscribe to real-time logs from Firestore
  useEffect(() => {
    if (!isL4Admin) return;

    setIsLoading(true);
    const unsubscribe = subscribeToStaffAuditLogs((updatedLogs) => {
      setLogs(updatedLogs);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 200);

    return () => unsubscribe();
  }, [isL4Admin]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetch('/api/admin/staff-logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
          setActionNotice('✅ Synced latest staff activity ledger with server & Firestore.');
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsRefreshing(false);
        setTimeout(() => setActionNotice(null), 3500);
      });
  };

  const handleSimulateStaffActivity = async () => {
    setIsRefreshing(true);
    const simulatedActions = [
      {
        actionType: 'USER_ROLE_CHANGE' as StaffActionType,
        actionCategory: 'User Management' as StaffActionCategory,
        targetId: 'u' + Math.floor(Math.random() * 900 + 100),
        targetName: '@ViceRacer_' + Math.floor(Math.random() * 99),
        targetType: 'user',
        severity: 'CRITICAL' as StaffAuditSeverity,
        details: 'Staff @ViceCityStaff_Marco upgraded user role to VIP Member and authorized priority queue access.',
        changes: [
          { field: 'role', oldValue: 'User', newValue: 'VIP Member', fieldLabel: 'Account Role' },
          { field: 'vipExpires', oldValue: 'Expired', newValue: '2027-08-16', fieldLabel: 'VIP Expiration' }
        ],
        actorOverride: {
          actorId: 'usr_staff_marco',
          actorEmail: 'marco.staff@vicecity.app',
          actorUsername: 'ViceCityStaff_Marco',
          actorRole: 'Staff',
          actorClearance: 'L3'
        }
      },
      {
        actionType: 'MODERATION_APPROVAL' as StaffActionType,
        actionCategory: 'Moderation Queue' as StaffActionCategory,
        targetId: 'build_' + Date.now(),
        targetName: 'Pegassi Ignus Custom Track Spec',
        targetType: 'build',
        severity: 'MEDIUM' as StaffAuditSeverity,
        details: 'Staff @Staff_L3_Elena approved player custom vehicle tune for public leaderboard championship.',
        changes: [
          { field: 'status', oldValue: 'Pending Review', newValue: 'Approved', fieldLabel: 'Publication State' }
        ],
        actorOverride: {
          actorId: 'usr_staff_elena',
          actorEmail: 'elena.mod@vicecity.app',
          actorUsername: 'Staff_L3_Elena',
          actorRole: 'Staff',
          actorClearance: 'L3'
        }
      },
      {
        actionType: 'USER_VC_ADJUST' as StaffActionType,
        actionCategory: 'User Management' as StaffActionCategory,
        targetId: 'u42',
        targetName: '@OceanDriveKing',
        targetType: 'user',
        severity: 'HIGH' as StaffAuditSeverity,
        details: 'Staff @ViceModerator_Kai adjusted user balance with +500 VC Cash compensation for event server downtime.',
        changes: [
          { field: 'vcBalance', oldValue: 1200, newValue: 1700, fieldLabel: 'Vice City Balance' }
        ],
        actorOverride: {
          actorId: 'usr_staff_kai',
          actorEmail: 'kai.mod@vicecity.app',
          actorUsername: 'ViceModerator_Kai',
          actorRole: 'Staff',
          actorClearance: 'L3'
        }
      }
    ];

    const randomAction = simulatedActions[Math.floor(Math.random() * simulatedActions.length)];
    await logStaffActivity(randomAction);
    setIsRefreshing(false);
    setActionNotice(`⚡ Logged new simulated L3 Staff activity by ${randomAction.actorOverride.actorUsername}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleVerifyAction = async (log: StaffAuditLog, isApproved: boolean) => {
    try {
      await reviewStaffAuditLog(log.id, {
        reviewerName: currentDisplayName,
        isApproved,
        note: isApproved ? 'Verified & approved by L4 Super Admin.' : 'Flagged for investigation.'
      });
      setLogs(prev => prev.map(l => l.id === log.id ? {
        ...l,
        isReviewedByL4: true,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentDisplayName,
        l4ReviewNote: isApproved ? 'Verified & approved by L4 Super Admin.' : 'Flagged for investigation.'
      } : l));
      setActionNotice(`✅ Log ${log.id} verified by L4 Super Admin.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.warn('Verification error:', e);
    }
  };

  const handleSaveSupervisorReview = async () => {
    if (!reviewingLog) return;
    setIsSavingReview(true);
    try {
      await reviewStaffAuditLog(reviewingLog.id, {
        reviewerName: currentDisplayName,
        isApproved: true,
        note: supervisorNoteInput.trim() || 'Reviewed by Level 4 Administrator.'
      });
      setLogs(prev => prev.map(l => l.id === reviewingLog.id ? {
        ...l,
        isReviewedByL4: true,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentDisplayName,
        l4ReviewNote: supervisorNoteInput.trim() || 'Reviewed by Level 4 Administrator.'
      } : l));
      setActionNotice(`📝 Supervisor note attached to log ${reviewingLog.id}.`);
      setTimeout(() => setActionNotice(null), 3500);
      setReviewingLog(null);
      setSupervisorNoteInput('');
    } catch (e) {
      console.warn('Save review error:', e);
    } finally {
      setIsSavingReview(false);
    }
  };

  const handlePurgeLog = (log: StaffAuditLog) => {
    setLogToPurge(log);
  };

  const confirmPurgeLog = async () => {
    if (!logToPurge) return;
    const logId = logToPurge.id;
    setLogToPurge(null);
    try {
      await purgeStaffAuditLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      setActionNotice(`🗑️ Purged audit log ${logId} from ledger.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.warn('Purge error:', e);
    }
  };

  const handleExportCsv = () => {
    const csvContent = exportAuditLogsToCsv(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gta6_vice_staff_audit_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionNotice('📥 Exported Staff Audit CSV Ledger successfully.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportJson = () => {
    const jsonContent = exportAuditLogsToJson(filteredLogs);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gta6_vice_staff_audit_ledger_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionNotice('📄 Exported Forensic JSON Ledger successfully.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Distinct staff members for dropdown
  const uniqueStaffMembers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.actorUsername) set.add(l.actorUsername);
    });
    return Array.from(set);
  }, [logs]);

  // Distinct action categories
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.actionCategory) set.add(l.actionCategory);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered & searched logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();

    return logs.filter((log) => {
      // Free text search
      if (q) {
        const matchSearch =
          log.id.toLowerCase().includes(q) ||
          log.actorUsername.toLowerCase().includes(q) ||
          log.actorEmail.toLowerCase().includes(q) ||
          log.actionType.toLowerCase().includes(q) ||
          log.actionCategory.toLowerCase().includes(q) ||
          (log.targetName && log.targetName.toLowerCase().includes(q)) ||
          (log.targetId && log.targetId.toLowerCase().includes(q)) ||
          log.details.toLowerCase().includes(q) ||
          (log.l4ReviewNote && log.l4ReviewNote.toLowerCase().includes(q));

        if (!matchSearch) return false;
      }

      // Staff filter
      if (staffFilter !== 'All' && log.actorUsername !== staffFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && log.actionCategory !== categoryFilter) {
        return false;
      }

      // Action type filter
      if (actionTypeFilter !== 'All' && log.actionType !== actionTypeFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'All' && log.severity !== severityFilter) {
        return false;
      }

      // Review status filter
      if (reviewStatusFilter === 'Reviewed' && !log.isReviewedByL4) return false;
      if (reviewStatusFilter === 'Pending' && log.isReviewedByL4) return false;

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const logAgeMs = now - log.timestampMs;
        if (dateRangeFilter === 'today' && logAgeMs > 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === '7days' && logAgeMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === '30days' && logAgeMs > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    }).sort((a, b) => b.timestampMs - a.timestampMs);
  }, [logs, searchQuery, staffFilter, categoryFilter, actionTypeFilter, severityFilter, reviewStatusFilter, dateRangeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

  // High-level statistics
  const totalL3Logs = logs.filter(l => l.actorClearance === 'L3').length;
  const criticalSeverityCount = logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'HIGH').length;
  const pendingReviewCount = logs.filter(l => !l.isReviewedByL4).length;

  // Render Access Denied for non-L4 accounts
  if (!isL4Admin) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-zinc-950 border border-rose-500/40 rounded-2xl shadow-2xl space-y-6 animate-fade-in relative overflow-hidden text-center">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 w-fit mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold uppercase">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>Level 4 Admin Clearance Required</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          L3 Staff Activity Audit Ledger Restricted
        </h2>
        <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
          The Staff Activity Audit Ledger is strictly confidential and reserved exclusively for Level 4 Super Administrators (Admins). Level 3 Staff members cannot view, alter, or inspect the supervisory audit log.
        </p>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left text-xs font-mono text-zinc-400 space-y-1.5 max-w-md mx-auto">
          <div className="text-zinc-300 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Ledger Security Protocol:</span>
          </div>
          <p>• Access Level: <strong>L4 Superuser Only</strong></p>
          <p>• Current Clearance: <strong>{propIsStaff ? 'L3 Staff Moderator' : 'Regular User'}</strong></p>
          <p>• Ledger Location: <strong>Firestore `staff_activity_logs` (Encrypted)</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: L4 Super Admin Classified Ledger */}
      <div className="bg-gradient-to-r from-zinc-950 via-rose-950/80 to-zinc-950 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-48 h-48 text-rose-400" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-400" />
                <span>L4 Superuser Clearance Active</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Restricted to L4 Admin • Hidden from L3 Staff</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Live Firestore Audit Stream</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              L3 Staff Activity & Modifications Audit Ledger
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              Real-time forensic log monitoring every profile edit, role change, ban, submission approval, chat moderation, and bug report triaged by Level 3 Staff members. Inspect before/after diffs, attach supervisor verification stamps, and export compliance reports.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              title="Refresh ledger from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Ledger</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Export CSV audit report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Export JSON forensic dump"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action notice banner */}
      {actionNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-between animate-fade-in shadow-lg shadow-amber-500/10">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </span>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recorded Logs</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{logs.length}</span>
            <span className="text-xs text-rose-400 font-mono font-bold">Entries</span>
          </div>
          <p className="text-[10px] text-zinc-500">All staff activities in tamper-evident ledger.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">L3 Staff Actions</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{totalL3Logs}</span>
            <span className="text-xs text-amber-300/80 font-bold font-mono">Mod Actions</span>
          </div>
          <p className="text-[10px] text-zinc-500">Executed by Level 3 Staff & Moderators.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">High / Critical Events</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">{criticalSeverityCount}</span>
            <span className="text-xs text-rose-400 font-bold font-mono">Bans & Edits</span>
          </div>
          <p className="text-[10px] text-zinc-500">Bans, role upgrades, VC balance credits.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting L4 Signoff</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{pendingReviewCount}</span>
            <span className="text-xs text-indigo-300 font-bold font-mono">Pending</span>
          </div>
          <p className="text-[10px] text-zinc-500">Unreviewed staff actions for verification.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search staff username, email, target player, action details, diff..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Staff Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-zinc-500 font-bold">Staff:</span>
              <select
                value={staffFilter}
                onChange={(e) => {
                  setStaffFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-900">All Operators</option>
                {uniqueStaffMembers.map(name => (
                  <option key={name} value={name} className="bg-zinc-900">@{name}</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-zinc-500 font-bold">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-900">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                ))}
              </select>
            </div>

            {/* Severity Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-zinc-500 font-bold">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-900">All Levels</option>
                <option value="CRITICAL" className="bg-zinc-900 text-rose-400">Critical</option>
                <option value="HIGH" className="bg-zinc-900 text-amber-400">High</option>
                <option value="MEDIUM" className="bg-zinc-900 text-indigo-400">Medium</option>
                <option value="LOW" className="bg-zinc-900 text-emerald-400">Low</option>
              </select>
            </div>

            {/* Review Status Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-zinc-500 font-bold">Status:</span>
              <select
                value={reviewStatusFilter}
                onChange={(e) => {
                  setReviewStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-zinc-900">All Statuses</option>
                <option value="Reviewed" className="bg-zinc-900 text-emerald-400">Verified by L4</option>
                <option value="Pending" className="bg-zinc-900 text-amber-400">Awaiting Signoff</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Time</option>
                <option value="today" className="bg-zinc-900">Last 24 Hours</option>
                <option value="7days" className="bg-zinc-900">Last 7 Days</option>
                <option value="30days" className="bg-zinc-900">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Ledger Table */}
        <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Timestamp & Operator</th>
                <th className="py-3 px-3">Action & Severity</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">Activity Description & Modifications</th>
                <th className="py-3 px-3">L4 Verification Status</th>
                <th className="py-3 px-4 text-right">L4 Superuser Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-zinc-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm font-bold text-zinc-400">No Staff Activity Logs Found</p>
                    <p className="text-xs text-zinc-600">Try loosening your search filters or click &quot;Simulate L3 Action&quot; above.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isCritical = log.severity === 'CRITICAL';
                  const isHigh = log.severity === 'HIGH';
                  const isMedium = log.severity === 'MEDIUM';

                  const dateObj = new Date(log.timestamp);
                  const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                      {/* 1. Timestamp & Staff Operator */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono">{log.actorUsername}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono border ${
                              log.actorClearance === 'L4'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {log.actorClearance} Staff
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {log.actorEmail}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            <span>{dateStr} {timeStr}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Action Type & Severity */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                              : isHigh
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isMedium
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {log.actionType.replace(/_/g, ' ')}
                          </span>
                          <div>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-zinc-950 border border-zinc-800 text-zinc-400">
                              {log.actionCategory}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Target Entity */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          {log.targetName ? (
                            <div className="font-bold text-zinc-200 font-mono">
                              {log.targetName}
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px] font-mono">Global / N/A</span>
                          )}
                          {log.targetType && (
                            <span className="text-[9px] uppercase font-bold text-zinc-500 px-1.5 py-0.2 bg-zinc-950 border border-zinc-800/80 rounded inline-block">
                              {log.targetType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Description & Diffs */}
                      <td className="py-3 px-4 align-top max-w-md">
                        <div className="space-y-1.5">
                          <p className="text-zinc-300 text-xs leading-relaxed">{log.details}</p>

                          {/* Diffs Preview */}
                          {log.changes && log.changes.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="flex flex-wrap gap-1.5">
                                {log.changes.slice(0, 2).map((c, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-300">
                                    <strong className="text-rose-400">{c.fieldLabel || c.field}:</strong>
                                    <span className="text-zinc-500 line-through">{String(c.oldValue)}</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-zinc-600" />
                                    <span className="text-emerald-400 font-bold">{String(c.newValue)}</span>
                                  </span>
                                ))}
                                {log.changes.length > 2 && (
                                  <span className="text-[10px] text-zinc-500 font-mono">+{log.changes.length - 2} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => setInspectingLog(log)}
                            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 pt-0.5 transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect Full Snapshot Diff</span>
                          </button>
                        </div>
                      </td>

                      {/* 5. L4 Verification Status */}
                      <td className="py-3 px-3 align-top">
                        {log.isReviewedByL4 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified by L4</span>
                            </span>
                            {log.reviewedBy && (
                              <div className="text-[9px] text-zinc-400 font-mono">
                                By @{log.reviewedBy}
                              </div>
                            )}
                            {log.l4ReviewNote && (
                              <p className="text-[10px] text-zinc-400 italic bg-zinc-950/80 p-1.5 rounded border border-zinc-800/80 max-w-xs">
                                &quot;{log.l4ReviewNote}&quot;
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>Awaiting Signoff</span>
                            </span>
                            <div className="text-[9px] text-zinc-500">
                              Requires L4 review
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. L4 Actions */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!log.isReviewedByL4 && (
                            <button
                              onClick={() => handleVerifyAction(log, true)}
                              className="px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="1-Click Verify Action"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Verify</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setReviewingLog(log);
                              setSupervisorNoteInput(log.l4ReviewNote || '');
                            }}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Add supervisor note"
                          >
                            <FileText className="w-3 h-3 text-zinc-400" />
                            <span>Note</span>
                          </button>

                          <button
                            onClick={() => handlePurgeLog(log)}
                            className="p-1 text-zinc-600 hover:text-rose-400 rounded transition cursor-pointer"
                            title="Purge log from ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Purge Audit Log Confirmation Modal */}
        {logToPurge && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="text-base font-extrabold text-white">Purge Audit Log Record</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLogToPurge(null)}
                  className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
                <p className="font-mono text-rose-400 font-bold">
                  Log ID: {logToPurge.id}
                </p>
                <p className="text-white font-bold">{logToPurge.actionType} • {logToPurge.actionCategory}</p>
                <p className="text-zinc-400 text-[11px]">
                  Actor: @{logToPurge.actorUsername} ({logToPurge.actorClearance}) • Target: {logToPurge.targetName || 'N/A'}
                </p>
                <p className="text-zinc-500 text-[10px] line-clamp-2">
                  {logToPurge.details}
                </p>
              </div>

              <p className="text-xs text-zinc-400">
                Are you sure you want to permanently purge this audit log entry from the ledger? This action is irreversible.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setLogToPurge(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPurgeLog}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Purge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="text-zinc-400 font-mono">
            Showing <strong className="text-white">{filteredLogs.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(safePage * pageSize, filteredLogs.length)}</strong> of{' '}
            <strong className="text-rose-400">{filteredLogs.length}</strong> staff activity records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition font-bold cursor-pointer"
            >
              Prev
            </button>

            <span className="font-mono text-xs text-zinc-400">
              Page <strong className="text-white">{safePage}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Full Snapshot Diff & Metadata Inspector */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Staff Modification Snapshot Inspector</h3>
                  <p className="text-xs text-zinc-400 font-mono">Log ID: {inspectingLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs font-mono">
              <div>
                <span className="text-zinc-500">Staff Operator:</span>
                <p className="text-white font-bold">@{inspectingLog.actorUsername} ({inspectingLog.actorClearance})</p>
                <p className="text-zinc-400 text-[10px]">{inspectingLog.actorEmail}</p>
              </div>
              <div>
                <span className="text-zinc-500">Timestamp:</span>
                <p className="text-zinc-300 font-bold">{new Date(inspectingLog.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</p>
                <p className="text-zinc-500 text-[10px]">{new Date(inspectingLog.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}</p>
              </div>
              <div>
                <span className="text-zinc-500">Action:</span>
                <p className="text-rose-400 font-bold">{inspectingLog.actionType}</p>
              </div>
              <div>
                <span className="text-zinc-500">Target Entity:</span>
                <p className="text-amber-300 font-bold">{inspectingLog.targetName || inspectingLog.targetId || 'N/A'}</p>
              </div>
            </div>

            {/* Changes Diff Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Modified Document Fields (Before vs After)
              </h4>
              {inspectingLog.changes && inspectingLog.changes.length > 0 ? (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Field</th>
                        <th className="p-2.5 text-rose-400">Previous Value (Old)</th>
                        <th className="p-2.5 text-emerald-400">Modified Value (New)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 bg-zinc-950">
                      {inspectingLog.changes.map((c, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold text-white">{c.fieldLabel || c.field}</td>
                          <td className="p-2.5 text-zinc-400 bg-rose-950/20">{JSON.stringify(c.oldValue)}</td>
                          <td className="p-2.5 text-emerald-300 font-bold bg-emerald-950/20">{JSON.stringify(c.newValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900 rounded-xl text-zinc-400 text-xs">
                  No individual field diffs recorded. General action: {inspectingLog.details}
                </div>
              )}
            </div>

            {/* Metadata Payload */}
            {inspectingLog.metadata && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Client & Forensic Metadata</h4>
                <pre className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  {JSON.stringify(inspectingLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Attach L4 Supervisor Note */}
      {reviewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Attach L4 Supervisor Audit Note</h3>
                  <p className="text-xs text-zinc-400 font-mono">Operator: @{reviewingLog.actorUsername}</p>
                </div>
              </div>
              <button
                onClick={() => setReviewingLog(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">
                Supervisor Feedback / Compliance Verification Note:
              </label>
              <textarea
                value={supervisorNoteInput}
                onChange={(e) => setSupervisorNoteInput(e.target.value)}
                placeholder="e.g., Verified against support ticket #VICE-4421. Action fully authorized by L4 Administration."
                rows={4}
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setReviewingLog(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupervisorReview}
                disabled={isSavingReview}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingReview ? 'Saving...' : 'Save Supervisor Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
