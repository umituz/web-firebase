/**
 * LRU Cache Utility
 * @description Simple LRU (Least Recently Used) cache implementation for performance optimization
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
  expiresAt: number;
}

export interface CacheOptions {
  /**
   * Maximum number of items in cache (default: 100)
   */
  maxSize?: number;

  /**
   * Time to live in milliseconds (default: 5 minutes)
   */
  ttl?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheNode<K, V>> = new Map();
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;
  private maxSize: number;
  private ttl: number;
  private debug: boolean;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes
    this.debug = options.debug ?? false;

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.log('Cache MISS', key);
      return undefined;
    }

    // Check if expired
    if (Date.now() > node.expiresAt) {
      this.log('Cache EXPIRED', key);
      this.remove(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    this.log('Cache HIT', key);
    return node.value;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V, customTtl?: number): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      existingNode.expiresAt = Date.now() + (customTtl ?? this.ttl);
      this.moveToFront(existingNode);
      this.log('Cache UPDATE', key);
      return;
    }

    // Create new node
    const newNode: CacheNode<K, V> = {
      key,
      value,
      prev: null,
      next: null,
      expiresAt: Date.now() + (customTtl ?? this.ttl),
    };

    // Add to front
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Check if cache is full
    if (this.cache.size > this.maxSize) {
      this.removeLeastRecentlyUsed();
    }

    this.log('Cache SET', key, `Size: ${this.cache.size}/${this.maxSize}`);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    if (Date.now() > node.expiresAt) {
      this.remove(key);
      return false;
    }
    return true;
  }

  /**
   * Remove key from cache
   */
  remove(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.cache.delete(key);
    this.removeFromList(node);
    this.log('Cache REMOVE', key);
    return true;
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.log('Cache CLEAR');
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need tracking for actual hit rate
    };
  }

  /**
   * Clean up expired items
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: K[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (now > node.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.remove(key);
    }

    if (expiredKeys.length > 0) {
      this.log(`Cleaned up ${expiredKeys.length} expired items`);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Every minute
  }

  /**
   * Stop cleanup interval
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Move node to front of list
   */
  private moveToFront(node: CacheNode<K, V>): void {
    this.removeFromList(node);
    this.addToFront(node);
  }

  /**
   * Add node to front of list
   */
  private addToFront(node: CacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from list
   */
  private removeFromList(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Remove least recently used item
   */
  private removeLeastRecentlyUsed(): void {
    if (!this.tail) return;

    this.cache.delete(this.tail.key);
    this.removeFromList(this.tail);
    this.log('Cache EVICT', this.tail.key, 'LRU');
  }

  /**
   * Debug logging
   */
  private log(message: string, key?: K, extra?: string): void {
    if (!this.debug) return;
    const keyStr = key !== undefined ? ` [${String(key)}]` : '';
    const extraStr = extra ? ` - ${extra}` : '';
    console.log(`[LRUCache]${keyStr} ${message}${extraStr}`);
  }
}

/**
 * Create a new LRU cache instance
 */
export function createLRUCache<K, V>(options?: CacheOptions): LRUCache<K, V> {
  return new LRUCache<K, V>(options);
}

