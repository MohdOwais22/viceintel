'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Laptop,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
  FileImage,
  Sliders,
  Maximize2,
  Download,
  Flame,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Archive,
  RotateCcw,
  Inbox,
  CheckCircle
} from 'lucide-react';
import {
  IssueReport,
  subscribeToIssueReports,
  updateReportStatus,
  deleteIssueReport
} from '../../lib/report-service';

export const BugReportsAdminSection: React.FC = () => {
  const [reports, setReports] = useState<IssueReport[]>([]);
  // Main view segment: 'active' (pending/open/in_progress), 'resolved' (resolved/dismissed), or 'all'
  const [activeQueueView, setActiveQueueView] = useState<'active' | 'resolved' | 'all'>('active');
  const [statusSubFilter, setStatusSubFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected screenshot for full resolution lightbox preview
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxReportRef, setLightboxReportRef] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<IssueReport | null>(null);

  // Expandable telemetry details map
  const [expandedTelemetry, setExpandedTelemetry] = useState<{ [id: string]: boolean }>({});

  // Editing admin notes map
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; viewTarget?: 'active' | 'resolved' } | null>(null);

  // Subscribe to live Firestore issueReports & bugReports
  useEffect(() => {
    const unsubscribe = subscribeToIssueReports((firestoreReports) => {
      setReports(firestoreReports.sort((a, b) => b.createdAtMs - a.createdAtMs));
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredReports = reports.filter((report) => {
    // 1. Primary Queue View filter (Separating Active from Resolved)
    if (activeQueueView === 'active') {
      if (report.status === 'resolved' || report.status === 'dismissed') return false;
    } else if (activeQueueView === 'resolved') {
      if (report.status !== 'resolved' && report.status !== 'dismissed') return false;
    }

    // 2. Specific Sub-status filter
    if (statusSubFilter !== 'All' && report.status !== statusSubFilter) return false;
    if (categoryFilter !== 'All' && report.category !== categoryFilter) return false;
    if (severityFilter !== 'All' && report.severity !== severityFilter) return false;

    // 3. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = report.title.toLowerCase().includes(q);
      const matchDesc = report.description.toLowerCase().includes(q);
      const matchRef = report.reportRefNumber.toLowerCase().includes(q);
      const matchReporter = report.reporterName.toLowerCase().includes(q);
      const matchUrl = report.currentUrl.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRef && !matchReporter && !matchUrl) return false;
    }

    return true;
  });

  // Action handlers
  const handleStatusChange = async (reportId: string, newStatus: IssueReport['status']) => {
    const targetReport = reports.find((r) => r.id === reportId);
    const refNum = targetReport?.reportRefNumber || reportId;

    try {
      await updateReportStatus(reportId, newStatus, undefined, 'Admin HQ');
      
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus,
                resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : newStatus === 'open' || newStatus === 'in_progress' ? undefined : r.resolvedAt,
                resolvedBy: newStatus === 'resolved' ? 'Admin HQ' : newStatus === 'open' || newStatus === 'in_progress' ? undefined : r.resolvedBy
              }
            : r
        )
      );

      if (newStatus === 'resolved') {
        setActionNotice({
          message: `Report ${refNum} marked as RESOLVED and moved to Resolved Archive.`,
          viewTarget: 'resolved'
        });
      } else if (newStatus === 'in_progress') {
        setActionNotice({
          message: `Report ${refNum} moved to IN PROGRESS under investigation.`
        });
      } else if (newStatus === 'open' || newStatus === 'pending') {
        setActionNotice({
          message: `Report ${refNum} reopened and moved back to Active Queue.`,
          viewTarget: 'active'
        });
      } else if (newStatus === 'dismissed') {
        setActionNotice({
          message: `Report ${refNum} dismissed and moved to Archive.`,
          viewTarget: 'resolved'
        });
      }

      setTimeout(() => setActionNotice(null), 5000);
    } catch (e) {
      console.warn('Status update fallback (local state applied):', e);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    }
  };

  const handleSaveNotes = async (reportId: string) => {
    const note = editingNotes[reportId];
    if (note === undefined) return;

    setSavingNoteId(reportId);
    try {
      const report = reports.find((r) => r.id === reportId);
      await updateReportStatus(reportId, report?.status || 'open', note, 'Admin HQ');
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, adminNotes: note } : r))
      );
      setActionNotice({ message: 'Admin staff note saved successfully!' });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.warn('Notes save error:', e);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDelete = (report: IssueReport) => {
    setReportToDelete(report);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    const reportId = reportToDelete.id;
    const refNum = reportToDelete.reportRefNumber || reportId;
    setReportToDelete(null);

    try {
      await deleteIssueReport(reportId);
    } catch (e) {
      console.warn('Firestore report deletion notice:', e);
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setActionNotice({ message: `Report record ${refNum} permanently deleted from database.` });
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCopyDebugJson = (report: IssueReport) => {
    const debugPayload = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(debugPayload);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const activeReportsCount = reports.filter((r) => r.status === 'pending' || r.status === 'open' || r.status === 'in_progress').length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const openCount = reports.filter((r) => r.status === 'open').length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;
  const totalArchiveCount = resolvedCount + dismissedCount;
  const criticalActiveCount = reports.filter((r) => r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'dismissed').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert Notice */}
      {actionNotice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg shadow-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice.message}</span>
            {actionNotice.viewTarget && (
              <button
                type="button"
                onClick={() => {
                  setActiveQueueView(actionNotice.viewTarget!);
                  setStatusSubFilter('All');
                  setActionNotice(null);
                }}
                className="ml-2 px-2.5 py-1 bg-emerald-500/30 hover:bg-emerald-500/40 text-white rounded-lg text-[11px] font-bold border border-emerald-400/40 transition cursor-pointer underline"
              >
                {actionNotice.viewTarget === 'resolved' ? 'Go to Resolved Archive →' : 'Go to Active Queue →'}
              </button>
            )}
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics HUD Grid (Clickable Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div
          onClick={() => {
            setActiveQueueView('active');
            setStatusSubFilter('All');
          }}
          className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer transition ${
            activeQueueView === 'active' && statusSubFilter === 'All'
              ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono uppercase font-bold block truncate">Active Bug Queue</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5">{activeReportsCount}</div>
            <span className="text-[9px] sm:text-[10px] text-rose-300/80 truncate block">
              {pendingCount > 0 ? `${pendingCount} pending triage • ` : ''}{openCount + inProgressCount} open
            </span>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQueueView('active');
            setStatusSubFilter('in_progress');
          }}
          className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer transition ${
            activeQueueView === 'active' && statusSubFilter === 'in_progress'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono uppercase font-bold block truncate">In Progress</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">{inProgressCount}</div>
            <span className="text-[9px] sm:text-[10px] text-amber-300/80 truncate block">Under investigation</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQueueView('resolved');
            setStatusSubFilter('All');
          }}
          className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer transition ${
            activeQueueView === 'resolved'
              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono uppercase font-bold block truncate">Resolved Archive</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">{resolvedCount}</div>
            <span className="text-[9px] sm:text-[10px] text-emerald-300/80 truncate block">Closed & verified issues</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQueueView('active');
            setSeverityFilter('critical');
          }}
          className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer transition ${
            severityFilter === 'critical'
              ? 'bg-rose-950/70 border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono uppercase font-bold block truncate">Critical Blockers</span>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-0.5">{criticalActiveCount}</div>
            <span className="text-[9px] sm:text-[10px] text-rose-400 truncate block">Requires urgent fix</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-950/80 border border-rose-600/40 rounded-xl text-rose-300 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Main View Queue Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveQueueView('active');
              setStatusSubFilter('All');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeQueueView === 'active'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span>Active Bug Queue</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${activeQueueView === 'active' ? 'bg-black/40 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              {activeReportsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveQueueView('resolved');
              setStatusSubFilter('All');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeQueueView === 'resolved'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span>Resolved Archive</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${activeQueueView === 'resolved' ? 'bg-black/40 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              {totalArchiveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveQueueView('all');
              setStatusSubFilter('All');
            }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeQueueView === 'all'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>All History</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeQueueView === 'all' ? 'bg-black/40 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              {reports.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          Showing {filteredReports.length} {activeQueueView === 'active' ? 'active issues' : activeQueueView === 'resolved' ? 'resolved archives' : 'total records'}
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reference #, title, description, GamerTag, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusSubFilter}
              onChange={(e) => setStatusSubFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="All">All Sub-Statuses</option>
              {activeQueueView !== 'resolved' && (
                <>
                  <option value="pending">🔵 Pending Triage</option>
                  <option value="open">🚨 Open</option>
                  <option value="in_progress">🟡 In Progress</option>
                </>
              )}
              {activeQueueView !== 'active' && (
                <>
                  <option value="resolved">🟢 Resolved</option>
                  <option value="dismissed">⚪ Dismissed</option>
                </>
              )}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="bug">🐛 Bug</option>
              <option value="ui">🖥️ UI Glitch</option>
              <option value="performance">⚡ Performance</option>
              <option value="radar_sync">📡 Squad Radar</option>
              <option value="calculator">🔢 Calculator</option>
              <option value="voice_comms">🎙️ Voice Comms</option>
              <option value="billing_vip">💳 VIP Billing</option>
              <option value="suggestion">💡 Suggestion</option>
              <option value="other">📝 Other</option>
            </select>

            {(statusSubFilter !== 'All' || categoryFilter !== 'All' || severityFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusSubFilter('All');
                  setCategoryFilter('All');
                  setSeverityFilter('All');
                  setSearchQuery('');
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl font-bold transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Feed List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            {activeQueueView === 'active' ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-black text-white">Active Queue All Clear!</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are no pending or open bug reports requiring staff attention. All reported issues have been resolved.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveQueueView('resolved')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Resolved Archive ({resolvedCount})</span>
                </button>
              </>
            ) : (
              <>
                <Archive className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-base font-black text-white">No Resolved Records in Archive</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When active bug reports are marked as resolved, they will appear here automatically.
                </p>
              </>
            )}
          </div>
        ) : (
          filteredReports.map((report) => {
            const isTelemetryOpen = expandedTelemetry[report.id] || false;
            const currentNote = editingNotes[report.id] !== undefined ? editingNotes[report.id] : report.adminNotes || '';
            const isResolved = report.status === 'resolved';
            const isDismissed = report.status === 'dismissed';
            const isPending = report.status === 'pending';

            return (
              <div
                key={report.id}
                className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 transition ${
                  isResolved
                    ? 'border-emerald-500/40 bg-zinc-900/60 shadow-md shadow-emerald-950/10'
                    : isPending
                    ? 'border-sky-500/50 shadow-lg shadow-sky-950/20'
                    : report.status === 'open'
                    ? 'border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : report.status === 'in_progress'
                    ? 'border-amber-500/40 shadow-lg shadow-amber-950/10'
                    : 'border-zinc-800 opacity-75'
                }`}
              >
                {/* Resolved Banner if ticket is resolved */}
                {isResolved && (
                  <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-300 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Resolved & Closed</strong> by <span className="text-white">{report.resolvedBy || 'Admin HQ'}</span>
                        {report.resolvedAt && ` on ${new Date(report.resolvedAt).toLocaleString()}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                      Archived
                    </span>
                  </div>
                )}

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Reference Token Badge */}
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-zinc-950 text-zinc-200 border border-zinc-800 flex items-center gap-1.5">
                      <span>{report.reportRefNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(report.reportRefNumber);
                          setCopiedId(report.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="text-zinc-500 hover:text-white transition cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>

                    {/* Category Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {report.category.replace('_', ' ')}
                    </span>

                    {/* Severity Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        report.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : report.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : report.severity === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {report.severity} severity
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPending
                          ? 'bg-sky-500 text-zinc-950 font-black animate-pulse'
                          : report.status === 'open'
                          ? 'bg-rose-600 text-white font-black'
                          : report.status === 'in_progress'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : isResolved
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isPending ? 'Pending Triage' : report.status.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono">
                    Submitted: {new Date(report.createdAtMs).toLocaleString()}
                  </span>
                </div>

                {/* Main Content & Reporter Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Issue Description & Steps (2 Cols) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div>
                      <h4 className="text-base font-black text-white tracking-tight">{report.title}</h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>

                    {/* Steps to reproduce box */}
                    {report.stepsToReproduce && (
                      <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block">
                          Steps to Reproduce:
                        </span>
                        <p className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                          {report.stepsToReproduce}
                        </p>
                      </div>
                    )}

                    {/* Reporter Info Row */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 flex-wrap">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Reporter</span>
                        <strong className="text-white font-bold">@{report.reporterName}</strong>
                      </div>
                      {report.reporterEmail && (
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Email</span>
                          <span className="text-zinc-300 font-mono">{report.reporterEmail}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Clearance</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${report.isVip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400'}`}>
                          {report.reporterRole || 'Player'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Active Route</span>
                        <span className="text-cyan-400 font-mono text-[11px]">{report.activeTab}</span>
                      </div>
                    </div>
                  </div>

                  {/* 📸 Screenshot Evidence Card (1 Col) */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      <span>Visual Evidence & Screenshot</span>
                    </span>

                    {report.screenshotUrl ? (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-2">
                        <div
                          onClick={() => {
                            setLightboxImageUrl(report.screenshotUrl!);
                            setLightboxReportRef(report.reportRefNumber);
                          }}
                          className="relative aspect-video w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer group"
                        >
                          <img
                            src={report.screenshotUrl}
                            alt="Issue visual evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-xs transition">
                            <Maximize2 className="w-4 h-4" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
                          <span className="truncate max-w-[140px]">{report.screenshotFileName || 'screenshot.png'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxImageUrl(report.screenshotUrl!);
                              setLightboxReportRef(report.reportRefNumber);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Full Size
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center text-zinc-600 space-y-1">
                        <FileImage className="w-6 h-6 text-zinc-700" />
                        <span className="text-[10px] font-mono">No screenshot attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telemetry Drawer (Toggle) */}
                <div className="border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTelemetry((prev) => ({ ...prev, [report.id]: !prev[report.id] }))
                      }
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>{isTelemetryOpen ? 'Hide System Diagnostics' : 'Inspect Diagnostic Telemetry'}</span>
                      {isTelemetryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyDebugJson(report)}
                      className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === report.id ? 'Copied JSON' : 'Copy Debug JSON'}</span>
                    </button>
                  </div>

                  {isTelemetryOpen && (
                    <div className="mt-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-[11px] font-mono space-y-2 animate-fade-in text-zinc-400">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-zinc-600 block text-[10px]">Browser</span>
                          <span className="text-white">{report.browser}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block text-[10px]">Operating System</span>
                          <span className="text-white">{report.os}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block text-[10px]">Resolution</span>
                          <span className="text-white">{report.screenResolution}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block text-[10px]">Reporter UID</span>
                          <span className="text-zinc-300 truncate block">{report.reporterUid || 'Anonymous'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-900 space-y-1">
                        <span className="text-zinc-600 block text-[10px]">Origin URL</span>
                        <a
                          href={report.currentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline break-all text-[10px]"
                        >
                          {report.currentUrl}
                        </a>
                      </div>

                      {report.recentConsoleErrors && report.recentConsoleErrors.length > 0 && (
                        <div className="pt-2 border-t border-zinc-900 space-y-1">
                          <span className="text-rose-400 font-bold block text-[10px]">
                            Captured Client Runtime Errors:
                          </span>
                          <div className="bg-rose-950/30 border border-rose-500/20 p-2 rounded text-rose-200 text-[10px] space-y-1 max-h-24 overflow-y-auto">
                            {report.recentConsoleErrors.map((err, i) => (
                              <div key={i}>{err}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Staff Admin Notes & Actions Footer */}
                <div className="border-t border-zinc-800/80 pt-3.5 space-y-3">
                  {/* Admin Notes Input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Staff investigation notes or resolution summary..."
                      value={currentNote}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                      }
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      disabled={savingNoteId === report.id}
                      onClick={() => handleSaveNotes(report.id)}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs rounded-xl border border-zinc-700 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {savingNoteId === report.id ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-zinc-500 font-bold">Actions:</span>

                      {/* If Resolved or Dismissed: allow Reopening */}
                      {isResolved || isDismissed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(report.id, 'open')}
                            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
                            title="Move back to Active Bug Queue"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reopen Ticket (Move to Active Queue)</span>
                          </button>
                        </>
                      ) : (
                        /* If in Active Queue (Pending, Open, In Progress) */
                        <>
                          {report.status !== 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(report.id, 'in_progress')}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition cursor-pointer"
                            >
                              Mark In Progress
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStatusChange(report.id, 'resolved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/30 transition flex items-center gap-1.5 cursor-pointer"
                            title="Mark as resolved and move to Resolved Archive"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved (Move to Archive)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs rounded-xl border border-zinc-700 transition cursor-pointer"
                            title="Dismiss issue"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(report)}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-zinc-800 hover:border-rose-500/40 transition flex items-center gap-1 cursor-pointer"
                      title="Permanently remove report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Record</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Delete Bug Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
              <p className="font-mono text-rose-400 font-bold">
                {reportToDelete.reportRefNumber || reportToDelete.id}
              </p>
              <p className="text-white font-bold">{reportToDelete.title}</p>
              <p className="text-zinc-500 text-[11px]">
                Reported by @{reportToDelete.reporterName} • {new Date(reportToDelete.createdAtMs).toLocaleString()}
              </p>
            </div>

            <p className="text-xs text-zinc-400">
              Are you sure you want to permanently delete this issue report record? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Screenshot Lightbox Modal */}
      {lightboxImageUrl && (
        <div
          onClick={() => {
            setLightboxImageUrl(null);
            setLightboxReportRef(null);
          }}
          className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in backdrop-blur-md"
        >
          <div className="relative max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 font-mono">
              <span className="font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                Screenshot Evidence — {lightboxReportRef || 'Report Asset'}
              </span>
              <span className="text-zinc-500">Click anywhere to close</span>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img
                src={lightboxImageUrl}
                alt="Full resolution evidence"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
