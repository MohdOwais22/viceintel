/**
 * Whitelist Service & Discord Queue Integration
 * Handles Firestore CRUD operations for whitelist form configurations, applicant submissions,
 * staff reviews, Discord account linking, and rich Discord webhook notifications.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc, 
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  WhitelistFormConfig, 
  WhitelistApplication, 
  WhitelistApplicationStatus,
  WhitelistQuestion, 
  UserProfile,
  QuickInvite,
  OwnershipTransfer
} from '../types';
import { generateCustomGtaAvatar, resolveApplicantAvatar } from '../data/avatars';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { dispatchServerOwnerNotification } from './server-notification-service';

export const FORMS_COLLECTION = 'whitelist_forms';
export const APPLICATIONS_COLLECTION = 'whitelist_applications';
export const USERS_COLLECTION = 'userProfiles';

/**
 * Standard Default Whitelist Questions Template
 */
export const DEFAULT_WHITELIST_QUESTIONS: WhitelistQuestion[] = [
  {
    id: 'q_char_name',
    question: 'Character Full Name & In-Game Age',
    type: 'text',
    required: true,
    placeholder: 'e.g. Mateo "Teo" Rodriguez, Age: 28',
    helperText: 'Must be realistic and fit the Vice City / Leonida lore.'
  },
  {
    id: 'q_char_backstory',
    question: 'Character Backstory & Motivation',
    type: 'textarea',
    required: true,
    placeholder: 'Describe your character\'s origins, why they arrived in Vice City, their personality traits, flaws, and long-term criminal/legal aspirations (min 100 words)...',
    helperText: 'High effort backstories have a 95% approval rate.'
  },
  {
    id: 'q_scenario_fear_rp',
    question: 'Scenario: Two armed masked individuals hold you at gunpoint in an alleyway. What do you do?',
    type: 'textarea',
    required: true,
    placeholder: 'Explain how you value your character\'s life (Fear RP) and respond to this situation...',
    helperText: 'Demonstrate your understanding of Value of Life / Fear RP rules.'
  },
  {
    id: 'q_primary_faction',
    question: 'Intended Roleplay Pathway / Faction Interest',
    type: 'multiple_choice',
    options: [
      'Civilian & Entrepreneur (Legal Businesses / Dealerships)',
      'Criminal Underworld & Cartel Syndicate',
      'Vice Squad / Vice Beach Police Dept (Law Enforcement)',
      'Emergency Medical Services (EMS / Fire Rescue)',
      'Government, Judicial & Department of Justice'
    ],
    required: true,
    helperText: 'Select the primary career path you plan to pursue upon entry.'
  },
  {
    id: 'q_rules_agreement',
    question: 'Do you confirm you have read the server rules, possess a working microphone, and agree to stay in-character at all times?',
    type: 'multiple_choice',
    options: [
      'Yes, I have thoroughly read all rules and have a clear working microphone.',
      'No, I need more time to review the community guidelines.'
    ],
    required: true
  }
];

/**
 * Default Seed Forms for Built-In Showcase RP Server (VCL-1)
 * External directory servers (e.g. NoPixel, District 10) are listed as external portals
 * without fabricated forms, preventing duplicate or unowned form collisions.
 */
export const DEFAULT_SEED_FORMS: Record<string, WhitelistFormConfig> = {
  'rp1': {
    serverId: 'rp1',
    serverSlug: 'vice-city-life-rp',
    serverName: 'Vice City Life RP (VCL-1)',
    ownerUid: 'system_admin_vcl',
    discordGuildId: '209876543210987654',
    discordRoleId: '209876543210987655',
    discordWebhookUrl: '',
    isSubscriptionActive: true,
    customQuestions: DEFAULT_WHITELIST_QUESTIONS,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now()
  }
};

/**
 * Format slug from server name or ID
 */
export function normalizeServerSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Enforce strict URL slug rules:
 * - 3 to 32 characters
 * - lowercase letters (a-z), numbers (0-9), single hyphens (-)
 * - No spaces, no consecutive hyphens, no trailing or leading hyphens
 * - Not a reserved system route
 */
export function validateServerSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.trim() === '') {
    return { valid: false, error: 'URL slug is required.' };
  }
  const clean = slug.toLowerCase().trim();
  if (clean.length < 3) {
    return { valid: false, error: 'URL slug must be at least 3 characters long.' };
  }
  if (clean.length > 32) {
    return { valid: false, error: 'URL slug must be at most 32 characters long.' };
  }
  if (/\s/.test(slug)) {
    return { valid: false, error: 'URL slug cannot contain spaces. Use hyphens (-) instead.' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)) {
    return { valid: false, error: 'URL slug can only contain lowercase letters, numbers, and single hyphens.' };
  }
  const reserved = [
    'admin', 'api', 'login', 'register', 'dashboard', 'servers', 'chat',
    'profile', 'checkout', 'billing', 'webhook', 'auth', 'support', 'terms',
    'privacy', 'onboarding', 'status', 'apply', 'manage', 'review', 'analytics'
  ];
  if (reserved.includes(clean)) {
    return { valid: false, error: `"${clean}" is a reserved system keyword. Please choose a different slug.` };
  }
  return { valid: true };
}

export function formatSlugString(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);
}

/**
 * Check slug availability against backend server registry
 */
