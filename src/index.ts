/**
 * @umituz/web-firebase
 * Firebase integration for web applications with domain-based architecture
 *
 * Usage:
 * import { AuthService } from '@umituz/web-firebase/auth'
 * import { FirestoreService } from '@umituz/web-firebase/firestore'
 * import { StorageService } from '@umituz/web-firebase/storage'
 */

// Firebase client initialization
export * from './infrastructure/firebase/client'

// React components
export { FirebaseProvider, useFirebaseContext } from './presentation/providers/FirebaseProvider'

// Re-export common types for convenience
export type { FirebaseInstances } from './infrastructure/firebase/client'
export type { FirebaseContextValue, FirebaseProviderProps } from './presentation/providers/FirebaseProvider'
