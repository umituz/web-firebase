/**
 * User DTOs
 * @description Data Transfer Objects for user operations
 */

import type { User } from '../../domain/entities/user.entity'

/**
 * Create User DTO
 */
export interface CreateUserDTO {
  id: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  emailVerified: boolean
}

/**
 * Update User DTO
 */
export interface UpdateUserDTO {
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
}

/**
 * Update User Settings DTO
 */
export interface UpdateUserSettingsDTO {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  currency?: string
  notifications?: Partial<User['settings']['notifications']>
  privacy?: Partial<User['settings']['privacy']>
}

/**
 * Update User Subscription DTO
 */
export interface UpdateUserSubscriptionDTO {
  plan?: User['subscription']['plan']
  status?: User['subscription']['status']
  polarCustomerId?: string
  polarSubscriptionId?: string
  currentPeriodStart?: number
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
}

/**
 * User Query Result
 */
export interface UserQueryResult {
  user: User | null
  lastLoginAt?: number
  createdAt?: number
}
