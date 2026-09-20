/**
 * Performance Utilities
 * @description Debounce, throttle, and other performance optimization utilities
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed since the last call
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle function - ensures execution at most once every wait milliseconds
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Request debouncer - manages multiple debounced functions with keys
 */
export class RequestDebouncer {
  private debouncers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Debounce a function with a specific key
   */
  debounce<T extends (...args: never[]) => unknown>(
    key: string,
    func: T,
    wait: number,
    ...args: Parameters<T>
  ): void {
    const existingTimeout = this.debouncers.get(key);
    if (existingTimeout !== undefined) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      func(...args);
      this.debouncers.delete(key);
    }, wait);

    this.debouncers.set(key, timeoutId);
  }

  /**
   * Cancel a pending debounced request
   */
  cancel(key: string): boolean {
    const timeoutId = this.debouncers.get(key);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.debouncers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending debounced requests
   */
  cancelAll(): void {
    for (const [, timeoutId] of this.debouncers) {
      clearTimeout(timeoutId);
    }
    this.debouncers.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.debouncers.size;
  }
}

/**
 * Request throttler - manages multiple throttled functions with keys
 */
export class RequestThrottler {
  private lastExecutions: Map<string, number> = new Map();
  private pendingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Throttle a function with a specific key
   */
  throttle<T extends (...args: never[]) => unknown>(
    key: string,
    func: T,
    wait: number,
    ...args: Parameters<T>
  ): void {
    const now = Date.now();
    const lastExecution = this.lastExecutions.get(key) ?? 0;
    const remaining = wait - (now - lastExecution);

    if (remaining <= 0) {
      this.lastExecutions.set(key, now);
      func(...args);
    } else {
      const existingTimeout = this.pendingTimeouts.get(key);
      if (existingTimeout !== undefined) {
        return; // Already scheduled
      }

      const timeoutId = setTimeout(() => {
        this.lastExecutions.set(key, Date.now());
        this.pendingTimeouts.delete(key);
        func(...args);
      }, remaining);

      this.pendingTimeouts.set(key, timeoutId);
    }
  }

  /**
   * Cancel a pending throttled request
   */
  cancel(key: string): boolean {
    const timeoutId = this.pendingTimeouts.get(key);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.pendingTimeouts.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending throttled requests
   */
  cancelAll(): void {
    for (const [, timeoutId] of this.pendingTimeouts) {
      clearTimeout(timeoutId);
    }
    this.pendingTimeouts.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingTimeouts.size;
  }
}

/**
 * Chrome-specific heap memory info (non-standard).
 */
interface PerformanceMemoryLike {
  usedJSHeapSize: number
}

type PerformanceWithMemory = Performance & { memory?: PerformanceMemoryLike }

/**
 * Read the current JS heap usage, or null where unavailable (non-Chromium).
 */
function getUsedHeapSize(): number | null {
  if (typeof performance === 'undefined') return null
  const memory = (performance as PerformanceWithMemory).memory
  return memory ? memory.usedJSHeapSize : null
}

/**
 * Memory leak detector - helps identify potential memory leaks
 */
export class MemoryLeakDetector {
  private snapshots: Map<string, number> = new Map();
  private threshold: number;

  constructor(threshold: number = 1024 * 1024) {
    // Default threshold: 1MB
    this.threshold = threshold;
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(key: string): number {
    const used = getUsedHeapSize();
    if (used !== null) {
      this.snapshots.set(key, used);
      return used;
    }
    return 0;
  }

  /**
   * Check for memory leaks since last snapshot
   */
  checkLeak(key: string): boolean {
    const previous = this.snapshots.get(key);
    if (!previous) return false;

    const current = getUsedHeapSize();
    if (current === null) return false;

    return current - previous > this.threshold;
  }

  /**
   * Get memory difference since last snapshot
   */
  getMemoryDiff(key: string): number {
    const previous = this.snapshots.get(key);
    if (!previous) return 0;

    const current = getUsedHeapSize();
    return current === null ? 0 : current - previous;
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }
}

/**
 * Performance monitor - tracks execution time
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  constructor(private logResults: boolean = false) {}

  /**
   * Start timing a operation
   */
  start(key: string): void {
    this.marks.set(key, performance.now());
  }

  /**
   * End timing and return duration in milliseconds
   */
  end(key: string): number {
    const startTime = this.marks.get(key);
    if (!startTime) {
      console.warn(`Performance mark "${key}" not found`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.marks.delete(key);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.start(key);
    try {
      return await fn();
    } finally {
      const duration = this.end(key);
      if (this.logResults) {
        console.log(`[Performance] ${key}: ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measureSync<T>(key: string, fn: () => T): T {
    this.start(key);
    try {
      return fn();
    } finally {
      const duration = this.end(key);
      if (this.logResults) {
        console.log(`[Performance] ${key}: ${duration.toFixed(2)}ms`);
      }
    }
  }
}

/**
 * Batch processor - batches operations for better performance
 */
interface BatchQueueEntry<T> {
  item: T;
  retries: number;
}

export class BatchProcessor<T> {
  private queue: BatchQueueEntry<T>[] = [];
  private processing: boolean = false;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private batchSize: number,
    private batchDelay: number,
    private processor: (batch: T[]) => Promise<void>,
    private maxRetries: number = 3
  ) {}

  /**
   * Add item to batch queue
   */
  add(item: T): void {
    this.queue.push({ item, retries: 0 });

    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else {
      this.scheduleBatch();
    }
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimer !== null) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.processing) return;
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.queue.length === 0) return;

    this.processing = true;
    const entries = this.queue.splice(0, this.batchSize);
    const batch = entries.map((entry) => entry.item);

    try {
      await this.processor(batch);
    } catch (error) {
      const failedEntries = entries.filter((entry) => entry.retries < this.maxRetries);

      if (failedEntries.length > 0) {
        // Re-add failed items with an incremented retry budget
        this.queue.unshift(
          ...failedEntries.map((entry) => ({ item: entry.item, retries: entry.retries + 1 }))
        );
      }

      if (failedEntries.length < entries.length) {
        // Retry budget exhausted — drop those items instead of retrying forever
        console.error(
          `BatchProcessor: ${entries.length - failedEntries.length} item(s) dropped after ${this.maxRetries} retries:`,
          error
        );
      }
    } finally {
      this.processing = false;

      // Process remaining items if any
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  /**
   * Force process all remaining items
   */
  async flush(): Promise<void> {
    while (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// Global instances
export const globalDebouncer = new RequestDebouncer();
export const globalThrottler = new RequestThrottler();
export const performanceMonitor = new PerformanceMonitor();
