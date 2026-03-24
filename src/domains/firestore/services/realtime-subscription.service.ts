/**
 * Real-time Subscription Manager Service
 * @description Manages Firestore real-time subscriptions with automatic cleanup
 * @domain Firestore
 * @layer Service
 */

import {
  onSnapshot,
  doc,
  collection,
  query,
  type Firestore,
  type Unsubscribe,
  type QueryConstraint,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { getFirebaseDB } from '../../../infrastructure/firebase/client';
import {
  FirestoreNotInitializedError,
} from '../../../domain/errors/repository.errors';

/**
 * Subscription callback types
 */
export type DocumentSnapshotCallback<T> = (data: T | null) => void;
export type QuerySnapshotCallback<T> = (data: T[]) => void;
export type ErrorCallback = (error: Error) => void;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /**
   * Include metadata changes
   */
  includeMetadataChanges?: boolean;

  /**
   * Automatically fetch initial data
   */
  fetchInitial?: boolean;

  /**
   * Error callback
   */
  onError?: ErrorCallback;
}

/**
 * Subscription metadata
 */
interface Subscription {
  id: string;
  unsubscribe: Unsubscribe;
  createdAt: number;
  lastActivity: number;
}

/**
 * Real-time Subscription Manager Class
 */
export class RealTimeSubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private get db(): Firestore {
    const db = getFirebaseDB();
    if (!db) {
      throw new FirestoreNotInitializedError();
    }
    return db;
  }

  /**
   * Subscribe to document changes
   */
  subscribeToDocument<T extends DocumentData>(
    collectionName: string,
    documentId: string,
    callback: DocumentSnapshotCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const { includeMetadataChanges = false, onError } = options;

    const docRef = doc(this.db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges },
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() } as unknown as T);
        } else {
          callback(null);
        }
        this.updateLastActivity(this.generateId('doc', collectionName, documentId));
      },
      (error) => {
        onError?.(error as Error);
      }
    );

    const subscriptionId = this.generateId('doc', collectionName, documentId);
    this.addSubscription(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * Subscribe to collection changes
   */
  subscribeToCollection<T extends DocumentData>(
    collectionName: string,
    callback: QuerySnapshotCallback<T>,
    constraints: QueryConstraint[] = [],
    options: SubscriptionOptions = {}
  ): () => void {
    const { includeMetadataChanges = false, onError } = options;

    const collectionRef = collection(this.db, collectionName);
    const q = constraints.length > 0
      ? query(collectionRef, ...constraints)
      : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges },
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as T)
        );
        callback(data);
        this.updateLastActivity(this.generateId('collection', collectionName));
      },
      (error) => {
        onError?.(error as Error);
      }
    );

    const subscriptionId = this.generateId('collection', collectionName);
    this.addSubscription(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * Subscribe to query changes
   */
  subscribeToQuery<T extends DocumentData>(
    query: Query<T>,
    callback: QuerySnapshotCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const { includeMetadataChanges = false, onError } = options;

    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges },
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        callback(data);
        this.updateLastActivity(this.generateId('query', query.toString()));
      },
      (error) => {
        onError?.(error as Error);
      }
    );

    const subscriptionId = this.generateId('query', query.toString());
    this.addSubscription(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * Unsubscribe by ID
   */
  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const [_id, subscription] of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscription IDs
   */
  getSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Clean up inactive subscriptions (older than specified milliseconds)
   */
  cleanupInactiveSubscriptions(olderThanMs: number): void {
    const now = Date.now();
    for (const [id, subscription] of this.subscriptions) {
      if (now - subscription.lastActivity > olderThanMs) {
        this.unsubscribe(id);
      }
    }
  }

  /**
   * Add subscription
   */
  private addSubscription(id: string, unsubscribe: Unsubscribe): void {
    // If subscription already exists, unsubscribe it first
    if (this.subscriptions.has(id)) {
      const existing = this.subscriptions.get(id);
      existing?.unsubscribe();
    }

    this.subscriptions.set(id, {
      id,
      unsubscribe,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.lastActivity = Date.now();
    }
  }

  /**
   * Generate unique subscription ID
   */
  private generateId(_type: string, ...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Auto-cleanup interval (default: 5 minutes)
   * @returns Cleanup function to stop the interval
   */
  startAutoCleanup(intervalMs: number = 5 * 60 * 1000): () => void {
    // Clear existing interval if any
    this.stopAutoCleanup();

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupInactiveSubscriptions(intervalMs);
    }, intervalMs);

    // Return cleanup function
    return () => this.stopAutoCleanup();
  }

  /**
   * Stop auto-cleanup interval
   */
  stopAutoCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Cleanup all resources (subscriptions and intervals)
   */
  dispose(): void {
    this.stopAutoCleanup();
    this.unsubscribeAll();
  }
}

/**
 * Create real-time subscription manager instance
 */
export function createRealTimeSubscriptionManager(): RealTimeSubscriptionManager {
  return new RealTimeSubscriptionManager();
}
