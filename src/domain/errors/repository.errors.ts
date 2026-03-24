/**
 * Domain Errors for Repository Operations
 * @description Custom error types for repository-related failures
 */

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code: RepositoryErrorCode,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class BatchFailedError extends RepositoryError {
  constructor(operationCount: number, originalError?: unknown) {
    super(`Batch operation failed for ${operationCount} operations`, RepositoryErrorCode.TRANSACTION_FAILED, originalError)
  }
}

export class BatchTooLargeError extends RepositoryError {
  constructor(operationCount: number, maxSize: number) {
    super(`Batch is too large: ${operationCount} operations exceeds maximum of ${maxSize}`, RepositoryErrorCode.TRANSACTION_FAILED)
  }
}

export class FirestoreNotInitializedError extends RepositoryError {
  constructor(originalError?: unknown) {
    super('Firestore is not initialized. Call initializeFirebase() first.', RepositoryErrorCode.UNKNOWN, originalError)
  }
}

export class TransactionFailedError extends RepositoryError {
  constructor(operation: string, originalError?: unknown) {
    super(`Transaction failed for operation: ${operation}`, RepositoryErrorCode.TRANSACTION_FAILED, originalError)
  }
}

export class TransactionConflictError extends RepositoryError {
  constructor(documentId: string, currentVersion: number, providedVersion: number) {
    super(`Version conflict for document ${documentId}: current=${currentVersion}, provided=${providedVersion}`, RepositoryErrorCode.VERSION_MISMATCH)
  }
}

export enum RepositoryErrorCode {
  // Document Errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_ALREADY_EXISTS = 'DOCUMENT_ALREADY_EXISTS',
  DOCUMENT_INVALID = 'DOCUMENT_INVALID',

  // Collection Errors
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  COLLECTION_INVALID = 'COLLECTION_INVALID',

  // Query Errors
  QUERY_INVALID = 'QUERY_INVALID',
  QUERY_FAILED = 'QUERY_FAILED',

  // Transaction Errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_ABORTED = 'TRANSACTION_ABORTED',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',

  // Permission Errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_DATA = 'INVALID_DATA',

  // Concurrency Errors
  CONFLICT = 'CONFLICT',
  VERSION_MISMATCH = 'VERSION_MISMATCH',

  // Storage Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Unknown Error
  UNKNOWN = 'UNKNOWN',
}

export function createRepositoryError(
  code: RepositoryErrorCode,
  message?: string,
  originalError?: unknown
): RepositoryError {
  const defaultMessage = getRepositoryErrorMessage(code)
  return new RepositoryError(message || defaultMessage, code, originalError)
}

function getRepositoryErrorMessage(code: RepositoryErrorCode): string {
  switch (code) {
    case RepositoryErrorCode.DOCUMENT_NOT_FOUND:
      return 'Document not found'
    case RepositoryErrorCode.DOCUMENT_ALREADY_EXISTS:
      return 'Document already exists'
    case RepositoryErrorCode.DOCUMENT_INVALID:
      return 'Document is invalid'
    case RepositoryErrorCode.COLLECTION_NOT_FOUND:
      return 'Collection not found'
    case RepositoryErrorCode.COLLECTION_INVALID:
      return 'Collection is invalid'
    case RepositoryErrorCode.QUERY_INVALID:
      return 'Query is invalid'
    case RepositoryErrorCode.QUERY_FAILED:
      return 'Query failed'
    case RepositoryErrorCode.TRANSACTION_FAILED:
      return 'Transaction failed'
    case RepositoryErrorCode.TRANSACTION_ABORTED:
      return 'Transaction aborted'
    case RepositoryErrorCode.NETWORK_ERROR:
      return 'Network error'
    case RepositoryErrorCode.TIMEOUT:
      return 'Request timeout'
    case RepositoryErrorCode.OFFLINE:
      return 'Client is offline'
    case RepositoryErrorCode.PERMISSION_DENIED:
      return 'Permission denied'
    case RepositoryErrorCode.UNAUTHORIZED:
      return 'Unauthorized'
    case RepositoryErrorCode.VALIDATION_FAILED:
      return 'Validation failed'
    case RepositoryErrorCode.INVALID_DATA:
      return 'Invalid data'
    case RepositoryErrorCode.CONFLICT:
      return 'Conflict occurred'
    case RepositoryErrorCode.VERSION_MISMATCH:
      return 'Version mismatch'
    case RepositoryErrorCode.STORAGE_ERROR:
      return 'Storage error'
    case RepositoryErrorCode.FILE_NOT_FOUND:
      return 'File not found'
    case RepositoryErrorCode.FILE_TOO_LARGE:
      return 'File is too large'
    case RepositoryErrorCode.INVALID_FILE_TYPE:
      return 'Invalid file type'
    case RepositoryErrorCode.UNKNOWN:
    default:
      return 'An unknown error occurred'
  }
}
