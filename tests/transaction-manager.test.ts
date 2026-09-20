import { describe, it, expect, vi, beforeEach } from 'vitest'

const runTransactionMock = vi.fn()
const docMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
}))

vi.mock('@/infrastructure/firebase/client', () => ({
  getFirebaseDB: () => ({ type: 'firestore-mock' }),
}))

import { TransactionManager } from '../src/domains/firestore/services/transaction-manager.service'
import { TransactionFailedError } from '../src/domains/firestore/errors/repository.errors'

function firebaseError(code: string): Error {
  const error = new Error(`Firebase error: ${code}`) as Error & { code: string }
  error.code = code
  return error
}

describe('TransactionManager', () => {
  let manager: TransactionManager

  beforeEach(() => {
    vi.clearAllMocks()
    docMock.mockReturnValue({ path: 'doc-ref' })
    manager = new TransactionManager()
  })

  it('executes a successful transaction once', async () => {
    runTransactionMock.mockImplementation(async (_db, fn) => fn({
      get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }))

    const result = await manager.executeTransaction([
      { type: 'create', collection: 'items', documentId: 'a', data: { x: 1 } },
    ])

    expect(runTransactionMock).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })

  it('default retry budget is a single outer retry (runTransaction retries internally)', async () => {
    runTransactionMock.mockRejectedValue(firebaseError('unavailable'))

    const result = await manager.executeTransaction([
      { type: 'create', collection: 'items', documentId: 'a', data: {} },
    ])

    // default maxRetries=1 → 2 total attempts, not 6× inner attempts
    expect(runTransactionMock).toHaveBeenCalledTimes(2)
    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
  })

  it('does not retry non-retryable errors', async () => {
    runTransactionMock.mockRejectedValue(firebaseError('permission-denied'))

    await expect(
      manager.executeTransaction([
        { type: 'create', collection: 'items', documentId: 'a', data: {} },
      ])
    ).rejects.toBeInstanceOf(TransactionFailedError)

    expect(runTransactionMock).toHaveBeenCalledTimes(1)
  })

  it('withTransaction throws TransactionFailedError after exhausting retries', async () => {
    runTransactionMock.mockRejectedValue(firebaseError('aborted'))

    await expect(
      manager.withTransaction(async () => 'value')
    ).rejects.toBeInstanceOf(TransactionFailedError)

    expect(runTransactionMock).toHaveBeenCalledTimes(2)
  })

  it('withTransaction returns the callback result on success', async () => {
    runTransactionMock.mockImplementation(async (_db, fn) => fn({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }))

    const value = await manager.withTransaction(async () => 42)
    expect(value).toBe(42)
  })
})
