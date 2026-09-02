import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { notifyQuotaExceeded } from './lib/firestoreErrorHandler';
import './index.css';

// Safely suppress benign Firestore gRPC idle stream timeout warnings and handles quota limits cleanly
const originalError = console.error;
const originalWarn = console.warn;

const isIgnorableFirestoreWarning = (args: any[]) => {
  return args.some(arg => {
    const str = typeof arg === 'string' ? arg : (arg && typeof arg === 'object' && arg.message ? arg.message : String(arg || ''));
    return (
      str.includes('Disconnecting idle stream') || 
      str.includes('Timed out waiting for new targets') ||
      str.includes('CANCELLED: Disconnecting idle stream') ||
      str.includes('Using maximum backoff delay to prevent overloading the backend')
    );
  });
};

const isQuotaExhaustedError = (args: any[]) => {
  return args.some(arg => {
    if (!arg) return false;
    const str = typeof arg === 'string' ? arg : (arg.message || String(arg));
    return (
      str.includes('RESOURCE_EXHAUSTED') ||
      str.includes('Quota limit exceeded') ||
      str.includes('code=resource-exhausted') ||
      str.includes('8 RESOURCE_EXHAUSTED') ||
      str.includes('Free daily write units')
    );
  });
};

console.error = function (...args: any[]) {
  if (isIgnorableFirestoreWarning(args)) {
    console.debug('[Firestore Connection Notice] Idle stream disconnected. Connection will automatically restore upon next target query.', ...args);
    return;
  }
  if (isQuotaExhaustedError(args)) {
    notifyQuotaExceeded();
    console.debug('[Firestore Quota Guardian] Free tier write quota limit active. Switching to high-speed local persistence.');
    return;
  }
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  if (isIgnorableFirestoreWarning(args)) {
    return;
  }
  if (isQuotaExhaustedError(args)) {
    notifyQuotaExceeded();
    return;
  }
  originalWarn.apply(console, args);
};

// Handle unhandled promise rejections and global errors for quota limits and connection notices
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = reason?.message || String(reason || '');
  if (
    reasonStr.includes('Disconnecting idle stream') ||
    reasonStr.includes('Timed out waiting for new targets') ||
    reasonStr.includes('CANCELLED: Disconnecting idle stream') ||
    reasonStr.includes('Using maximum backoff delay')
  ) {
    event.preventDefault();
    console.debug('[Firestore Connection Notice] Ignored idle stream cancellation rejection.', reason);
  } else if (
    reasonStr.includes('RESOURCE_EXHAUSTED') ||
    reasonStr.includes('Quota limit exceeded') ||
    reasonStr.includes('code=resource-exhausted') ||
    reasonStr.includes('8 RESOURCE_EXHAUSTED') ||
    reasonStr.includes('Free daily write units')
  ) {
    event.preventDefault();
    notifyQuotaExceeded();
    console.debug('[Firestore Quota Guardian] Intercepted unhandled quota rejection.');
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || String(event?.error || '');
  if (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('code=resource-exhausted') ||
    msg.includes('8 RESOURCE_EXHAUSTED') ||
    msg.includes('Free daily write units')
  ) {
    event.preventDefault();
    notifyQuotaExceeded();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>
  </StrictMode>,
);
