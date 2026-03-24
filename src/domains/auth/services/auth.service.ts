/**
 * Auth Service
 * @description Firebase Auth service with Google & Apple OAuth
 * Facade pattern using AuthAdapter
 */

import type { UserCredential } from 'firebase/auth'
import type { AuthUser } from '../entities'
import type { IAuthService } from '../types'
import { toAuthUser } from '../entities'
import { authAdapter } from '../../../infrastructure/firebase/auth.adapter'

/**
 * Auth Service
 * Implements IAuthService interface using AuthAdapter
 */
class AuthService implements IAuthService {
  // ==================== Authentication Methods ====================

  async signIn(email: string, password: string): Promise<UserCredential> {
    return await authAdapter.signIn(email, password)
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserCredential> {
    return await authAdapter.signUp(email, password, displayName)
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(useRedirect = false): Promise<UserCredential> {
    return await authAdapter.signInWithGoogle(useRedirect)
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(useRedirect = false): Promise<UserCredential> {
    return await authAdapter.signInWithApple(useRedirect)
  }

  async signOut(): Promise<void> {
    await authAdapter.signOut()
  }

  async sendPasswordReset(email: string): Promise<void> {
    await authAdapter.sendPasswordReset(email)
  }

  async resendEmailVerification(): Promise<void> {
    await authAdapter.resendEmailVerification()
  }

  // ==================== Profile Management ====================

  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    await authAdapter.updateProfile(updates)
  }

  async updateEmail(newEmail: string, password: string): Promise<void> {
    await authAdapter.updateEmail(newEmail, password)
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authAdapter.updatePassword(currentPassword, newPassword)
  }

  async deleteAccount(password: string): Promise<void> {
    await authAdapter.deleteAccount(password)
  }

  // ==================== Provider Linking ====================

  /**
   * Link Google to current user
   */
  async linkGoogle(): Promise<UserCredential> {
    return await authAdapter.linkGoogle()
  }

  /**
   * Link Apple to current user
   */
  async linkApple(): Promise<UserCredential> {
    return await authAdapter.linkApple()
  }

  /**
   * Unlink a provider from current user
   */
  async unlinkProvider(providerId: string): Promise<void> {
    await authAdapter.unlinkProvider(providerId)
  }

  // ==================== Token Management ====================

  /**
   * Get ID Token
   */
  async getIdToken(forceRefresh = false): Promise<string> {
    return await authAdapter.getIdToken(forceRefresh)
  }

  /**
   * Refresh ID Token
   */
  async refreshToken(): Promise<void> {
    await authAdapter.refreshToken()
  }

  // ==================== State Management ====================

  getCurrentUser(): AuthUser | null {
    return toAuthUser(authAdapter.getCurrentUser())
  }

  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return authAdapter.onAuthStateChanged(
      (user) => callback(toAuthUser(user)),
      onError
    )
  }
}

// Export class and singleton instance
export const authService = new AuthService()
