/**
 * Firestore Service Interface
 * @description Abstract interface for Firestore operations
 */

import type { User } from '../entities'

export interface IFirestoreService {
  /**
   * Get user by ID
   */
  getUser(userId: string): Promise<User | null>

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Promise<User | null>

  /**
   * Create user
   */
  createUser(userId: string, data: Partial<User>): Promise<void>

  /**
   * Update user
   */
  updateUser(userId: string, data: Partial<User>): Promise<void>

  /**
   * Delete user
   */
  deleteUser(userId: string): Promise<void>

  /**
   * Update user profile
   */
  updateProfile(userId: string, updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL' | 'phoneNumber'>>): Promise<void>

  /**
   * Update user settings
   */
  updateSettings(userId: string, settings: Partial<User['settings']>): Promise<void>

  /**
   * Update user subscription
   */
  updateSubscription(userId: string, subscription: Partial<User['subscription']>): Promise<void>

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>

  /**
   * Query users with constraints
   */
  queryUsers(constraints: import('firebase/firestore').QueryConstraint[]): Promise<User[]>

  /**
   * Subscribe to user document changes
   */
  subscribeToUser(userId: string, callback: (user: User | null) => void, onError?: (error: Error) => void): () => void
}
