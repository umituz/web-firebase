/**
 * UserId Value Object
 * @description Immutable user ID value object with validation
 */

import { createRepositoryError, RepositoryErrorCode } from '../errors/repository.errors'

export class UserId {
  private readonly value: string

  constructor(id: string) {
    this.value = id
    this.validate()
  }

  /**
   * Validate user ID
   */
  private validate(): void {
    if (!this.value) {
      throw createRepositoryError(RepositoryErrorCode.INVALID_DATA, 'User ID cannot be empty')
    }

    // Temporary IDs are exempt from length validation
    if (this.isTemporary()) {
      // Validate temporary ID format
      const tempPattern = /^temp_[0-9]+_[a-z0-9]+$/
      if (!tempPattern.test(this.value)) {
        throw createRepositoryError(
          RepositoryErrorCode.INVALID_DATA,
          'Invalid temporary ID format'
        )
      }
      return
    }

    // Firebase Auth UIDs are typically 28 characters but can vary
    if (this.value.length < 20) {
      throw createRepositoryError(
        RepositoryErrorCode.INVALID_DATA,
        'User ID is too short (must be at least 20 characters for Firebase UIDs)'
      )
    }

    // Firebase UIDs contain only alphanumeric characters and certain special characters
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(this.value)) {
      throw createRepositoryError(
        RepositoryErrorCode.INVALID_DATA,
        'User ID contains invalid characters'
      )
    }
  }

  /**
   * Get user ID value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Check if this is a temporary ID (not yet persisted)
   */
  isTemporary(): boolean {
    return this.value.startsWith('temp_')
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value
  }

  /**
   * Check equality with another user ID
   */
  equals(other: UserId): boolean {
    return this.value === other.value
  }

  /**
   * Generate a temporary user ID
   */
  static generateTemp(): UserId {
    return new UserId(`temp_${Date.now()}_${Math.random().toString(36).substring(7)}`)
  }

  /**
   * Create UserId from string (returns null if invalid)
   */
  static create(id: string): UserId | null {
    try {
      return new UserId(id)
    } catch {
      return null
    }
  }
}
