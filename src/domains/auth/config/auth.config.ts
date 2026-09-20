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
 * Resolve the runtime timezone without throwing in exotic environments.
 * Evaluated lazily (never at module scope) so importing this module stays
 * side-effect free.
 */
function resolveTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Default Auth Configuration
 *
 * Note: `defaultUserSettings.timezone` is intentionally not resolved at
 * module scope; `initAuthConfig()` fills it in from the runtime locale.
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
    timezone: 'UTC',
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
  currentConfig = {
    ...DEFAULT_AUTH_CONFIG,
    ...config,
    defaultUserSettings: {
      ...DEFAULT_AUTH_CONFIG.defaultUserSettings,
      ...config.defaultUserSettings,
      timezone:
        config.defaultUserSettings?.timezone
        ?? resolveTimezone(),
    },
  }
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
  currentConfig = {
    ...currentConfig,
    ...updates,
    ...(updates.defaultUserSettings
      ? {
          defaultUserSettings: {
            ...currentConfig.defaultUserSettings,
            ...updates.defaultUserSettings,
            timezone: updates.defaultUserSettings.timezone ?? currentConfig.defaultUserSettings?.timezone ?? resolveTimezone(),
          },
        }
      : {}),
  }
}
