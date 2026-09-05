/**
 * Server Owner Notification Service
 * Dedicated real-time alert and notification engine for RP Server Owners & Staff.
 * Supports Firestore synchronization with bounded limits, LocalStorage fallback,
 * sound chimes, and Discord webhook integration.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { safeFirestoreWrite, isFirestoreQuotaExhausted } from './firebase/firestoreCircuitBreaker';
import { 
  ServerOwnerNotification, 
  ServerNotificationSettings, 
  ServerOwnerNotificationType 
} from '../types';
import { playNotificationChime } from './soundUtils';
import { normalizeServerSlug } from './whitelist-service';

export const SERVER_NOTIFICATIONS_COLLECTION = 'serverOwnerNotifications';
const SETTINGS_STORAGE_PREFIX = 'gtavi_server_notif_settings_';
const CACHE_STORAGE_PREFIX = 'gtavi_server_notifs_cache_';

export const DEFAULT_SERVER_NOTIF_SETTINGS: ServerNotificationSettings = {
  soundEnabled: true,
  browserPushEnabled: false,
  discordWebhookForwarding: true,
  notifyNewApplications: true,
  notifyApplicationDecisions: true,
  notifyBillingAndSpotlight: true,
  notifySecurityAlerts: true,
  notifyUptimePings: false,
  notifyStaffActivity: true,
  minSeverity: 'all'
};

/**
 * Get Notification Settings for a specific server
 */
export function getServerNotificationSettings(serverSlug: string): ServerNotificationSettings {
  const norm = normalizeServerSlug(serverSlug || 'default');
  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${norm}`);
    if (raw) {
      return { ...DEFAULT_SERVER_NOTIF_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[ServerNotifService] Could not parse settings from localStorage:', err);
  }
  return DEFAULT_SERVER_NOTIF_SETTINGS;
}

/**
 * Save Notification Settings for a specific server
 */
export function saveServerNotificationSettings(serverSlug: string, settings: ServerNotificationSettings): void {
  const norm = normalizeServerSlug(serverSlug || 'default');
  try {
    localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${norm}`, JSON.stringify(settings));
  } catch (err) {
    console.warn('[ServerNotifService] Failed to save settings:', err);
  }
}

/**
 * Generate initial server notifications - Returns empty array (no dummy notifications).
 */
export function generateInitialServerNotifications(serverSlug: string, serverName: string = 'Vice City Life RP'): ServerOwnerNotification[] {
  // Return empty array - no dummy notifications
  return [];
}

/**
 * Read local cache for server notifications (filters out legacy seed notifications)
 */
