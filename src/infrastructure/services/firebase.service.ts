import { initializeApp, getApps, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

/**
 * Firebase Service Infrastructure
 * @description Initialization and instance management for Firebase
 */

export interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

export function initializeFirebase(config: FirebaseOptions, appName?: string): FirebaseInstances {
  const existing = getApps().find((a) => a.name === (appName ?? '[DEFAULT]'));
  const app = existing ?? initializeApp(config, appName);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app),
  };
}
