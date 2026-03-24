/**
 * Batch Operation Manager Service
 * @description Manages Firestore batch operations with automatic chunking
 * @domain Firestore
 * @layer Service
 */

import {
  writeBatch,
  doc,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseDB } from '../../../infrastructure/firebase/client';
import {
  BatchFailedError,
  BatchTooLargeError,
  FirestoreNotInitializedError,
} from '../errors';

/**
 * Firestore maximum operations per batch
 */
const MAX_BATCH_OPERATIONS = 500;

/**
 * Batch operation type
 */
export type BatchOperationType = 'create' | 'update' | 'delete';

/**
 * Batch operation
 */
export interface BatchOperation {
  type: BatchOperationType;
  collection: string;
  documentId: string;
  data?: Record<string, unknown>;
  options?: { merge?: boolean };
}

/**
 * Batch options
 */
export interface BatchOptions {
  /**
   * Maximum operations per batch (default: 500)
   */
  maxOperations?: number;

  /**
   * Delay between batches in milliseconds (default: 0)
   */
  batchDelay?: number;

  /**
   * Continue on error (default: false)
   */
  continueOnError?: boolean;
}

/**
 * Batch result
 */
export interface BatchResult {
  success: boolean;
  totalOperations: number;
  successfulBatches: number;
  failedBatches: number;
  errors: Array<{ batch: number; error: Error }>;
}

/**
 * Batch Operation Manager Class
 */
export class BatchOperationManager {
  private get db(): Firestore {
    const db = getFirebaseDB();
    if (!db) {
      throw new FirestoreNotInitializedError();
    }
    return db;
  }

  /**
   * Execute batch operations with automatic chunking
   */
  async executeBatch(
    operations: BatchOperation[],
    options: BatchOptions = {}
  ): Promise<BatchResult> {
    const {
      maxOperations = MAX_BATCH_OPERATIONS,
      batchDelay = 0,
      continueOnError = false,
    } = options;

    if (operations.length > maxOperations) {
      throw new BatchTooLargeError(operations.length, maxOperations);
    }

    // Chunk operations into batches
    const chunks = this.chunkOperations(operations, maxOperations);

    const result: BatchResult = {
      success: true,
      totalOperations: operations.length,
      successfulBatches: 0,
      failedBatches: 0,
      errors: [],
    };

    for (let i = 0; i < chunks.length; i++) {
      try {
        await this.executeSingleBatch(chunks[i]);
        result.successfulBatches++;

        // Add delay between batches if specified
        if (batchDelay > 0 && i < chunks.length - 1) {
          await this.delay(batchDelay);
        }
      } catch (error) {
        result.failedBatches++;
        result.errors.push({
          batch: i,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        if (!continueOnError) {
          result.success = false;
          throw new BatchFailedError(operations.length, error);
        }
      }
    }

    if (result.failedBatches > 0 && continueOnError) {
      result.success = false;
    }

    return result;
  }

  /**
   * Execute single batch
   */
  private async executeSingleBatch(
    operations: BatchOperation[]
  ): Promise<void> {
    const batch = writeBatch(this.db);

    for (const operation of operations) {
      const { type, collection, documentId, data, options: opOptions } = operation;
      const docRef = doc(this.db, collection, documentId);

      const now = new Date().toISOString();

      switch (type) {
        case 'create':
          batch.set(docRef, {
            ...data,
            createdAt: now,
            updatedAt: now,
          }, opOptions || {});
          break;

        case 'update':
          batch.update(docRef, {
            ...data,
            updatedAt: now,
          });
          break;

        case 'delete':
          batch.delete(docRef);
          break;
      }
    }

    await batch.commit();
  }

  /**
   * Chunk operations into batches
   */
  private chunkOperations(
    operations: BatchOperation[],
    maxSize: number
  ): BatchOperation[][] {
    const chunks: BatchOperation[][] = [];
    const totalChunks = Math.ceil(operations.length / maxSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * maxSize;
      const end = start + maxSize;
      chunks.push(operations.slice(start, end));
    }

    return chunks;
  }

  /**
   * Create documents with auto-generated IDs
   */
  async createWithAutoIds(
    collection: string,
    documents: Array<{ id?: string; data: Record<string, unknown> }>,
    options: BatchOptions = {}
  ): Promise<string[]> {
    const { collection: docCollection, addDoc } = await import('firebase/firestore');

    // Separate documents with IDs and without IDs
    const withIds: Array<{ index: number; id: string; data: Record<string, unknown> }> = [];
    const withoutIds: Array<{ index: number; data: Record<string, unknown> }> = [];

    documents.forEach((doc, index) => {
      if (doc.id) {
        withIds.push({ index, id: doc.id, data: doc.data });
      } else {
        withoutIds.push({ index, data: doc.data });
      }
    });

    const ids: string[] = new Array(documents.length);

    // Execute batch for documents with provided IDs
    if (withIds.length > 0) {
      const operations: BatchOperation[] = withIds.map(({ id, data }) => ({
        type: 'create' as const,
        collection,
        documentId: id,
        data,
      }));
      await this.executeBatch(operations, options);

      withIds.forEach(({ index, id }) => {
        ids[index] = id;
      });
    }

    // Generate auto IDs for documents without IDs (in parallel)
    if (withoutIds.length > 0) {
      const collectionRef = docCollection(this.db, collection);
      const autoIdPromises = withoutIds.map(async ({ index, data }) => {
        const docRef = await addDoc(collectionRef, {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return { index, id: docRef.id };
      });

      const results = await Promise.all(autoIdPromises);
      results.forEach(({ index, id }) => {
        ids[index] = id;
      });
    }

    return ids;
  }

  /**
   * Delete multiple documents
   */
  async deleteMultiple(
    collection: string,
    documentIds: string[],
    options: BatchOptions = {}
  ): Promise<BatchResult> {
    const operations: BatchOperation[] = documentIds.map((documentId) => ({
      type: 'delete',
      collection,
      documentId,
    }));

    return this.executeBatch(operations, options);
  }

  /**
   * Update multiple documents
   */
  async updateMultiple(
    collection: string,
    updates: Array<{
      documentId: string;
      data: Record<string, unknown>;
    }>,
    options: BatchOptions = {}
  ): Promise<BatchResult> {
    const operations: BatchOperation[] = updates.map((update) => ({
      type: 'update',
      collection,
      documentId: update.documentId,
      data: update.data,
    }));

    return this.executeBatch(operations, options);
  }

  /**
   * Copy documents within collection or to another collection
   */
  async copyDocuments(
    sourceCollection: string,
    targetCollection: string,
    documentIds: string[],
    options: BatchOptions = {}
  ): Promise<void> {
    const { getDoc } = await import('firebase/firestore');

    // Read all source documents
    const operations: BatchOperation[] = [];

    for (const documentId of documentIds) {
      const docRef = doc(this.db, sourceCollection, documentId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        operations.push({
          type: 'create',
          collection: targetCollection,
          documentId,
          data: snap.data(),
        });
      }
    }

    await this.executeBatch(operations, options);
  }

  /**
   * Move documents (copy + delete)
   */
  async moveDocuments(
    sourceCollection: string,
    targetCollection: string,
    documentIds: string[],
    options: BatchOptions = {}
  ): Promise<void> {
    await this.copyDocuments(
      sourceCollection,
      targetCollection,
      documentIds,
      options
    );
    await this.deleteMultiple(sourceCollection, documentIds, options);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const batchOperationManager = new BatchOperationManager();

/**
 * Create batch operation manager instance
 */
export function createBatchOperationManager(): BatchOperationManager {
  return new BatchOperationManager();
}