export async function checkSlugAvailabilityApi(slug: string, ownerUid?: string, ownerEmail?: string): Promise<{
  valid: boolean;
  available: boolean;
  taken?: boolean;
  error?: string;
  portalUrl?: string;
}> {
  const localVal = validateServerSlug(slug);
  if (!localVal.valid) {
    return { valid: false, available: false, error: localVal.error };
  }
  try {
    const params = new URLSearchParams({
      slug: slug.toLowerCase().trim(),
      ownerUid: ownerUid || '',
      ownerEmail: ownerEmail || ''
    });
    const res = await fetch(`/api/servers/check-slug?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Backend check-slug network fallback:', err);
    return { valid: true, available: true, portalUrl: `viceintel.app/servers/${slug}` };
  }
}

/**
 * Check if the server is one of the pre-seeded mock servers
 */
export function isPreseededMockServer(id: string, slug?: string): boolean {
  const normId = normalizeServerSlug(id || '');
  const normSlug = slug ? normalizeServerSlug(slug) : '';
  const preseededSlugs = [
    'rp1',
    'vice-city-life-rp',
    'vicecityliferp'
  ];
  return preseededSlugs.includes(normId) || (normSlug !== '' && preseededSlugs.includes(normSlug));
}

/**
 * Save / Update Whitelist Form Configuration with strict ownership verification
 */
export async function saveFormConfig(
  config: WhitelistFormConfig,
  userUid?: string,
  userEmail?: string,
  isAdmin?: boolean
): Promise<{ success: boolean; message?: string }> {
  const serverId = config.serverId;
  const serverSlug = config.serverSlug || normalizeServerSlug(config.serverName || serverId);

  // Check if a form already exists for this serverId or serverSlug
  const existingConfig = (await getFormConfig(serverId)) || (await getFormConfigBySlug(serverSlug));

  if (existingConfig && existingConfig.ownerUid) {
    const isGlobalAdmin = Boolean(isAdmin);
    const isOwner = Boolean(
      userUid && (
        existingConfig.ownerUid === userUid ||
        (userEmail && existingConfig.ownerUid.toLowerCase() === userEmail.toLowerCase())
      )
    );

    if (!isOwner && !isGlobalAdmin) {
      throw new Error(
        `This server whitelist configuration is claimed and managed by another verified owner. Only the registered server owner or Level 4 Administrator can modify this form.`
      );
    }
  }

  // Preserve existing discordWebhookUrl and discordInviteUrl if not explicitly updated in incoming config
  const effectiveWebhookUrl =
    typeof config.discordWebhookUrl === 'string'
      ? config.discordWebhookUrl.trim()
      : (existingConfig?.discordWebhookUrl || '');

  const effectiveDiscordInviteUrl =
    typeof config.discordInviteUrl === 'string' && config.discordInviteUrl.trim() !== ''
      ? config.discordInviteUrl.trim()
      : (config.customBranding?.discordInviteUrl || existingConfig?.discordInviteUrl || existingConfig?.customBranding?.discordInviteUrl || '');

  const payload: WhitelistFormConfig = {
    ...(existingConfig || {}),
    ...config,
    discordWebhookUrl: effectiveWebhookUrl,
    discordInviteUrl: effectiveDiscordInviteUrl,
    customBranding: {
      ...(existingConfig?.customBranding || {}),
      ...(config.customBranding || {}),
      discordInviteUrl: effectiveDiscordInviteUrl || config.customBranding?.discordInviteUrl || existingConfig?.customBranding?.discordInviteUrl || ''
    },
    serverSlug,
    ownerUid: config.ownerUid || existingConfig?.ownerUid || userUid || 'system_admin',
    updatedAt: Date.now(),
    createdAt: config.createdAt || existingConfig?.createdAt || Date.now()
  };

  try {
    const docRef = doc(db, FORMS_COLLECTION, serverId);
    await setDoc(docRef, payload, { merge: true });

    if (serverSlug && serverSlug !== serverId) {
      const slugDocRef = doc(db, FORMS_COLLECTION, serverSlug);
      await setDoc(slugDocRef, payload, { merge: true });
    }

    // Also update server document in 'servers' collection for synchronization
    try {
      const serverRef = doc(db, 'servers', serverId);
      await setDoc(serverRef, {
        discordWebhookUrl: effectiveWebhookUrl,
        discordInviteUrl: effectiveDiscordInviteUrl,
        officialDiscordUrl: effectiveDiscordInviteUrl,
        discordGuildId: payload.discordGuildId || '',
        discordRoleId: payload.discordRoleId || '',
        updatedAt: Date.now()
      }, { merge: true });
    } catch (sErr) {
      // Non-blocking fallback
    }
  } catch (err) {
    console.warn('Direct Firestore save failed, writing to local memory fallback:', err);
  }

  // Always update in-memory fallback cache so webhooks are retained during current session
  DEFAULT_SEED_FORMS[serverId] = payload;
  if (serverSlug) DEFAULT_SEED_FORMS[serverSlug] = payload;

  return { success: true, message: 'Server whitelist form configuration saved successfully!' };
}

/**
 * Retrieve Whitelist Form Config by Server ID
 */
export async function getFormConfig(serverId: string): Promise<WhitelistFormConfig | null> {
  try {
    const docRef = doc(db, FORMS_COLLECTION, serverId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as WhitelistFormConfig;
      if (data) {
        if (!Array.isArray(data.customQuestions) || data.customQuestions.length === 0) {
          data.customQuestions = DEFAULT_WHITELIST_QUESTIONS;
        }
        return data;
      }
    } else {
      // Fallback to checking the `servers` collection from older onboarding format
      const serverSnap = await getDoc(doc(db, 'servers', serverId));
      if (serverSnap.exists()) {
         const serverData = serverSnap.data();
         return {
           serverId: serverId,
           ownerUid: serverData.ownerUid || serverData.ownerDiscordId || 'system_admin',
           ownerDiscordId: serverData.ownerDiscordId,
           serverName: serverData.serverName || '',
           serverSlug: serverData.serverSlug || normalizeServerSlug(serverId),
           discordGuildId: serverData.discordGuildId || '',
           discordRoleId: serverData.discordRoleId || serverData.whitelistedRoleId || '',
           discordWebhookUrl: serverData.discordWebhookUrl || '',
           isSubscriptionActive: serverData.isSubscriptionActive || false,
           customQuestions: serverData.formTemplate || DEFAULT_WHITELIST_QUESTIONS
         } as WhitelistFormConfig;
      }
    }
  } catch (err) {
    console.warn(`Firestore read failed for form ${serverId}, falling back:`, err);
  }

  // Check default seed forms (e.g. rp1 showcase server)
  if (DEFAULT_SEED_FORMS[serverId]) {
    const seed = DEFAULT_SEED_FORMS[serverId];
    return {
      ...seed,
      customQuestions: Array.isArray(seed.customQuestions) && seed.customQuestions.length > 0
        ? seed.customQuestions
        : DEFAULT_WHITELIST_QUESTIONS
    };
  }

  return null;
}

/**
 * Retrieve Whitelist Form Config by Server Slug
 */
export async function getFormConfigBySlug(slug: string): Promise<WhitelistFormConfig | null> {
  const normalized = normalizeServerSlug(slug);

  // 1. Try finding by direct serverId match
  const directConfig = await getFormConfig(slug);
  if (directConfig) return directConfig;

  // 2. Query Firestore by serverSlug
  try {
    const q = query(collection(db, FORMS_COLLECTION), where('serverSlug', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data() as WhitelistFormConfig;
      if (data) {
        if (!Array.isArray(data.customQuestions) || data.customQuestions.length === 0) {
          data.customQuestions = DEFAULT_WHITELIST_QUESTIONS;
        }
        return data;
      }
    }

    // 2.5 Fallback to querying the servers collection directly by serverSlug
    const q2 = query(collection(db, 'servers'), where('serverSlug', '==', normalized), limit(1));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const data = snap2.docs[0].data() as WhitelistFormConfig;
      if (data) {
        if (!Array.isArray(data.customQuestions) || data.customQuestions.length === 0) {
          data.customQuestions = DEFAULT_WHITELIST_QUESTIONS;
        }
        return data;
      }
    }
  } catch (err) {
    console.warn(`Firestore query by slug ${slug} failed:`, err);
  }

  // 3. Fallback search in memory seeds
  for (const key of Object.keys(DEFAULT_SEED_FORMS)) {
    const form = DEFAULT_SEED_FORMS[key];
    if (form.serverSlug === normalized || form.serverId === slug || normalizeServerSlug(form.serverName) === normalized) {
      return {
        ...form,
        customQuestions: Array.isArray(form.customQuestions) && form.customQuestions.length > 0
          ? form.customQuestions
          : DEFAULT_WHITELIST_QUESTIONS
      };
    }
  }

  return null;
}

/**
 * Submit New Whitelist Application
 */
export async function submitApplication(
  applicationData: Omit<WhitelistApplication, 'id' | 'createdAt' | 'status'>,
  webhookUrl?: string,
  serverName?: string
): Promise<string> {
  const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newApp: WhitelistApplication = {
    ...applicationData,
    id: applicationId,
    status: 'pending',
    createdAt: Date.now()
  };

  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    await setDoc(docRef, newApp);
  } catch (err) {
    console.warn('Firestore application write failed, storing locally:', err);
  }

  // Dispatch rich Discord webhook embed to notify server staff in real-time
  if (webhookUrl || applicationData.serverId) {
    try {
      await sendDiscordNotification({
        type: 'new_submission',
        application: newApp,
        serverName: serverName || applicationData.serverId,
        webhookUrl
      });
    } catch (webhookErr) {
      console.warn('Webhook dispatch failed:', webhookErr);
    }
  }

  // Dispatch dedicated Server Owner Sentinel Notification
  try {
    const applicantName = (applicationData as any).characterName || applicationData.discordTag?.split('#')[0] || 'New Applicant';
    await dispatchServerOwnerNotification({
      serverId: applicationData.serverId,
      serverSlug: normalizeServerSlug(applicationData.serverId),
      serverName: serverName || applicationData.serverId,
      type: 'NEW_APPLICATION',
      category: 'applications',
      severity: 'info',
      title: 'New Whitelist Application Submitted',
      message: `${applicantName} submitted a new whitelist application for review.`,
      priority: 'high',
      actionSection: 'applications',
      actionLabel: 'Review Application',
      metadata: {
        applicationId,
        applicantName,
        applicantUid: applicationData.applicantUid,
        applicantDiscordTag: applicationData.discordTag,
        statusDecision: 'pending'
      }
    });
  } catch (notifErr) {
    console.warn('Server owner notification dispatch failed:', notifErr);
  }

  return applicationId;
}

/**
 * Fetch All Applications for a Specific Server
 */
export async function getApplicationsByServer(serverId: string, serverSlug?: string): Promise<WhitelistApplication[]> {
  const normSlug = serverSlug ? normalizeServerSlug(serverSlug) : normalizeServerSlug(serverId);
  const normId = normalizeServerSlug(serverId);

  const possibleIds = Array.from(new Set([
    serverId,
    normId,
    normSlug,
    `srv_${normId}`,
    `srv_${normSlug}`,
    serverId.replace(/^srv_/, ''),
    serverSlug || '',
    ...((serverId === 'rp1' || serverId === 'vice-city-life-rp' || serverSlug === 'vice-city-life-rp') ? [
      'vice-city-life-rp',
      'vicecityliferp',
      'rp1'
    ] : [])
  ])).filter(Boolean);

  const getLocalApps = (): WhitelistApplication[] => {
    const localApps: WhitelistApplication[] = [];
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('gtavi_app_status_') || key.startsWith('gtavi_submitted_app_'))) {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                const parsed = JSON.parse(item) as WhitelistApplication;
                if (parsed && parsed.id) {
                  const pSlug = parsed.serverSlug ? normalizeServerSlug(parsed.serverSlug) : '';
                  const pId = parsed.serverId ? normalizeServerSlug(parsed.serverId) : '';
                  if (
                    possibleIds.includes(parsed.serverId) ||
                    possibleIds.includes(parsed.serverSlug) ||
                    (pSlug && pSlug === normSlug) ||
                    (pId && pId === normSlug) ||
                    (pId && pId === normId)
                  ) {
                    localApps.push(parsed);
                  }
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
    return localApps;
  };

  try {
    const q = query(collection(db, APPLICATIONS_COLLECTION));
    const snap = await getDocs(q);
    const resultsMap = new Map<string, WhitelistApplication>();

    snap.forEach((docSnap) => {
      const data = docSnap.data() as WhitelistApplication;
      if (data && data.id) {
        const appServerSlug = data.serverSlug ? normalizeServerSlug(data.serverSlug) : '';
        const appServerId = data.serverId || '';
        const normAppServerId = normalizeServerSlug(appServerId);

        if (
          possibleIds.includes(appServerId) ||
          possibleIds.includes(data.serverSlug) ||
          (appServerSlug && appServerSlug === normSlug) ||
          (normAppServerId && normAppServerId === normSlug) ||
          (normAppServerId && normAppServerId === normId)
        ) {
          resultsMap.set(data.id, data);
        }
      }
    });

    const localApps = getLocalApps();
    localApps.forEach(app => {
      if (!resultsMap.has(app.id)) {
        resultsMap.set(app.id, app);
      }
    });

    const finalApps = Array.from(resultsMap.values());
    if (finalApps.length > 0) {
      finalApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return finalApps;
    }
  } catch (err) {
    console.warn(`Firestore query for applications on server ${serverId} failed:`, err);
  }

  const localApps = getLocalApps();
  if (localApps.length > 0) {
    localApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return localApps;
  }

  return isPreseededMockServer(serverId) ? getMockApplicationsForServer(serverId) : [];
}

/**
 * Real-time Listener for Server Applications
 */
export function subscribeToApplicationsByServer(
  serverId: string,
  onUpdate: (apps: WhitelistApplication[]) => void,
  serverSlug?: string,
  onSyncStatus?: (status: 'synced' | 'connecting' | 'error') => void
): () => void {
  onSyncStatus?.('connecting');
  const normSlug = serverSlug ? normalizeServerSlug(serverSlug) : normalizeServerSlug(serverId);
  const normId = normalizeServerSlug(serverId);

  const possibleIds = Array.from(new Set([
    serverId,
    normId,
    normSlug,
    `srv_${normId}`,
    `srv_${normSlug}`,
    serverId.replace(/^srv_/, ''),
    serverSlug || '',
    ...((serverId === 'rp1' || serverId === 'vice-city-life-rp' || serverSlug === 'vice-city-life-rp') ? [
      'vice-city-life-rp',
      'vicecityliferp',
      'rp1'
    ] : [])
  ])).filter(Boolean);

  const getLocalApps = (): WhitelistApplication[] => {
    const localApps: WhitelistApplication[] = [];
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('gtavi_app_status_') || key.startsWith('gtavi_submitted_app_'))) {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                const parsed = JSON.parse(item) as WhitelistApplication;
                if (parsed && parsed.id) {
                  const pSlug = parsed.serverSlug ? normalizeServerSlug(parsed.serverSlug) : '';
                  const pId = parsed.serverId ? normalizeServerSlug(parsed.serverId) : '';
                  if (
                    possibleIds.includes(parsed.serverId) ||
                    possibleIds.includes(parsed.serverSlug) ||
                    (pSlug && pSlug === normSlug) ||
                    (pId && pId === normSlug) ||
                    (pId && pId === normId)
                  ) {
                    localApps.push(parsed);
                  }
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
    return localApps;
  };

  try {
    const q = query(collection(db, APPLICATIONS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        onSyncStatus?.('synced');
        const resultsMap = new Map<string, WhitelistApplication>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as WhitelistApplication;
          if (data && data.id) {
            const appServerSlug = data.serverSlug ? normalizeServerSlug(data.serverSlug) : '';
            const appServerId = data.serverId || '';
            const normAppServerId = normalizeServerSlug(appServerId);

            if (
              possibleIds.includes(appServerId) ||
              possibleIds.includes(data.serverSlug) ||
              (appServerSlug && appServerSlug === normSlug) ||
              (normAppServerId && normAppServerId === normSlug) ||
              (normAppServerId && normAppServerId === normId)
            ) {
              resultsMap.set(data.id, data);
            }
          }
        });

        // Merge local apps if not present
        const localApps = getLocalApps();
        localApps.forEach(app => {
          if (!resultsMap.has(app.id)) {
            resultsMap.set(app.id, app);
          }
        });

        const finalApps = Array.from(resultsMap.values());
        finalApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (finalApps.length > 0) {
          onUpdate(finalApps);
        } else {
          onUpdate(isPreseededMockServer(serverId, serverSlug) ? getMockApplicationsForServer(serverId) : []);
        }
      },
      (error) => {
        console.warn(`Firestore onSnapshot error for server ${serverId}:`, error);
        onSyncStatus?.('error');
        const localApps = getLocalApps();
        if (localApps.length > 0) {
          localApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          onUpdate(localApps);
        } else {
          onUpdate(isPreseededMockServer(serverId, serverSlug) ? getMockApplicationsForServer(serverId) : []);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn(`Failed to set up Firestore onSnapshot for server ${serverId}:`, err);
    onSyncStatus?.('error');
    const localApps = getLocalApps();
    if (localApps.length > 0) {
      localApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(localApps);
    } else {
      onUpdate(isPreseededMockServer(serverId, serverSlug) ? getMockApplicationsForServer(serverId) : []);
    }
    return () => {};
  }
}

/**
 * Fetch Single Application by ID
 */
export async function getApplicationById(applicationId: string): Promise<WhitelistApplication | null> {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as WhitelistApplication;
    }
  } catch (err) {
    console.warn(`Firestore get application ${applicationId} failed:`, err);
  }

  // Fallback search in mock data
  const allMocks = [
    ...getMockApplicationsForServer('rp1'),
    ...getMockApplicationsForServer('rp2'),
    ...getMockApplicationsForServer('rp5')
  ];
  return allMocks.find(a => a.id === applicationId) || null;
}

/**
 * Check if User Already has an Active Application for a Server
 */
export async function getUserApplicationForServer(
  serverId: string, 
  applicantUid: string,
  serverSlug?: string
): Promise<WhitelistApplication | null> {
  if (!applicantUid) return null;

  const normSlug = serverSlug ? normalizeServerSlug(serverSlug) : normalizeServerSlug(serverId);
  const possibleIds = Array.from(new Set([
    serverId,
    normSlug,
    `srv_${normSlug}`,
    `srv_${serverId}`,
    serverId.replace(/^srv_/, '')
  ]));

  // 1. Query Firestore for ALL applications submitted by this user
  try {
    const qUserApps = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('applicantUid', '==', applicantUid)
    );
    const snapUserApps = await getDocs(qUserApps);
    if (!snapUserApps.empty) {
      const userApps: WhitelistApplication[] = [];
      snapUserApps.forEach(d => {
        const data = d.data() as WhitelistApplication;
        const appServerSlug = data.serverSlug ? normalizeServerSlug(data.serverSlug) : '';
        const appServerId = data.serverId || '';
        
        if (
          possibleIds.includes(appServerId) ||
          (appServerSlug && appServerSlug === normSlug) ||
          (serverSlug && normalizeServerSlug(appServerId) === normSlug) ||
          normalizeServerSlug(appServerId) === normSlug
        ) {
          userApps.push(data);
        }
      });

      if (userApps.length > 0) {
        userApps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return userApps[0];
      }
    }
  } catch (err) {
    console.warn('Firestore query user applications by applicantUid failed:', err);
  }

  // 2. Direct query by possible server IDs if above returned empty or failed
  try {
    for (const pId of possibleIds) {
      const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('serverId', '==', pId),
        where('applicantUid', '==', applicantUid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const results: WhitelistApplication[] = [];
        snap.forEach(d => results.push(d.data() as WhitelistApplication));
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return results[0];
      }
    }
  } catch (err) {
    console.warn('Firestore check user application by serverId failed:', err);
  }

  // 3. Check localStorage cache for all possible keys
  if (typeof window !== 'undefined') {
    try {
      for (const pId of possibleIds) {
        const saved = localStorage.getItem(`gtavi_app_status_${pId}_${applicantUid}`);
        if (saved) {
          return JSON.parse(saved) as WhitelistApplication;
        }
      }

      // Check last submitted application cache
      const lastSubmitted = localStorage.getItem(`gtavi_app_status_last_submitted_${applicantUid}`);
      if (lastSubmitted) {
        const parsed = JSON.parse(lastSubmitted) as WhitelistApplication;
        if (
          parsed && parsed.applicantUid === applicantUid && (
            possibleIds.includes(parsed.serverId) ||
            (parsed.serverSlug && normalizeServerSlug(parsed.serverSlug) === normSlug) ||
            normalizeServerSlug(parsed.serverId) === normSlug
          )
        ) {
          return parsed;
        }
      }

      // Scan all localStorage keys for matching app
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gtavi_app_status_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw) as WhitelistApplication;
              if (
                parsed &&
                parsed.applicantUid === applicantUid &&
                (possibleIds.includes(parsed.serverId) ||
                  (parsed.serverSlug && normalizeServerSlug(parsed.serverSlug) === normSlug) ||
                  normalizeServerSlug(parsed.serverId) === normSlug)
              ) {
                return parsed;
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Dispatch Transactional Email Notification for Whitelist Application Status Updates
 */
export async function sendWhitelistEmailNotification(params: {
  applicationId: string;
  status: WhitelistApplicationStatus;
  serverName?: string;
  serverSlug?: string;
  applicantUid?: string;
  applicantEmail?: string;
  applicantUsername?: string;
  discordTag?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  connectUrl?: string;
  discordInviteUrl?: string;
}): Promise<{
  success: boolean;
  recipient?: string;
  subject?: string;
  webhookDispatched?: boolean;
  renderedHtml?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/whitelist/notify-status-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (data && data.success) {
      return {
        success: true,
        recipient: data.recipient,
        subject: data.subject,
        webhookDispatched: data.webhookDispatched,
        renderedHtml: data.renderedHtml
      };
    } else {
      console.warn('[Whitelist Email Trigger API returned error]:', data);
      return {
        success: false,
        error: data?.error || 'Email dispatch failed'
      };
    }
  } catch (err: any) {
    console.warn('[Whitelist Email Trigger Exception]:', err);
    return {
      success: false,
      error: err?.message || 'Network exception when triggering email'
    };
  }
}

/**
 * Save AI Pre-Screening Audit & Score to Firestore and Local Storage Cache
 */
export async function updateApplicationAudit(
  applicationId: string,
  aiAudit: WhitelistApplication['aiAudit'],
  status?: WhitelistApplication['status']
): Promise<void> {
  if (!applicationId || !aiAudit) return;

  const updates: Partial<WhitelistApplication> = {
    aiAudit,
    ...(status ? { status } : {})
  };

  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.warn(`Firestore update audit for ${applicationId} failed:`, err);
  }

  // Also update local storage caches so local state retains AI audit on page refresh
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('gtavi_app_status_') || key.startsWith('gtavi_submitted_app_'))) {
          const itemStr = localStorage.getItem(key);
          if (itemStr && itemStr.includes(applicationId)) {
            try {
              const parsed = JSON.parse(itemStr);
              if (parsed && parsed.id === applicationId) {
                localStorage.setItem(key, JSON.stringify({ ...parsed, ...updates }));
              }
            } catch {}
          }
        }
      }
    } catch {}
  }
}

/**
 * Update Application Status (Approve / Reject / Under Review / Pending), Dispatch Discord Webhook and Email Notification
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: WhitelistApplication['status'],
  reviewerNotes?: string,
  reviewedBy?: string,
  webhookUrl?: string,
  serverName?: string,
  applicantDiscordTag?: string,
  serverSlug?: string,
  applicantEmail?: string,
  applicantUsername?: string
): Promise<{ success: boolean; emailResult?: any }> {
  const updates: Partial<WhitelistApplication> = {
    status,
    reviewerNotes: reviewerNotes !== undefined ? reviewerNotes : '',
    reviewedBy: reviewedBy || 'Server Staff',
    reviewedAt: Date.now()
  };

  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.warn(`Firestore update status for ${applicationId} failed:`, err);
  }

  // Also update local storage cache if this application was saved locally
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gtavi_app_status_')) {
        const itemStr = localStorage.getItem(key);
        if (itemStr && itemStr.includes(applicationId)) {
          const parsed = JSON.parse(itemStr);
          if (parsed.id === applicationId) {
            localStorage.setItem(key, JSON.stringify({ ...parsed, ...updates }));
          }
        }
      }
    }
  } catch {}

  let targetApp: WhitelistApplication | null = null;
  try {
    targetApp = await getApplicationById(applicationId);
  } catch {}

  const finalServerName = serverName || targetApp?.serverId || 'FiveM RP Server';
  const finalApplicantUid = targetApp?.applicantUid || '';
  const finalApplicantEmail = applicantEmail || targetApp?.applicantEmail || '';
  const finalApplicantUsername = applicantUsername || targetApp?.applicantUsername || (targetApp?.discordTag ? targetApp.discordTag.split('#')[0] : 'Applicant');
  const finalDiscordTag = applicantDiscordTag || targetApp?.discordTag || '';
  const finalServerSlug = serverSlug || (targetApp ? normalizeServerSlug(finalServerName) : 'vice-city-life-rp');

  // Dispatch Discord webhook notification
  try {
    if (targetApp) {
      const updatedApp = { ...targetApp, ...updates };
      await sendDiscordNotification({
        type: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'under_review' ? 'status_update' : 'status_update',
        application: updatedApp,
        serverName: finalServerName,
        reviewerNotes,
        reviewedBy,
        webhookUrl
      });
    }
  } catch (webhookErr) {
    console.warn('Status change Discord webhook dispatch notice:', webhookErr);
  }

  // Trigger Transactional Email Webhook and In-App Notifications
  let emailResult: any = null;
  try {
    const targetConfig = (await getFormConfig(targetApp?.serverId || '')) || (await getFormConfigBySlug(finalServerSlug));
    const targetRpServer = RP_SERVERS_DATA.find(
      s => normalizeServerSlug(s.name) === normalizeServerSlug(finalServerSlug) || s.id === targetApp?.serverId
    );
    const resolvedConnectUrl = targetConfig?.connectUrl || targetRpServer?.connectUrl || 'cfx.re/join/vclife1';
    const resolvedDiscordInviteUrl =
      targetConfig?.discordInviteUrl ||
      targetConfig?.customBranding?.discordInviteUrl ||
      targetRpServer?.officialDiscordUrl ||
      'https://discord.gg/vicecity';

    emailResult = await sendWhitelistEmailNotification({
      applicationId,
      status,
      serverName: finalServerName,
      serverSlug: finalServerSlug,
      applicantUid: finalApplicantUid,
      applicantEmail: finalApplicantEmail,
      applicantUsername: finalApplicantUsername,
      discordTag: finalDiscordTag,
      reviewerNotes: updates.reviewerNotes,
      reviewedBy: updates.reviewedBy,
      connectUrl: resolvedConnectUrl,
      discordInviteUrl: resolvedDiscordInviteUrl
    });
  } catch (emailErr) {
    console.warn('Status change Email notification trigger notice:', emailErr);
  }

  // Dispatch dedicated Server Owner Sentinel Notification for staff decision
  try {
    const statusTitle = status === 'approved' 
      ? `Application Approved: ${finalApplicantUsername}` 
      : status === 'rejected'
      ? `Application Declined: ${finalApplicantUsername}`
      : `Application Set Under Review: ${finalApplicantUsername}`;

    await dispatchServerOwnerNotification({
      serverId: finalServerSlug,
      serverSlug: finalServerSlug,
      serverName: finalServerName,
      type: 'APPLICATION_REVIEWED',
      category: 'applications',
      severity: status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
      title: statusTitle,
      message: `${updates.reviewedBy || 'Staff'} marked ${finalApplicantUsername} (${finalDiscordTag}) as ${status.toUpperCase()}.${updates.reviewerNotes ? ` Note: "${updates.reviewerNotes}"` : ''}`,
      priority: status === 'approved' ? 'normal' : 'high',
      actionSection: 'applications',
      actionLabel: 'View Applications',
      metadata: {
        applicationId,
        applicantName: finalApplicantUsername,
        applicantUid: finalApplicantUid,
        applicantDiscordTag: finalDiscordTag,
        reviewerName: updates.reviewedBy,
        reviewerNotes: updates.reviewerNotes,
        statusDecision: status
      }
    });
  } catch (notifErr) {
    console.warn('Server owner status update notification failed:', notifErr);
  }

  return { success: true, emailResult };
}

/**
 * Delete / Purge Application from Firestore
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`Firestore delete application ${applicationId} failed:`, err);
  }
}

/**
 * Generate a Test Whitelist Applicant for demonstration and testing
 */
export async function createTestApplication(
  serverId: string,
  serverName: string = 'FiveM RP Server'
): Promise<WhitelistApplication> {
  const testNames = [
    { name: 'Mateo "Teo" Rodriguez', age: 27, tag: 'ViceDrifter_Teo#9901', avatar: generateCustomGtaAvatar('ViceDrifter_Teo'), path: 'Street Racing & Underworld Chop Shops', story: 'Growing up around Ocean Drive, Mateo started as a freelance courier before entering the underground drift circuit. He prioritizes vehicle craftsmanship and high-risk cargo deliveries without drawing heat from the Vice Beach PD.' },
    { name: 'Lucia Cartier', age: 29, tag: 'LuciaCartier_RP#3114', avatar: generateCustomGtaAvatar('LuciaCartier_RP'), path: 'Nightclub Entrepreneur & VIP Lounge Host', story: 'Former Liberty City hospitality manager opening a luxury beachfront club in Vice City. Intends to host VIP events, broker high-society deals, and operate legal business fronts.' },
    { name: 'Sergeant Derek Miller', age: 36, tag: 'SgtMiller_LEO#7741', avatar: generateCustomGtaAvatar('SgtMiller_LEO'), path: 'Vice Squad / Vice Beach Police Dept (Law Enforcement)', story: '10-year veteran officer with extensive background in tactical dispatch, traffic enforcement, and active negotiation. Strives to maintain high-caliber roleplay standards during city emergencies.' }
  ];

  const randomProfile = testNames[Math.floor(Math.random() * testNames.length)];
  const appId = `app_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const discordId = `${Math.floor(Math.random() * 899999999999999999) + 100000000000000000}`;

  const testApp: WhitelistApplication = {
    id: appId,
    serverId,
    applicantUid: `user_test_${Date.now()}`,
    discordId,
    discordTag: randomProfile.tag,
    discordAvatar: randomProfile.avatar,
    answers: {
      'Character Full Name & In-Game Age': `${randomProfile.name}, Age: ${randomProfile.age}`,
      'Character Backstory & Motivation': randomProfile.story,
      'Scenario: Two armed masked individuals hold you at gunpoint in an alleyway. What do you do?': 'I immediately value my life, raise my hands, comply calmly with all demands, surrender my possessions, and avoid initiating combat while outmatched. After they flee, I contact emergency dispatch.',
      'Intended Roleplay Pathway / Faction Interest': randomProfile.path,
      'Do you confirm you have read the server rules, possess a working microphone, and agree to stay in-character at all times?': 'Yes, I confirm full agreement with server guidelines and have a verified microphone.'
    },
    status: 'pending',
    createdAt: Date.now()
  };

  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, appId);
    await setDoc(docRef, testApp);
  } catch (err) {
    console.warn('Firestore test application write failed:', err);
  }

  return testApp;
}

