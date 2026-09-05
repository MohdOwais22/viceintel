'use client';

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Sliders, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  Bot, 
  CreditCard, 
  Users, 
  UserCheck, 
  Activity, 
  Volume2, 
  VolumeX, 
  Zap, 
  ChevronRight, 
  Send, 
  Clock,
  Radio,
  Share2,
  Shield,
  Eye
} from 'lucide-react';
import { 
  ServerOwnerNotification, 
  ServerNotificationSettings, 
  ServerOwnerNotificationCategory, 
  ServerOwnerNotificationSeverity 
} from '../../types';
import { 
  markServerNotificationAsRead, 
  markAllServerNotificationsAsRead, 
  deleteServerNotification, 
  clearAllServerNotifications, 
  saveServerNotificationSettings 
} from '../../lib/server-notification-service';
import { playNotificationChime } from '../../lib/soundUtils';

interface ServerOwnerNotificationCenterProps {
  serverSlug: string;
  serverName: string;
  currentUserUid?: string;
  notifications: ServerOwnerNotification[];
  settings: ServerNotificationSettings;
  onUpdateSettings: (newSettings: ServerNotificationSettings) => void;
  onNavigateSection: (sectionKey: string) => void;
  onRefresh?: () => void;
}

export const ServerOwnerNotificationCenter: React.FC<ServerOwnerNotificationCenterProps> = ({
  serverSlug,
  serverName,
  currentUserUid,
  notifications,
  settings,
  onUpdateSettings,
  onNavigateSection,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter calculations
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) {
        return false;
      }
      // Unread only filter
      if (unreadOnly && n.read) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(query);
        const matchMsg = n.message?.toLowerCase().includes(query);
        const matchApplicant = n.metadata?.applicantName?.toLowerCase().includes(query);
        const matchDiscord = n.metadata?.applicantDiscordTag?.toLowerCase().includes(query);
        const matchReviewer = n.metadata?.reviewerName?.toLowerCase().includes(query);
        const matchType = n.type?.toLowerCase().includes(query);
        return matchTitle || matchMsg || matchApplicant || matchDiscord || matchReviewer || matchType;
      }
      return true;
    });
  }, [notifications, selectedCategory, unreadOnly, searchQuery]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const appNotifCount = useMemo(() => notifications.filter((n) => n.category === 'applications').length, [notifications]);
  const staffNotifCount = useMemo(() => notifications.filter((n) => n.category === 'staff').length, [notifications]);
  const billingNotifCount = useMemo(() => notifications.filter((n) => n.category === 'billing').length, [notifications]);
  const securityNotifCount = useMemo(() => notifications.filter((n) => n.category === 'security').length, [notifications]);
  const systemNotifCount = useMemo(() => notifications.filter((n) => n.category === 'system').length, [notifications]);

  const showNotificationToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleMarkAllRead = async () => {
    await markAllServerNotificationsAsRead(serverSlug, notifications.map(n => n.id));
    showNotificationToast('All server notifications marked as read.');
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notification history for this server?')) {
      await clearAllServerNotifications(serverSlug, notifications.map(n => n.id));
      showNotificationToast('Notification history cleared.');
    }
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
    saveServerNotificationSettings(serverSlug, updated);
    if (updated.soundEnabled) {
      playNotificationChime(true);
      showNotificationToast('Sound chimes enabled.');
    } else {
      showNotificationToast('Sound chimes muted.');
    }
  };

  // Severity rendering helpers
  const getSeverityBadge = (severity: ServerOwnerNotificationSeverity) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-500',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5" />
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-500',
          icon: <Zap className="w-3.5 h-3.5" />
        };
    }
  };

  const getCategoryIcon = (category: ServerOwnerNotificationCategory) => {
    switch (category) {
      case 'applications':
        return <UserCheck className="w-4 h-4 text-cyan-400" />;
      case 'staff':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'billing':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'system':
      default:
        return <Bot className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div id="server-owner-notification-center" className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Bell className="w-6 h-6 animate-pulse" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full ring-2 ring-zinc-950 shadow-md animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
                  <span>Server Sentinel & Notification Center</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    Live Dispatch
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Dedicated real-time alert feed for <span className="text-white font-medium">{serverName}</span>. Whitelist submissions, staff alerts, billing events, and security sentinels.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-toggle-notif-sound"
              onClick={handleToggleSound}
              title={settings.soundEnabled ? 'Mute Notification Chimes' : 'Enable Notification Chimes'}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                settings.soundEnabled 
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                  <span className="hidden sm:inline">Audio Muted</span>
                </>
              )}
            </button>

            <button
              id="btn-mark-all-read"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark All Read</span>
            </button>

            <button
              id="btn-open-notif-settings"
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 flex items-center gap-1.5 transition-all"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Preferences</span>
            </button>

            <button
              id="btn-clear-all-notifs"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="p-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 border border-zinc-700/80 text-zinc-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
              title="Clear All Notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toast message */}
        {actionSuccessMsg && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Metric Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Unread Alerts</span>
            <Bell className={`w-4 h-4 shrink-0 ${unreadCount > 0 ? 'text-cyan-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-white">{unreadCount}</span>
            <span className="text-xs text-zinc-500">of {notifications.length} total</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Applications</span>
            <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-white">{appNotifCount}</span>
            <span className="text-xs text-cyan-400/80 font-medium">submissions</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Staff & Security</span>
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-white">{staffNotifCount + securityNotifCount}</span>
            <span className="text-xs text-indigo-400/80 font-medium">events</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">Webhook & System</span>
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <span className="text-base sm:text-xl font-bold text-emerald-400 tracking-tight">Operational</span>
            <span className="text-[11px] text-zinc-500 font-medium shrink-0">100% SLA</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            id="filter-cat-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            id="filter-cat-apps"
            onClick={() => setSelectedCategory('applications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'applications'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Applications ({appNotifCount})</span>
          </button>
          <button
            id="filter-cat-staff"
            onClick={() => setSelectedCategory('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'staff'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff ({staffNotifCount})</span>
          </button>
          <button
            id="filter-cat-billing"
            onClick={() => setSelectedCategory('billing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'billing'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Spotlight ({billingNotifCount})</span>
          </button>
          <button
            id="filter-cat-security"
            onClick={() => setSelectedCategory('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'security'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security ({securityNotifCount})</span>
          </button>
          <button
            id="filter-cat-system"
            onClick={() => setSelectedCategory('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'system'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot & System ({systemNotifCount})</span>
          </button>
        </div>

        {/* Search & Unread Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search alerts or applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300 whitespace-nowrap">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span>Unread Only</span>
          </label>
        </div>
      </div>

      {/* Notification List Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Bell className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Notifications Found</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                {searchQuery || unreadOnly || selectedCategory !== 'all'
                  ? 'No notifications match your active search filters. Try clearing your filters.'
                  : 'Your server notification inbox is completely caught up. Incoming applications and system alerts will appear here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const badge = getSeverityBadge(notif.severity);
            return (
              <div
                key={notif.id}
                id={`server-notif-${notif.id}`}
                className={`bg-zinc-900 border rounded-xl p-4 transition-all hover:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.read
                    ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 via-zinc-900 to-zinc-900 shadow-sm'
                    : 'border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Category icon with severity background */}
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badge.bg}`}>
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" title="Unread" />
                      )}
                      <h4 className={`text-sm font-bold tracking-tight truncate ${!notif.read ? 'text-white' : 'text-zinc-300'}`}>
                        {notif.title}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        <span>{notif.severity}</span>
                      </span>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{notif.timestamp}</span>
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {/* Metadata Chips if present */}
                    {notif.metadata && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {notif.metadata.applicantName && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center gap-1">
                            <span className="text-zinc-500">Applicant:</span>
                            <span className="font-semibold text-cyan-300">{notif.metadata.applicantName}</span>
                          </span>
                        )}
                        {notif.metadata.applicantDiscordTag && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-mono">
                            {notif.metadata.applicantDiscordTag}
                          </span>
                        )}
                        {notif.metadata.reviewerName && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                            <span className="text-zinc-500">Reviewer:</span> {notif.metadata.reviewerName}
                          </span>
                        )}
                        {notif.metadata.statusDecision && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            notif.metadata.statusDecision === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : notif.metadata.statusDecision === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {notif.metadata.statusDecision}
                          </span>
                        )}
                        {notif.metadata.planName && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                            {notif.metadata.planName}
                          </span>
                        )}
                        {notif.metadata.pingMs !== undefined && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono">
                            {notif.metadata.pingMs}ms latency
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.actionSection && (
                    <button
                      id={`btn-action-${notif.id}`}
                      onClick={() => onNavigateSection(notif.actionSection!)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/90 hover:bg-cyan-500 text-white flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>{notif.actionLabel || 'Inspect'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    id={`btn-toggle-read-${notif.id}`}
                    onClick={() => markServerNotificationAsRead(notif.id, serverSlug)}
                    title={notif.read ? 'Mark as Read' : 'Mark as Read'}
                    className={`p-1.5 rounded-lg text-xs border transition-colors ${
                      notif.read 
                        ? 'text-zinc-600 border-zinc-800 hover:text-zinc-400' 
                        : 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
                    }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-delete-${notif.id}`}
                    onClick={() => deleteServerNotification(notif.id, serverSlug)}
                    title="Dismiss alert"
                    className="p-1.5 rounded-lg text-xs text-zinc-600 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Notification Preferences Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[99990] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl shadow-black ring-1 ring-cyan-500/20 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Server Alert Preferences</h3>
                  <p className="text-xs text-zinc-400">Configure delivery channels, sounds, and event thresholds.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Sound Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Audio Chimes for Incoming Alerts</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Play web synth sound on new applications and critical security alerts.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playNotificationChime(true)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-700/60 transition-colors"
                  >
                    Test Chime
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => {
                      const updated = { ...settings, soundEnabled: e.target.checked };
                      onUpdateSettings(updated);
                      saveServerNotificationSettings(serverSlug, updated);
                    }}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              {/* Event Subscriptions */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Alert Subscriptions</label>
                
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 cursor-pointer transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">New Whitelist Applications</span>
                    <input
                      type="checkbox"
                      checked={settings.notifyNewApplications}
                      onChange={(e) => {
                        const updated = { ...settings, notifyNewApplications: e.target.checked };
                        onUpdateSettings(updated);
                        saveServerNotificationSettings(serverSlug, updated);
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 cursor-pointer transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">Staff Decisions & Status Updates</span>
                    <input
                      type="checkbox"
                      checked={settings.notifyApplicationDecisions}
                      onChange={(e) => {
                        const updated = { ...settings, notifyApplicationDecisions: e.target.checked };
                        onUpdateSettings(updated);
                        saveServerNotificationSettings(serverSlug, updated);
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 cursor-pointer transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">Staff Invites & Role Claims</span>
                    <input
                      type="checkbox"
                      checked={settings.notifyStaffActivity}
                      onChange={(e) => {
                        const updated = { ...settings, notifyStaffActivity: e.target.checked };
                        onUpdateSettings(updated);
                        saveServerNotificationSettings(serverSlug, updated);
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 cursor-pointer transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">SaaS Billing, Renewals & Spotlight</span>
                    <input
                      type="checkbox"
                      checked={settings.notifyBillingAndSpotlight}
                      onChange={(e) => {
                        const updated = { ...settings, notifyBillingAndSpotlight: e.target.checked };
                        onUpdateSettings(updated);
                        saveServerNotificationSettings(serverSlug, updated);
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 cursor-pointer transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">Security Bursts & Anti-Abuse Sentinel</span>
                    <input
                      type="checkbox"
                      checked={settings.notifySecurityAlerts}
                      onChange={(e) => {
                        const updated = { ...settings, notifySecurityAlerts: e.target.checked };
                        onUpdateSettings(updated);
                        saveServerNotificationSettings(serverSlug, updated);
                      }}
                      className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
