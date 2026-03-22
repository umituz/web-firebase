/**
 * Auth Adapter
 * @description Firebase Auth implementation of IAuthRepository
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/services/auth.ts
 */

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateAuthProfile,
  updateEmail as updateAuthEmail,
  updatePassword as updateAuthPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth'
import { GoogleAuthProvider } from 'firebase/auth'
import { getFirebaseAuth } from './client'
import type { IAuthRepository } from '../../domain/interfaces/auth.repository.interface'
import type { User } from '../../domain/entities/user.entity'
import { createAuthError, AuthErrorCode } from '../../domain/errors/auth.errors'

export class AuthAdapter implements IAuthRepository {
  private get auth() {
    return getFirebaseAuth()
  }

  // Authentication Methods

  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password)

      // Update profile
      await updateAuthProfile(result.user, { displayName })

      // Send email verification
      await sendEmailVerification(result.user)

      return result
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')

      return await signInWithPopup(this.auth, provider)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth)
    } catch (error) {
      throw createAuthError(AuthErrorCode.SIGN_OUT_FAILED, 'Sign out failed', error)
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async resendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }
      await sendEmailVerification(user)
    } catch (error) {
      throw createAuthError(AuthErrorCode.EMAIL_VERIFICATION_FAILED, 'Failed to resend verification', error)
    }
  }

  // Profile Management

  async updateProfile(
    updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL'>>
  ): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      await updateAuthProfile(user, updates)
    } catch (error) {
      throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Profile update failed', error)
    }
  }

  async updateEmail(newEmail: string, password: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      await updateAuthEmail(user, newEmail)
    } catch (error) {
      throw createAuthError(AuthErrorCode.EMAIL_UPDATE_FAILED, 'Email update failed', error)
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updateAuthPassword(user, newPassword)
    } catch (error) {
      throw createAuthError(AuthErrorCode.PASSWORD_UPDATE_FAILED, 'Password update failed', error)
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      await user.delete()
    } catch (error) {
      throw createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'Account deletion failed', error)
    }
  }

  // State Management

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return this.auth.onAuthStateChanged(callback)
  }

  // Note: User document operations should be handled by UserAdapter
  // These methods are part of IAuthRepository interface but should be implemented separately
  async createUserDocument(
    _userId: string,
    _data: Partial<Omit<User, 'profile'>> & { email: string; displayName: string }
  ): Promise<void> {
    throw new Error('createUserDocument should be handled by UserAdapter')
  }

  async updateLastLogin(_userId: string): Promise<void> {
    throw new Error('updateLastLogin should be handled by UserAdapter')
  }

  /**
   * Handle Firebase Auth errors
   */
  private handleAuthError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      switch (code) {
        case 'auth/user-not-found':
          return createAuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found', error)
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid credentials', error)
        case 'auth/email-already-in-use':
          return createAuthError(AuthErrorCode.USER_ALREADY_EXISTS, 'Email already in use', error)
        case 'auth/weak-password':
          return createAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password is too weak', error)
        case 'auth/invalid-email':
          return createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email', error)
        case 'auth/user-disabled':
          return createAuthError(AuthErrorCode.USER_NOT_FOUND, 'Account disabled', error)
        case 'auth/too-many-requests':
          return createAuthError(AuthErrorCode.TOO_MANY_REQUESTS, 'Too many requests', error)
        case 'auth/popup-closed-by-user':
          return createAuthError(AuthErrorCode.OAUTH_CANCELLED, 'Sign in cancelled', error)
        case 'auth/account-exists-with-different-credential':
          return createAuthError(AuthErrorCode.OAUTH_ACCOUNT_EXISTS, 'Account exists with different provider', error)
        case 'auth/requires-recent-login':
          return createAuthError(AuthErrorCode.REAUTHENTICATION_REQUIRED, 'Please reauthenticate', error)
        default:
          return createAuthError(AuthErrorCode.UNKNOWN, `Auth error: ${code}`, error)
      }
    }

    return createAuthError(AuthErrorCode.UNKNOWN, 'Unknown auth error', error)
  }
}
