/**
 * User Domain Entities
 * @description Core user-related entities following DDD principles
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/types/index.ts
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
 * Account Metrics Value Object
 */
export interface AccountMetrics {
  followers: number
  following: number
  posts: number
  engagement: number
  lastSyncedAt: number
}

/**
 * User Connected Account Entity
 */
export interface UserConnectedAccount {
  platform:
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'tiktok'
    | 'youtube'
    | 'pinterest'
    | 'reddit'
    | 'threads'
    | 'discord'
    | 'telegram'
    | 'mastodon'
    | 'medium'
  connected: boolean
  readonly connectedAt: number
  username?: string
  profileId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: number
  metrics?: AccountMetrics
}

/**
 * User Content Entity
 */
export interface UserContent {
  readonly id: string
  type: 'post' | 'article' | 'video' | 'image' | 'story' | 'reel'
  title: string
  content: string
  platforms: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledFor?: number
  publishedAt?: number
  readonly createdAt: number
  readonly updatedAt: number
  mediaUrls?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Platform Breakdown for Analytics
 */
export interface PlatformBreakdown {
  [platform: string]: {
    posts: number
    engagement: number
    reach: number
  }
}

/**
 * User Analytics Value Object
 */
export interface UserAnalytics {
  totalPosts: number
  totalEngagement: number
  totalReach: number
  topPerformingPosts: string[] // content IDs
  platformBreakdown: PlatformBreakdown
  lastCalculatedAt: number
}

/**
 * User Credits Value Object
 */
export interface UserCredits {
  standard: number
  professional: number
  total: number
  resetAt: number
  lastResetAt: number
}

/**
 * User Aggregate Root
 * Main user document containing all user-related data
 * This is the aggregate root for the User domain
 */
export interface User {
  readonly profile: UserProfile
  settings: UserSettings
  subscription: UserSubscription
  connectedAccounts: UserConnectedAccount[]
  content: UserContent[]
  analytics: UserAnalytics
  credits: UserCredits
}

/**
 * Collection Constants
 */
export const USER_COLLECTIONS = {
  USERS: 'users',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  CONNECTED_ACCOUNTS: 'connectedAccounts',
} as const

export const USER_SUBCOLLECTIONS = {
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  DRAFTS: 'drafts',
} as const
