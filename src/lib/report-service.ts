import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface IssueReport {
  id: string;
  reportRefNumber: string;
  category: 'bug' | 'ui' | 'performance' | 'radar_sync' | 'calculator' | 'voice_comms' | 'billing_vip' | 'suggestion' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  
  // Screenshot data (base64 data URL or storage URL)
  screenshotUrl?: string;
  screenshotFileName?: string;
  
  // Reporter context
  reporterUid?: string;
  reporterName: string;
  reporterEmail?: string;
  reporterRole?: string;
  isVip?: boolean;
  
  // Environment Telemetry
  activeTab: string;
  currentUrl: string;
  browser: string;
  os: string;
  screenResolution: string;
  userAgent: string;
  recentConsoleErrors?: string[];
  
  // Status & Administration
  status: 'pending' | 'open' | 'in_progress' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  createdAtMs: number;
}

const LOCAL_STORAGE_REPORTS_KEY = 'gtavicentral_cached_issue_reports';

// Helper to get locally cached issue reports
export function getLocalCachedReports(): IssueReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save locally cached issue reports
function saveLocalCachedReport(report: IssueReport) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalCachedReports();
    const filtered = current.filter(r => r.id !== report.id);
    filtered.unshift(report);
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (e) {
    console.warn('LocalStorage save report note:', e);
  }
}

// Global in-memory log buffer for uncaught client errors
const recentClientErrors: string[] = [];

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = `[${new Date().toLocaleTimeString()}] ${event.message} at ${event.filename}:${event.lineno}`;
    recentClientErrors.unshift(errorMsg);
    if (recentClientErrors.length > 10) recentClientErrors.pop();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = typeof event.reason === 'object' ? JSON.stringify(event.reason) : String(event.reason);
    const errorMsg = `[${new Date().toLocaleTimeString()}] Unhandled Promise: ${reason}`;
    recentClientErrors.unshift(errorMsg);
    if (recentClientErrors.length > 10) recentClientErrors.pop();
  });
}

export function getRecentClientErrors(): string[] {
  return [...recentClientErrors];
}

