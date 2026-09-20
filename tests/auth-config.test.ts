import { describe, it, expect } from 'vitest'
import {
  initAuthConfig,
  getAuthConfig,
  updateAuthConfig,
  DEFAULT_AUTH_CONFIG,
} from '../src/domains/auth/config/auth.config'

describe('auth config', () => {
  it('has safe module-scope defaults (no Intl evaluation at import)', () => {
    // If Intl were evaluated at module scope this import would already have
    // thrown in exotic environments; DEFAULT timezone is a plain constant.
    expect(DEFAULT_AUTH_CONFIG.defaultUserSettings?.timezone).toBe('UTC')
  })

  it('initAuthConfig() resolves the runtime timezone lazily', () => {
    initAuthConfig()
    const timezone = getAuthConfig().defaultUserSettings?.timezone
    expect(typeof timezone).toBe('string')
    expect(timezone!.length).toBeGreaterThan(0)
  })

  it('merges partial user overrides with defaults', () => {
    initAuthConfig({ googleEnabled: false, defaultUserSettings: { theme: 'dark' } })
    const config = getAuthConfig()

    expect(config.googleEnabled).toBe(false)
    expect(config.defaultUserSettings?.theme).toBe('dark')
    // Untouched defaults survive
    expect(config.emailPasswordEnabled).toBe(true)
    expect(config.defaultUserSettings?.currency).toBe('USD')
  })

  it('respects an explicit timezone override', () => {
    initAuthConfig({ defaultUserSettings: { timezone: 'Europe/Istanbul' } })
    expect(getAuthConfig().defaultUserSettings?.timezone).toBe('Europe/Istanbul')
  })

  it('updateAuthConfig() preserves the resolved timezone when not specified', () => {
    initAuthConfig({ defaultUserSettings: { timezone: 'Europe/Istanbul' } })
    updateAuthConfig({ defaultUserSettings: { theme: 'light' } })

    expect(getAuthConfig().defaultUserSettings?.theme).toBe('light')
    expect(getAuthConfig().defaultUserSettings?.timezone).toBe('Europe/Istanbul')
  })
})
