/**
 * Transaction Manager Service
 * @description Manages Firestore transactions for atomic multi-document operations
 * @domain Firestore
 * @layer Service
 */

import {
  runTransaction,
  doc,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';
import { getFirebaseDB } from '../../../infrastructure/firebase/client';
import {
  TransactionFailedError,
  TransactionConflictError,
  FirestoreNotInitializedError,
} from '../../../domain/errors/repository.errors';

/**
 * Transaction operation type
 */
export type TransactionOperationType = 'get' | 'create' | 'update' | 'delete';

/**
 * Transaction operation
 */
export interface TransactionOperation {
  type: TransactionOperationType;
  collection: string;
  documentId: string;
  data?: Record<string, unknown>;
  options?: { merge?: boolean };
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /**
   * Maximum number of retries for conflicts
   */
  maxRetries?: number;

  /**
   * Transaction timeout in milliseconds
   */
  timeout?: number;

  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay?: number;

  /**
   * Enable optimistic locking with version checks
   */
  enableOptimisticLocking?: boolean;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  operations: TransactionOperation[];
  error?: Error;
}

/**
 * Transaction error codes from Firebase
 */
const FIRESTORE_ERROR_CODES = {
  ABORTED: 'aborted',
  ALREADY_EXISTS: 'already-exists',
  CANCELLED: 'cancelled',
  DATA_LOSS: 'data-loss',
  DEADLINE_EXCEEDED: 'deadline-exceeded',
  FAILED_PRECONDITION: 'failed-precondition',
  INTERNAL: 'internal',
  INVALID_ARGUMENT: 'invalid-argument',
  NOT_FOUND: 'not-found',
  OK: 'ok',
  OUT_OF_RANGE: 'out-of-range',
  PERMISSION_DENIED: 'permission-denied',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  UNAUTHENTICATED: 'unauthenticated',
  UNAVAILABLE: 'unavailable',
  UNIMPLEMENTED: 'unimplemented',
  UNKNOWN: 'unknown',
} as const;

/**
 * Transaction Manager Class
 */
export class TransactionManager {
  private get db(): Firestore {
    const db = getFirebaseDB();
    if (!db) {
      throw new FirestoreNotInitializedError();
    }
    return db;
  }

  /**
   * Execute transaction with operations
   */
  async executeTransaction(
    operations: TransactionOperation[],
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    const { maxRetries = 5, enableOptimisticLocking = false, maxDelay = 5000 } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await runTransaction(this.db, async (transaction) => {
          for (const operation of operations) {
            await this.executeOperation(transaction, operation, {
              enableOptimisticLocking,
            });
          }
        });

        return {
          success: true,
          operations,
        };
      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            operations,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }

        // Check if error is retryable using Firebase error codes
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable) {
          throw new TransactionFailedError(
            operations.map((op) => `${op.type}:${op.documentId}`).join(', '),
            error
          );
        }

        // Calculate delay with exponential backoff and max limit
        const delayMs = Math.min(Math.pow(2, attempt) * 100, maxDelay);

        // Wait before retry
        await this.delay(delayMs);
      }
    }

    return {
      success: false,
      operations,
      error: new TransactionFailedError('Transaction failed after retries'),
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    // Check for Firebase Firestore error codes
    const errorCode = (error as { code?: string }).code;
    if (errorCode) {
      return [
        FIRESTORE_ERROR_CODES.ABORTED,
        FIRESTORE_ERROR_CODES.UNAVAILABLE,
        FIRESTORE_ERROR_CODES.DEADLINE_EXCEEDED,
        FIRESTORE_ERROR_CODES.RESOURCE_EXHAUSTED,
        FIRESTORE_ERROR_CODES.INTERNAL,
      ].includes(errorCode as any);
    }

    // Fallback to message checking for backward compatibility
    const message = error.message.toLowerCase();
    return message.includes('aborted') ||
           message.includes('conflict') ||
           message.includes('unavailable') ||
           message.includes('deadline');
  }

  /**
   * Execute single operation within transaction
   */
  private async executeOperation(
    transaction: Transaction,
    operation: TransactionOperation,
    options: { enableOptimisticLocking: boolean }
  ): Promise<void> {
    const { type, collection, documentId, data, options: opOptions } = operation;
    const docRef = doc(this.db, collection, documentId);

    switch (type) {
      case 'get':
        await transaction.get(docRef);
        break;

      case 'create':
        if (options.enableOptimisticLocking) {
          // Check if document exists for optimistic locking
          const snap = await transaction.get(docRef);
          if (snap.exists()) {
            throw new TransactionConflictError(documentId, 1, 0);
          }
        }
        transaction.set(docRef, data || {}, opOptions || {});
        break;

      case 'update':
        if (options.enableOptimisticLocking) {
          // Check version for optimistic locking
          const snap = await transaction.get(docRef);
          if (!snap.exists()) {
            throw new TransactionConflictError(documentId, 0, 1);
          }

          const currentVersion = (snap.data()?.version as number) || 0;
          const providedVersion = (data?.version as number) || 0;

          if (currentVersion !== providedVersion) {
            throw new TransactionConflictError(
              documentId,
              currentVersion,
              providedVersion
            );
          }

          // Increment version
          transaction.update(docRef, {
            ...data,
            version: currentVersion + 1,
            updatedAt: new Date().toISOString(),
          });
        } else {
          transaction.update(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
          });
        }
        break;

      case 'delete':
        transaction.delete(docRef);
        break;
    }
  }

  /**
   * Execute transaction with function
   */
  async withTransaction<T>(
    fn: (transaction: Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const { maxRetries = 5, maxDelay = 5000 } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await runTransaction(this.db, fn);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new TransactionFailedError(
            'withTransaction',
            error
          );
        }

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable) {
          throw new TransactionFailedError(
            'withTransaction',
            error
          );
        }

        // Calculate delay with exponential backoff and max limit
        const delayMs = Math.min(Math.pow(2, attempt) * 100, maxDelay);

        // Wait before retry
        await this.delay(delayMs);
      }
    }

    throw new TransactionFailedError(
      'Transaction failed after retries'
    );
  }

  /**
   * Execute atomic update (read-modify-write)
   */
  async atomicUpdate<T extends Record<string, unknown>>(
    collection: string,
    documentId: string,
    updateFn: (current: T | null) => Partial<T>,
    options: TransactionOptions = {}
  ): Promise<void> {
    await this.withTransaction(async (transaction) => {
      const docRef = doc(this.db, collection, documentId);
      const snap = await transaction.get(docRef);

      const current = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as unknown as T)
        : null;

      const updates = updateFn(current);

      if (snap.exists()) {
        transaction.update(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } else if (current === null && updates) {
        transaction.set(docRef, {
          ...updates,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }, options);
  }

  /**
   * Execute batch update across multiple documents
   */
  async batchUpdate<T extends Record<string, unknown>>(
    operations: Array<{
      collection: string;
      documentId: string;
      updateFn: (current: T | null) => Partial<T>;
    }>,
    options: TransactionOptions = {}
  ): Promise<void> {
    await this.withTransaction(async (transaction) => {
      for (const operation of operations) {
        const { collection, documentId, updateFn } = operation;
        const docRef = doc(this.db, collection, documentId);
        const snap = await transaction.get(docRef);

        const current = snap.exists()
          ? ({ id: snap.id, ...snap.data() } as unknown as T)
          : null;

        const updates = updateFn(current);

        if (snap.exists()) {
          transaction.update(docRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
        } else if (current === null && updates) {
          transaction.set(docRef, {
            ...updates,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }, options);
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create transaction manager instance
 */
export function createTransactionManager(): TransactionManager {
  return new TransactionManager();
}
