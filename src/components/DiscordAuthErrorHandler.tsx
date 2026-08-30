import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp,
  Key,
  HelpCircle,
  Info,
  Lock,
  LogIn,
  Mail
} from 'lucide-react';

export interface DiscordAuthErrorDetails {
  code: string;
  title: string;
  description: string;
  resolution: string;
  category: 'config' | 'user' | 'network' | 'token' | 'rate_limit' | 'provider';
  rawMessage: string;
  expectedRedirectUri?: string;
  canRetry: boolean;
  actionHint?: string;
}

/**
 * Normalizes and classifies various Discord OAuth2, Firebase Auth, and REST errors
 * into structured, human-readable explanations with actionable recovery steps.
 */
export function parseDiscordAuthError(error: unknown): DiscordAuthErrorDetails {
  let rawStr = '';

  if (typeof error === 'string') {
    rawStr = error;
  } else if (error && typeof error === 'object') {
    const errObj = error as any;
    rawStr = errObj.message || errObj.error_description || errObj.error || errObj.code || JSON.stringify(error);
  }

  const normalized = rawStr.toLowerCase();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://viceintel.app';
  const expectedRedirectUri = `${currentOrigin}/profile`;
  const serverRedirectUri = `${currentOrigin}/api/auth/discord/callback`;

  // 1. Redirect URI Mismatch
  if (
    normalized.includes('redirect_uri_mismatch') ||
    normalized.includes('invalid oauth2 redirect_uri') ||
    normalized.includes('redirect_uri must match') ||
    normalized.includes('invalid_redirect_uri') ||
    normalized.includes('redirect uri')
  ) {
    return {
      code: 'REDIRECT_URI_MISMATCH',
      title: 'Discord OAuth Redirect URI Mismatch',
      description:
        'The callback redirect URL registered in your Discord Developer Portal does not match this web application origin.',
      resolution:
        `To resolve this, open your Discord Developer Portal -> Applications -> OAuth2 -> Redirects, and add these redirect URIs: "${expectedRedirectUri}" and "${serverRedirectUri}".`,
      category: 'config',
      rawMessage: rawStr,
      expectedRedirectUri,
      canRetry: true,
      actionHint: 'Add this redirect URI to Discord Developer Portal'
    };
  }

  // 2. Access Denied / User Cancelled
  if (
    normalized.includes('access_denied') ||
    normalized.includes('user_denied') ||
    normalized.includes('user cancelled') ||
    normalized.includes('popup-closed-by-user') ||
    normalized.includes('declined')
  ) {
    return {
      code: 'USER_CANCELLED',
      title: 'Discord Authorization Cancelled',
      description:
        'The Discord authorization popup was closed or access was declined before authentication could complete.',
      resolution:
        'No changes were made to your account. You can click "Retry Discord Sign In" when you are ready to authorize.',
      category: 'user',
      rawMessage: rawStr,
      canRetry: true,
      actionHint: 'Click Retry to re-open the Discord authorization window'
    };
  }

  // 3. Invalid or Expired Token / Authorization Code
  if (
    normalized.includes('invalid_grant') ||
    normalized.includes('invalid_token') ||
    normalized.includes('code expired') ||
    normalized.includes('expired token') ||
    normalized.includes('already redeemed') ||
    normalized.includes('no authorization code')
  ) {
    return {
      code: 'INVALID_OR_EXPIRED_TOKEN',
      title: 'Expired or Invalid Authorization Code',
      description:
        'The one-time authorization code provided by Discord expired or has already been redeemed.',
      resolution:
        'Authorization codes are valid for a single exchange only. Please restart the Discord login flow to receive a fresh token.',
      category: 'token',
      rawMessage: rawStr,
      canRetry: true,
      actionHint: 'Restart Discord authorization to get a fresh token'
    };
  }

  // 4. Missing or Invalid Client Credentials / Unknown Application
  if (
    normalized.includes('unknown application') ||
    normalized.includes('unknown_application') ||
    normalized.includes('invalid_client') ||
    normalized.includes('unauthorized_client') ||
    normalized.includes('missing discord_client_id') ||
    normalized.includes('requires discord_client_id') ||
    normalized.includes('invalid client id') ||
    normalized.includes('invalid client_id') ||
    normalized.includes('invalid client secret') ||
    normalized.includes('application not found')
  ) {
    return {
      code: 'UNKNOWN_APPLICATION',
      title: 'Discord Application Not Found (Unknown Application)',
      description:
        'Discord returned "Unknown Application" because the Client ID does not match an active application in your Discord Developer Portal.',
      resolution:
        `Open your Discord Developer Portal tab -> Applications -> your application -> General Information -> Copy "Application ID", then paste it into the Discord Application ID input below.`,
      category: 'config',
      rawMessage: rawStr,
      expectedRedirectUri,
      canRetry: true,
      actionHint: 'Paste your Discord Application ID from Discord Developer Portal'
    };
  }

  // 5. Popup Blocked by Browser
  if (normalized.includes('popup-blocked') || normalized.includes('blocked by browser')) {
    return {
      code: 'POPUP_BLOCKED',
      title: 'Authentication Popup Blocked',
      description:
        'Your browser blocked the Discord OAuth popup window from opening.',
      resolution:
        'Please click the popup blocked icon in your browser address bar, choose "Always allow popups from this site", and retry.',
      category: 'user',
      rawMessage: rawStr,
      canRetry: true,
      actionHint: 'Allow popups in your browser settings and try again'
    };
  }

  // 6. Account Exists with Different Credential
  if (
    normalized.includes('account-exists-with-different-credential') ||
    normalized.includes('credential already associated')
  ) {
    return {
      code: 'ACCOUNT_EXISTS_DIFFERENT_METHOD',
      title: 'Account Already Exists',
      description:
        'An account already exists with the same email address using Google or Email/Password.',
      resolution:
        'Please sign in with your primary login method (Google or Email/Password) first, then link your Discord ID from your Profile settings.',
      category: 'provider',
      rawMessage: rawStr,
      canRetry: false,
      actionHint: 'Sign in using your original method'
    };
  }

  // 7. Operation Not Allowed (Firebase OAuth Provider Disabled)
  if (
    normalized.includes('operation-not-allowed') ||
    normalized.includes('provider is disabled')
  ) {
    return {
      code: 'PROVIDER_DISABLED',
      title: 'Discord Sign-In Provider Disabled',
      description:
        'Discord OAuth is not enabled as an active sign-in provider in your Firebase Authentication configuration.',
      resolution:
        'You can sign in using standard Email/Password or Google, or enable the Discord OAuth provider in the Firebase Console.',
      category: 'provider',
      rawMessage: rawStr,
      canRetry: false,
      actionHint: 'Use Email or Google sign-in instead'
    };
  }

  // 8. Rate Limited (429)
  if (normalized.includes('rate limit') || normalized.includes('429') || normalized.includes('too many requests')) {
    return {
      code: 'RATE_LIMITED',
      title: 'Discord API Rate Limit Exceeded',
      description:
        'Discord is currently throttling authentication requests due to frequent connection attempts.',
      resolution:
        'Please wait 20 to 30 seconds before attempting to connect your Discord account again.',
      category: 'rate_limit',
      rawMessage: rawStr,
      canRetry: true,
      actionHint: 'Wait 30 seconds before retrying'
    };
  }

  // 9. Unauthorized Domain (Firebase Auth)
  if (normalized.includes('unauthorized-domain')) {
    return {
      code: 'UNAUTHORIZED_DOMAIN',
      title: 'Unauthorized OAuth Domain',
      description:
        `The current domain (${typeof window !== 'undefined' ? window.location.hostname : 'this host'}) is not listed under Authorized Domains in Firebase Authentication.`,
      resolution:
        'Go to Firebase Console -> Authentication -> Settings -> Authorized Domains, and add this domain.',
      category: 'config',
      rawMessage: rawStr,
      canRetry: false,
      actionHint: 'Add domain to Firebase Authorized Domains'
    };
  }

  // 10. Generic / Network Fallback
  return {
    code: 'DISCORD_AUTH_ERROR',
    title: 'Discord Authentication Notice',
    description:
      rawStr && rawStr.length > 3
        ? rawStr
        : 'An unexpected issue occurred while communicating with the Discord OAuth2 service.',
    resolution:
      'Please verify your internet connection, try again, or sign in using Email or Google.',
    category: 'network',
    rawMessage: rawStr,
    canRetry: true,
    actionHint: 'Try again or use an alternative login method'
  };
}

