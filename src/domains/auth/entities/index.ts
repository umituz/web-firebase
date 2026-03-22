/**
 * Auth Domain Entities
 * @description Core authentication-related entities
 */

import type { User as FirebaseUser } from 'firebase/auth'

/**
 * Auth User Entity
 * Wrapper around Firebase User with application-specific data
 */
export interface AuthUser {
  readonly uid: string
  readonly email: string | null
  readonly emailVerified: boolean
  readonly displayName: string | null
  readonly photoURL: string | null
  readonly phoneNumber: string | null
  readonly isAnonymous: boolean
  readonly tenantId: string | null
  readonly providerId: string
  readonly metadata: {
    readonly creationTime?: number
    readonly lastSignInTime?: number
  }
}

/**
 * Auth State Entity
 * Current authentication state
 */
export interface AuthState {
  readonly user: AuthUser | null
  readonly isLoading: boolean
  readonly isInitialized: boolean
  readonly error: Error | null
}

/**
 * Convert Firebase User to Auth User
 */
export function toAuthUser(firebaseUser: FirebaseUser | null): AuthUser | null {
  if (!firebaseUser) return null

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    isAnonymous: firebaseUser.isAnonymous,
    tenantId: firebaseUser.tenantId,
    providerId: firebaseUser.providerId,
    metadata: {
      creationTime: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : undefined,
      lastSignInTime: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime).getTime() : undefined,
    },
  }
}
