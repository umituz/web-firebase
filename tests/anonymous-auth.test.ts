import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
}))

const getFirebaseAuthMock = vi.fn()

vi.mock('@/infrastructure/firebase/client', () => ({
  getFirebaseAuth: () => getFirebaseAuthMock(),
}))

import { AnonymousAuthService } from '../src/domains/anonymous/services/anonymous-auth.service'
import type { IAnonymousUserRepository } from '../src/domains/anonymous/repositories/anonymous-user.repository.interface'

function makeRepository(): IAnonymousUserRepository & {
  getById: ReturnType<typeof vi.fn>
  createAnonymousUser: ReturnType<typeof vi.fn>
  updateActivity: ReturnType<typeof vi.fn>
} {
  return {
    getById: vi.fn().mockResolvedValue(null),
    createAnonymousUser: vi.fn().mockResolvedValue(undefined),
    updateActivity: vi.fn().mockResolvedValue(undefined),
    isAnonymousUser: vi.fn().mockResolvedValue(false),
  }
}

function makeStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    _store: store,
  }
}

describe('AnonymousAuthService (SSR safety)', () => {
  let repository: ReturnType<typeof makeRepository>
  let service: AnonymousAuthService

  beforeEach(() => {
    vi.clearAllMocks()
    repository = makeRepository()
    service = new AnonymousAuthService(repository)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hasAnonymousUser() returns false when localStorage is unavailable (SSR)', () => {
    // Node test environment has no localStorage global by default
    expect(() => service.hasAnonymousUser()).not.toThrow()
    expect(service.hasAnonymousUser()).toBe(false)
    expect(service.getStoredAnonymousUid()).toBeNull()
  })

  it('signInAsAnonymous() returns null without throwing when Firebase auth is unavailable', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getFirebaseAuthMock.mockReturnValue(null)

    const result = await service.signInAsAnonymous()

    expect(result).toBeNull()
    expect(repository.createAnonymousUser).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('creates an anonymous user end-to-end when storage and auth are available', async () => {
    const storage = makeStorage()
    vi.stubGlobal('localStorage', storage)

    const { signInAnonymously } = await import('firebase/auth')
    vi.mocked(signInAnonymously).mockResolvedValue({
      user: { uid: 'anon-123' },
    } as never)
    getFirebaseAuthMock.mockReturnValue({ currentUser: null })

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const uid = await service.signInAsAnonymous({ source: 'test' })

    expect(uid).toBe('anon-123')
    expect(repository.createAnonymousUser).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'anon-123',
        deviceId: expect.stringMatching(/^device_/),
        metadata: expect.objectContaining({ source: 'test' }),
      })
    )
    expect(storage._store.get('anonymous_uid')).toBe('anon-123')
    expect(storage._store.get('anonymous_user_created')).toBe('true')

    logSpy.mockRestore()
  })

  it('restores an existing anonymous user from storage without creating a new one', async () => {
    const storage = makeStorage()
    storage._store.set('anonymous_user_created', 'true')
    storage._store.set('anonymous_uid', 'anon-existing')
    vi.stubGlobal('localStorage', storage)

    repository.getById.mockResolvedValue({ uid: 'anon-existing', isAnonymous: true })

    const uid = await service.signInAsAnonymous()

    expect(uid).toBe('anon-existing')
    expect(repository.updateActivity).toHaveBeenCalledWith('anon-existing')
    expect(repository.createAnonymousUser).not.toHaveBeenCalled()
  })

  it('clearAnonymousData() removes keys and keeps working without storage', () => {
    expect(() => service.clearAnonymousData()).not.toThrow()
  })
})
