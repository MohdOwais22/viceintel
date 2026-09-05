import {
  StaffAuditLog,
  StaffActionType,
  StaffActionCategory,
  StaffAuditSeverity,
  StaffFieldChange,
  UserRole
} from '../types';
import { isAdminUser, isStaffUser } from './rbac';
import { auth } from './firebase';

export const STAFF_LOGS_COLLECTION = 'staff_activity_logs';

/**
 * Realistic initial seed logs representing historic activities executed by L3 Staff & Moderators
 */
export const INITIAL_STAFF_AUDIT_LOGS: StaffAuditLog[] = [
  {
    id: 'staff_log_1001',
    timestamp: '2026-08-16T11:42:15.000Z',
    timestampMs: 1786966935000,
    actorId: 'usr_staff_marco',
    actorEmail: 'marco.staff@vicecity.app',
    actorUsername: 'ViceCityStaff_Marco',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'USER_EDIT',
    actionCategory: 'User Management',
    targetId: 'u1',
    targetName: '@ViceRacer99',
    targetType: 'user',
    severity: 'MEDIUM',
    details: 'Staff @ViceCityStaff_Marco updated VIP subscription profile and moderation notes for player @ViceRacer99.',
    changes: [
      { field: 'moderationNote', oldValue: 'New member review pending.', newValue: 'Active VIP supporter, clean record.', fieldLabel: 'Staff Moderation Note' },
      { field: 'publishedBuildsCount', oldValue: 2, newValue: 4, fieldLabel: 'Approved Custom Builds' }
    ],
    metadata: {
      clientIp: '198.51.100.44',
      browser: 'Chrome 128 (Windows 11)',
      reason: 'Periodic VIP account audit & build quota sync'
    },
    isReviewedByL4: true,
    reviewedAt: '2026-08-16T11:55:00.000Z',
    reviewedBy: 'Admin_L4_Lucia',
    l4ReviewNote: 'Verified and approved profile adjustments.'
  },
  {
    id: 'staff_log_1002',
    timestamp: '2026-08-16T11:15:30.000Z',
    timestampMs: 1786965330000,
    actorId: 'usr_staff_marco',
    actorEmail: 'marco.staff@vicecity.app',
    actorUsername: 'ViceCityStaff_Marco',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'USER_BAN_SUSPEND',
    actionCategory: 'User Management',
    targetId: 'u3',
    targetName: '@SpamBot_404',
    targetType: 'user',
    severity: 'CRITICAL',
    details: 'Staff @ViceCityStaff_Marco suspended account @SpamBot_404 for phishing broadcast in #general channel.',
    changes: [
      { field: 'status', oldValue: 'Active', newValue: 'Suspended', fieldLabel: 'Account Status' },
      { field: 'moderationNote', oldValue: '', newValue: 'Flagged for automated spam in community channels.', fieldLabel: 'Infraction Record' }
    ],
    metadata: {
      clientIp: '198.51.100.44',
      triggerReportId: 'p3',
      evidenceUrl: 'fake-gta6-bonus.com'
    },
    isReviewedByL4: true,
    reviewedAt: '2026-08-16T11:20:10.000Z',
    reviewedBy: 'Admin_L4_Lucia',
    l4ReviewNote: 'Confirmed malicious phishing link. Permanent suspension upheld.'
  },
  {
    id: 'staff_log_1003',
    timestamp: '2026-08-16T10:48:00.000Z',
    timestampMs: 1786963680000,
    actorId: 'usr_staff_elena',
    actorEmail: 'elena.mod@vicecity.app',
    actorUsername: 'Staff_L3_Elena',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'REPORT_RESOLVE',
    actionCategory: 'Moderation Queue',
    targetId: 'p3',
    targetName: 'Phishing Scam by Spammer_Vice',
    targetType: 'report',
    severity: 'HIGH',
    details: 'Staff @Staff_L3_Elena deleted reported message from live chat and resolved ticket #VICE-REP-8812.',
    changes: [
      { field: 'messageStatus', oldValue: 'Active Live', newValue: 'Deleted by Moderator', fieldLabel: 'Chat Message State' },
      { field: 'reportStatus', oldValue: 'Pending', newValue: 'Resolved', fieldLabel: 'Moderation Ticket' }
    ],
    metadata: {
      messageId: 'msg_spam_sample',
      reporter: 'ViceCityPlayer99'
    },
    isReviewedByL4: false
  },
  {
    id: 'staff_log_1004',
    timestamp: '2026-08-16T09:30:12.000Z',
    timestampMs: 1786959012000,
    actorId: 'usr_staff_marco',
    actorEmail: 'marco.staff@vicecity.app',
    actorUsername: 'ViceCityStaff_Marco',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'MODERATION_APPROVAL',
    actionCategory: 'Moderation Queue',
    targetId: 'p1',
    targetName: 'Miami Vice City Realism RP (128 Slots)',
    targetType: 'server',
    severity: 'MEDIUM',
    details: 'Staff @ViceCityStaff_Marco verified and approved FiveM RP Server submission into public server directory.',
    changes: [
      { field: 'isWhitelisted', oldValue: false, newValue: true, fieldLabel: 'Server Directory Whitelist' },
      { field: 'approvalStatus', oldValue: 'Pending Review', newValue: 'Approved & Listed', fieldLabel: 'Review State' }
    ],
    metadata: {
      framework: 'FiveM',
      connectUrl: 'cfx.re/join/miamivice99',
      submittedBy: 'ViceServerOwner'
    },
    isReviewedByL4: false
  },
  {
    id: 'staff_log_1005',
    timestamp: '2026-08-16T08:15:45.000Z',
    timestampMs: 1786954545000,
    actorId: 'usr_staff_elena',
    actorEmail: 'elena.mod@vicecity.app',
    actorUsername: 'Staff_L3_Elena',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'BUG_REPORT_STATUS_CHANGE',
    actionCategory: 'Bug Reports',
    targetId: 'rep_sample_01',
    targetName: 'Squad Tactical Radar markers freeze (VICE-BUG-9142)',
    targetType: 'bug_report',
    severity: 'MEDIUM',
    details: 'Staff @Staff_L3_Elena triaged bug report #VICE-BUG-9142, confirmed reproduction steps and escalated priority to High.',
    changes: [
      { field: 'status', oldValue: 'pending', newValue: 'investigating', fieldLabel: 'Ticket Status' },
      { field: 'assignedEngineer', oldValue: 'Unassigned', newValue: 'Lead Systems Dev', fieldLabel: 'Engineering Assignment' }
    ],
    metadata: {
      affectedTab: 'map',
      reporter: 'ViceRacer_99'
    },
    isReviewedByL4: false
  },
  {
    id: 'staff_log_1006',
    timestamp: '2026-08-15T22:10:00.000Z',
    timestampMs: 1786918200000,
    actorId: 'usr_staff_kai',
    actorEmail: 'kai.mod@vicecity.app',
    actorUsername: 'ViceModerator_Kai',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'USER_VC_ADJUST',
    actionCategory: 'User Management',
    targetId: 'u1',
    targetName: '@ViceRacer99',
    targetType: 'user',
    severity: 'HIGH',
    details: 'Staff @ViceModerator_Kai awarded +250 VC Credits to @ViceRacer99 as bug bounty reward for verified radar bug reproduction.',
    changes: [
      { field: 'vcBalance', oldValue: 1000, newValue: 1250, fieldLabel: 'Vice City Balance' }
    ],
    metadata: {
      rewardCategory: 'Bug Hunter Bounty',
      ticketRef: 'VICE-BUG-9142'
    },
    isReviewedByL4: true,
    reviewedAt: '2026-08-15T22:45:00.000Z',
    reviewedBy: 'Admin_L4_Lucia',
    l4ReviewNote: 'Bounty grant verified against engineering bug report.'
  },
  {
    id: 'staff_log_1007',
    timestamp: '2026-08-15T19:22:40.000Z',
    timestampMs: 1786908160000,
    actorId: 'usr_staff_marco',
    actorEmail: 'marco.staff@vicecity.app',
    actorUsername: 'ViceCityStaff_Marco',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'CMS_CONTENT_CREATE',
    actionCategory: 'Content CMS',
    targetId: 'veh_bravado_interceptor_2026',
    targetName: 'Bravado Buffalo EV - Interceptor Spec',
    targetType: 'vehicle',
    severity: 'MEDIUM',
    details: 'Staff @ViceCityStaff_Marco published new vehicle specification to the live Vehicle Catalog.',
    changes: [
      { field: 'catalogStatus', oldValue: 'Draft', newValue: 'Published Live', fieldLabel: 'Vehicle Entry State' }
    ],
    metadata: {
      brand: 'Bravado',
      topSpeed: '168 MPH',
      price: '$1,250,000'
    },
    isReviewedByL4: false
  },
  {
    id: 'staff_log_1008',
    timestamp: '2026-08-15T16:04:19.000Z',
    timestampMs: 1786896259000,
    actorId: 'usr_staff_elena',
    actorEmail: 'elena.mod@vicecity.app',
    actorUsername: 'Staff_L3_Elena',
    actorRole: 'Staff',
    actorClearance: 'L3',
    actionType: 'CHANNEL_MODERATION',
    actionCategory: 'Community Chat',
    targetId: 'chan_underground_tuners',
    targetName: '# Underground Tuners VIP Hub',
    targetType: 'channel',
    severity: 'MEDIUM',
    details: 'Staff @Staff_L3_Elena kicked member @ToxicRacer_X from channel for harassment rule violations.',
    changes: [
      { field: 'channelMembership', oldValue: 'Member', newValue: 'Kicked', fieldLabel: 'Channel Access' }
    ],
    metadata: {
      channelId: 'chan_underground_tuners',
      kickedUserId: 'usr_toxic_x',
      reason: 'Harassment in public channel'
    },
    isReviewedByL4: false
  }
];