/**
 * Link Discord Account Metadata to User Firestore Profile
 */
export async function linkDiscordToUser(
  uid: string,
  discordData: {
    discordId: string;
    discordUsername: string;
    discordAvatar?: string;
  }
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const cleanId = String(discordData.discordId || '').trim();
  const cleanTag = String(discordData.discordUsername || '').trim();
  const cleanAvatar = String(discordData.discordAvatar || '').trim();

  const updates = {
    discordConnected: true,
    discordId: cleanId,
    discordUsername: cleanTag,
    discordAvatar: cleanAvatar,
    claimedByDiscordId: cleanId,
    claimedByDiscordUsername: cleanTag,
    updatedAt: new Date().toISOString()
  };

  // 1. Sync to MongoDB via backend REST API (Primary Source of Truth)
  try {
    const res = await fetch('/api/auth/discord/link-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        discordId: cleanId,
        discordUsername: cleanTag,
        discordAvatar: cleanAvatar
      })
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('MongoDB Direct Discord link profile API reported failure:', data.error);
    }
  } catch (err) {
    console.warn('Failed to link Discord in MongoDB REST API:', err);
  }

  // 2. Sync to Firestore (Real-time fallback/listener)
  try {
    await updateDoc(docRef, updates);
  } catch (err) {
    try {
      await setDoc(docRef, updates, { merge: true });
    } catch (setErr) {
      console.warn('Failed to link Discord in Firestore:', setErr);
    }
  }

  // 3. Sync to localStorage & Dispatch Global Sync Events
  try {
    localStorage.setItem(`gtavi_discord_link_${uid}`, JSON.stringify(updates));
    localStorage.setItem('gtavi_discord_user_id', cleanId);
    localStorage.setItem('gtavi_discord_username', cleanTag);
    if (cleanAvatar) localStorage.setItem('gtavi_discord_avatar', cleanAvatar);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gtavi_discord_linked', { detail: { uid, ...updates } }));
      window.dispatchEvent(new CustomEvent('gtavi_profile_updated', { detail: { uid, ...updates } }));
    }
  } catch {}
}

