/**
 * FilePath Value Object
 * @description Immutable file path value object with validation for Firebase Storage paths
 */

import { createRepositoryError, RepositoryErrorCode } from '../errors/repository.errors'

export class FilePath {
  private readonly value: string
  private readonly parts: string[]

  constructor(path: string) {
    this.value = path.trim()
    this.parts = this.value.split('/').filter(p => p.length > 0)
    this.validate()
  }

  /**
   * Validate file path
   */
  private validate(): void {
    if (!this.value) {
      throw createRepositoryError(RepositoryErrorCode.INVALID_DATA, 'File path cannot be empty')
    }

    // Path should not start or end with /
    if (this.value.startsWith('/') || this.value.endsWith('/')) {
      throw createRepositoryError(
        RepositoryErrorCode.INVALID_DATA,
        'File path should not start or end with /'
      )
    }

    // Path should not contain //
    if (this.value.includes('//')) {
      throw createRepositoryError(RepositoryErrorCode.INVALID_DATA, 'File path should not contain //')
    }

    // Path segments should not be empty
    if (this.parts.length === 0) {
      throw createRepositoryError(RepositoryErrorCode.INVALID_DATA, 'File path must have at least one segment')
    }

    // Validate each segment
    for (const part of this.parts) {
      // Segments should not contain invalid characters
      if (/[<>:"|?*]/.test(part)) {
        throw createRepositoryError(
          RepositoryErrorCode.INVALID_DATA,
          `Invalid characters in path segment: ${part}`
        )
      }

      // Segments should not be . or ..
      if (part === '.' || part === '..') {
        throw createRepositoryError(
          RepositoryErrorCode.INVALID_DATA,
          `Invalid path segment: ${part}`
        )
      }
    }
  }

  /**
   * Get file path value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Get path parts
   */
  getParts(): string[] {
    return [...this.parts]
  }

  /**
   * Get filename (last part of path)
   */
  getFileName(): string {
    return this.parts[this.parts.length - 1] || ''
  }

  /**
   * Get directory path (all parts except last)
   */
  getDirectory(): string {
    return this.parts.slice(0, -1).join('/')
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    const fileName = this.getFileName()
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(lastDot + 1) : ''
  }

  /**
   * Get file name without extension
   */
  getFileNameWithoutExtension(): string {
    const fileName = this.getFileName()
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  }

  /**
   * Check if path is in a specific directory
   */
  isInDirectory(directory: string): boolean {
    return this.value.startsWith(directory + '/')
  }

  /**
   * Check if file has a specific extension
   */
  hasExtension(extension: string): boolean {
    return this.getExtension().toLowerCase() === extension.toLowerCase()
  }

  /**
   * Create a new path by appending segments
   */
  append(...segments: string[]): FilePath {
    return new FilePath([...this.parts, ...segments].join('/'))
  }

  /**
   * Create a new path in a parent directory
   */
  withParent(parent: string): FilePath {
    return new FilePath([parent, ...this.parts].join('/'))
  }

  /**
   * Create a new path with a different filename
   */
  withFileName(fileName: string): FilePath {
    const dir = this.getDirectory()
    return dir ? new FilePath(`${dir}/${fileName}`) : new FilePath(fileName)
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value
  }

  /**
   * Check equality with another file path
   */
  equals(other: FilePath): boolean {
    return this.value === other.value
  }

  /**
   * Create user path (users/{userId}/...)
   */
  static userPath(userId: string, ...segments: string[]): FilePath {
    return new FilePath(['users', userId, ...segments].join('/'))
  }

  /**
   * Create public path (public/...)
   */
  static publicPath(...segments: string[]): FilePath {
    return new FilePath(['public', ...segments].join('/'))
  }

  /**
   * Create FilePath from string (returns null if invalid)
   */
  static create(path: string): FilePath | null {
    try {
      return new FilePath(path)
    } catch {
      return null
    }
  }
}
