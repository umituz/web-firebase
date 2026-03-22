/**
 * User Repository Interface
 * @description Generic contract for user data operations
 */

import type { User } from '../entities/user.entity'

export interface IUserRepository {
  getUser(userId: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  createUser(userId: string, data: Partial<User>): Promise<void>
  updateUser(userId: string, data: Partial<User>): Promise<void>
  deleteUser(userId: string): Promise<void>
  updateProfile(userId: string, updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL' | 'phoneNumber'>>): Promise<void>
  updateSettings(userId: string, settings: Partial<User['settings']>): Promise<void>
  updateSubscription(userId: string, subscription: Partial<User['subscription']>): Promise<void>
  updateLastLogin(userId: string): Promise<void>
  queryUsers(constraints: any[]): Promise<User[]>
  subscribeToUser(userId: string, callback: (user: User | null) => void, onError?: (error: Error) => void): () => void
}
