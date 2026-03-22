/**
 * Timestamp Value Objects
 * @description Value objects for handling timestamps in Firestore
 */

import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'

/**
 * Firebase Timestamp wrapper
 * Provides type safety and utility methods for timestamp handling
 */
export class Timestamp {
  constructor(
    public readonly seconds: number,
    public readonly nanoseconds: number
  ) {}

  /**
   * Create Timestamp from JavaScript Date
   */
  static fromDate(date: Date): Timestamp {
    const milliseconds = date.getTime()
    const seconds = Math.floor(milliseconds / 1000)
    const nanoseconds = (milliseconds % 1000) * 1_000_000
    return new Timestamp(seconds, nanoseconds)
  }

  /**
   * Create Timestamp from milliseconds
   */
  static fromMillis(milliseconds: number): Timestamp {
    const seconds = Math.floor(milliseconds / 1000)
    const nanoseconds = (milliseconds % 1000) * 1_000_000
    return new Timestamp(seconds, nanoseconds)
  }

  /**
   * Create Timestamp from Firestore Timestamp
   */
  static fromFirestoreTimestamp(timestamp: FirestoreTimestamp): Timestamp {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds)
  }

  /**
   * Get current timestamp
   */
  static now(): Timestamp {
    return Timestamp.fromDate(new Date())
  }

  /**
   * Convert to JavaScript Date
   */
  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1_000_000)
  }

  /**
   * Convert to milliseconds
   */
  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1_000_000
  }

  /**
   * Convert to Firestore Timestamp
   */
  toFirestoreTimestamp(): FirestoreTimestamp {
    return {
      seconds: this.seconds,
      nanoseconds: this.nanoseconds,
    } as FirestoreTimestamp
  }

  /**
   * Convert to ISO string
   */
  toISOString(): string {
    return this.toDate().toISOString()
  }

  /**
   * Check if timestamp is in the past
   */
  isPast(): boolean {
    return this.toMillis() < Date.now()
  }

  /**
   * Check if timestamp is in the future
   */
  isFuture(): boolean {
    return this.toMillis() > Date.now()
  }

  /**
   * Get difference in milliseconds with another timestamp
   */
  diff(other: Timestamp): number {
    return this.toMillis() - other.toMillis()
  }
}

/**
 * Server timestamp sentinel for Firestore
 */
export const serverTimestamp = {
  __type__: 'serverTimestamp',
} as const

export type ServerTimestamp = typeof serverTimestamp

/**
 * Timestamp field that can be a Timestamp, server timestamp, or ISO string
 */
export type TimestampField = Timestamp | ServerTimestamp | string
