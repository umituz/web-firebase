/**
 * User Repository Interface
 * @description Defines contract for user data operations
 */

import type { User } from '../entities/user.entity'
import type { QueryConstraint } from 'firebase/firestore'

/**
 * User Repository Interface
 * Defines operations for user data management
 */
export interface IUserRepository {
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
  updateSubscription(
    userId: string,
    subscription: Partial<User['subscription']>
  ): Promise<void>

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>

  /**
   * Query users with constraints
   */
  queryUsers(constraints: QueryConstraint[]): Promise<User[]>

  /**
   * Subscribe to user document changes
   */
  subscribeToUser(
    userId: string,
    callback: (user: User | null) => void,
    onError?: (error: Error) => void
  ): () => void
}
