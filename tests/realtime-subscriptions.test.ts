import { describe, it, expect, vi, beforeEach } from 'vitest'

const onSnapshotMock = vi.fn()
const docMock = vi.fn()
const collectionMock = vi.fn()
const queryMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
}))

vi.mock('@/infrastructure/firebase/client', () => ({
  getFirebaseDB: () => ({ type: 'firestore-mock' }),
}))

import { RealTimeSubscriptionManager } from '../src/domains/firestore/services/realtime-subscription.service'

interface RegisteredListener {
  unsubscribe: ReturnType<typeof vi.fn>
  next: (snap: unknown) => void
  error: (error: Error) => void
}

function registerListeners(): RegisteredListener[] {
  const listeners: RegisteredListener[] = []
  onSnapshotMock.mockImplementation(
    (_target: unknown, _opts: unknown, next: (snap: unknown) => void, error: (e: Error) => void) => {
      const listener = { unsubscribe: vi.fn(), next, error }
      listeners.push(listener)
      return listener.unsubscribe
    }
  )
  return listeners
}

describe('RealTimeSubscriptionManager', () => {
  let manager: RealTimeSubscriptionManager

  beforeEach(() => {
    vi.clearAllMocks()
    docMock.mockReturnValue({ path: 'doc-ref' })
    collectionMock.mockReturnValue({ id: 'collection-ref' })
    queryMock.mockImplementation((_c, ..._rest) => ({ type: 'query' }))
    manager = new RealTimeSubscriptionManager()
  })

  it('tracks active subscriptions', () => {
    registerListeners()
    const unsub = manager.subscribeToDocument('users', 'u1', () => {})

    expect(manager.getActiveSubscriptionsCount()).toBe(1)
    unsub()
    expect(manager.getActiveSubscriptionsCount()).toBe(0)
  })

  it('two query subscriptions coexist — the second must not evict the first (regression)', () => {
    const listeners = registerListeners()
    const callbackA = vi.fn()
    const callbackB = vi.fn()

    const unsubA = manager.subscribeToQuery({ type: 'query' } as never, callbackA)
    const unsubB = manager.subscribeToQuery({ type: 'query' } as never, callbackB)

    // Both must be alive simultaneously — the old implementation derived IDs
    // from query.toString() ("[object Object]") and silently killed the first.
    expect(manager.getActiveSubscriptionsCount()).toBe(2)

    unsubA()
    expect(manager.getActiveSubscriptionsCount()).toBe(1)

    // B still delivers
    listeners[1].next({ docs: [] })
    expect(callbackB).toHaveBeenCalled()

    unsubB()
    expect(manager.getActiveSubscriptionsCount()).toBe(0)
  })

  it('two subscriptions to the same collection with different constraints coexist', () => {
    registerListeners()
    const constraint = { type: 'where' } as never

    const unsubA = manager.subscribeToCollection('users', () => {}, [constraint])
    const unsubB = manager.subscribeToCollection('users', () => {})

    expect(manager.getActiveSubscriptionsCount()).toBe(2)
    unsubA()
    unsubB()
    expect(manager.getActiveSubscriptionsCount()).toBe(0)
  })

  it('unsubscribes the correct listener, not the most recent one', () => {
    const listeners = registerListeners()
    const unsubA = manager.subscribeToDocument('users', 'u1', () => {})
    manager.subscribeToDocument('users', 'u2', () => {})

    unsubA()
    expect(listeners[0].unsubscribe).toHaveBeenCalledTimes(1)
    expect(listeners[1].unsubscribe).not.toHaveBeenCalled()
  })

  it('routes snapshot data and errors to the callbacks', () => {
    const listeners = registerListeners()
    const onData = vi.fn()
    const onError = vi.fn()

    manager.subscribeToDocument('users', 'u1', onData, { onError })

    listeners[0].next({ exists: () => true, id: 'u1', data: () => ({ name: 'Test' }) })
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1', name: 'Test' }))

    listeners[0].error(new Error('permission denied'))
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'permission denied' }))
  })

  it('cleanupInactiveSubscriptions removes stale listeners only', async () => {
    registerListeners()
    manager.subscribeToDocument('users', 'u1', () => {})

    const originalNow = Date.now
    const realNow = Date.now.bind(Date)
    Date.now = vi.fn(() => realNow() + 10 * 60 * 1000) as unknown as typeof Date.now

    manager.cleanupInactiveSubscriptions(5 * 60 * 1000)

    Date.now = originalNow
    expect(manager.getActiveSubscriptionsCount()).toBe(0)
  })

  it('dispose() clears everything', () => {
    registerListeners()
    manager.subscribeToDocument('users', 'u1', () => {})

    manager.dispose()
    expect(manager.getActiveSubscriptionsCount()).toBe(0)
  })
})
