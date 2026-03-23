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
} from '../errors';

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
    const { maxRetries = 5, enableOptimisticLocking = false } = options;

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

        // Check if error is retryable (conflict)
        const isConflict =
          error instanceof Error && error.message.includes('conflict');

        if (!isConflict) {
          throw new TransactionFailedError(
            operations.map((op) => `${op.type}:${op.documentId}`).join(', '),
            error
          );
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 100);
      }
    }

    return {
      success: false,
      operations,
      error: new TransactionFailedError('Transaction failed after retries'),
    };
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
    const { maxRetries = 5 } = options;

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

        const isConflict =
          error instanceof Error && error.message.includes('conflict');

        if (!isConflict) {
          throw new TransactionFailedError(
            'withTransaction',
            error
          );
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 100);
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

// Export singleton instance
export const transactionManager = new TransactionManager();

/**
 * Create transaction manager instance
 */
export function createTransactionManager(): TransactionManager {
  return new TransactionManager();
}
