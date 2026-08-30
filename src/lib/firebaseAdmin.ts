import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

function getAdminApp() {
  const apps = getApps();
  if (apps.length === 0) {
    return initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  return apps[0]!;
}

export function getAdminFirestore() {
  const app = getAdminApp();
  const dbId = firebaseConfig.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    return getFirestore(app, dbId);
  }
  return getFirestore(app);
}
