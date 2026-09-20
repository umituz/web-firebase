import { describe, it, expect } from 'vitest'
import { AuthError, AuthErrorCode, createAuthError } from '../src/domains/auth/errors/auth.errors'
import {
  RepositoryError,
  RepositoryErrorCode,
  createRepositoryError,
  BatchFailedError,
  BatchTooLargeError,
  FirestoreNotInitializedError,
  TransactionFailedError,
} from '../src/domains/firestore/errors/repository.errors'
import {
  FirestoreError,
  FirestoreErrorCode,
  isFirestoreError,
  isRetryableError,
  createFirestoreError,
} from '../src/domains/firestore/errors/firestore-error.domain'

describe('AuthError', () => {
  it('carries code and original error', () => {
    const cause = new Error('firebase exploded')
    const error = createAuthError(AuthErrorCode.INVALID_CREDENTIALS, undefined, cause)

    expect(error).toBeInstanceOf(AuthError)
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe(AuthErrorCode.INVALID_CREDENTIALS)
    expect(error.originalError).toBe(cause)
    expect(error.name).toBe('AuthError')
    expect(error.message).toBe('Invalid credentials') // default message
  })

  it('uses the provided message when given', () => {
    const error = createAuthError(AuthErrorCode.UNKNOWN, 'custom message')
    expect(error.message).toBe('custom message')
  })
})

describe('RepositoryError family', () => {
  it('createRepositoryError applies default messages per code', () => {
    const error = createRepositoryError(RepositoryErrorCode.PERMISSION_DENIED)
    expect(error.code).toBe(RepositoryErrorCode.PERMISSION_DENIED)
    expect(error.message).toBe('Permission denied')
    expect(error.name).toBe('RepositoryError')
  })

  it('specialized constructors format their messages', () => {
    expect(new BatchTooLargeError(600, 500).message).toContain('600')
    expect(new BatchFailedError(12).code).toBe(RepositoryErrorCode.TRANSACTION_FAILED)
    expect(new FirestoreNotInitializedError().message).toContain('initializeFirebase')
    expect(new TransactionFailedError('op:a').originalError).toBeUndefined()
  })

  it('preserves the original error for logging', () => {
    const cause = new Error('network down')
    const error = createRepositoryError(RepositoryErrorCode.NETWORK_ERROR, 'boom', cause)
    expect((error as RepositoryError).originalError).toBe(cause)
  })
})

describe('FirestoreError family', () => {
  it('identifies Firestore errors via type guard', () => {
    const error = createFirestoreError(FirestoreErrorCode.QUERY_FAILED, 'users?active==true')
    expect(isFirestoreError(error)).toBe(true)
    expect(isFirestoreError(new Error('plain'))).toBe(false)
    expect(error).toBeInstanceOf(FirestoreError)
  })

  it('classifies retryable error codes', () => {
    expect(isRetryableError(FirestoreErrorCode.FIRESTORE_UNAVAILABLE)).toBe(true)
    expect(isRetryableError(FirestoreErrorCode.NETWORK_ERROR)).toBe(true)
    expect(isRetryableError(FirestoreErrorCode.PERMISSION_DENIED)).toBe(false)
  })

  it('serializes to JSON without leaking the full original error object', () => {
    const error = createFirestoreError(
      FirestoreErrorCode.QUERY_FAILED,
      'q',
      new Error('sensitive internals')
    )
    const json = (error as FirestoreError).toJSON()
    expect(json.code).toBe(FirestoreErrorCode.QUERY_FAILED)
    expect(json.originalError).toBe('Error: sensitive internals') // stringified only
  })
})
