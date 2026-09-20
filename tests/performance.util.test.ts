import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  debounce,
  throttle,
  RequestDebouncer,
  RequestThrottler,
  BatchProcessor,
  PerformanceMonitor,
} from '../src/infrastructure/utils/performance.util'

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('delays execution until the wait elapses', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments through', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced('a', 1)
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledWith('a', 1)
  })
})

describe('throttle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('executes immediately and schedules a trailing call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled(1)
    throttled(2)
    throttled(3)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)

    vi.advanceTimersByTime(100)
    // trailing invocation fires once after the window
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('RequestDebouncer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces per key independently', () => {
    const debouncer = new RequestDebouncer()
    const fnA = vi.fn()
    const fnB = vi.fn()

    debouncer.debounce('a', fnA, 100, 'x')
    debouncer.debounce('a', fnA, 100, 'y')
    debouncer.debounce('b', fnB, 100)

    vi.advanceTimersByTime(100)
    expect(fnA).toHaveBeenCalledTimes(1)
    expect(fnA).toHaveBeenCalledWith('y')
    expect(fnB).toHaveBeenCalledTimes(1)
    expect(debouncer.getPendingCount()).toBe(0)
  })

  it('cancel() prevents execution', () => {
    const debouncer = new RequestDebouncer()
    const fn = vi.fn()
    debouncer.debounce('a', fn, 100)
    expect(debouncer.cancel('a')).toBe(true)
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
    expect(debouncer.cancel('a')).toBe(false)
  })
})

describe('RequestThrottler', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('throttles repeated calls for the same key', () => {
    const throttler = new RequestThrottler()
    const fn = vi.fn()

    throttler.throttle('key', fn, 100)
    throttler.throttle('key', fn, 100)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(150)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('BatchProcessor', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('batches items up to batchSize', async () => {
    const processor = vi.fn().mockResolvedValue(undefined)
    const bp = new BatchProcessor<number>(2, 10, processor)

    bp.add(1)
    expect(processor).not.toHaveBeenCalled() // waits for batch or delay

    bp.add(2)
    await vi.advanceTimersByTimeAsync(0)
    expect(processor).toHaveBeenCalledTimes(1)
    expect(processor).toHaveBeenCalledWith([1, 2])
  })

  it('flush() processes everything queued', async () => {
    const processor = vi.fn().mockResolvedValue(undefined)
    const bp = new BatchProcessor<number>(10, 10_000, processor)

    bp.add(1)
    bp.add(2)
    bp.add(3)
    await bp.flush()
    expect(processor).toHaveBeenCalledWith([1, 2, 3])
    expect(bp.getQueueSize()).toBe(0)
  })

  it('stops retrying a failing batch after maxRetries (no infinite retry loop)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const processor = vi.fn().mockRejectedValue(new Error('persistent failure'))
    const bp = new BatchProcessor<number>(2, 5, processor, 2)

    bp.add(1)
    bp.add(2)

    // maxRetries=2 → initial attempt + 2 retries, then dropped
    await vi.advanceTimersByTimeAsync(5)
    await vi.advanceTimersByTimeAsync(5)
    await vi.advanceTimersByTimeAsync(5)

    expect(processor).toHaveBeenCalledTimes(3)
    expect(bp.getQueueSize()).toBe(0) // dropped, not requeued forever
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('PerformanceMonitor', () => {
  it('measures async functions and stays silent by default', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const monitor = new PerformanceMonitor()

    const result = await monitor.measure('op', async () => 42)
    expect(result).toBe(42)
    expect(logSpy).not.toHaveBeenCalled()

    logSpy.mockRestore()
  })

  it('logs results when logResults is enabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const monitor = new PerformanceMonitor(true)

    await monitor.measure('op', async () => 1)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[Performance] op'))

    logSpy.mockRestore()
  })

  it('end() without start() warns and returns 0', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const monitor = new PerformanceMonitor()
    expect(monitor.end('never-started')).toBe(0)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
