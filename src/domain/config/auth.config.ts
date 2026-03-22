/**
 * Auth Configuration
 * @description Configuration options for Firebase Authentication
 * Following DDD principles, this is a domain configuration value object
 */

/**
 * Available OAuth Providers
 */
export type OAuthProviderType =
  | 'google'
  | 'apple'

/**
 * OAuth Provider Configuration
 */
export interface OAuthProviderConfig {
  enabled: boolean
  scopes?: string[]
  customParameters?: Record<string, string>
}

/**
 * Auth Configuration Interface
 */
export interface AuthConfig {
  // Email/Password Authentication
  emailPasswordEnabled: boolean

  // OAuth Providers
  // OAuth Providers (Google & Apple)
  googleEnabled: boolean
  appleEnabled: boolean
  googleScopes?: string[]
  googleCustomParameters?: Record<string, string>

  // Email Verification
  requireEmailVerification: boolean

  // User Document Creation
  autoCreateUserDocument: boolean

  // Default User Settings (applied when creating user document)
  defaultUserSettings?: {
    theme?: 'light' | 'dark' | 'system'
    language?: string
    timezone?: string
    currency?: string
    notifications?: {
      email?: boolean
      push?: boolean
      marketing?: boolean
      security?: boolean
      weeklyDigest?: boolean
    }
    privacy?: {
      profileVisibility?: 'public' | 'private'
      showEmail?: boolean
      showPhone?: boolean
      dataSharing?: boolean
    }
  }

  // Default Subscription Plan
  defaultSubscriptionPlan?: 'free' | 'standard' | 'professional' | 'business'

  // Token Refresh Settings
  tokenRefreshEnabled: boolean
  tokenRefreshThreshold: number // milliseconds

  // Session Persistence
  persistence: 'local' | 'session' | 'none'

  // Error Handling
  throwOnAuthError: boolean
}

/**
 * Default Auth Configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  emailPasswordEnabled: true,
  googleEnabled: true,
  appleEnabled: false,
  googleScopes: ['profile', 'email'],
  requireEmailVerification: true,
  autoCreateUserDocument: true,
  defaultUserSettings: {
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      marketing: false,
      security: true,
      weeklyDigest: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      dataSharing: false,
    },
  },
  defaultSubscriptionPlan: 'free',
  tokenRefreshEnabled: true,
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
  persistence: 'local',
  throwOnAuthError: true,
}

/**
 * Auth Configuration Manager
 * Singleton class to manage auth configuration
 */
export class AuthConfigManager {
  private static instance: AuthConfigManager
  private config: AuthConfig

  private constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      ...DEFAULT_AUTH_CONFIG,
      ...config,
      defaultUserSettings: {
        ...DEFAULT_AUTH_CONFIG.defaultUserSettings,
        ...config.defaultUserSettings,
        notifications: {
          ...DEFAULT_AUTH_CONFIG.defaultUserSettings?.notifications,
          ...config.defaultUserSettings?.notifications,
        },
        privacy: {
          ...DEFAULT_AUTH_CONFIG.defaultUserSettings?.privacy,
          ...config.defaultUserSettings?.privacy,
        },
      },
    }
  }

  static getInstance(config?: Partial<AuthConfig>): AuthConfigManager {
    if (!AuthConfigManager.instance) {
      AuthConfigManager.instance = new AuthConfigManager(config)
    }
    return AuthConfigManager.instance
  }

  getConfig(): AuthConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<AuthConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      defaultUserSettings: {
        ...this.config.defaultUserSettings,
        ...updates.defaultUserSettings,
        notifications: {
          ...this.config.defaultUserSettings?.notifications,
          ...updates.defaultUserSettings?.notifications,
        },
        privacy: {
          ...this.config.defaultUserSettings?.privacy,
          ...updates.defaultUserSettings?.privacy,
        },
      },
    }
  }

  isGoogleEnabled(): boolean {
    return this.config.googleEnabled
  }

  isAppleEnabled(): boolean {
    return this.config.appleEnabled
  }

  isEmailPasswordEnabled(): boolean {
    return this.config.emailPasswordEnabled
  }

  shouldCreateUserDocument(): boolean {
    return this.config.autoCreateUserDocument
  }
}

/**
 * Initialize Auth Config with custom settings
 */
export function initAuthConfig(config: Partial<AuthConfig> = {}): AuthConfigManager {
  return AuthConfigManager.getInstance(config)
}

/**
 * Get Auth Config instance
 */
export function getAuthConfig(): AuthConfigManager {
  return AuthConfigManager.getInstance()
}
