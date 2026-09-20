import { describe, it, expect, vi, beforeEach } from 'vitest'

const initializeAppMock = vi.fn()
const getAppsMock = vi.fn()

vi.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => initializeAppMock(...args),
  getApps: () => getAppsMock(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  initializeAuth: vi.fn(),
  browserLocalPersistence: {},
}))

vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn() }))
vi.mock('firebase/storage', () => ({ getStorage: vi.fn() }))
vi.mock('firebase/analytics', () => ({ getAnalytics: vi.fn() }))
vi.mock('firebase/functions', () => ({ getFunctions: vi.fn() }))

import {
  initializeFirebase,
  resetFirebase,
  getFirebaseApp,
  isFirebaseInitialized,
} from '../src/infrastructure/firebase/client'

const VALID_CONFIG = {
  apiKey: 'apiKey',
  authDomain: 'project.firebaseapp.com',
  projectId: 'project-one',
  storageBucket: 'project.appspot.com',
  messagingSenderId: '1',
  appId: 'app-1',
}

function fakeApp(projectId: string) {
  return { name: '[DEFAULT]', options: { projectId } }
}

describe('firebase client', () => {
  beforeEach(() => {
    initializeAppMock.mockReset()
    getAppsMock.mockReset().mockReturnValue([])
    resetFirebase()
  })

  it('rejects configs without apiKey or projectId', () => {
    expect(() => initializeFirebase({ ...VALID_CONFIG, apiKey: '' } as typeof VALID_CONFIG)).toThrow(
      /apiKey and projectId are required/
    )
    expect(() => initializeFirebase({ ...VALID_CONFIG, projectId: '' } as typeof VALID_CONFIG)).toThrow(
      /apiKey and projectId are required/
    )
  })

  it('initializes once and returns the same app for repeated calls', () => {
    initializeAppMock.mockReturnValue(fakeApp('project-one'))

    const first = initializeFirebase(VALID_CONFIG)
    const second = initializeFirebase(VALID_CONFIG)

    expect(initializeAppMock).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    expect(isFirebaseInitialized()).toBe(true)
    expect(getFirebaseApp()).toBe(first)
  })

  it('warns when re-initialized with a different project instead of silently switching', () => {
    initializeAppMock.mockReturnValue(fakeApp('project-one'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    initializeFirebase(VALID_CONFIG)
    const app = initializeFirebase({ ...VALID_CONFIG, projectId: 'project-two' })

    expect(app.options.projectId).toBe('project-one') // existing app wins
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('project-two'))
    expect(initializeAppMock).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
  })

  it('adopts an already-registered FirebaseApp without re-initializing', () => {
    const existing = fakeApp('existing')
    getAppsMock.mockReturnValue([existing])

    const app = initializeFirebase(VALID_CONFIG)
    expect(app).toBe(existing)
    expect(initializeAppMock).not.toHaveBeenCalled()
  })

  it('resetFirebase() clears state so a new config can be applied', () => {
    initializeAppMock.mockReturnValueOnce(fakeApp('project-one')).mockReturnValue(fakeApp('project-two'))

    initializeFirebase(VALID_CONFIG)
    resetFirebase()
    expect(isFirebaseInitialized()).toBe(false)
    expect(getFirebaseApp()).toBeNull()

    const app = initializeFirebase({ ...VALID_CONFIG, projectId: 'project-two' })
    expect(app.options.projectId).toBe('project-two')
    expect(initializeAppMock).toHaveBeenCalledTimes(2)
  })
})
