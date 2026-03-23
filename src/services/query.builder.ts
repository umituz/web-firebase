/**
 * Query Builder for Firestore
 * @description Fluent API for building Firestore queries with type safety
 * @example
 * const users = await queryBuilder('users')
 *   .where('status', '==', 'active')
 *   .orderBy('createdAt', 'desc')
 *   .limit(10)
 *   .exec<User>()
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  startAfter,
  type QueryConstraint,
  type DocumentData,
  type Firestore,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { getFirebaseDB } from '../firebase/client';

// Query constraint helpers - re-export for convenience
export { where, orderBy, limit as limitFn, startAfter } from 'firebase/firestore';

/**
 * Query Builder Class
 * Provides fluent API for building Firestore queries
 */
export class QueryBuilder<T extends DocumentData> {
  private constraints: QueryConstraint[] = [];
  private currentLimit: number | null = null;

  constructor(
    private collectionPath: string,
    private db?: Firestore
  ) {
    if (!db) {
      const dbInstance = getFirebaseDB();
      if (!dbInstance) {
        throw new Error('Firebase Firestore is not initialized');
      }
      this.db = dbInstance;
    } else {
      this.db = db;
    }
  }

  /**
   * Add where constraint
   * @param field Field name
   * @param op Operator (==, !=, <, <=, >, >=, array-contains, in, array-contains-any)
   * @param value Value to compare
   */
  where(field: string, op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any', value: unknown): this {
    this.constraints.push(where(field, op, value));
    return this;
  }

  /**
   * Add orderBy constraint
   * @param field Field name
   * @param directionStr 'asc' or 'desc'
   */
  orderBy(field: string, directionStr: 'asc' | 'desc' = 'asc'): this {
    this.constraints.push(orderBy(field, directionStr));
    return this;
  }

  /**
   * Limit results
   * @param n Maximum number of results
   */
  limit(n: number): this {
    this.currentLimit = n;
    this.constraints.push(limitFn(n));
    return this;
  }

  /**
   * Start after a document (cursor-based pagination)
   * @param doc Document to start after
   */
  startAfterDoc(doc: any): this {
    this.constraints.push(startAfter(doc));
    return this;
  }

  /**
   * Get collection reference
   */
  private getCollection(): CollectionReference<T> {
    return collection(this.db, this.collectionPath) as CollectionReference<T>;
  }

  /**
   * Execute query and return results
   * @returns Array of documents
   */
  async exec(): Promise<T[]> {
    const q = query(this.getCollection(), ...this.constraints);
    const snapshot = await this.db ? await import('firebase/firestore').then(m => m.getDocs(q)) : null;
    if (!snapshot) return [];

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  }

  /**
   * Execute query and return single result
   * @returns First document or null
   */
  async execOne(): Promise<T | null> {
    const results = await this.exec();
    return results[0] || null;
  }

  /**
   * Get count of results
   * @returns Number of matching documents
   */
  async count(): Promise<number> {
    return (await this.exec()).length;
  }

  /**
   * Get raw Firestore query
   * @returns Firestore query object
   */
  getQuery(): Query {
    return query(this.getCollection(), ...this.constraints);
  }

  /**
   * Reset builder for reuse
   */
  reset(): this {
    this.constraints = [];
    this.currentLimit = null;
    return this;
  }
}

/**
 * Create a query builder for a collection
 * @param collectionPath - Collection path (e.g., 'users' or 'users/userId/organisations')
 * @returns QueryBuilder instance
 * @example
 * const activeUsers = await createQueryBuilder('users')
 *   .where('status', '==', 'active')
 *   .orderBy('createdAt', 'desc')
 *   .limit(10)
 *   .exec<User>()
 */
export function createQueryBuilder<T extends DocumentData>(
  collectionPath: string,
  db?: Firestore
): QueryBuilder<T> {
  return new QueryBuilder<T>(collectionPath, db);
}

/**
 * Cursor-based pagination helper
 * @param collectionPath - Collection path
 * @param constraints - Query constraints
 * @param pageSize - Page size
 * @param startAfter - Optional start document
 * @returns Paginated results
 */
export async function paginate<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  pageSize: number,
  startAfter?: any
): Promise<{
  data: T[];
  hasMore: boolean;
  lastDoc: any;
}> {
  const db = getFirebaseDB();
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }

  const allConstraints = [...constraints];
  if (startAfter) {
    allConstraints.push(startAfter(startAfter));
  }
  allConstraints.push(limitFn(pageSize + 1));

  const coll = collection(db, collectionPath);
  const q = query(coll, ...allConstraints);
  const { getDocs } = await import('firebase/firestore');
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;
  const data = docs.slice(0, pageSize).map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  const lastDoc = hasMore ? docs[pageSize - 1] : null;

  return { data, hasMore, lastDoc };
}

/**
 * Real-time query listener
 * @param collectionPath - Collection path
 * @param constraints - Query constraints
 * @param callback - Callback function for updates
 * @returns Unsubscribe function
 */
export function onQuery<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): () => void {
  const db = getFirebaseDB();
  if (!db) {
    console.error('Cannot listen to query: Firebase not initialized');
    return () => {};
  }

  const coll = collection(db, collectionPath);
  const q = query(coll, ...constraints);
  const { onSnapshot } = await import('firebase/firestore');

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
    callback(data);
  });

  return unsubscribe;
}