// Detect client device telemetry
export function getClientTelemetry(activeTab: string = 'home') {
  if (typeof window === 'undefined') {
    return {
      activeTab,
      currentUrl: '',
      browser: 'Unknown',
      os: 'Unknown',
      screenResolution: '1920x1080',
      userAgent: 'Server-Side'
    };
  }

  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
  else if (userAgent.includes('Edge') || userAgent.includes('Edg')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome')) browser = 'Google Chrome';
  else if (userAgent.includes('Safari')) browser = 'Apple Safari';

  let os = 'Unknown OS';
  if (userAgent.includes('Win')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return {
    activeTab,
    currentUrl: window.location.href,
    browser,
    os,
    screenResolution: `${window.innerWidth}x${window.innerHeight} (Screen: ${window.screen?.width || 0}x${window.screen?.height || 0})`,
    userAgent
  };
}

// Generate human-friendly reference token (e.g., VICE-BUG-8492)
export function generateReportRefToken(category: string): string {
  const prefix = category.toUpperCase().slice(0, 3);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `VICE-${prefix}-${randomDigits}`;
}

/**
 * Submit an issue report to Firestore bugReports collection and create a pending approval moderation card
 */
export async function submitIssueReport(data: Omit<IssueReport, 'id' | 'createdAt' | 'createdAtMs' | 'status' | 'reportRefNumber'>): Promise<IssueReport> {
  const refNumber = generateReportRefToken(data.category);
  const now = new Date();
  const reportDocId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newReport: IssueReport = {
    ...data,
    id: reportDocId,
    reportRefNumber: refNumber,
    status: 'pending',
    createdAt: now.toISOString(),
    createdAtMs: now.getTime()
  };

  // 1. Save locally for instant availability and resilience
  saveLocalCachedReport(newReport);

  // 2. Save to primary bugReports collection in Firestore
  try {
    const bugReportRef = doc(db, 'bugReports', reportDocId);
    await setDoc(bugReportRef, {
      ...newReport,
      status: 'pending',
      serverTimestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn('Direct Firestore bugReports save notice:', err);
  }

  // 3. Also save to issueReports collection for backwards compatibility
  try {
    const reportRef = doc(db, 'issueReports', reportDocId);
    await setDoc(reportRef, {
      ...newReport,
      status: 'pending',
      serverTimestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn('Direct Firestore issueReports save notice:', err);
  }

  // 4. Also push to pendingApprovals collection so administrators see it instantly in their main moderation queue
  const approvalId = `pending_${reportDocId}`;
  const pendingPayload = {
    id: approvalId,
    type: 'issue_report',
    title: `[${data.severity.toUpperCase()}] ${data.title}`,
    submittedBy: data.reporterName,
    reporterUid: data.reporterUid || 'anonymous',
    submittedAt: 'Just now',
    detail: data.description,
    category: data.category,
    severity: data.severity,
    screenshotUrl: data.screenshotUrl || null,
    activeTab: data.activeTab,
    reportRefNumber: refNumber,
    reportId: reportDocId,
    status: 'pending',
    requestedAtMs: now.getTime(),
    createdAt: now.toISOString()
  };

  try {
    const approvalRef = doc(db, 'pendingApprovals', approvalId);
    await setDoc(approvalRef, {
      ...pendingPayload,
      serverTimestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn('PendingApprovals push notice:', err);
  }

  // 5. Post to Express REST API for MongoDB synchronization in Admin HQ
  try {
    await fetch(`/api/admin/cms/pendingApprovals/${approvalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingPayload)
    });
  } catch (err) {
    console.warn('REST API pendingApprovals push error:', err);
  }

  return newReport;
}

/**
 * Subscribe to live issue and bug reports from Firestore (bugReports & issueReports)
 */
export function subscribeToIssueReports(onReportsUpdate: (reports: IssueReport[]) => void): () => void {
  try {
    // Deliver locally cached reports immediately
    const local = getLocalCachedReports();
    if (local.length > 0) {
      onReportsUpdate(local);
    }

    const unsubs: (() => void)[] = [];
    const aggregatedMap = new Map<string, IssueReport>();

    // Seed local cache into aggregator
    local.forEach((r) => aggregatedMap.set(r.id, r));

    const notify = () => {
      const all = Array.from(aggregatedMap.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
      onReportsUpdate(all);
    };

    // 1. Subscribe to bugReports collection
    try {
      const qBug = query(collection(db, 'bugReports'), orderBy('createdAtMs', 'desc'));
      const unsubBug = onSnapshot(
        qBug,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            aggregatedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id } as IssueReport);
          });
          notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot bugReports subscription fallback to local cache:', err);
        }
      );
      unsubs.push(unsubBug);
    } catch (e) {
      console.warn('bugReports subscribe error:', e);
    }

    // 2. Subscribe to issueReports collection for full sync
    try {
      const qIssue = query(collection(db, 'issueReports'), orderBy('createdAtMs', 'desc'));
      const unsubIssue = onSnapshot(
        qIssue,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as IssueReport;
            if (!aggregatedMap.has(docSnap.id) || aggregatedMap.get(docSnap.id)?.status === 'open') {
              aggregatedMap.set(docSnap.id, { ...data, id: docSnap.id });
            }
          });
          notify();
        },
        (err) => {
          console.warn('Firestore onSnapshot issueReports subscription fallback:', err);
        }
      );
      unsubs.push(unsubIssue);
    } catch (e) {
      console.warn('issueReports subscribe error:', e);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  } catch (e) {
    console.warn('Failed to initialize issue reports onSnapshot:', e);
    onReportsUpdate(getLocalCachedReports());
    return () => {};
  }
}

export const subscribeToBugReports = subscribeToIssueReports;

/**
 * Update the status of an issue report (Pending -> In Progress -> Resolved -> Dismissed)
 */
export async function updateReportStatus(
  reportId: string,
  status: IssueReport['status'],
  adminNotes?: string,
  adminUser?: string
): Promise<void> {
  // Update local cache
  if (typeof window !== 'undefined') {
    const current = getLocalCachedReports();
    const updated = current.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : r.resolvedAt,
          resolvedBy: status === 'resolved' ? (adminUser || 'Staff Admin') : r.resolvedBy
        };
      }
      return r;
    });
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
  }

  const updatePayload: any = {
    status,
    updatedAt: new Date().toISOString()
  };

  if (adminNotes !== undefined) {
    updatePayload.adminNotes = adminNotes;
  }

  if (status === 'resolved') {
    updatePayload.resolvedAt = new Date().toISOString();
    updatePayload.resolvedBy = adminUser || 'Staff Admin';
  }

  // Update in bugReports collection
  try {
    const bugDocRef = doc(db, 'bugReports', reportId);
    await setDoc(bugDocRef, updatePayload, { merge: true });
  } catch (err) {
    console.warn('Firestore bugReports status update fallback:', err);
  }

  // Update in issueReports collection
  try {
    const docRef = doc(db, 'issueReports', reportId);
    await setDoc(docRef, updatePayload, { merge: true });
  } catch (err) {
    console.warn('Firestore issueReports status update fallback:', err);
  }

  // Also clean up pending approvals if resolved or dismissed
  if (status === 'resolved' || status === 'dismissed') {
    try {
      await deleteDoc(doc(db, 'pendingApprovals', `pending_${reportId}`));
    } catch {}
  }
}

/**
 * Delete an issue report permanently
 */
export async function deleteIssueReport(reportId: string): Promise<void> {
  // Delete from local cache
  if (typeof window !== 'undefined') {
    const current = getLocalCachedReports();
    const filtered = current.filter(r => r.id !== reportId);
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(filtered));
  }

  try {
    await deleteDoc(doc(db, 'bugReports', reportId));
  } catch (err) {
    console.warn('Firestore delete bug report notice:', err);
  }

  try {
    await deleteDoc(doc(db, 'issueReports', reportId));
  } catch (err) {
    console.warn('Firestore delete issue report notice:', err);
  }

  try {
    await deleteDoc(doc(db, 'pendingApprovals', `pending_${reportId}`));
  } catch {}
}