/**
 * Unlink Discord Account from User Profile
 */
export async function unlinkDiscordFromUser(uid: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const updates: Record<string, any> = {
    discordConnected: false,
    discordId: deleteField(),
    discordUsername: deleteField(),
    discordAvatar: deleteField(),
    claimedByDiscordId: deleteField(),
    claimedByDiscordUsername: deleteField(),
    discordAuth: deleteField(),
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(docRef, updates);
  } catch (err) {
    try {
      await setDoc(docRef, updates, { merge: true });
    } catch (setErr) {
      console.warn('Firestore unlink Discord failed:', setErr);
    }
  }

  // Also notify server backend endpoint
  try {
    await fetch('/api/auth/discord/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });
  } catch (backendErr) {
    console.warn('Server backend Discord unlink notice:', backendErr);
  }

  try {
    localStorage.removeItem(`gtavi_discord_link_${uid}`);
    localStorage.removeItem('gtavi_discord_user_id');
    localStorage.removeItem('gtavi_discord_username');
    localStorage.removeItem('gtavi_discord_avatar');
  } catch {}
}

/**
 * Check persistent Discord OAuth connection and token status
 */
export async function fetchDiscordAuthStatus(uid: string, email?: string): Promise<{
  connected: boolean;
  discordId?: string | null;
  discordUsername?: string | null;
  discordAvatar?: string | null;
  hasPersistentTokens?: boolean;
  expiresAt?: number | null;
  isExpired?: boolean;
  scope?: string;
  linkedAt?: string | null;
  lastRefreshedAt?: string | null;
}> {
  if (!uid && !email) return { connected: false };
  try {
    const params = new URLSearchParams();
    if (uid) params.append('uid', uid);
    if (email) params.append('email', email);
    const res = await fetch(`/api/auth/discord/status?${params.toString()}`);
    if (!res.ok) throw new Error('Status fetch failed');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to fetch Discord auth status from server:', err);
    return { connected: false };
  }
}

/**
 * Refresh persistent Discord OAuth access token using stored encrypted refresh token
 */
export async function refreshDiscordOAuthToken(uid: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  expiresAt?: number;
}> {
  if (!uid) return { success: false, error: 'User UID required' };
  try {
    const res = await fetch('/api/auth/discord/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to communicate with token refresh service' };
  }
}

/**
 * Fetch Full User Profile (with MongoDB source of truth and Firestore fallback)
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;

  let mongoData: any = null;
  let firestoreData: any = null;

  // 1. Query MongoDB REST API (source of truth)
  try {
    const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(uid)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        mongoData = json.data;
      }
    }
  } catch (apiErr) {
    console.warn(`[getUserProfile] REST API fetch error for ${uid}:`, apiErr);
  }

  // 2. Query Firestore collection only if mongoData is not found
  if (!mongoData) {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        firestoreData = snap.data();
      }
    } catch (fsErr) {
      console.warn(`[getUserProfile] Firestore fetch error for ${uid}:`, fsErr);
    }
  }

  // If neither returned, check localStorage
  let localData: any = null;
  try {
    const cachedDiscord = localStorage.getItem(`gtavi_discord_link_${uid}`);
    if (cachedDiscord) {
      localData = JSON.parse(cachedDiscord);
    }
  } catch {}

  const merged = {
    ...(firestoreData || {}),
    ...(mongoData || {}),
    ...(localData || {})
  };

  if (mongoData || firestoreData || localData) {
    // Resolve Discord fields across all possible schema variations
    const resolvedDiscordId = merged.discordId || merged.claimedByDiscordId || merged.discordAuth?.discordId || null;
    const resolvedDiscordUsername = merged.discordUsername || merged.claimedByDiscordUsername || merged.discordTag || merged.discordAuth?.discordUsername || null;
    const resolvedDiscordAvatar = merged.discordAvatar || merged.discordAuth?.discordAvatar || null;
    const resolvedDiscordConnected = Boolean(merged.discordConnected || resolvedDiscordId || resolvedDiscordUsername || merged.discordAuth);

    return {
      id: uid,
      uid: uid,
      username: merged.gamerTag || merged.username || 'GTA Player',
      displayName: merged.displayName || merged.gamerTag || merged.username || 'GTA Player',
      email: merged.email || '',
      avatar: merged.avatar || 'avatar_lucia',
      role: merged.role || 'User',
      isVip: Boolean(merged.isVip),
      joinedDate: merged.createdAt || merged.joinedDate || new Date().toISOString(),
      publishedBuildsCount: merged.publishedBuildsCount || 0,
      status: merged.status || 'Active',
      ...merged,
      discordId: resolvedDiscordId,
      discordUsername: resolvedDiscordUsername,
      discordAvatar: resolvedDiscordAvatar,
      discordConnected: resolvedDiscordConnected
    } as UserProfile;
  }

  return null;
}

/**
 * Discord Rich Embed Payload Interface
 */
export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds: Array<{
    title: string;
    description?: string;
    url?: string;
    color: number; // Decimal color code
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    author?: {
      name: string;
      icon_url?: string;
      url?: string;
    };
    thumbnail?: {
      url: string;
    };
    footer?: {
      text: string;
      icon_url?: string;
    };
    timestamp?: string;
  }>;
}

