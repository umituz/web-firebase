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
} from '../errors/repository.errors';

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
  private nextSubscriptionSeq = 0;
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
    const subscriptionId = this.generateId('doc', collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges },
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() } as unknown as T);
        } else {
          callback(null);
        }
        this.updateLastActivity(subscriptionId);
      },
      (error) => {
        onError?.(error as Error);
      }
    );

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

    // Every subscription gets a unique ID: two listeners on the same
    // collection (with different constraints) must not evict each other.
    const subscriptionId = this.generateId('collection', collectionName);

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges },
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as T)
        );
        callback(data);
        this.updateLastActivity(subscriptionId);
      },
      (error) => {
        onError?.(error as Error);
      }
    );

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

    // `query.toString()` is "[object Object]" for every query, so it can never
    // identify a subscription — use a unique sequential ID instead.
    const subscriptionId = this.generateId('query');

    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges },
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        callback(data);
        this.updateLastActivity(subscriptionId);
      },
      (error) => {
        onError?.(error as Error);
      }
    );

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
    for (const subscription of this.subscriptions.values()) {
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
   * Generate a unique subscription ID.
   * A per-instance sequence number guarantees uniqueness even when several
   * subscriptions share the same collection path or query shape.
   */
  private generateId(type: string, ...parts: string[]): string {
    const seq = ++this.nextSubscriptionSeq;
    return [...parts, type, String(seq)].join(':');
  }

  /**
   * Auto-cleanup interval (default: runs every 5 minutes and unsubscribes
   * listeners with no snapshot activity for `inactivityMs`).
   *
   * WARNING: a listener that receives no snapshots for `inactivityMs` will be
   * unsubscribed even though it is healthy — Firestore only emits on changes.
   * Only enable this for short-lived polling-style listeners.
   *
   * @returns Cleanup function to stop the interval
   */
  startAutoCleanup(intervalMs: number = 5 * 60 * 1000, inactivityMs: number = intervalMs): () => void {
    // Clear existing interval if any
    this.stopAutoCleanup();

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupInactiveSubscriptions(inactivityMs);
    }, intervalMs);

    // Don't keep Node.js processes alive just for subscription cleanup
    if (typeof this.cleanupIntervalId === 'object' && this.cleanupIntervalId && 'unref' in this.cleanupIntervalId) {
      (this.cleanupIntervalId as { unref: () => void }).unref();
    }

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

/**
 * Singleton instance
 */
export const realTimeSubscriptionManager = createRealTimeSubscriptionManager();