export interface LogStaffActivityParams {
  actionType: StaffActionType;
  actionCategory: StaffActionCategory;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  severity?: StaffAuditSeverity;
  details: string;
  changes?: StaffFieldChange[];
  metadata?: Record<string, any>;
  actorOverride?: {
    actorId?: string;
    actorEmail?: string;
    actorUsername?: string;
    actorRole?: UserRole | string;
    actorClearance?: 'L3' | 'L4' | string;
  };
}

/**
 * Logs an activity performed by an L3 Staff member or L4 Admin to MongoDB single source of truth
 */
export async function logStaffActivity(params: LogStaffActivityParams): Promise<StaffAuditLog> {
  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampMs = now.getTime();
  const logId = `staff_log_${timestampMs}_${Math.random().toString(36).substring(2, 7)}`;

  const currentAuthUser = auth.currentUser;
  const currentEmail = params.actorOverride?.actorEmail || currentAuthUser?.email || 'staff@vicecity.app';
  const isL4 = isAdminUser(params.actorOverride?.actorRole, currentEmail);
  const isL3 = isStaffUser(params.actorOverride?.actorRole, currentEmail);

  const actorRole: UserRole = (params.actorOverride?.actorRole as UserRole) || (isL4 ? 'Admin' : (isL3 ? 'Staff' : 'Staff'));
  const actorClearance: 'L3' | 'L4' = isL4 ? 'L4' : 'L3';
  const actorUsername = params.actorOverride?.actorUsername ||
    currentAuthUser?.displayName ||
    (isL4 ? 'Admin_L4_Lucia' : (currentEmail?.split('@')[0] || 'ViceCityStaff_Marco'));
  const actorId = params.actorOverride?.actorId || currentAuthUser?.uid || 'usr_staff_active';

  // Determine automatic default severity if omitted
  let severity: StaffAuditSeverity = params.severity || 'LOW';
  if (!params.severity) {
    if (params.actionType === 'USER_BAN_SUSPEND' || params.actionType === 'USER_ROLE_CHANGE') {
      severity = 'CRITICAL';
    } else if (params.actionType === 'USER_VC_ADJUST' || params.actionType === 'CMS_CONTENT_DELETE' || params.actionType === 'REPORT_RESOLVE') {
      severity = 'HIGH';
    } else if (params.actionType === 'MODERATION_APPROVAL' || params.actionType === 'MODERATION_REJECTION' || params.actionType === 'BUG_REPORT_STATUS_CHANGE') {
      severity = 'MEDIUM';
    }
  }

  const logEntry: StaffAuditLog = {
    id: logId,
    timestamp: timestampIso,
    timestampMs,
    actorId,
    actorEmail: currentEmail,
    actorUsername,
    actorRole,
    actorClearance,
    actionType: params.actionType,
    actionCategory: params.actionCategory,
    targetId: params.targetId || undefined,
    targetName: params.targetName || undefined,
    targetType: params.targetType || undefined,
    severity,
    details: params.details,
    changes: params.changes && params.changes.length > 0 ? params.changes : undefined,
    metadata: {
      ...params.metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js/Server',
      clientTimestamp: timestampIso
    },
    isReviewedByL4: isL4, // Auto-reviewed if performed by L4 Super Admin
    reviewedAt: isL4 ? timestampIso : undefined,
    reviewedBy: isL4 ? actorUsername : undefined,
    l4ReviewNote: isL4 ? 'Executed directly by Level 4 Administrator.' : undefined
  };

  // Cache locally
  try {
    const cached = localStorage.getItem('gtavi_staff_audit_logs');
    const logsList: StaffAuditLog[] = cached ? JSON.parse(cached) : [];
    logsList.unshift(logEntry);
    localStorage.setItem('gtavi_staff_audit_logs', JSON.stringify(logsList.slice(0, 500)));
  } catch {}

  // Dispatch custom event for immediate UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gtavi_staff_log_created', { detail: logEntry }));
  }

  // Persist directly to MongoDB via REST API (Single source of truth)
  try {
    await fetch('/api/admin/staff-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  } catch (apiErr) {
    console.warn('[StaffAuditLogger] Error sending staff log to server:', apiErr);
  }

  return logEntry;
}

