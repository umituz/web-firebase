import { describe, it, expect, vi, beforeEach } from 'vitest'

const writeBatchMock = vi.fn()
const docMock = vi.fn()
const collectionMock = vi.fn()
const addDocMock = vi.fn()
const getDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
}))

vi.mock('@/infrastructure/firebase/client', () => ({
  getFirebaseDB: () => ({ type: 'firestore-mock' }),
}))

import {
  BatchOperationManager,
  type BatchOperation,
} from '../src/domains/firestore/services/batch-operation.service'
import { BatchFailedError } from '../src/domains/firestore/errors/repository.errors'

function makeOperations(count: number): BatchOperation[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'create' as const,
    collection: 'items',
    documentId: `doc-${i}`,
    data: { index: i },
  }))
}

function makeBatch(overrides: Partial<{ commit: ReturnType<typeof vi.fn> }> = {}) {
  const batch = {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: overrides.commit ?? vi.fn().mockResolvedValue(undefined),
  }
  writeBatchMock.mockReturnValue(batch)
  return batch
}

describe('BatchOperationManager', () => {
  let manager: BatchOperationManager

  beforeEach(() => {
    vi.clearAllMocks()
    docMock.mockReturnValue({ path: 'mock-doc-ref' })
    collectionMock.mockReturnValue({ id: 'mock-collection-ref' })
    manager = new BatchOperationManager()
  })

  it('commits a batch of operations', async () => {
    const batch = makeBatch()
    const result = await manager.executeBatch(makeOperations(3))

    expect(batch.set).toHaveBeenCalledTimes(3)
    expect(batch.commit).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ success: true, totalOperations: 3, successfulBatches: 1 })
  })

  it('auto-chunks operations above 500 instead of throwing (documented behavior)', async () => {
    makeBatch()
    const result = await manager.executeBatch(makeOperations(600))

    expect(writeBatchMock).toHaveBeenCalledTimes(2)
    expect(result.successfulBatches).toBe(2)
    expect(result.success).toBe(true)
  })

  it('respects a custom maxOperations chunk size', async () => {
    makeBatch()
    const result = await manager.executeBatch(makeOperations(10), { maxOperations: 4 })

    expect(writeBatchMock).toHaveBeenCalledTimes(3) // 4 + 4 + 2
    expect(result.successfulBatches).toBe(3)
  })

  it('throws BatchFailedError on commit failure by default', async () => {
    makeBatch({ commit: vi.fn().mockRejectedValue(new Error('commit failed')) })

    await expect(manager.executeBatch(makeOperations(2))).rejects.toBeInstanceOf(BatchFailedError)
  })

  it('continues on error when continueOnError is set', async () => {
    let call = 0
    makeBatch({
      commit: vi.fn().mockImplementation(() => {
        call++
        return call === 1 ? Promise.reject(new Error('first fails')) : Promise.resolve()
      }),
    })

    const result = await manager.executeBatch(makeOperations(2), {
      maxOperations: 1,
      continueOnError: true,
    })

    expect(result.success).toBe(false)
    expect(result.successfulBatches).toBe(1)
    expect(result.failedBatches).toBe(1)
    expect(result.errors).toHaveLength(1)
  })

  describe('createWithAutoIds', () => {
    it('passes a CollectionReference (not a document ref) to addDoc', async () => {
      makeBatch()
      const collectionRef = { id: 'mock-collection-ref' }
      addDocMock.mockResolvedValue({ id: 'auto-1' })

      const ids = await manager.createWithAutoIds('items', [{ data: { a: 1 } }])

      expect(collectionMock).toHaveBeenCalledWith({ type: 'firestore-mock' }, 'items')
      expect(docMock).not.toHaveBeenCalledWith({ type: 'firestore-mock' }, 'items') // regression: was doc(db, name)
      expect(addDocMock).toHaveBeenCalledWith(collectionRef, expect.anything())
      expect(ids).toEqual(['auto-1'])
    })

    it('keeps document order when mixing provided and generated ids', async () => {
      makeBatch()
      addDocMock.mockResolvedValue({ id: 'generated' })

      const ids = await manager.createWithAutoIds('items', [
        { id: 'known-1', data: {} },
        { data: {} }, // no id → generated
        { id: 'known-2', data: {} },
      ])

      expect(ids).toEqual(['known-1', 'generated', 'known-2'])
    })
  })

  it('deleteMultiple builds delete operations', async () => {
    const batch = makeBatch()
    await manager.deleteMultiple('items', ['a', 'b'])

    expect(batch.delete).toHaveBeenCalledTimes(2)
  })
})
