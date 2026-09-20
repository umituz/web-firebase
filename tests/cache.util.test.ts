import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache, createLRUCache } from '../src/infrastructure/utils/cache.util'

describe('LRUCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves values', () => {
    const cache = new LRUCache<string, number>()
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('missing')).toBe(false)
  })

  it('returns undefined for missing keys', () => {
    const cache = new LRUCache<string, number>()
    expect(cache.get('nope')).toBeUndefined()
  })

  it('expires values after the TTL', () => {
    const cache = new LRUCache<string, number>({ ttl: 1000 })
    cache.set('a', 1)
    vi.advanceTimersByTime(1500)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.has('a')).toBe(false)
  })

  it('honors a custom TTL per set()', () => {
    const cache = new LRUCache<string, number>({ ttl: 10_000 })
    cache.set('a', 1, 100)
    vi.advanceTimersByTime(200)
    expect(cache.get('a')).toBeUndefined()
  })

  it('evicts the least recently used item when full', () => {
    const cache = new LRUCache<string, number>({ maxSize: 2 })
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // touch 'a' so 'b' becomes LRU
    cache.set('c', 3)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
    expect(cache.size()).toBe(2)
  })

  it('remove() deletes a single entry', () => {
    const cache = new LRUCache<string, number>()
    cache.set('a', 1)
    expect(cache.remove('a')).toBe(true)
    expect(cache.remove('a')).toBe(false)
    expect(cache.get('a')).toBeUndefined()
  })

  it('clear() empties the cache', () => {
    const cache = new LRUCache<string, number>()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.size()).toBe(0)
    expect(cache.keys()).toEqual([])
  })

  it('does not start a cleanup interval on construction (timer leak guard)', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const cache = new LRUCache<string, number>()
    expect(setIntervalSpy).not.toHaveBeenCalled()

    cache.set('a', 1)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    // Second set must not start a second interval
    cache.set('b', 2)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    cache.dispose()
    setIntervalSpy.mockRestore()
  })

  it('dispose() stops the cleanup interval', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const cache = new LRUCache<string, number>()
    cache.set('a', 1)
    cache.dispose()
    expect(clearIntervalSpy).toHaveBeenCalled()
    expect(cache.size()).toBe(0)
    clearIntervalSpy.mockRestore()
  })

  it('createLRUCache returns a configured instance', () => {
    const cache = createLRUCache<string, string>({ maxSize: 5, ttl: 1000 })
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
  })
})
