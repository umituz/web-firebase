/**
 * Firestore Error Domain
 * @description Domain-specific errors for Firestore operations
 * @domain Firestore
 * @layer Domain
 */

/**
 * Firestore Error Codes
 */
export enum FirestoreErrorCode {
  // Document Errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_ALREADY_EXISTS = 'DOCUMENT_ALREADY_EXISTS',
  DOCUMENT_INVALID = 'DOCUMENT_INVALID',
  DOCUMENT_CONFLICT = 'DOCUMENT_CONFLICT',

  // Collection Errors
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  COLLECTION_INVALID = 'COLLECTION_INVALID',

  // Query Errors
  QUERY_FAILED = 'QUERY_FAILED',
  QUERY_INVALID = 'QUERY_INVALID',
  QUERY_TOO_LARGE = 'QUERY_TOO_LARGE',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',

  // Transaction Errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_ABORTED = 'TRANSACTION_ABORTED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  TRANSACTION_CONFLICT = 'TRANSACTION_CONFLICT',

  // Batch Errors
  BATCH_FAILED = 'BATCH_FAILED',
  BATCH_TOO_LARGE = 'BATCH_TOO_LARGE',
  BATCH_INVALID = 'BATCH_INVALID',

  // Connection Errors
  FIRESTORE_NOT_INITIALIZED = 'FIRESTORE_NOT_INITIALIZED',
  FIRESTORE_UNAVAILABLE = 'FIRESTORE_UNAVAILABLE',
  FIRESTORE_TIMEOUT = 'FIRESTORE_TIMEOUT',

  // Permission Errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',

  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_DATA = 'INVALID_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Version Errors
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  VERSION_INVALID = 'VERSION_INVALID',

  // Subscription Errors
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Base Firestore Error
 */
export class FirestoreError extends Error {
  constructor(
    public code: FirestoreErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'FirestoreError';
    Error.captureStackTrace?.(this, FirestoreError);
  }

