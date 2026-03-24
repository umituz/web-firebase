import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  writeBatch,
  onSnapshot,
  where,
  limit,
  startAfter,
  type QueryConstraint,
  type DocumentData,
  type Firestore,
  type CollectionReference,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { getFirebaseDB } from '../../../infrastructure/firebase/client';
import { createLRUCache, type LRUCache } from '../../../infrastructure/utils/cache.util';

/**
 * Firestore Repository Implementation
 * @description Generic CRUD operations for Firestore collections
 * @example
 * class UsersRepository extends FirestoreRepository<User> {
 *   constructor() {
 *     super('users');
 *   }
 *
 *   async getByEmail(email: string) {
 *     return this.getAll([where('email', '==', email)], undefined, true);
 *   }
 * }
 */
export class FirestoreRepository<T extends DocumentData> {
  protected cache: LRUCache<string, T>;
  protected queryCache: LRUCache<string, T[]>;
  protected cachingEnabled: boolean;

  constructor(
    protected collectionName: string,
    options?: {
      enableCache?: boolean;
      cacheMaxSize?: number;
      cacheTTL?: number;
    }
  ) {
    this.cachingEnabled = options?.enableCache ?? true;
    this.cache = createLRUCache<string, T>({
      maxSize: options?.cacheMaxSize ?? 100,
      ttl: options?.cacheTTL ?? 5 * 60 * 1000,
    });
    this.queryCache = createLRUCache<string, T[]>({
      maxSize: options?.cacheMaxSize ?? 50,
      ttl: options?.cacheTTL ?? 2 * 60 * 1000,
    });
  }

