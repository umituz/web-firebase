/**
 * Anonymous User Repository Interface
 * Contract for anonymous user data persistence
 */

import type { AnonymousUser, CreateAnonymousUserDto } from '../entities/anonymous-user.entity';

export interface IAnonymousUserRepository {
  /**
   * Create anonymous user document in Firestore
   */
  createAnonymousUser(dto: CreateAnonymousUserDto): Promise<void>;

  /**
   * Update anonymous user activity (session count, last activity)
   */
  updateActivity(userId: string): Promise<void>;

  /**
   * Get anonymous user by ID
   */
  getById(userId: string): Promise<AnonymousUser | null>;

  /**
   * Check if user is anonymous
   */
  isAnonymousUser(userId: string): Promise<boolean>;
}
