/**
 * Firestore Domain Entities
 * @description Core Firestore-related entities
 */

/**
 * User Profile Value Object
 * Immutable user profile data
 */
export interface UserProfile {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly photoURL?: string
  readonly phoneNumber?: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly lastLoginAt: number
  readonly emailVerified: boolean
}

/**
 * User Notifications Settings
 */
export interface UserNotifications {
  email: boolean
  push: boolean
  marketing: boolean
  security: boolean
  weeklyDigest: boolean
}

/**
 * User Privacy Settings
 */
export interface UserPrivacy {
  profileVisibility: 'public' | 'private'
  showEmail: boolean
  showPhone: boolean
  dataSharing: boolean
}

/**
 * User Settings Value Object
 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  currency: string
  notifications: UserNotifications
  privacy: UserPrivacy
}

/**
 * User Subscription Value Object
 */
export interface UserSubscription {
  plan: 'free' | 'standard' | 'professional' | 'business'
  status: 'active' | 'inactive' | 'canceled' | 'past_due'
  polarCustomerId?: string
  polarSubscriptionId?: string
  currentPeriodStart?: number
  currentPeriodEnd?: number
  cancelAtPeriodEnd: boolean
  readonly createdAt: number
  readonly updatedAt: number
}

/**
 * User Aggregate Root
 * Main user document containing all user-related data
 */
export interface User {
  readonly profile: UserProfile
  settings: UserSettings
  subscription: UserSubscription
  connectedAccounts?: any[]
  content?: any[]
  analytics?: any
  credits?: any
}
