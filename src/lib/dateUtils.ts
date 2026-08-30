const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/**
 * Safely parses any date representation into a Date object or null.
 * Supports numbers (timestamps in sec or ms), ISO strings, Firestore Timestamps, and Date objects.
 */
export function parseFlexibleDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  // Firestore Timestamp object { seconds, nanoseconds } or { toDate() }
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return null;
    // Unix timestamp in seconds vs milliseconds
    const ms = val < 1e11 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === 'never' || trimmed.toLowerCase() === 'null') return null;
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) {
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return null;
}

/**
 * Formats timestamps for crawler status, e.g. "Today at 2:48 PM", "Yesterday at 11:30 AM", or "Aug 26, 2026 at 2:48 PM".
 */
export function formatAutoCrawlTime(val?: any): string {
  const date = parseFlexibleDate(val);
  if (!date) return typeof val === 'string' && val.length > 0 && !val.includes('T') ? val : 'Just now';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year} at ${timeStr}`;
}

/**
 * Formats a date into "MMM D, YYYY, h:mm A" (e.g. "Aug 26, 2026, 2:48 PM")
 */
export function formatDateTime(val?: any, fallback = 'N/A'): string {
  const date = parseFlexibleDate(val);
  if (!date) return fallback;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date into "MMM D, YYYY" (e.g. "Aug 26, 2026")
 */
export function formatDate(val?: any, fallback = 'N/A'): string {
  const date = parseFlexibleDate(val);
  if (!date) return fallback;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a time into "h:mm A" (e.g. "2:48 PM")
 */
export function formatTime(val?: any, fallback = 'N/A'): string {
  const date = parseFlexibleDate(val);
  if (!date) return fallback;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date into relative human text or absolute date time if older.
 */
export function formatRelativeOrDateTime(val?: any, fallback = 'Just now'): string {
  const date = parseFlexibleDate(val);
  if (!date) return fallback;

  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return formatDateTime(date);
}

/**
 * Formats VIP Expiration strings like "Lifetime", "Staff Account", or parses ISO dates into "Aug 26, 2027"
 */
export function formatVipExpiry(val?: any): string {
  if (!val) return 'No Active VIP';
  if (typeof val === 'string') {
    if (val === 'Lifetime' || val === 'Staff Account' || val === 'Expired' || val === 'Upcoming Expiry') {
      return val;
    }
  }
  const date = parseFlexibleDate(val);
  if (date) {
    return formatDate(date);
  }
  return String(val);
}

/**
 * Formats timestamps into compact, human-readable relative/absolute time labels.
 */
export function formatShortTimestamp(timestamp?: string | number, createdAt?: number): string {
  if (!timestamp && !createdAt) return 'Just now';

  let timeVal: number | null = null;

  if (typeof createdAt === 'number' && !Number.isNaN(createdAt) && createdAt > 0) {
    timeVal = createdAt;
  } else if (typeof timestamp === 'number' && !Number.isNaN(timestamp)) {
    timeVal = timestamp;
  } else if (typeof timestamp === 'string') {
    const num = Number(timestamp);
    if (!Number.isNaN(num) && num > 0) {
      timeVal = num;
    } else {
      const parsed = Date.parse(timestamp);
      if (!Number.isNaN(parsed)) {
        timeVal = parsed;
      }
    }
  }

  if (timeVal === null) {
    if (typeof timestamp === 'string') {
      return timestamp.length > 20 ? timestamp.slice(0, 16).replace('T', ' ') : timestamp;
    }
    return 'Just now';
  }

  const diffSec = Math.floor((Date.now() - timeVal) / 1000);

  // If time is slightly in the future or under 45s, treat as just now
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  const d = new Date(timeVal);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}


