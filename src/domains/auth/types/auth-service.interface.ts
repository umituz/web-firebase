/**
 * Auth Service Interface
 * @description Abstract interface for authentication operations
 */

import type { UserCredential } from 'firebase/auth'
import type { AuthUser } from '../entities'

export interface IAuthService {
  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<UserCredential>

  /**
   * Sign up with email, password, and display name
   */
  signUp(email: string, password: string, displayName: string): Promise<UserCredential>

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle(useRedirect?: boolean): Promise<UserCredential>

  /**
   * Sign in with Apple OAuth
   */
  signInWithApple(useRedirect?: boolean): Promise<UserCredential>

  /**
   * Sign out current user
   */
  signOut(): Promise<void>

  /**
   * Send password reset email
   */
  sendPasswordReset(email: string): Promise<void>

  /**
   * Resend email verification
   */
  resendEmailVerification(): Promise<void>

  /**
   * Update user profile (displayName, photoURL)
   */
  updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void>

  /**
   * Update user email (requires password)
   */
  updateEmail(newEmail: string, password: string): Promise<void>

  /**
   * Update user password (requires current password)
   */
  updatePassword(currentPassword: string, newPassword: string): Promise<void>

  /**
   * Delete user account (requires password)
   */
  deleteAccount(password: string): Promise<void>

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
    onError?: (error: Error) => void
  ): () => void

  /**
   * Link Google account to current user
   */
  linkGoogle(): Promise<UserCredential>

  /**
   * Link Apple account to current user
   */
  linkApple(): Promise<UserCredential>

  /**
   * Unlink provider from current user
   */
  unlinkProvider(providerId: string): Promise<void>

  /**
   * Get ID token for current user
   */
  getIdToken(forceRefresh?: boolean): Promise<string>

  /**
   * Refresh ID token for current user
   */
  refreshToken(): Promise<void>
}
