/**
 * Firebase Client
 * @description Firebase initialization and singleton instances
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/services/client.ts
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { initializeAuth, getAuth, Auth, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, Analytics } from 'firebase/analytics'
import { getFunctions, Functions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Singleton instances
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let functions: Functions
let analytics: Analytics | null = null

/**
 * Initialize Firebase App
 */
export function initializeFirebase(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  return app
}

/**
 * Get Firebase App instance
 */
export function getFirebaseApp(): FirebaseApp {
  return app || initializeFirebase()
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp()
    if (typeof window !== 'undefined') {
      try {
        auth = getAuth(firebaseApp)
      } catch (e) {
        console.warn('getAuth failed, trying initializeAuth...', e)
        auth = initializeAuth(firebaseApp, {
          persistence: browserLocalPersistence,
        })
      }
    } else {
      auth = getAuth(firebaseApp)
    }
  }
  return auth
}

/**
 * Get Firestore instance
 */
export function getFirebaseDB(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

/**
 * Get Firebase Functions instance
 */
export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp())
  }
  return functions
}

/**
 * Get Firebase Analytics instance
 */
export function getFirebaseAnalytics(): Analytics | null {
  if (!analytics && typeof window !== 'undefined') {
    analytics = getAnalytics(getFirebaseApp())
  }
  return analytics
}

/**
 * Firebase Instances
 * All Firebase service instances
 */
export interface FirebaseInstances {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  storage: FirebaseStorage
  functions: Functions
  analytics: Analytics | null
}

/**
 * Get all Firebase instances
 */
export function getFirebaseInstances(): FirebaseInstances {
  return {
    app: getFirebaseApp(),
    auth: getFirebaseAuth(),
    db: getFirebaseDB(),
    storage: getFirebaseStorage(),
    functions: getFirebaseFunctions(),
    analytics: getFirebaseAnalytics(),
  }
}

// Export singleton instances for convenience
export { app, auth, db, storage, functions, analytics }
