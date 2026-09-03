import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDocFromServer,
  setLogLevel,
  Firestore
} from 'firebase/firestore';

// Set Firestore SDK log level to error to prevent benign idle stream cancellation debug logs
try {
  setLogLevel('error');
} catch {
  // ignore if already set
}
import firebaseConfig from '../../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId;

// Safely detect if localStorage and IndexedDB are fully available in the current context (e.g. not blocked by iframe sandbox)
function checkLocalStorageAvailability(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

let db: Firestore;
if (checkLocalStorageAvailability()) {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }, dbId && dbId !== '(default)' ? dbId : undefined);
  } catch (e) {
    db = getFirestore(app, dbId && dbId !== '(default)' ? dbId : undefined);
  }
} else {
  // If in a sandboxed iframe or limited environment, initialize using standard memory/default cache settings
  db = getFirestore(app, dbId && dbId !== '(default)' ? dbId : undefined);
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check notice: client is offline or re-connecting.");
    }
  }
}
testConnection();

export const auth = getAuth(app);
export { db };