function getCachedServerNotifications(serverSlug: string): ServerOwnerNotification[] {
  const norm = normalizeServerSlug(serverSlug || 'default');
  try {
    const raw = localStorage.getItem(`${CACHE_STORAGE_PREFIX}${norm}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy dummy/seed notifications
        return parsed.filter((n: ServerOwnerNotification) => n && n.id && !n.id.startsWith('seed_notif_'));
      }
    }
  } catch (e) {
    console.warn('[ServerNotifService] Cache read error:', e);
  }
  return [];
}

/**
 * Save to local cache
 */
function setCachedServerNotifications(serverSlug: string, notifications: ServerOwnerNotification[]): void {
  const norm = normalizeServerSlug(serverSlug || 'default');
  try {
    localStorage.setItem(`${CACHE_STORAGE_PREFIX}${norm}`, JSON.stringify(notifications.slice(0, 50)));
  } catch (e) {
    console.warn('[ServerNotifService] Cache write error:', e);
  }
}

/**
 * Subscribe to Real-Time Server Owner Notifications
 * Uses a strict limit(30) query to guarantee low read quota consumption.
 */
export function subscribeToServerNotifications(
  serverSlug: string,
  serverName: string,
  ownerUid: string | undefined,
  onUpdate: (notifications: ServerOwnerNotification[]) => void
): Unsubscribe {
  const normSlug = normalizeServerSlug(serverSlug || 'default');
  
  // 1. Immediately provide cached data
  const localData = getCachedServerNotifications(normSlug).filter(n => !n.id.startsWith('seed_notif_'));
  onUpdate(localData);

  // 2. Set up Firestore listener if quota not exhausted
  if (isFirestoreQuotaExhausted()) {
    return () => {};
  }

  try {
    const collRef = collection(db, SERVER_NOTIFICATIONS_COLLECTION);
    const q = query(
      collRef,
      where('serverSlug', 'in', [normSlug, serverSlug, `srv_${normSlug}`]),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          const cached = getCachedServerNotifications(normSlug).filter(n => !n.id.startsWith('seed_notif_'));
          onUpdate(cached);
          return;
        }

        const remoteList: ServerOwnerNotification[] = [];
        snapshot.forEach((d) => {
          if (!d.id.startsWith('seed_notif_')) {
            remoteList.push({ id: d.id, ...d.data() } as ServerOwnerNotification);
          }
        });

        // Merge remote records with any local-only records and deduplicate by id
        const mergedMap = new Map<string, ServerOwnerNotification>();
        localData.forEach(item => {
          if (!item.id.startsWith('seed_notif_')) mergedMap.set(item.id, item);
        });
        remoteList.forEach(item => {
          if (!item.id.startsWith('seed_notif_')) mergedMap.set(item.id, item);
        });

        const finalSorted = Array.from(mergedMap.values())
          .filter(n => !n.archived && !n.id.startsWith('seed_notif_'))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setCachedServerNotifications(normSlug, finalSorted);
        onUpdate(finalSorted);
      },
      (err) => {
        console.warn('[ServerNotifService] Firestore listener notice (fallback to local cache):', err);
        const cached = getCachedServerNotifications(normSlug).filter(n => !n.id.startsWith('seed_notif_'));
        onUpdate(cached);
      }
    );

    return unsub;
  } catch (err) {
    console.warn('[ServerNotifService] Listener setup error, using local mode:', err);
    return () => {};
  }
}

/**
 * Dispatch a new Server Owner Notification
 */
export async function dispatchServerOwnerNotification(
  notification: Omit<ServerOwnerNotification, 'id' | 'createdAt' | 'read' | 'timestamp'> & {
    id?: string;
    createdAt?: number;
    read?: boolean;
    timestamp?: string;
  }
): Promise<string> {
  const normSlug = normalizeServerSlug(notification.serverSlug || notification.serverId);
  const notifId = notification.id || `srv_notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = Date.now();

  const finalNotification: ServerOwnerNotification = {
    ...notification,
    id: notifId,
    serverSlug: normSlug,
    serverId: normSlug,
    createdAt: notification.createdAt || now,
    timestamp: notification.timestamp || new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: notification.read ?? false,
    severity: notification.severity || 'info',
    category: notification.category || 'system'
  };

  // 1. Update Local Cache
  const existing = getCachedServerNotifications(normSlug);
  const updated = [finalNotification, ...existing.filter(n => n.id !== notifId)].slice(0, 50);
  setCachedServerNotifications(normSlug, updated);

  // 2. Play Audio Chime if enabled
  const settings = getServerNotificationSettings(normSlug);
  if (settings.soundEnabled) {
    try {
      playNotificationChime(true);
    } catch {}
  }

  // 3. Persist to Firestore with circuit breaker
  try {
    await safeFirestoreWrite(async () => {
      const docRef = doc(db, SERVER_NOTIFICATIONS_COLLECTION, notifId);
      await setDoc(docRef, finalNotification, { merge: true });
    });
  } catch (err) {
    console.warn('[ServerNotifService] Firestore write failed, preserved in local cache:', err);
  }

  return notifId;
}

/**
 * Mark a single Server Owner Notification as read
 */
export async function markServerNotificationAsRead(id: string, serverSlug: string): Promise<void> {
  const norm = normalizeServerSlug(serverSlug);
  
  // Local cache
  const cached = getCachedServerNotifications(norm);
  const updated = cached.map(n => n.id === id ? { ...n, read: true } : n);
  setCachedServerNotifications(norm, updated);

  // Firestore update
  try {
    await safeFirestoreWrite(async () => {
      const docRef = doc(db, SERVER_NOTIFICATIONS_COLLECTION, id);
      await setDoc(docRef, { read: true }, { merge: true });
    });
  } catch (err) {
    console.warn('[ServerNotifService] Remote mark read error:', err);
  }
}

/**
 * Mark all Server Owner Notifications as read for a server
 */
export async function markAllServerNotificationsAsRead(serverSlug: string, notificationIds?: string[]): Promise<void> {
  const norm = normalizeServerSlug(serverSlug);

  // Local cache
  const cached = getCachedServerNotifications(norm);
  const updated = cached.map(n => ({ ...n, read: true }));
  setCachedServerNotifications(norm, updated);

  // Firestore
  const ids = notificationIds || cached.map(n => n.id);
  for (const id of ids.slice(0, 15)) {
    try {
      safeFirestoreWrite(async () => {
        const docRef = doc(db, SERVER_NOTIFICATIONS_COLLECTION, id);
        await setDoc(docRef, { read: true }, { merge: true });
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Delete / Dismiss a Server Owner Notification
 */
export async function deleteServerNotification(id: string, serverSlug: string): Promise<void> {
  const norm = normalizeServerSlug(serverSlug);

  // Local cache
  const cached = getCachedServerNotifications(norm);
  const updated = cached.filter(n => n.id !== id);
  setCachedServerNotifications(norm, updated);

  // Firestore
  try {
    await safeFirestoreWrite(async () => {
      const docRef = doc(db, SERVER_NOTIFICATIONS_COLLECTION, id);
      await deleteDoc(docRef);
    });
  } catch (err) {
    console.warn('[ServerNotifService] Remote delete error:', err);
  }
}

/**
 * Clear All Notifications for a server
 */
export async function clearAllServerNotifications(serverSlug: string, notificationIds?: string[]): Promise<void> {
  const norm = normalizeServerSlug(serverSlug);
  
  const cached = getCachedServerNotifications(norm);
  setCachedServerNotifications(norm, []);

  const ids = notificationIds || cached.map(n => n.id);
  for (const id of ids.slice(0, 20)) {
    try {
      safeFirestoreWrite(async () => {
        const docRef = doc(db, SERVER_NOTIFICATIONS_COLLECTION, id);
        await deleteDoc(docRef);
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Pre-configured Test Notification Triggers for Owner Dashboard
 */
export const TEST_SERVER_NOTIFICATION_TEMPLATES: Array<{
  id: string;
  name: string;
  type: ServerOwnerNotificationType;
  category: ServerOwnerNotification['category'];
  severity: ServerOwnerNotification['severity'];
  title: string;
  message: string;
  actionSection: string;
  actionLabel: string;
  metadata: Record<string, any>;
}> = [
  {
    id: 'test_applicant_submission',
    name: '📝 New Whitelist Application',
    type: 'NEW_APPLICATION',
    category: 'applications',
    severity: 'info',
    title: 'New Whitelist Application Submitted',
    message: 'Antonio "El Martillo" Rossi submitted a whitelist application for "Underground Street Racer & Chop Shop Mechanic".',
    actionSection: 'applications',
    actionLabel: 'Inspect Application',
    metadata: {
      applicantName: 'Antonio Rossi',
      applicantDiscordTag: 'AntonioRossi#7721',
      applicantRoleplayPath: 'Underground Street Racer & Chop Shop Mechanic',
      statusDecision: 'pending'
    }
  },
  {
    id: 'test_application_approved',
    name: '✅ Application Approved by Staff',
    type: 'APPLICATION_REVIEWED',
    category: 'applications',
    severity: 'success',
    title: 'Application Approved by Staff',
    message: 'Staff Moderator "ViceMod_Jason" approved Dr. Elena Vance for "Vice General Hospital Trauma Surgeon".',
    actionSection: 'applications',
    actionLabel: 'View Applications',
    metadata: {
      applicantName: 'Dr. Elena Vance',
      reviewerName: 'ViceMod_Jason',
      statusDecision: 'approved',
      reviewerNotes: 'Excellent medical lore backstory and clear voice roleplay background.'
    }
  },
  {
    id: 'test_staff_invite',
    name: '🛡️ Staff Invite Accepted',
    type: 'STAFF_INVITE_ACCEPTED',
    category: 'staff',
    severity: 'success',
    title: 'New Staff Reviewer Joined',
    message: 'GamerTag "OceanDriveJudge" accepted your Quick Invite link and joined the Whitelist Reviewer Team.',
    actionSection: 'quick_invites',
    actionLabel: 'Manage Staff Invites',
    metadata: {
      reviewerName: 'OceanDriveJudge'
    }
  },
  {
    id: 'test_stripe_renewal',
    name: '💳 SaaS Subscription Renewed',
    type: 'SUBSCRIPTION_RENEWED',
    category: 'billing',
    severity: 'success',
    title: 'Enterprise Server Spot Renewed',
    message: 'Your Monthly SaaS Subscription ($49.00/mo) renewed successfully. Unlimited whitelist submissions active.',
    actionSection: 'billing',
    actionLabel: 'View Billing & Invoice',
    metadata: {
      planName: 'B2B Sponsored RP Server Spot',
      invoiceAmount: '$49.00',
      expiryDate: '2027-09-03'
    }
  },
  {
    id: 'test_webhook_failure',
    name: '⚠️ Discord Webhook Latency Alert',
    type: 'DISCORD_WEBHOOK_ALERT',
    category: 'system',
    severity: 'warning',
    title: 'Discord Webhook Latency Notice',
    message: 'Outbound webhook response latency reached 840ms. Automatic retry sentinel dispatched message successfully.',
    actionSection: 'bot_gateway',
    actionLabel: 'Test Webhook Gateway',
    metadata: {
      webhookStatus: 'rate_limited',
      pingMs: 840
    }
  },
  {
    id: 'test_security_burst',
    name: '🚨 High Application Volume Burst',
    type: 'SERVER_SECURITY_ALERT',
    category: 'security',
    severity: 'critical',
    title: 'High Application Volume Surge',
    message: '14 whitelist submissions received in 5 minutes. Anti-Abuse Discord Verification filter engaged.',
    actionSection: 'settings',
    actionLabel: 'Check Security Rules',
    metadata: {
      securityDetails: 'Burst threshold exceeded (14 apps / 5m). IP duplicate check passed.'
    }
  }
];

/**
 * Trigger a simulated / test notification on demand
 */
export async function triggerTestServerNotification(
  serverSlug: string,
  serverName: string,
  templateId: string
): Promise<string> {
  const norm = normalizeServerSlug(serverSlug);
  const template = TEST_SERVER_NOTIFICATION_TEMPLATES.find(t => t.id === templateId) || TEST_SERVER_NOTIFICATION_TEMPLATES[0];

  return dispatchServerOwnerNotification({
    serverId: norm,
    serverSlug: norm,
    serverName: serverName,
    type: template.type,
    category: template.category,
    severity: template.severity,
    title: template.title,
    message: template.message,
    actionSection: template.actionSection,
    actionLabel: template.actionLabel,
    metadata: template.metadata
  });
}
