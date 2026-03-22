/**
 * Auth Adapter
 * @description Firebase Auth implementation with Google & Apple OAuth support
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
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup,
  unlink as firebaseUnlink,
} from 'firebase/auth'
import { getFirebaseAuth } from './client'
import type { IAuthRepository } from '../../domain/interfaces/auth.repository.interface'
import type { User } from '../../domain/entities/user.entity'
import { createAuthError, AuthErrorCode } from '../../domain/errors/auth.errors'
import { getAuthConfig } from '../../domain/config/auth.config'

/**
 * Auth Adapter
 * Implements IAuthRepository with Google & Apple OAuth support
 */
export class AuthAdapter implements IAuthRepository {
  private get auth() {
    return getFirebaseAuth()
  }

  private config = getAuthConfig()

  // ==================== Authentication Methods ====================

  async signIn(email: string, password: string): Promise<UserCredential> {
    if (!this.config.isEmailPasswordEnabled()) {
      throw createAuthError(
        AuthErrorCode.UNKNOWN,
        'Email/password authentication is disabled'
      )
    }

    try {
      return await signInWithEmailAndPassword(this.auth, email, password)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserCredential> {
    if (!this.config.isEmailPasswordEnabled()) {
      throw createAuthError(
        AuthErrorCode.UNKNOWN,
        'Email/password authentication is disabled'
      )
    }

    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password)

      // Update profile
      await updateAuthProfile(result.user, { displayName })

      // Send email verification if required
      if (this.config.getConfig().requireEmailVerification) {
        await sendEmailVerification(result.user)
      }

      return result
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign in with Google
   * @param useRedirect - Whether to use redirect flow instead of popup (default: false)
   */
  async signInWithGoogle(useRedirect = false): Promise<UserCredential> {
    if (!this.config.isGoogleEnabled()) {
      throw createAuthError(
        AuthErrorCode.UNKNOWN,
        'Google authentication is disabled'
      )
    }

    try {
      const provider = new GoogleAuthProvider()
      const config = this.config.getConfig()

      // Add scopes
      if (config.googleScopes) {
        config.googleScopes.forEach((scope) => provider.addScope(scope))
      }

      // Add custom parameters
      if (config.googleCustomParameters) {
        provider.setCustomParameters(config.googleCustomParameters)
      }

      if (useRedirect) {
        await signInWithRedirect(this.auth, provider)
        const result = await getRedirectResult(this.auth)
        if (!result) {
          throw createAuthError(AuthErrorCode.UNKNOWN, 'No redirect result found')
        }
        return result
      } else {
        return await signInWithPopup(this.auth, provider)
      }
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign in with Apple
   * @param useRedirect - Whether to use redirect flow instead of popup (default: false)
   */
  async signInWithApple(useRedirect = false): Promise<UserCredential> {
    if (!this.config.isAppleEnabled()) {
      throw createAuthError(
        AuthErrorCode.UNKNOWN,
        'Apple authentication is disabled'
      )
    }

    try {
      const provider = new OAuthProvider('apple.com')

      if (useRedirect) {
        await signInWithRedirect(this.auth, provider)
        const result = await getRedirectResult(this.auth)
        if (!result) {
          throw createAuthError(AuthErrorCode.UNKNOWN, 'No redirect result found')
        }
        return result
      } else {
        return await signInWithPopup(this.auth, provider)
      }
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

  // ==================== Profile Management ====================

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

  // ==================== Provider Linking ====================

  /**
   * Link Google to current user
   */
  async linkGoogle(): Promise<UserCredential> {
    if (!this.config.isGoogleEnabled()) {
      throw createAuthError(AuthErrorCode.UNKNOWN, 'Google authentication is disabled')
    }

    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      const provider = new GoogleAuthProvider()
      const config = this.config.getConfig()

      if (config.googleScopes) {
        config.googleScopes.forEach((scope) => provider.addScope(scope))
      }

      if (config.googleCustomParameters) {
        provider.setCustomParameters(config.googleCustomParameters)
      }

      return await linkWithPopup(user, provider)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Link Apple to current user
   */
  async linkApple(): Promise<UserCredential> {
    if (!this.config.isAppleEnabled()) {
      throw createAuthError(AuthErrorCode.UNKNOWN, 'Apple authentication is disabled')
    }

    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      const provider = new OAuthProvider('apple.com')
      return await linkWithPopup(user, provider)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Unlink a provider from current user
   */
  async unlinkProvider(providerId: string): Promise<FirebaseUser> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      return await firebaseUnlink(user, providerId)
    } catch (error) {
      throw createAuthError(AuthErrorCode.UNKNOWN, 'Failed to unlink provider', error)
    }
  }

  // ==================== State Management ====================

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return this.auth.onAuthStateChanged(callback)
  }

  // ==================== Token Management ====================

  async getIdToken(forceRefresh = false): Promise<string> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      return await user.getIdToken(forceRefresh)
    } catch (error) {
      throw createAuthError(AuthErrorCode.UNKNOWN, 'Failed to get ID token', error)
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      await user.getIdToken(true)
    } catch (error) {
      throw createAuthError(AuthErrorCode.UNKNOWN, 'Failed to refresh token', error)
    }
  }

  // ==================== Note ====================
  // User document operations should be handled by UserAdapter

  async createUserDocument(
    _userId: string,
    _data: Partial<Omit<User, 'profile'>> & { email: string; displayName: string }
  ): Promise<void> {
    throw new Error('createUserDocument should be handled by UserAdapter')
  }

  async updateLastLogin(_userId: string): Promise<void> {
    throw new Error('updateLastLogin should be handled by UserAdapter')
  }

  // ==================== Error Handling ====================

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

// Export singleton instance
export const authAdapter = new AuthAdapter()
