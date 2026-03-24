/**
 * @umituz/web-firebase
 * Production-ready Firebase integration with clean architecture
 *
 * @example
 * import { initializeFirebase, getFirebaseAuth, getFirebaseDB, AuthService } from '@umituz/web-firebase'
 */

// ============================================================
// CORE INITIALIZATION
// ============================================================

export {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDB,
  getFirebaseStorage,
  getFirebaseFunctions,
  getFirebaseAnalytics,
  getFirebaseInstances,
  isFirebaseInitialized,
  type FirebaseConfig,
  type FirebaseInstances,
} from './infrastructure/firebase/client'

// ============================================================
// AUTH SERVICE
// ============================================================

export { AuthAdapter as AuthService } from './infrastructure/firebase/auth.adapter'

// ============================================================
// FIRESTORE REPOSITORY
// ============================================================

export { FirestoreRepository } from './infrastructure/services/firestore.repository'

// ============================================================
// STORAGE SERVICE
// ============================================================

export { StorageAdapter as StorageService } from './infrastructure/firebase/storage.adapter'

// ============================================================
// UTILITIES
// ============================================================

export {
  debounce,
  throttle,
  RequestDebouncer,
  RequestThrottler,
  BatchProcessor,
  PerformanceMonitor,
  MemoryLeakDetector,
  globalDebouncer,
  globalThrottler,
  performanceMonitor,
} from './infrastructure/utils/performance.util'

export {
  LRUCache,
  createLRUCache,
} from './infrastructure/utils/cache.util'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type { User, UserProfile, UserSettings, UserSubscription } from './domains/auth/entities/user.entity'
export type { FileMetadata, UploadResult, UploadOptions, UploadProgress } from './domains/storage/entities/file.entity'

// ============================================================
// ERROR CLASSES
// ============================================================

export { AuthError, AuthErrorCode, createAuthError } from './domains/auth/errors/auth.errors'
export {
  RepositoryError,
  RepositoryErrorCode,
  createRepositoryError,
} from './domains/firestore/errors/repository.errors'