  /**
   * Get Firestore DB instance
   * @throws Error if Firebase not initialized
   */
  protected get db(): Firestore {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }
    return db;
  }

  /**
   * Get collection reference
   * @param parentPath - Parent collection path for nested collections (e.g., 'users/userId')
   * @returns Collection reference
   */
  protected getCollection(parentPath?: string): CollectionReference<T> {
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    return collection(this.db, fullPath) as CollectionReference<T>;
  }

  /**
   * Get document reference
   * @param id - Document ID
   * @param parentPath - Parent collection path for nested collections
   * @returns Document reference
   */
  protected getDocRef(id: string, parentPath?: string) {
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    return doc(this.db, fullPath, id);
  }

  /**
   * Get document by ID
   * @param id - Document ID
   * @param parentPath - Parent collection path for nested collections
   * @param useCache - Use cache if available (default: true)
   * @returns Document data or null
   */
  async getById(id: string, parentPath?: string, useCache = true): Promise<T | null> {
    const cacheKey = this.getCacheKey(id, parentPath);

    // Try cache first
    if (this.cachingEnabled && useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const snap = await getDoc(this.getDocRef(id, parentPath));
    const result = snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as T) : null;

    // Cache the result
    if (this.cachingEnabled && useCache && result) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Get all documents with optional query constraints
   * @param constraints - Query constraints (where, orderBy, limit, etc.)
   * @param parentPath - Parent collection path for nested collections
   * @param returnSingle - Return single document if true
   * @param useCache - Use cache if available (default: true)
   * @returns Array of documents or single document
   */
  async getAll(
    constraints: QueryConstraint[] = [],
    parentPath?: string,
    returnSingle = false,
    useCache = true
  ): Promise<T[]> {
    const cacheKey = this.getQueryCacheKey(constraints, parentPath);

    // Try cache first
    if (this.cachingEnabled && useCache && constraints.length > 0) {
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        return returnSingle ? cached.slice(0, 1) : cached;
      }
    }

    const q = query(this.getCollection(parentPath), ...constraints);
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));

    // Cache the result (only if there are constraints)
    if (this.cachingEnabled && useCache && constraints.length > 0) {
      this.queryCache.set(cacheKey, docs);
    }

    return returnSingle ? docs.slice(0, 1) : docs;
  }

  /**
   * Create document with specific ID
   * @param id - Document ID
   * @param data - Document data (without id)
   * @param parentPath - Parent collection path for nested collections
   */
  async create(id: string, data: Omit<T, 'id'>, parentPath?: string): Promise<void> {
    await setDoc(this.getDocRef(id, parentPath), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DocumentData);

    // Invalidate cache
    this.invalidateCache(id, parentPath);
    this.invalidateQueryCache(parentPath);
  }

  /**
   * Create document with auto-generated ID
   * @param data - Document data (without id)
   * @param parentPath - Parent collection path for nested collections
   * @returns Generated document ID
   */
  async createWithAutoId(data: Omit<T, 'id'>, parentPath?: string): Promise<string> {
    const docRef = await addDoc(this.getCollection(parentPath), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DocumentData);
    return docRef.id;
  }

  /**
   * Update document
   * @param id - Document ID
   * @param data - Partial data to update
   * @param parentPath - Parent collection path for nested collections
   */
  async update(id: string, data: Partial<T>, parentPath?: string): Promise<void> {
    await updateDoc(this.getDocRef(id, parentPath), {
      ...(data as DocumentData),
      updatedAt: new Date().toISOString(),
    });

    // Invalidate cache
    this.invalidateCache(id, parentPath);
    this.invalidateQueryCache(parentPath);
  }

  /**
   * Delete document
   * @param id - Document ID
   * @param parentPath - Parent collection path for nested collections
   */
  async delete(id: string, parentPath?: string): Promise<void> {
    await deleteDoc(this.getDocRef(id, parentPath));

    // Invalidate cache
    this.invalidateCache(id, parentPath);
    this.invalidateQueryCache(parentPath);
  }

  /**
   * Batch create or update multiple documents
   * @param operations - Array of operations to perform
   * @param parentPath - Parent collection path for nested collections
   */
  async batch(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      id: string;
      data?: Omit<T, 'id'>;
    }>,
    parentPath?: string
  ): Promise<void> {
    const batch = writeBatch(this.db);

    operations.forEach(({ type, id, data }) => {
      const ref = this.getDocRef(id, parentPath);
      const timestamp = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      switch (type) {
        case 'create':
          batch.set(ref, { ...data, ...timestamp } as DocumentData);
          break;
        case 'update':
          batch.update(ref, { ...data, updatedAt: timestamp.updatedAt } as DocumentData);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });

    await batch.commit();

    // Invalidate all affected caches
    operations.forEach(({ type, id }) => {
      if (type === 'create' || type === 'update' || type === 'delete') {
        this.invalidateCache(id, parentPath);
      }
    });
    this.invalidateQueryCache(parentPath);
  }

  /**
   * Get sub-collection documents
   * @param parentId - Parent document ID
   * @param subCollectionName - Sub-collection name
   * @param constraints - Query constraints
   * @returns Array of sub-collection documents
   */
  async getSubCollection<S extends DocumentData>(
    parentId: string,
    subCollectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<S[]> {
    const parentPath = `${this.collectionName}/${parentId}`;
    const subCollectionRef = collection(this.db, `${parentPath}/${subCollectionName}`);
    const q = query(subCollectionRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as S));
  }

  /**
   * Add document to sub-collection
   * @param parentId - Parent document ID
   * @param subCollectionName - Sub-collection name
   * @param data - Document data
   * @returns Generated document ID
   */
  async addToSubCollection<S extends DocumentData>(
    parentId: string,
    subCollectionName: string,
    data: Omit<S, 'id'>
  ): Promise<string> {
    const parentPath = `${this.collectionName}/${parentId}`;
    const subCollectionRef = collection(this.db, `${parentPath}/${subCollectionName}`);
    const docRef = await addDoc(subCollectionRef, {
      ...data,
      createdAt: new Date().toISOString(),
    } as DocumentData);
    return docRef.id;
  }

  /**
   * Count documents matching constraints
   * @param constraints - Query constraints
   * @param parentPath - Parent collection path for nested collections
   * @returns Document count
   */
  async count(constraints: QueryConstraint[] = [], parentPath?: string): Promise<number> {
    const docs = await this.getAll(constraints, parentPath);
    return docs.length;
  }

  /**
   * Check if document exists
   * @param id - Document ID
   * @param parentPath - Parent collection path for nested collections
   * @returns true if document exists
   */
  async exists(id: string, parentPath?: string): Promise<boolean> {
    const doc = await this.getById(id, parentPath);
    return doc !== null;
  }

  /**
   * Create or update document (upsert)
   * @param id - Document ID
   * @param data - Document data
   * @param parentPath - Parent collection path for nested collections
   */
  async upsert(id: string, data: Omit<T, 'id'>, parentPath?: string): Promise<void> {
    const exists = await this.exists(id, parentPath);
    if (exists) {
      await this.update(id, data as Partial<T>, parentPath);
    } else {
      await this.create(id, data, parentPath);
    }

    // Invalidate cache
    this.invalidateCache(id, parentPath);
    this.invalidateQueryCache(parentPath);
  }

  /**
   * Get document with automatic retry
   * @param id - Document ID
   * @param maxRetries - Maximum retry attempts
   * @param parentPath - Parent collection path for nested collections
   * @returns Document data or null
   */
  async getByIdWithRetry(
    id: string,
    maxRetries = 3,
    parentPath?: string
  ): Promise<T | null> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getById(id, parentPath);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 100));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get paginated results
   * @param constraints - Query constraints
   * @param pageSize - Page size
   * @param startAfterDoc - Start after document
   * @param parentPath - Parent collection path for nested collections
   * @returns Paginated documents
   */
  async paginate(
    constraints: QueryConstraint[] = [],
    pageSize = 20,
    startAfterDoc?: T,
    parentPath?: string
  ): Promise<{ documents: T[]; hasNextPage: boolean }> {
    const queryConstraints = [...constraints];

    if (startAfterDoc) {
      queryConstraints.push(startAfter(startAfterDoc.id));
    }

    queryConstraints.push(limit(pageSize + 1));

    const documents = await this.getAll(queryConstraints, parentPath);
    const hasNextPage = documents.length > pageSize;

    return {
      documents: documents.slice(0, pageSize),
      hasNextPage,
    };
  }

  /**
   * Get first document matching constraints
   * @param constraints - Query constraints
   * @param parentPath - Parent collection path for nested collections
   * @returns First document or null
   */
  async getFirst(
    constraints: QueryConstraint[] = [],
    parentPath?: string
  ): Promise<T | null> {
    const documents = await this.getAll(constraints, parentPath);
    return documents[0] || null;
  }

  /**
   * Get multiple documents by IDs
   * @param ids - Document IDs
   * @param parentPath - Parent collection path for nested collections
   * @returns Documents
   */
  async getByIds(ids: string[], parentPath?: string): Promise<T[]> {
    // Firestore limits 'in' queries to 10 items
    const chunkSize = 10;
    const chunks: string[][] = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    const results: T[] = [];
    for (const chunk of chunks) {
      const documents = await this.getAll([where('__name__', 'in', chunk)], parentPath);
      results.push(...documents);
    }

    return results;
  }

  /**
   * Watch document changes (real-time)
   * @param id - Document ID
   * @param callback - Callback function
   * @param onError - Error callback
   * @param parentPath - Parent collection path for nested collections
   * @returns Unsubscribe function
   */
  watchById(
    id: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void,
    parentPath?: string
  ): () => void {
    const docRef = this.getDocRef(id, parentPath);

    const unsubscribe = onSnapshot(
      docRef,
      (snap: DocumentSnapshot<DocumentData>) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() } as unknown as T);
        } else {
          callback(null);
        }
      },
      onError
    );

    return unsubscribe;
  }

  /**
   * Watch collection changes (real-time)
   * @param callback - Callback function
   * @param constraints - Query constraints
   * @param onError - Error callback
   * @param parentPath - Parent collection path for nested collections
   * @returns Unsubscribe function
   */
  watchCollection(
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = [],
    onError?: (error: Error) => void,
    parentPath?: string
  ): () => void {
    const q = query(this.getCollection(parentPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const data = snap.docs.map((d: DocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...d.data(),
        } as unknown as T));
        callback(data);
      },
      onError
    );

    return unsubscribe;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    documentCache: { size: number; maxSize: number };
    queryCache: { size: number; maxSize: number };
  } {
    return {
      documentCache: {
        size: this.cache.size(),
        maxSize: 100,
      },
      queryCache: {
        size: this.queryCache.size(),
        maxSize: 50,
      },
    };
  }

  /**
   * Enable or disable caching
   */
  setCaching(enabled: boolean): void {
    this.cachingEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Generate cache key for document
   */
  private getCacheKey(id: string, parentPath?: string): string {
    return parentPath ? `${parentPath}/${this.collectionName}/${id}` : `${this.collectionName}/${id}`;
  }

  /**
   * Generate cache key for query
   * Note: Constraints order matters for cache key generation
   */
  private getQueryCacheKey(constraints: QueryConstraint[], parentPath?: string): string {
    // Sort constraints by their string representation to ensure consistent keys
    const sortedConstraints = [...constraints].sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });

    const constraintStr = sortedConstraints.map(c => JSON.stringify(c)).join('&');
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    return `${fullPath}?${constraintStr}`;
  }

  /**
   * Invalidate document cache
   */
  private invalidateCache(id: string, parentPath?: string): void {
    const cacheKey = this.getCacheKey(id, parentPath);
    this.cache.remove(cacheKey);
  }

  /**
   * Invalidate query cache
   */
  private invalidateQueryCache(parentPath?: string): void {
    // Use exact collection path matching to avoid false positives
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    const keys = this.queryCache.keys();

    for (const key of keys) {
      // Check if key starts with collection path followed by ? or /
      // This avoids matching similar collection names like "users" vs "users-archive"
      const matchPattern = new RegExp(`^${fullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[/?]`);
      if (matchPattern.test(key)) {
        this.queryCache.remove(key);
      }
    }
  }
}