export interface DiscordAuthErrorHandlerProps {
  error: DiscordAuthErrorDetails | string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onSwitchToEmail?: () => void;
  onSwitchToGoogle?: () => void;
  className?: string;
  compact?: boolean;
}

export const DiscordAuthErrorHandler: React.FC<DiscordAuthErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  onSwitchToEmail,
  onSwitchToGoogle,
  className = '',
  compact = false
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [copiedRawError, setCopiedRawError] = useState(false);

  if (!error) return null;

  const errorDetails: DiscordAuthErrorDetails =
    typeof error === 'object' && 'code' in error && 'title' in error
      ? (error as DiscordAuthErrorDetails)
      : parseDiscordAuthError(error);

  const handleCopyRedirectUri = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (errorDetails.expectedRedirectUri && navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails.expectedRedirectUri);
      setCopiedRedirectUri(true);
      setTimeout(() => setCopiedRedirectUri(false), 2500);
    }
  };

  const handleCopyRawError = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      const diagnosticText = `Discord OAuth Diagnostic Log:
Error Code: ${errorDetails.code}
Title: ${errorDetails.title}
Category: ${errorDetails.category}
Details: ${errorDetails.description}
Raw Message: ${errorDetails.rawMessage}
Timestamp: ${new Date().toISOString()}
Origin: ${typeof window !== 'undefined' ? window.location.origin : 'unknown'}`;

      navigator.clipboard.writeText(diagnosticText);
      setCopiedRawError(true);
      setTimeout(() => setCopiedRawError(false), 2500);
    }
  };

  // Compact variant for inline notifications
  if (compact) {
    return (
      <div
        id="discord-auth-error-compact"
        className={`p-3 bg-[#5865F2]/10 border border-[#5865F2]/40 rounded-xl text-xs text-indigo-200 flex items-start justify-between gap-3 shadow-md ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <span>{errorDetails.title}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-mono uppercase">
                {errorDetails.code}
              </span>
            </p>
            <p className="text-[11px] text-zinc-300 leading-relaxed">{errorDetails.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {errorDetails.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="p-1.5 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-indigo-200 rounded-lg transition"
              title="Retry Discord Login"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 text-zinc-400 hover:text-white transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="discord-auth-error-banner"
      className={`relative overflow-hidden rounded-2xl bg-zinc-950/95 border border-[#5865F2]/40 p-4 shadow-xl text-xs space-y-3.5 ${className}`}
    >
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5865F2] via-purple-500 to-rose-500" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-white tracking-tight">{errorDetails.title}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-indigo-300 border border-[#5865F2]/30 uppercase font-bold">
                {errorDetails.code}
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{errorDetails.description}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition shrink-0"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Actionable Resolution Card */}
      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Recommended Resolution</span>
        </div>
        <p className="text-zinc-300 leading-normal">{errorDetails.resolution}</p>

        {/* Expected Redirect URI Box with 1-Click Copy if applicable */}
        {errorDetails.expectedRedirectUri && (
          <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>Required Callback URL:</span>
              <span className="text-indigo-400 font-mono">OAuth2 Redirects</span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 border border-zinc-800 rounded-lg p-2 font-mono text-[10px] text-indigo-300 break-all select-all">
              <span className="flex-1">{errorDetails.expectedRedirectUri}</span>
              <button
                type="button"
                onClick={handleCopyRedirectUri}
                className="px-2.5 py-1 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded font-sans font-bold flex items-center gap-1 shrink-0 transition"
              >
                {copiedRedirectUri ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {errorDetails.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-extrabold text-[11px] rounded-xl transition shadow-md shadow-[#5865F2]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Discord Sign In</span>
            </button>
          )}

          {onSwitchToGoogle && (
            <button
              type="button"
              onClick={onSwitchToGoogle}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Use Google</span>
            </button>
          )}

          {onSwitchToEmail && (
            <button
              type="button"
              onClick={onSwitchToEmail}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Use Email</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyRawError}
            className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition flex items-center gap-1"
            title="Copy technical diagnostic details"
          >
            {copiedRawError ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied Log</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Diagnostics</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-2.5 py-1 text-[10px] text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 rounded-lg transition flex items-center gap-1"
          >
            <span>{showTechnicalDetails ? 'Hide' : 'Details'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Technical Diagnostics */}
      {showTechnicalDetails && (
        <div className="mt-2 p-2.5 bg-black/80 border border-zinc-800 rounded-xl font-mono text-[10px] text-zinc-400 space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-zinc-500 pb-1 border-b border-zinc-900 font-sans font-bold">
            <span>Technical Error Stack</span>
            <span>Category: {errorDetails.category}</span>
          </div>
          <p className="text-rose-400 break-all">{errorDetails.rawMessage || 'No raw message available'}</p>
          <p className="text-zinc-500">Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
        </div>
      )}
    </div>
  );
};