/**
 * Subscribes to Staff Activity Logs from MongoDB (L4 Admin Only) using API polling & event hooks
 */
export function subscribeToStaffAuditLogs(
  onUpdate: (logs: StaffAuditLog[]) => void,
  maxLimit = 150
): () => void {
  let isMounted = true;

  const fetchLogsFromMongo = async () => {
    try {
      const res = await fetch(`/api/admin/staff-logs?limit=${maxLimit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs) && isMounted) {
          const sorted = [...data.logs].sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
          onUpdate(sorted);
          try {
            localStorage.setItem('gtavi_staff_audit_logs', JSON.stringify(sorted.slice(0, maxLimit)));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.debug('[StaffAuditLogger] Fetch notice:', err);
    }

    // Fallback to local cache or initial seeds
    if (isMounted) {
      try {
        const cached = localStorage.getItem('gtavi_staff_audit_logs');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            onUpdate(parsed);
            return;
          }
        }
      } catch {}
      onUpdate(INITIAL_STAFF_AUDIT_LOGS);
    }
  };

  // Initial load
  fetchLogsFromMongo();

  // Poll every 8 seconds for real-time updates from MongoDB
  const intervalId = setInterval(fetchLogsFromMongo, 8000);

  // Listen for local creation & update events
  const handleLocalLog = () => {
    fetchLogsFromMongo();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('gtavi_staff_log_created', handleLocalLog);
    window.addEventListener('gtavi_staff_log_updated', handleLocalLog);
  }

  return () => {
    isMounted = false;
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('gtavi_staff_log_created', handleLocalLog);
      window.removeEventListener('gtavi_staff_log_updated', handleLocalLog);
    }
  };
}

/**
 * Seeds initial demo logs into MongoDB if needed
 */
export async function seedInitialStaffAuditLogs(): Promise<void> {
  try {
    for (const log of INITIAL_STAFF_AUDIT_LOGS) {
      await fetch('/api/admin/staff-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
    }
  } catch (err) {
    console.warn('[StaffAuditLogger] Seed initial logs notice:', err);
  }
}

/**
 * L4 Super Administrator review & verification action on MongoDB
 */
export async function reviewStaffAuditLog(
  logId: string,
  params: {
    reviewerName: string;
    isApproved: boolean;
    note?: string;
  }
): Promise<void> {
  const updatePayload = {
    isReviewedByL4: true,
    reviewedAt: new Date().toISOString(),
    reviewedBy: params.reviewerName,
    l4ReviewNote: params.note || (params.isApproved ? 'Verified and approved by L4 Super Admin.' : 'Flagged for investigation by L4 Super Admin.')
  };

  try {
    const cached = localStorage.getItem('gtavi_staff_audit_logs');
    if (cached) {
      const logsList: StaffAuditLog[] = JSON.parse(cached);
      const idx = logsList.findIndex(l => l.id === logId);
      if (idx !== -1) {
        logsList[idx] = { ...logsList[idx], ...updatePayload };
        localStorage.setItem('gtavi_staff_audit_logs', JSON.stringify(logsList));
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gtavi_staff_log_updated', { detail: { logId, ...updatePayload } }));
    }
  } catch {}

  try {
    await fetch(`/api/admin/staff-logs/${logId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
  } catch (e) {
    console.warn('[StaffAuditLogger] Error reviewing log in MongoDB:', e);
  }
}

/**
 * Purges a specific audit log from MongoDB (L4 Admin Only)
 */
export async function purgeStaffAuditLog(logId: string): Promise<void> {
  try {
    const cached = localStorage.getItem('gtavi_staff_audit_logs');
    if (cached) {
      const logsList: StaffAuditLog[] = JSON.parse(cached);
      localStorage.setItem('gtavi_staff_audit_logs', JSON.stringify(logsList.filter(l => l.id !== logId)));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gtavi_staff_log_updated', { detail: { logId, deleted: true } }));
    }
  } catch {}

  try {
    await fetch(`/api/admin/staff-logs/${logId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('[StaffAuditLogger] Error deleting log from MongoDB:', e);
  }
}

/**
 * Helper to export audit logs to a formatted CSV string
 */
export function exportAuditLogsToCsv(logs: StaffAuditLog[]): string {
  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'Staff GamerTag',
    'Staff Email',
    'Clearance Level',
    'Action Type',
    'Category',
    'Severity',
    'Target Name / ID',
    'Target Type',
    'Details',
    'Modified Fields (Diff)',
    'L4 Reviewed Status',
    'L4 Reviewer',
    'L4 Supervisor Note'
  ];

  const rows = logs.map((log) => {
    const diffsText = log.changes
      ? log.changes.map(c => `${c.fieldLabel || c.field}: [${JSON.stringify(c.oldValue)} -> ${JSON.stringify(c.newValue)}]`).join('; ')
      : 'N/A';

    return [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.actorUsername}"`,
      `"${log.actorEmail}"`,
      `"${log.actorClearance}"`,
      `"${log.actionType}"`,
      `"${log.actionCategory}"`,
      `"${log.severity}"`,
      `"${(log.targetName || log.targetId || '').replace(/"/g, '""')}"`,
      `"${log.targetType || 'N/A'}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${diffsText.replace(/"/g, '""')}"`,
      `"${log.isReviewedByL4 ? 'VERIFIED' : 'PENDING REVIEW'}"`,
      `"${log.reviewedBy || ''}"`,
      `"${(log.l4ReviewNote || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Helper to export audit logs to formatted JSON
 */
export function exportAuditLogsToJson(logs: StaffAuditLog[]): string {
  return JSON.stringify(logs, null, 2);
}
