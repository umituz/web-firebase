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

/**
 * Firebase Configuration interface
 * Pass this to initializeFirebase()
 */
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// Singleton instances
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let functions: Functions | null = null
let analytics: Analytics | null = null

/**
 * Initialize Firebase with provided configuration
 * Must be called before using any Firebase services
 *
 * @param config - Firebase configuration object
 * @returns FirebaseApp instance
 */
export function initializeFirebase(config: FirebaseConfig): FirebaseApp {
  if (app) {
    return app
  }

  if (getApps().length > 0) {
    app = getApps()[0]
    return app
  }

  // Validate config
  if (!config.apiKey || !config.projectId) {
    throw new Error('Invalid Firebase config: apiKey and projectId are required')
  }

  app = initializeApp(config)
  return app
}

/**
 * Get Firebase App instance
 * @returns FirebaseApp instance or null if not initialized
 */
export function getFirebaseApp(): FirebaseApp | null {
  return app
}

/**
 * Get Firebase Auth instance
 * @returns Auth instance or null if not initialized
 */
export function getFirebaseAuth(): Auth | null {
  if (!app) {
    return null
  }
  if (!auth) {
    const firebaseApp = getFirebaseApp()
    if (firebaseApp && typeof window !== 'undefined') {
      try {
        auth = getAuth(firebaseApp)
      } catch (e) {
        auth = initializeAuth(firebaseApp, {
          persistence: browserLocalPersistence,
        })
      }
    } else if (firebaseApp) {
      auth = getAuth(firebaseApp)
    }
  }
  return auth
}

/**
 * Get Firestore instance
 * @returns Firestore instance or null if not initialized
 */
export function getFirebaseDB(): Firestore | null {
  if (!app) {
    return null
  }
  if (!db) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }
    db = getFirestore(firebaseApp)
  }
  return db
}

/**
 * Get Firebase Storage instance
 * @returns FirebaseStorage instance or null if not initialized
 */
export function getFirebaseStorage(): FirebaseStorage | null {
  if (!app) {
    return null
  }
  if (!storage) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }
    storage = getStorage(firebaseApp)
  }
  return storage
}

/**
 * Get Firebase Functions instance
 * @returns Functions instance or null if not initialized
 */
export function getFirebaseFunctions(): Functions | null {
  if (!app) {
    return null
  }
  if (!functions) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }
    functions = getFunctions(firebaseApp)
  }
  return functions
}

/**
 * Get Firebase Analytics instance
 * @returns Analytics instance or null (not available in SSR or not initialized)
 */
export function getFirebaseAnalytics(): Analytics | null {
  if (!app) {
    return null
  }
  if (!analytics && typeof window !== 'undefined') {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }
    analytics = getAnalytics(firebaseApp)
  }
  return analytics
}

/**
 * Firebase Instances
 * All Firebase service instances (may be null if not initialized)
 */
export interface FirebaseInstances {
  app: FirebaseApp
  auth: Auth | null
  db: Firestore | null
  storage: FirebaseStorage | null
  functions: Functions | null
  analytics: Analytics | null
}

/**
 * Get all Firebase instances
 * @returns FirebaseInstances or null if not initialized
 */
export function getFirebaseInstances(): FirebaseInstances | null {
  const app = getFirebaseApp()
  if (!app) {
    return null
  }
  return {
    app,
    auth: getFirebaseAuth(),
    db: getFirebaseDB(),
    storage: getFirebaseStorage(),
    functions: getFirebaseFunctions(),
    analytics: getFirebaseAnalytics(),
  }
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return app !== null
}
