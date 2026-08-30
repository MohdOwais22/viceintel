/**
 * Server-Side SaaS Authorization & Subscription Guard Module
 * Enforces Zero-Free-Access policy for Server Owner Management Suites
 * 
 * Verifies:
 * 1. User authentication (Firebase UID / Discord ID)
 * 2. Server ownership identity
 * 3. Active paid SaaS subscription (Community, Mega-Server, Enterprise, Starter, Pro, Mega)
 * 
 * Redirects unauthorized or unpaid requests to the appropriate billing or auth page.
 */

import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface AuthGuardValidationResult {
  authorized: boolean;
  reason?: 'unauthenticated' | 'unauthorized' | 'server_not_found' | 'payment_required';
  server?: any;
  redirectUrl?: string;
  error?: string;
}

export interface AuthGuardOptions {
  serverSlug: string;
  userDiscordId?: string | null;
  userUid?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  isStaff?: boolean;
}

/**
 * Validates whether the current user is the verified owner of a server
 * AND holds an active paid subscription (Community $29, Mega-Server $49, Enterprise $99).
 */
export async function validateServerOwnerSubscription(
  options: AuthGuardOptions
): Promise<AuthGuardValidationResult> {
  const { serverSlug, userDiscordId, userUid, userEmail, isAdmin } = options;

  if (!serverSlug) {
    return {
      authorized: false,
      reason: 'server_not_found',
      error: 'Invalid or missing server slug',
      redirectUrl: '/servers'
    };
  }

  // Admin / Superuser override for platform administrators
  const isSuperAdmin = Boolean(
    isAdmin ||
    (userEmail && (
      userEmail.toLowerCase() === 'admin@vicecity.app' ||
      userEmail.toLowerCase() === 'l4_admin@vicecity.app'
    ))
  );

  let serverData: any = null;
  let serverDocId: string | null = null;

  try {
    // 1. Check direct doc lookup in `servers` collection
    const serverRef = doc(db, 'servers', serverSlug);
    const serverSnap = await getDoc(serverRef);

    if (serverSnap.exists()) {
      serverData = serverSnap.data();
      serverDocId = serverSnap.id;
    } else {
      // Query by `slug` or `serverSlug` in `servers` collection
      const qSlug = query(collection(db, 'servers'), where('slug', '==', serverSlug));
      const qSlugSnap = await getDocs(qSlug);
      
      if (!qSlugSnap.empty) {
        serverData = qSlugSnap.docs[0].data();
        serverDocId = qSlugSnap.docs[0].id;
      } else {
        const qServerSlug = query(collection(db, 'servers'), where('serverSlug', '==', serverSlug));
        const qServerSlugSnap = await getDocs(qServerSlug);
        
        if (!qServerSlugSnap.empty) {
          serverData = qServerSlugSnap.docs[0].data();
          serverDocId = qServerSlugSnap.docs[0].id;
        } else {
          // Fallback check in `rpServers` collection
          const rpRef = doc(db, 'rpServers', serverSlug);
          const rpSnap = await getDoc(rpRef);
          if (rpSnap.exists()) {
            serverData = rpSnap.data();
            serverDocId = rpSnap.id;
          } else {
            const rpQ = query(collection(db, 'rpServers'), where('slug', '==', serverSlug));
            const rpQSnap = await getDocs(rpQ);
            if (!rpQSnap.empty) {
              serverData = rpQSnap.docs[0].data();
              serverDocId = rpQSnap.docs[0].id;
            } else {
              const rpQ2 = query(collection(db, 'rpServers'), where('serverSlug', '==', serverSlug));
              const rpQ2Snap = await getDocs(rpQ2);
              if (!rpQ2Snap.empty) {
                serverData = rpQ2Snap.docs[0].data();
                serverDocId = rpQ2Snap.docs[0].id;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[AuthGuard] Firestore lookup error:', err);
  }

  // If server document was not found
  if (!serverData) {
    return {
      authorized: false,
      reason: 'server_not_found',
      error: `Server listing '${serverSlug}' was not found in directory.`,
      redirectUrl: '/servers'
    };
  }

  // Attach resolved id and slug
  serverData.id = serverData.id || serverDocId || serverSlug;
  serverData.slug = serverData.slug || serverSlug;
  serverData.serverSlug = serverData.serverSlug || serverSlug;

  // 2. Verify Authentication & Ownership Identity
  if (!isSuperAdmin) {
    if (!userDiscordId && !userUid && !userEmail) {
      return {
        authorized: false,
        reason: 'unauthenticated',
        server: serverData,
        error: 'Authentication required. Please connect your Discord account or sign in.',
        redirectUrl: `/servers/${encodeURIComponent(serverSlug)}/manage?error=auth_required`
      };
    }

    const matchesDiscord = Boolean(
      userDiscordId && (
        serverData.ownerDiscordId === userDiscordId ||
        serverData.claimedByDiscordId === userDiscordId ||
        serverData.ownerDiscordUsername?.toLowerCase() === userDiscordId.toLowerCase()
      )
    );

    const matchesUid = Boolean(
      userUid && (
        serverData.ownerUid === userUid ||
        serverData.claimedByUid === userUid ||
        serverData.userId === userUid ||
        serverData.ownerId === userUid
      )
    );

    const matchesEmail = Boolean(
      userEmail && (
        (serverData.ownerEmail && serverData.ownerEmail.toLowerCase() === userEmail.toLowerCase()) ||
        (serverData.email && serverData.email.toLowerCase() === userEmail.toLowerCase())
      )
    );

    if (!matchesDiscord && !matchesUid && !matchesEmail) {
      return {
        authorized: false,
        reason: 'unauthorized',
        server: serverData,
        error: 'Access denied: You are not the registered owner of this server listing.',
        redirectUrl: `/servers/${encodeURIComponent(serverSlug)}?error=unauthorized`
      };
    }
  }

  // 3. Strict Subscription Validation (Zero-Free-Access Policy)
  const validTiers = [
    'community', 'mega_server', 'enterprise',
    'starter', 'pro', 'mega',
    'starter_plan', 'pro_plan', 'mega_plan'
  ];

  const hasValidTier = Boolean(
    (serverData.tier && validTiers.includes(String(serverData.tier).toLowerCase())) ||
    (serverData.planTier && validTiers.includes(String(serverData.planTier).toLowerCase())) ||
    (serverData.pricingTier && validTiers.includes(String(serverData.pricingTier).toLowerCase()))
  );

  const isSubscriptionActive = Boolean(
    isSuperAdmin ||
    (serverData.isSubscriptionActive === true && hasValidTier) ||
    (serverData.status === 'active' && hasValidTier) ||
    (serverData.directoryStatus === 'published' && hasValidTier) ||
    (typeof serverData.tierWeight === 'number' && serverData.tierWeight > 0)
  );

  if (!isSubscriptionActive) {
    return {
      authorized: false,
      reason: 'payment_required',
      server: serverData,
      error: 'Active SaaS Subscription required to access server management suite.',
      redirectUrl: `/servers/${encodeURIComponent(serverSlug)}/billing?error=payment_required`
    };
  }

  return {
    authorized: true,
    server: serverData
  };
}

/**
 * Server-Side Route Guard for Next.js App Router Page Components
 * Automatically throws or returns redirect configuration if authorization fails.
 */
export async function requireServerOwnerSubscription(
  serverSlug: string,
  options: Omit<AuthGuardOptions, 'serverSlug'> = {}
): Promise<{ server: any }> {
  const result = await validateServerOwnerSubscription({
    serverSlug,
    ...options
  });

  if (!result.authorized) {
    const targetUrl = result.redirectUrl || `/servers/${encodeURIComponent(serverSlug)}/billing`;
    return {
      server: null,
      ...result,
      redirect: {
        destination: targetUrl,
        permanent: false
      }
    } as any;
  }

  return { server: result.server };
}

/**
 * Express / Node.js API Middleware Helper for strict route protection
 */
export function createServerSubscriptionGuardMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      const serverSlug = req.params?.slug || req.params?.serverId || req.body?.serverSlug || req.query?.slug;
      const userDiscordId = req.headers['x-discord-id'] || req.body?.discordId || req.user?.discordId;
      const userUid = req.headers['x-user-uid'] || req.body?.uid || req.user?.uid;
      const userEmail = req.headers['x-user-email'] || req.user?.email;
      const isAdmin = req.headers['x-is-admin'] === 'true' || req.user?.isAdmin;

      const result = await validateServerOwnerSubscription({
        serverSlug,
        userDiscordId,
        userUid,
        userEmail,
        isAdmin
      });

      if (!result.authorized) {
        if (result.reason === 'payment_required') {
          return res.status(402).json({
            success: false,
            error: result.error,
            reason: result.reason,
            redirectUrl: result.redirectUrl
          });
        }
        if (result.reason === 'unauthorized') {
          return res.status(403).json({
            success: false,
            error: result.error,
            reason: result.reason,
            redirectUrl: result.redirectUrl
          });
        }
        return res.status(401).json({
          success: false,
          error: result.error,
          reason: result.reason,
          redirectUrl: result.redirectUrl
        });
      }

      req.verifiedServer = result.server;
      next();
    } catch (err: any) {
      console.error('[AuthGuard Middleware Error]:', err);
      return res.status(500).json({ error: 'Internal authorization guard failure' });
    }
  };
}
