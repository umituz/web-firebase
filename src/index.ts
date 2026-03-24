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

export { AuthService, type IAuthRepository } from './infrastructure/firebase/auth.adapter'
export const authService = new AuthService()

// ============================================================
// FIRESTORE REPOSITORY
// ============================================================

export {
  FirestoreRepository,
  type IBaseRepository,
} from './infrastructure/services/firestore.repository'

// ============================================================
// STORAGE SERVICE
// ============================================================

export { StorageAdapter, type IFileRepository } from './infrastructure/firebase/storage.adapter'
export const storageService = new StorageAdapter()

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

export type { User, UserProfile, UserSettings, UserSubscription } from './domain/entities/user.entity'
export type { FileMetadata, UploadResult, UploadOptions, UploadProgress } from './domain/entities/file.entity'

// ============================================================
// ERROR CLASSES
// ============================================================

export { AuthError, AuthErrorCode, createAuthError } from './domain/errors/auth.errors'
export {
  RepositoryError,
  RepositoryErrorCode,
  createRepositoryError,
} from './domain/errors/repository.errors'