  toJSON() {
    const result: Record<string, string> = {
      name: this.name,
      code: this.code,
      message: this.message,
    };

    if (this.originalError) {
      result.originalError = String(this.originalError);
    }

    return result;
  }
}

/**
 * Document Not Found Error
 */
export class DocumentNotFoundError extends FirestoreError {
  constructor(documentId: string, collection: string, originalError?: unknown) {
    super(
      FirestoreErrorCode.DOCUMENT_NOT_FOUND,
      `Document '${documentId}' not found in collection '${collection}'`,
      originalError
    );
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * Document Already Exists Error
 */
export class DocumentAlreadyExistsError extends FirestoreError {
  constructor(documentId: string, collection: string, originalError?: unknown) {
    super(
      FirestoreErrorCode.DOCUMENT_ALREADY_EXISTS,
      `Document '${documentId}' already exists in collection '${collection}'`,
      originalError
    );
    this.name = 'DocumentAlreadyExistsError';
  }
}

/**
 * Query Failed Error
 */
export class QueryFailedError extends FirestoreError {
  constructor(query: string, originalError?: unknown) {
    super(
      FirestoreErrorCode.QUERY_FAILED,
      `Query failed: ${query}`,
      originalError
    );
    this.name = 'QueryFailedError';
  }
}

/**
 * Transaction Failed Error
 */
export class TransactionFailedError extends FirestoreError {
  constructor(operation: string, originalError?: unknown) {
    super(
      FirestoreErrorCode.TRANSACTION_FAILED,
      `Transaction failed for operation: ${operation}`,
      originalError
    );
    this.name = 'TransactionFailedError';
  }
}

/**
 * Transaction Conflict Error (optimistic locking)
 */
export class TransactionConflictError extends FirestoreError {
  constructor(documentId: string, currentVersion: number, expectedVersion: number) {
    super(
      FirestoreErrorCode.TRANSACTION_CONFLICT,
      `Version conflict for document '${documentId}': current version ${currentVersion}, expected ${expectedVersion}`
    );
    this.name = 'TransactionConflictError';
  }
}

/**
 * Batch Failed Error
 */
export class BatchFailedError extends FirestoreError {
  constructor(operationCount: number, originalError?: unknown) {
    super(
      FirestoreErrorCode.BATCH_FAILED,
      `Batch operation failed for ${operationCount} operations`,
      originalError
    );
    this.name = 'BatchFailedError';
  }
}

/**
 * Batch Too Large Error
 */
export class BatchTooLargeError extends FirestoreError {
  constructor(operationCount: number, maxOperations: number) {
    super(
      FirestoreErrorCode.BATCH_TOO_LARGE,
      `Batch too large: ${operationCount} operations exceeds maximum of ${maxOperations}`
    );
    this.name = 'BatchTooLargeError';
  }
}

/**
 * Permission Denied Error
 */
export class PermissionDeniedError extends FirestoreError {
  constructor(operation: string, resource: string, originalError?: unknown) {
    super(
      FirestoreErrorCode.PERMISSION_DENIED,
      `Permission denied for ${operation} on ${resource}`,
      originalError
    );
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Validation Failed Error
 */
export class ValidationError extends FirestoreError {
  constructor(field: string, reason: string) {
    super(
      FirestoreErrorCode.VALIDATION_FAILED,
      `Validation failed for field '${field}': ${reason}`
    );
    this.name = 'ValidationError';
  }
}

/**
 * Version Conflict Error
 */
export class VersionConflictError extends FirestoreError {
  constructor(documentId: string, currentVersion: number, providedVersion: number) {
    super(
      FirestoreErrorCode.VERSION_CONFLICT,
      `Version conflict for document '${documentId}': current version is ${currentVersion}, but version ${providedVersion} was provided`
    );
    this.name = 'VersionConflictError';
  }
}

/**
 * Firestore Not Initialized Error
 */
export class FirestoreNotInitializedError extends FirestoreError {
  constructor() {
    super(
      FirestoreErrorCode.FIRESTORE_NOT_INITIALIZED,
      'Firestore not initialized. Call initializeFirebase() first.'
    );
    this.name = 'FirestoreNotInitializedError';
  }
}

/**
 * Create Firestore Error Factory
 */
export function createFirestoreError(
  code: FirestoreErrorCode,
  message: string,
  originalError?: unknown
): FirestoreError {
  switch (code) {
    case FirestoreErrorCode.DOCUMENT_NOT_FOUND:
      return new DocumentNotFoundError('unknown', 'unknown', originalError);
    case FirestoreErrorCode.DOCUMENT_ALREADY_EXISTS:
      return new DocumentAlreadyExistsError('unknown', 'unknown', originalError);
    case FirestoreErrorCode.QUERY_FAILED:
      return new QueryFailedError(message, originalError);
    case FirestoreErrorCode.TRANSACTION_FAILED:
      return new TransactionFailedError(message, originalError);
    case FirestoreErrorCode.BATCH_FAILED:
      return new BatchFailedError(0, originalError);
    case FirestoreErrorCode.PERMISSION_DENIED:
      return new PermissionDeniedError('unknown', 'unknown', originalError);
    case FirestoreErrorCode.VALIDATION_FAILED:
      return new ValidationError('unknown', message);
    case FirestoreErrorCode.VERSION_CONFLICT:
      return new VersionConflictError('unknown', 0, 0);
    case FirestoreErrorCode.FIRESTORE_NOT_INITIALIZED:
      return new FirestoreNotInitializedError();
    default:
      return new FirestoreError(code, message, originalError);
  }
}

/**
 * Check if error is a Firestore error
 */
export function isFirestoreError(error: unknown): error is FirestoreError {
  return error instanceof FirestoreError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: FirestoreErrorCode): boolean {
  return [
    FirestoreErrorCode.FIRESTORE_UNAVAILABLE,
    FirestoreErrorCode.FIRESTORE_TIMEOUT,
    FirestoreErrorCode.NETWORK_ERROR,
    FirestoreErrorCode.QUERY_TIMEOUT,
    FirestoreErrorCode.TRANSACTION_TIMEOUT,
    FirestoreErrorCode.TRANSACTION_CONFLICT,
  ].includes(error);
}
