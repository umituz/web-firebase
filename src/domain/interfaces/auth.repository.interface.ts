/**
 * Authentication Repository Interface
 * @description Defines contract for authentication operations
 */

import type { User as FirebaseUser, UserCredential } from 'firebase/auth'
import type { User } from '../entities/user.entity'

/**
 * Authentication Repository Interface
 * Defines operations for user authentication and management
 */
export interface IAuthRepository {
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
  signInWithGoogle(): Promise<UserCredential>

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
  updateProfile(updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL'>>): Promise<void>

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
  getCurrentUser(): FirebaseUser | null

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void

  /**
   * Create user document in Firestore
   */
  createUserDocument(userId: string, data: Partial<Omit<User, 'profile'>> & { email: string; displayName: string }): Promise<void>

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>
}
