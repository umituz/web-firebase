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
 * Deep merge utility for nested objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue, sourceValue)
      } else if (sourceValue !== undefined) {
        // Override with source value (only if not undefined)
        result[key] = sourceValue
      }
    }
  }

  return result
}

/**
 * Auth Configuration Manager
 * Singleton class to manage auth configuration
 */
export class AuthConfigManager {
  private static instance: AuthConfigManager
  private config: AuthConfig

  private constructor(config: Partial<AuthConfig> = {}) {
    // Use deep merge for nested objects
    this.config = deepMerge(DEFAULT_AUTH_CONFIG, config)
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
    // Use deep merge for proper nested object merging
    this.config = deepMerge(this.config, updates)
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