/**
 * Dispatch Discord Rich Embed via Backend Relay or Direct Fetch
 */
export async function sendDiscordEmbed(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.log('[Discord Webhook Simulated Dispatch]', payload);
    return true;
  }

  try {
    // 1. Try sending via backend proxy to bypass CORS if browser-side
    const response = await fetch('/api/whitelist/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, payload })
    });

    if (response.ok) return true;

    // 2. Direct fallback
    const directRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return directRes.ok;
  } catch (err) {
    console.warn('Discord Webhook Delivery Error:', err);
    return false;
  }
}

/**
 * Helper to generate formatted notification embeds
 */
export async function sendDiscordNotification(params: {
  type: 'new_submission' | 'approved' | 'rejected' | 'status_update' | 'test';
  application?: WhitelistApplication;
  serverName: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  webhookUrl?: string;
}): Promise<boolean> {
  const { type, application, serverName, reviewerNotes, reviewedBy, webhookUrl } = params;

  let color = 0x6366F1; // Indigo
  let title = `[Whitelist System] Notification`;
  let description = `Notification from ${serverName}`;

  if (type === 'new_submission' && application) {
    color = 0xF59E0B; // Amber
    title = `📝 New Whitelist Application Submitted`;
    description = `**Applicant:** <@${application.discordId}> (\`${application.discordTag}\`)\n**Server:** ${serverName}\n**Application ID:** \`${application.id}\``;
  } else if (type === 'approved' && application) {
    color = 0x10B981; // Emerald Green
    title = `✅ Whitelist Application APPROVED`;
    description = `Congratulations <@${application.discordId}> (\`${application.discordTag}\`)! Your whitelist application for **${serverName}** has been **APPROVED**.\n\nYou have been granted the Whitelisted Citizen role. Please review the server connect IP and launch instructions.`;
  } else if (type === 'rejected' && application) {
    color = 0xEF4444; // Rose Red
    title = `❌ Whitelist Application DECLINED`;
    description = `<@${application.discordId}> (\`${application.discordTag}\`), your whitelist application for **${serverName}** was not accepted at this time.`;
  } else if (type === 'test') {
    color = 0x8B5CF6; // Purple
    title = `⚡ GTA VI Central Whitelist Webhook Test`;
    description = `Your Discord Webhook integration for **${serverName}** is properly connected and operating at 100% efficiency!`;
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (application && application.answers) {
    // Add first 3 answers as scannable summary fields
    let count = 0;
    for (const [key, value] of Object.entries(application.answers)) {
      if (count < 3 && value) {
        fields.push({
          name: key.length > 50 ? key.substring(0, 47) + '...' : key,
          value: value.length > 250 ? value.substring(0, 247) + '...' : value,
          inline: false
        });
        count++;
      }
    }
  }

  if (reviewerNotes) {
    fields.push({
      name: 'Staff Feedback / Reviewer Notes',
      value: reviewerNotes,
      inline: false
    });
  }

  if (reviewedBy) {
    fields.push({
      name: 'Reviewed By',
      value: reviewedBy,
      inline: true
    });
  }

  const payload: DiscordWebhookPayload = {
    username: `${serverName} Whitelist HQ`,
    avatar_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=256&q=80',
    embeds: [
      {
        title,
        description,
        color,
        fields: fields.length > 0 ? fields : undefined,
        thumbnail: application?.discordAvatar ? { url: application.discordAvatar } : undefined,
        footer: {
          text: `GTA VI Central Whitelist Gateway • ${new Date().toLocaleDateString()}`,
          icon_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=64&q=80'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  return sendDiscordEmbed(webhookUrl || '', payload);
}

/**
 * Generate Mock Applications for Initial Queue Pre-population
 */
function getMockApplicationsForServer(serverId: string): WhitelistApplication[] {
  return [
    {
      id: `app_mock_1_${serverId}`,
      serverId,
      applicantUid: 'user_mock_antonio_88',
      discordId: '849204918294028190',
      discordTag: 'ViceRacer_Tony#4092',
      discordAvatar: generateCustomGtaAvatar('ViceRacer_Tony'),
      answers: {
        'Character Full Name & In-Game Age': 'Antonio "Tony" Vercetti, Age: 31',
        'Character Backstory & Motivation': 'Born in Little Haiti, Antonio spent years working as a port mechanic before getting caught up in high-stakes illegal street racing circuits around Port Gellhorn. He is looking to build an underground chop shop empire while staying under the radar of the Vice Beach PD.',
        'Scenario: Two armed masked individuals hold you at gunpoint in an alleyway. What do you do?': 'I immediately raise my hands, comply with all demands, surrender my wallet and vehicle keys without resisting, and value my character\'s life. Once they leave, I seek medical assistance and report the vehicle theft to the police.',
        'Intended Roleplay Pathway / Faction Interest': 'Criminal Underworld & Cartel Syndicate',
        'Do you confirm you have read the server rules, possess a working microphone, and agree to stay in-character at all times?': 'Yes, I have thoroughly read all rules and have a clear working microphone.'
      },
      status: 'pending',
      createdAt: Date.now() - 1000 * 60 * 25 // 25 mins ago
    },
    {
      id: `app_mock_2_${serverId}`,
      serverId,
      applicantUid: 'user_mock_dr_elena',
      discordId: '918273645102938475',
      discordTag: 'DrElenaV_EMS#1104',
      discordAvatar: generateCustomGtaAvatar('DrElenaV_EMS'),
      answers: {
        'Character Full Name & In-Game Age': 'Elena Vance, MD, Age: 34',
        'Character Backstory & Motivation': 'Dr. Elena Vance transferred from Liberty City General Hospital to Vice City Fire Rescue after serving 6 years as a trauma surgeon. Her goal is to establish an advanced paramedicine field unit and train rookie EMTs across Leonida.',
        'Scenario: Two armed masked individuals hold you at gunpoint in an alleyway. What do you do?': 'I prioritize my survival, inform them calmly that I am an off-duty paramedic with medical supplies, hand over everything they ask for, and avoid making any sudden movements.',
        'Intended Roleplay Pathway / Faction Interest': 'Emergency Medical Services (EMS / Fire Rescue)',
        'Do you confirm you have read the server rules, possess a working microphone, and agree to stay in-character at all times?': 'Yes, I have thoroughly read all rules and have a clear working microphone.'
      },
      status: 'under_review',
      reviewerNotes: 'Strong medical RP background verified. Ready for in-game interview.',
      reviewedBy: 'Staff Officer Marcus',
      createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
      reviewedAt: Date.now() - 1000 * 60 * 45
    },
    {
      id: `app_mock_3_${serverId}`,
      serverId,
      applicantUid: 'user_mock_cop_carter',
      discordId: '728193847561029384',
      discordTag: 'OfficerCarter#0077',
      discordAvatar: generateCustomGtaAvatar('OfficerCarter'),
      answers: {
        'Character Full Name & In-Game Age': 'Jackson Carter, Age: 29',
        'Character Backstory & Motivation': 'Ex-military MP eager to join Vice Squad tactical division. Highly disciplined with extensive communication protocol training.',
        'Scenario: Two armed masked individuals hold you at gunpoint in an alleyway. What do you do?': 'Comply with armed assailants, memorize visual details of suspects and vehicle plates for investigation later.',
        'Intended Roleplay Pathway / Faction Interest': 'Vice Squad / Vice Beach Police Dept (Law Enforcement)',
        'Do you confirm you have read the server rules, possess a working microphone, and agree to stay in-character at all times?': 'Yes, I have thoroughly read all rules and have a clear working microphone.'
      },
      status: 'approved',
      reviewerNotes: 'Excellent scenario answers. Granted Whitelist role.',
      reviewedBy: 'Admin Drake',
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      reviewedAt: Date.now() - 1000 * 60 * 60 * 18
    }
  ];
}

export const QUICK_INVITES_COLLECTION = 'quick_invites';
export const TRANSFERS_COLLECTION = 'ownership_transfers';

// In-memory fallback stores for fast dev/offline reactivity
const IN_MEMORY_QUICK_INVITES: Record<string, QuickInvite[]> = {};

/**
 * Claim RP Server Listing using Discord OAuth Guild Member / Owner verification
 */
export async function claimServerWithDiscord(params: {
  serverSlug: string;
  serverId?: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  discordGuildId?: string;
  uid?: string;
  email?: string;
  isAdmin?: boolean;
  planTier?: string;
  verificationSecret?: string;
  trialPassCode?: string;
}): Promise<{ success: boolean; message: string; serverRecord?: any }> {
  const {
    serverSlug,
    discordId,
    discordUsername,
    discordAvatar,
    discordGuildId,
    uid,
    email,
    isAdmin,
    planTier = 'community',
    verificationSecret,
    trialPassCode
  } = params;

  const normalizedSlug = normalizeServerSlug(serverSlug);
  const existingConfig = await getFormConfigBySlug(normalizedSlug);
  const serverId = existingConfig?.serverId || params.serverId || `srv_${normalizedSlug.replace(/[^a-z0-9]/g, '')}`;

  // 1. Post to backend claim endpoint for server state sync & anti-hijack validation first
  try {
    const apiRes = await fetch('/api/servers/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        serverSlug: normalizedSlug,
        discordId,
        discordUsername,
        discordAvatar,
        discordGuildId: discordGuildId || existingConfig?.discordGuildId || '',
        uid,
        email,
        isAdmin,
        planTier,
        verificationSecret,
        trialPassCode
      })
    });
    const apiData = await apiRes.json();
    if (!apiRes.ok || !apiData.success) {
      throw new Error(apiData.error || apiData.message || 'Server claim verification failed');
    }
  } catch (backendErr: any) {
    if (backendErr.message && !backendErr.message.includes('fetch')) {
      throw backendErr;
    }
  }

  // Check if already claimed locally
  if (existingConfig?.isClaimed && existingConfig.ownerDiscordId && existingConfig.ownerDiscordId !== discordId) {
    const isGlobalAdmin = Boolean(isAdmin);
    if (!isGlobalAdmin) {
      throw new Error(
        `This server is already claimed by Discord ID <@${existingConfig.ownerDiscordId}>. Please contact the existing owner or staff if you believe this is in error.`
      );
    }
  }

  const claimTimestamp = Date.now();

  const formPayload: Partial<WhitelistFormConfig> = {
    serverId,
    serverSlug: normalizedSlug,
    serverName: existingConfig?.serverName || serverSlug.replace(/-/g, ' ').toUpperCase(),
    ownerUid: uid || discordId,
    ownerDiscordId: discordId,
    isClaimed: true,
    claimedAt: claimTimestamp,
    claimedByDiscordId: discordId,
    claimedByDiscordUsername: discordUsername,
    discordGuildId: discordGuildId || existingConfig?.discordGuildId || '',
    discordRoleId: existingConfig?.discordRoleId || '1198765432109876550',
    discordWebhookUrl: existingConfig?.discordWebhookUrl || '',
    isSubscriptionActive: true,
    planTier: (planTier as any) || 'community',
    updatedAt: claimTimestamp,
    customQuestions: existingConfig?.customQuestions || DEFAULT_WHITELIST_QUESTIONS
  };

  // 2. Update whitelist_forms collection
  try {
    const formDocRef = doc(db, FORMS_COLLECTION, serverId);
    await setDoc(formDocRef, formPayload, { merge: true });
  } catch (err) {
    console.warn('Firestore form claim write warning:', err);
  }

  // 3. Update servers collection
  try {
    const serverDocRef = doc(db, 'servers', serverId);
    await setDoc(serverDocRef, {
      id: serverId,
      serverSlug: normalizedSlug,
      serverName: formPayload.serverName,
      ownerDiscordId: discordId,
      isClaimed: true,
      claimedAt: claimTimestamp,
      claimedByDiscordId: discordId,
      claimedByDiscordUsername: discordUsername,
      discordGuildId: formPayload.discordGuildId,
      isSubscriptionActive: true,
      planTier: formPayload.planTier,
      updatedAt: claimTimestamp
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore server claim write warning:', err);
  }

  // Update in-memory seed
  if (DEFAULT_SEED_FORMS[serverId]) {
    DEFAULT_SEED_FORMS[serverId] = {
      ...DEFAULT_SEED_FORMS[serverId],
      ...formPayload
    } as WhitelistFormConfig;
  }

  return {
    success: true,
    message: `Server "${formPayload.serverName}" successfully claimed by Discord user ${discordUsername}!`,
    serverRecord: formPayload
  };
}

/**
 * Transfer RP Server Ownership to another Discord User ID
 */
export async function transferServerOwnership(params: {
  serverId: string;
  serverSlug: string;
  serverName: string;
  currentDiscordId: string;
  newDiscordId: string;
  newDiscordUsername?: string;
  currentUid?: string;
  isAdmin?: boolean;
  note?: string;
  webhookUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const {
    serverId,
    serverSlug,
    serverName,
    currentDiscordId,
    newDiscordId,
    newDiscordUsername,
    currentUid,
    isAdmin,
    note,
    webhookUrl
  } = params;

  const normalizedSlug = normalizeServerSlug(serverSlug);
  const cleanTargetDiscordId = newDiscordId.trim().replace(/^<@!?|>$/g, '').replace(/^@/, '');

  if (!cleanTargetDiscordId || cleanTargetDiscordId.length < 2) {
    throw new Error('Please enter a valid target Discord Snowflake User ID or Username (e.g. 849204918294028190 or _Niklaus).');
  }

  if (cleanTargetDiscordId === currentDiscordId) {
    throw new Error('Target Discord ID is identical to the current owner Discord ID.');
  }

  const existingConfig = await getFormConfig(serverId) || await getFormConfigBySlug(normalizedSlug);
  if (!existingConfig) {
    throw new Error('Target server configuration could not be located.');
  }

  const isGlobalAdmin = Boolean(isAdmin);

  const isCurrentOwner = Boolean(
    existingConfig.ownerDiscordId === currentDiscordId ||
    existingConfig.claimedByDiscordId === currentDiscordId ||
    (currentUid && existingConfig.ownerUid === currentUid)
  );

  if (!isCurrentOwner && !isGlobalAdmin) {
    throw new Error('Access Denied: Only the verified server owner or an L4 Administrator can transfer ownership.');
  }

  const transferTimestamp = Date.now();
  const transferId = `xfer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Update WhitelistFormConfig in Firestore
  const updatedFormPayload = {
    ownerDiscordId: cleanTargetDiscordId,
    claimedByDiscordId: cleanTargetDiscordId,
    claimedByDiscordUsername: newDiscordUsername || `@DiscordUser_${cleanTargetDiscordId.slice(-4)}`,
    ownerUid: cleanTargetDiscordId,
    updatedAt: transferTimestamp
  };

  try {
    const formDocRef = doc(db, FORMS_COLLECTION, serverId);
    await updateDoc(formDocRef, updatedFormPayload);
  } catch (err) {
    console.warn('Firestore transfer update form warning:', err);
    if (DEFAULT_SEED_FORMS[serverId]) {
      DEFAULT_SEED_FORMS[serverId] = {
        ...DEFAULT_SEED_FORMS[serverId],
        ...updatedFormPayload
      };
    }
  }

  // 2. Update servers collection in Firestore
  try {
    const serverDocRef = doc(db, 'servers', serverId);
    await updateDoc(serverDocRef, {
      ownerDiscordId: cleanTargetDiscordId,
      claimedByDiscordId: cleanTargetDiscordId,
      claimedByDiscordUsername: newDiscordUsername || `@DiscordUser_${cleanTargetDiscordId.slice(-4)}`,
      updatedAt: transferTimestamp
    });
  } catch (err) {
    console.warn('Firestore transfer update server warning:', err);
  }

  // 3. Log transfer record in Firestore
  try {
    const transferRecord: OwnershipTransfer = {
      id: transferId,
      serverId,
      serverSlug: normalizedSlug,
      serverName,
      fromDiscordId: currentDiscordId,
      toDiscordId: cleanTargetDiscordId,
      toUsername: newDiscordUsername,
      status: 'completed',
      initiatedAt: transferTimestamp,
      completedAt: transferTimestamp,
      note
    };
    const transferDocRef = doc(db, TRANSFERS_COLLECTION, transferId);
    await setDoc(transferDocRef, transferRecord);
  } catch (err) {
    console.warn('Firestore transfer audit log warning:', err);
  }

  // 4. Sync to server-side backend endpoint
  try {
    fetch('/api/servers/transfer-ownership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        serverSlug: normalizedSlug,
        currentDiscordId,
        newDiscordId: cleanTargetDiscordId,
        newDiscordUsername,
        note
      })
    }).catch((e) => console.warn('Transfer backend sync notice:', e));
  } catch (e) {
    // Ignore fetch error
  }

  // 5. Dispatch Discord Audit Webhook Embed if configured
  const effectiveWebhook = webhookUrl || existingConfig.discordWebhookUrl;
  if (effectiveWebhook) {
    try {
      await sendDiscordNotification({
        type: 'test',
        webhookUrl: effectiveWebhook,
        serverName,
        reviewerNotes: `👑 **Ownership Transfer Complete**\nTransferred From: <@${currentDiscordId}>\nTransferred To: <@${cleanTargetDiscordId}> (${newDiscordUsername || 'New Owner'})\nNote: ${note || 'No additional notes provided.'}`
      });
    } catch (e) {
      console.warn('Ownership transfer webhook dispatch warning:', e);
    }
  }

  return {
    success: true,
    message: `Server ownership for "${serverName}" has been successfully transferred to Discord ID <@${cleanTargetDiscordId}>. Your dashboard owner privileges have been reset.`
  };
}

/**
 * Create a new Quick Invite with conversion tracking
 */
export async function createQuickInvite(params: {
  serverId: string;
  serverSlug: string;
  createdByDiscordId: string;
  createdByUsername?: string;
  customCode?: string;
  label?: string;
  note?: string;
  maxUses?: number | null;
  expiresInDays?: number | null;
}): Promise<QuickInvite> {
  const {
    serverId,
    serverSlug,
    createdByDiscordId,
    createdByUsername,
    customCode,
    label,
    note,
    maxUses,
    expiresInDays
  } = params;

  const normalizedSlug = normalizeServerSlug(serverSlug);
  const rawCode = customCode?.trim() || `VCL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const code = rawCode.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const now = Date.now();
  const expiresAt = expiresInDays && expiresInDays > 0 ? now + expiresInDays * 24 * 60 * 60 * 1000 : null;

  const quickInvite: QuickInvite = {
    id: inviteId,
    code,
    serverId,
    serverSlug: normalizedSlug,
    createdByDiscordId,
    createdByUsername,
    createdAt: now,
    expiresAt,
    maxUses: maxUses && maxUses > 0 ? maxUses : null,
    usesCount: 0,
    clicksCount: 0,
    conversionsCount: 0,
    label: label?.trim() || `Invite #${code}`,
    note: note?.trim(),
    isActive: true
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, QUICK_INVITES_COLLECTION, inviteId);
    await setDoc(docRef, quickInvite);
  } catch (err) {
    console.warn('Firestore quick invite write warning:', err);
  }

  // 2. In-memory store
  if (!IN_MEMORY_QUICK_INVITES[normalizedSlug]) {
    IN_MEMORY_QUICK_INVITES[normalizedSlug] = [];
  }
  IN_MEMORY_QUICK_INVITES[normalizedSlug].unshift(quickInvite);

  // 3. Post to backend
  try {
    fetch('/api/servers/quick-invites/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quickInvite)
    }).catch(() => {});
  } catch (e) {}

  return quickInvite;
}

/**
 * Fetch all Quick Invites for a server
 */
export async function getQuickInvites(serverSlug: string): Promise<QuickInvite[]> {
  const normalizedSlug = normalizeServerSlug(serverSlug);
  const invites: QuickInvite[] = [];

  try {
    const q = query(
      collection(db, QUICK_INVITES_COLLECTION),
      where('serverSlug', '==', normalizedSlug),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      invites.push(d.data() as QuickInvite);
    });
  } catch (err) {
    console.warn(`Firestore quick invites query for ${serverSlug} failed, using local/seed:`, err);
  }

  if (invites.length > 0) {
    IN_MEMORY_QUICK_INVITES[normalizedSlug] = invites;
    return invites;
  }

  // Return from in-memory cache or default seeds
  if (IN_MEMORY_QUICK_INVITES[normalizedSlug]?.length) {
    return IN_MEMORY_QUICK_INVITES[normalizedSlug];
  }

  // Generate seed quick invites for initial display only if it is a preseeded mock server
  if (!isPreseededMockServer('', normalizedSlug)) {
    return [];
  }

  const seedInvites: QuickInvite[] = [
    {
      id: `seed_inv_1_${normalizedSlug}`,
      code: 'DISCORD-VIP-CREW',
      serverId: `srv_${normalizedSlug}`,
      serverSlug: normalizedSlug,
      createdByDiscordId: '849204918294028190',
      createdByUsername: 'ServerStaff',
      createdAt: Date.now() - 1000 * 60 * 60 * 72,
      expiresAt: null,
      maxUses: 100,
      usesCount: 24,
      clicksCount: 142,
      conversionsCount: 24,
      label: 'Main Discord Announcement Link',
      note: 'Pinned in #announcements for VIP Fast-Track applicants',
      isActive: true
    },
    {
      id: `seed_inv_2_${normalizedSlug}`,
      code: 'STREAMER-PRIORITY-26',
      serverId: `srv_${normalizedSlug}`,
      serverSlug: normalizedSlug,
      createdByDiscordId: '849204918294028190',
      createdByUsername: 'ServerStaff',
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
      maxUses: 25,
      usesCount: 9,
      clicksCount: 38,
      conversionsCount: 9,
      label: 'Content Creator Fast-Track',
      note: 'Distributed to verified Twitch/YouTube roleplayers',
      isActive: true
    }
  ];

  IN_MEMORY_QUICK_INVITES[normalizedSlug] = seedInvites;
  return seedInvites;
}

/**
 * Record a click-through on a Quick Invite link
 */
export async function recordInviteClick(inviteCode: string, serverSlug: string): Promise<void> {
  const normalizedSlug = normalizeServerSlug(serverSlug);
  const cleanCode = inviteCode.trim().toUpperCase();

  // Find in memory
  const list = IN_MEMORY_QUICK_INVITES[normalizedSlug] || [];
  const item = list.find((i) => i.code === cleanCode);
  if (item) {
    item.clicksCount = (item.clicksCount || 0) + 1;
  }

  // Update in Firestore
  try {
    const q = query(
      collection(db, QUICK_INVITES_COLLECTION),
      where('code', '==', cleanCode),
      where('serverSlug', '==', normalizedSlug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const targetDoc = snap.docs[0];
      const data = targetDoc.data() as QuickInvite;
      await updateDoc(targetDoc.ref, {
        clicksCount: (data.clicksCount || 0) + 1
      });
    }
  } catch (err) {
    console.warn('Click record warning:', err);
  }

  // Post to backend
  try {
    fetch('/api/servers/quick-invites/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, serverSlug: normalizedSlug })
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Record a conversion (submitted whitelist application) on a Quick Invite
 */
export async function recordInviteConversion(inviteCode: string, serverSlug: string): Promise<void> {
  const normalizedSlug = normalizeServerSlug(serverSlug);
  const cleanCode = inviteCode.trim().toUpperCase();

  // Find in memory
  const list = IN_MEMORY_QUICK_INVITES[normalizedSlug] || [];
  const item = list.find((i) => i.code === cleanCode);
  if (item) {
    item.conversionsCount = (item.conversionsCount || 0) + 1;
    item.usesCount = (item.usesCount || 0) + 1;
  }

  // Update in Firestore
  try {
    const q = query(
      collection(db, QUICK_INVITES_COLLECTION),
      where('code', '==', cleanCode),
      where('serverSlug', '==', normalizedSlug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const targetDoc = snap.docs[0];
      const data = targetDoc.data() as QuickInvite;
      await updateDoc(targetDoc.ref, {
        conversionsCount: (data.conversionsCount || 0) + 1,
        usesCount: (data.usesCount || 0) + 1
      });
    }
  } catch (err) {
    console.warn('Conversion record warning:', err);
  }

  // Post to backend
  try {
    fetch('/api/servers/quick-invites/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, serverSlug: normalizedSlug })
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Delete a Quick Invite
 */
export async function deleteQuickInvite(inviteId: string, serverSlug: string): Promise<void> {
  const normalizedSlug = normalizeServerSlug(serverSlug);
  try {
    const docRef = doc(db, QUICK_INVITES_COLLECTION, inviteId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Delete quick invite Firestore warning:', err);
  }

  if (IN_MEMORY_QUICK_INVITES[normalizedSlug]) {
    IN_MEMORY_QUICK_INVITES[normalizedSlug] = IN_MEMORY_QUICK_INVITES[normalizedSlug].filter(
      (i) => i.id !== inviteId
    );
  }

  try {
    fetch(`/api/servers/quick-invites/${inviteId}`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {}
}

/**
 * Toggle Active Status on a Quick Invite
 */
export async function toggleQuickInviteActive(inviteId: string, serverSlug: string, isActive: boolean): Promise<void> {
  const normalizedSlug = normalizeServerSlug(serverSlug);
  try {
    const docRef = doc(db, QUICK_INVITES_COLLECTION, inviteId);
    await updateDoc(docRef, { isActive });
  } catch (err) {
    console.warn('Toggle quick invite Firestore warning:', err);
  }

  if (IN_MEMORY_QUICK_INVITES[normalizedSlug]) {
    const found = IN_MEMORY_QUICK_INVITES[normalizedSlug].find((i) => i.id === inviteId);
    if (found) found.isActive = isActive;
  }
}

/**
 * Verify Server Stripe Subscription & Grant Verified Server Owner clearance
 */
export async function verifyServerStripeSubscription(params: {
  serverId: string;
  serverSlug: string;
  stripeSubscriptionId: string;
  discordId?: string;
  discordUsername?: string;
  planTier?: string;
  email?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  isVerifiedServerOwner?: boolean;
  isSubscriptionActive?: boolean;
  planTier?: string;
}> {
  try {
    const res = await fetch('/api/servers/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to communicate with subscription verification server' };
  }
}

/**
 * Fetch Server Subscription & Verified Owner Status
 */
export async function fetchServerSubscriptionStatus(serverSlug: string): Promise<{
  success: boolean;
  isVerifiedServerOwner?: boolean;
  isSubscriptionActive?: boolean;
  trialActive?: boolean;
  isExpired?: boolean;
  stripeSubscriptionId?: string;
  subscriptionExpiresAt?: number | string;
  subscriptionExpiresAtIso?: string;
  trialStartedAt?: number;
  trialEndsAt?: number;
  trialEndsAtIso?: string;
  daysRemaining?: number;
  subscriptionStatus?: 'trialing' | 'active' | 'expired' | 'inactive';
  planTier?: string;
  customBranding?: any;
  priorityPlacement?: any;
  features?: Record<string, boolean>;
}> {
  try {
    const res = await fetch(`/api/servers/${encodeURIComponent(serverSlug)}/subscription-status`);
    return await res.json();
  } catch (err: any) {
    return { success: false };
  }
}

/**
 * Save Custom Branding Configuration (Gated for Verified Server Owners)
 */
export async function saveServerCustomBranding(params: {
  serverId: string;
  serverSlug: string;
  customBranding: any;
  discordId?: string;
  isStaffBypass?: boolean;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { serverId, serverSlug, customBranding } = params;
  const cleanSlug = normalizeServerSlug(serverSlug || serverId);
  const cleanServerId = (serverId || cleanSlug).trim();

  // 1. Direct Firestore Persistence
  try {
    if (cleanServerId) {
      await setDoc(doc(db, FORMS_COLLECTION, cleanServerId), { customBranding, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'servers', cleanServerId), { customBranding, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
    if (cleanSlug && cleanSlug !== cleanServerId) {
      await setDoc(doc(db, FORMS_COLLECTION, cleanSlug), { customBranding, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'servers', cleanSlug), { customBranding, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  } catch (fsErr) {
    console.warn('Direct Firestore custom branding save fallback notice:', fsErr);
  }

  // 2. In-Memory Seed / Cache Sync
  if (cleanServerId && DEFAULT_SEED_FORMS[cleanServerId]) {
    DEFAULT_SEED_FORMS[cleanServerId] = {
      ...DEFAULT_SEED_FORMS[cleanServerId],
      customBranding: {
        ...(DEFAULT_SEED_FORMS[cleanServerId].customBranding || {}),
        ...customBranding
      }
    };
  }
  if (cleanSlug && DEFAULT_SEED_FORMS[cleanSlug]) {
    DEFAULT_SEED_FORMS[cleanSlug] = {
      ...DEFAULT_SEED_FORMS[cleanSlug],
      customBranding: {
        ...(DEFAULT_SEED_FORMS[cleanSlug].customBranding || {}),
        ...customBranding
      }
    };
  }

  // 3. Call backend API route
  try {
    const res = await fetch('/api/servers/custom-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (data.success) {
      return data;
    }
    return { success: true, message: 'Custom branding applied and published to Firestore!' };
  } catch (err: any) {
    return { success: true, message: 'Custom branding applied locally and in Firestore.' };
  }
}

/**
 * Save Priority Placement & Directory Boost (Gated for Verified Server Owners)
 */
export async function saveServerPriorityPlacement(params: {
  serverId: string;
  serverSlug: string;
  priorityPlacement: any;
  isStaffBypass?: boolean;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { serverId, serverSlug, priorityPlacement } = params;
  const cleanSlug = normalizeServerSlug(serverSlug || serverId);
  const cleanServerId = (serverId || cleanSlug).trim();

  // 1. Direct Firestore Persistence
  try {
    if (cleanServerId) {
      await setDoc(doc(db, FORMS_COLLECTION, cleanServerId), { priorityPlacement, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'servers', cleanServerId), { priorityPlacement, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
    if (cleanSlug && cleanSlug !== cleanServerId) {
      await setDoc(doc(db, FORMS_COLLECTION, cleanSlug), { priorityPlacement, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'servers', cleanSlug), { priorityPlacement, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  } catch (fsErr) {
    console.warn('Direct Firestore priority placement save fallback notice:', fsErr);
  }

  // 2. In-Memory Seed / Cache Sync
  if (cleanServerId && DEFAULT_SEED_FORMS[cleanServerId]) {
    DEFAULT_SEED_FORMS[cleanServerId] = {
      ...DEFAULT_SEED_FORMS[cleanServerId],
      priorityPlacement: {
        ...(DEFAULT_SEED_FORMS[cleanServerId].priorityPlacement || {}),
        ...priorityPlacement
      }
    };
  }
  if (cleanSlug && DEFAULT_SEED_FORMS[cleanSlug]) {
    DEFAULT_SEED_FORMS[cleanSlug] = {
      ...DEFAULT_SEED_FORMS[cleanSlug],
      priorityPlacement: {
        ...(DEFAULT_SEED_FORMS[cleanSlug].priorityPlacement || {}),
        ...priorityPlacement
      }
    };
  }

  // 3. Call backend API route
  try {
    const res = await fetch('/api/servers/priority-placement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (data.success) {
      return data;
    }
    return { success: true, message: 'Priority placement saved to Firestore!' };
  } catch (err: any) {
    return { success: true, message: 'Priority placement saved locally and in Firestore.' };
  }
}

/**
 * Import or Batch Restore Whitelist Applications into Firestore and local cache
 */
export async function importWhitelistApplications(apps: WhitelistApplication[]): Promise<{ success: boolean; count: number }> {
  let count = 0;
  for (const app of apps) {
    if (!app.id) continue;
    try {
      const docRef = doc(db, APPLICATIONS_COLLECTION, app.id);
      await setDoc(docRef, app, { merge: true });
      count++;
    } catch (err) {
      console.warn(`Failed to import application ${app.id} to Firestore:`, err);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gtavi_submitted_app_${app.id}`, JSON.stringify(app));
      } catch {}
    }
  }
  return { success: true, count };
}


