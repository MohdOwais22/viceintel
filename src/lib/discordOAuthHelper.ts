/**
 * Discord Client-Side & Server-Side Universal OAuth2 Helper
 * Supports direct Implicit Grant (#access_token=...) on static deployments (Vercel, GitHub Pages)
 * and server authorization code exchange on Cloud Run / Node Express backends.
 */

import { ENV } from './envConfig';
import { linkDiscordToUser } from './whitelist-service';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_DISCORD_CLIENT_ID = '1540025117470621759';

export function getCustomDiscordClientId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('gtavi_custom_discord_client_id') || '';
}

export function setCustomDiscordClientId(id: string): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem('gtavi_custom_discord_client_id');
  } else {
    localStorage.setItem('gtavi_custom_discord_client_id', id.trim());
  }
}

export function getEffectiveDiscordClientId(): string {
  const custom = getCustomDiscordClientId();
  if (custom && /^\d{17,20}$/.test(custom)) return custom;
  if (ENV.DISCORD_CLIENT_ID && /^\d{17,20}$/.test(ENV.DISCORD_CLIENT_ID)) return ENV.DISCORD_CLIENT_ID;
  return '';
}

export interface DiscordOAuthOptions {
  uid?: string;
  slug?: string;
  returnUrl?: string;
  clientId?: string;
  preferDirectImplicit?: boolean;
}

/**
 * Initiates the Discord OAuth2 authorization flow.
 * Directs the browser to the backend `/api/auth/discord` route which handles the
 * Authorization Code flow (response_type=code) and exchanges tokens securely on the server.
 */
export function startDiscordOAuth(options: DiscordOAuthOptions = {}): { initiated: boolean; needsClientId: boolean } {
  if (typeof window === 'undefined') return { initiated: false, needsClientId: false };

  const clientId = options.clientId || getEffectiveDiscordClientId();
  
  if (!clientId || !/^\d{17,20}$/.test(clientId)) {
    return { initiated: false, needsClientId: true };
  }

  const returnPath = options.returnUrl || window.location.pathname || '/profile';
  
  const statePayload = {
    uid: options.uid || '',
    slug: options.slug || '',
    returnUrl: returnPath,
    clientId,
    ts: Date.now()
  };

  try {
    sessionStorage.setItem('gtavi_discord_oauth_state', JSON.stringify(statePayload));
  } catch {}

  // Route to the server's Discord OAuth endpoint for authorization code flow
  const params = new URLSearchParams({
    uid: options.uid || '',
    slug: options.slug || '',
    returnUrl: returnPath,
    clientId
  });

  window.location.href = `/api/auth/discord?${params.toString()}`;
  return { initiated: true, needsClientId: false };
}

/**
 * Checks for Discord OAuth credentials in URL hash (#access_token=...) or search params (?discordLinked=true).
 * Automatically fetches user profile and saves to Firestore.
 */
export async function processDiscordCallback(currentUserUid?: string): Promise<{
  handled: boolean;
  success: boolean;
  user?: { id: string; username: string; avatarUrl: string };
  error?: string;
}> {
  if (typeof window === 'undefined') return { handled: false, success: false };

  // 1. Check URL Hash for Implicit Grant token (#access_token=...)
  const hash = window.location.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('token_type') || 'Bearer';
    const expiresIn = Number(hashParams.get('expires_in')) || 604800;
    const scope = hashParams.get('scope') || 'identify guilds email';
    const hashError = hashParams.get('error');
    const hashErrorDesc = hashParams.get('error_description');

    if (hashError) {
      // Clean URL hash
      try {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } catch {}
      return {
        handled: true,
        success: false,
        error: hashErrorDesc || hashError || 'Discord authorization was cancelled or denied.'
      };
    }

    if (accessToken) {
      try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `${tokenType} ${accessToken}` }
        });

        if (!userRes.ok) {
          throw new Error(`Discord API returned status ${userRes.status}`);
        }

        const discordUser = await userRes.json();

        if (!discordUser?.id) {
          throw new Error('Failed to retrieve Discord user profile.');
        }

        const discordTag = discordUser.discriminator && discordUser.discriminator !== '0'
          ? `${discordUser.username}#${discordUser.discriminator}`
          : `@${discordUser.username}`;

        const avatarUrl = discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

        const targetUid = currentUserUid || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_auth_uid') : null);

        if (targetUid) {
          await linkDiscordToUser(targetUid, {
            discordId: discordUser.id,
            discordUsername: discordTag,
            discordAvatar: avatarUrl
          });

          // Store discordAuth metadata in Firestore
          try {
            await setDoc(doc(db, 'userProfiles', targetUid), {
              discordConnected: true,
              discordId: discordUser.id,
              discordUsername: discordTag,
              discordAvatar: avatarUrl,
              discordAuth: {
                tokenType,
                scope,
                expiresAt: Date.now() + expiresIn * 1000,
                discordId: discordUser.id,
                discordUsername: discordTag,
                discordAvatar: avatarUrl,
                linkedAt: new Date().toISOString(),
                lastRefreshedAt: new Date().toISOString()
              },
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (fsErr) {
            console.warn('Firestore direct auth doc update notice:', fsErr);
          }
        }

        // Clean URL hash
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch {}

        return {
          handled: true,
          success: true,
          user: {
            id: discordUser.id,
            username: discordTag,
            avatarUrl
          }
        };
      } catch (err: any) {
        // Clean URL hash
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch {}
        return {
          handled: true,
          success: false,
          error: err?.message || 'Failed to exchange Discord authorization with Discord API.'
        };
      }
    }
  }

  // 2. Check Search Params for Server Code callback (?discordLinked=true or ?discordError=...)
  const searchParams = new URLSearchParams(window.location.search);
  const discordErrorParam = searchParams.get('discordError');
  const discordLinkedParam = searchParams.get('discordLinked') === 'true';
  const discordIdParam = searchParams.get('discordId');
  const discordUsernameParam = searchParams.get('discordUsername');
  const discordAvatarParam = searchParams.get('discordAvatar');

  if (discordErrorParam) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}
    return {
      handled: true,
      success: false,
      error: decodeURIComponent(discordErrorParam)
    };
  }

  if (discordLinkedParam && discordIdParam) {
    const cleanTag = decodeURIComponent(discordUsernameParam || '');
    const cleanAvatar = decodeURIComponent(discordAvatarParam || '');
    if (currentUserUid) {
      await linkDiscordToUser(currentUserUid, {
        discordId: discordIdParam,
        discordUsername: cleanTag,
        discordAvatar: cleanAvatar
      });
    }
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}
    return {
      handled: true,
      success: true,
      user: {
        id: discordIdParam,
        username: cleanTag,
        avatarUrl: cleanAvatar
      }
    };
  }

  return { handled: false, success: false };
}
