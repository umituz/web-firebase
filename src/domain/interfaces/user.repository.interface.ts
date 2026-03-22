/**
 * User Repository Interface
 * @description Generic contract for user data operations
 */

import type { QueryConstraint } from 'firebase/firestore'

export interface IUserRepository {
  /**
   * Get document by ID
   */
  getById<T>(userId: string): Promise<T | null>

  /**
   * Get document by field
   */
  getByField<T>(collectionPath: string, field: string, value: any): Promise<T | null>

  /**
   * Create document
   */
  create(userId: string, data: any): Promise<void>

  /**
   * Update document
   */
  update(userId: string, data: any, options?: { merge?: boolean }): Promise<void>

  /**
   * Delete document
   */
  delete(userId: string): Promise<void>

  /**
   * Query collection with constraints
   */
  query<T>(collectionPath: string, constraints: QueryConstraint[]): Promise<T[]>

  /**
   * Subscribe to document changes
   */
  subscribeToDoc<T>(docPath: string, callback: (data: T | null) => void): () => void

  /**
   * Subscribe to collection changes
   */
  subscribeToCollection<T>(collectionPath: string, callback: (data: T[]) => void, constraints?: QueryConstraint[]): () => void
}
