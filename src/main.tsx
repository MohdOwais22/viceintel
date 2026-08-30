import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Safely suppress benign Firestore gRPC idle stream timeout warnings
const originalError = console.error;
const originalWarn = console.warn;

const isIgnorableFirestoreWarning = (args: any[]) => {
  return args.some(arg => {
    if (typeof arg === 'string') {
      return arg.includes('Disconnecting idle stream') || 
             arg.includes('Timed out waiting for new targets') ||
             arg.includes('CANCELLED: Disconnecting idle stream');
    }
    if (arg && typeof arg === 'object' && arg.message) {
      return arg.message.includes('Disconnecting idle stream') || 
             arg.message.includes('Timed out waiting for new targets') ||
             arg.message.includes('CANCELLED: Disconnecting idle stream');
    }
    return false;
  });
};

console.error = function (...args: any[]) {
  if (isIgnorableFirestoreWarning(args)) {
    // Quietly log as debug/info level instead of noisy console.error
    console.debug('[Firestore Connection Notice] Idle stream disconnected. Connection will automatically restore upon next target query.', ...args);
    return;
  }
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  if (isIgnorableFirestoreWarning(args)) {
    return;
  }
  originalWarn.apply(console, args);
};

// Also handle unhandled promise rejections for this specific warning
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = reason?.message || String(reason || '');
  if (
    reasonStr.includes('Disconnecting idle stream') ||
    reasonStr.includes('Timed out waiting for new targets') ||
    reasonStr.includes('CANCELLED: Disconnecting idle stream')
  ) {
    event.preventDefault();
    console.debug('[Firestore Connection Notice] Ignored idle stream cancellation rejection.', reason);
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
