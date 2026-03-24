/**
 * Auth Configuration
 * @description Firebase Authentication configuration
 */

/**
 * Auth Configuration Interface
 */
export interface AuthConfig {
  // Email/Password Authentication
  emailPasswordEnabled: boolean

  // OAuth Providers
  googleEnabled: boolean
  appleEnabled: boolean
  googleScopes?: string[]
  googleCustomParameters?: Record<string, string>

  // Email Verification
  requireEmailVerification: boolean

  // User Document Creation
  autoCreateUserDocument: boolean

  // Default User Settings
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
 * Current auth configuration
 */
let currentConfig: AuthConfig = DEFAULT_AUTH_CONFIG

/**
 * Initialize auth configuration
 */
export function initAuthConfig(config: Partial<AuthConfig> = {}): void {
  currentConfig = { ...DEFAULT_AUTH_CONFIG, ...config }
}

/**
 * Get current auth configuration
 */
export function getAuthConfig(): AuthConfig {
  return currentConfig
}

/**
 * Update auth configuration
 */
export function updateAuthConfig(updates: Partial<AuthConfig>): void {
  currentConfig = { ...currentConfig, ...updates }
}
