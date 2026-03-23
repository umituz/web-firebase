/**
 * Firestore Domain Services
 * Subpath: @umituz/web-firebase/firestore
 */

// Core services
export { firestoreService } from './firestore.service'
export type { IFirestoreService } from '../types'

// Query Builder
export {
  QueryBuilder,
  createQueryBuilder,
  buildQueryConstraints,
} from './query-builder.service'

// Transaction Manager
export {
  TransactionManager,
  transactionManager,
  createTransactionManager,
} from './transaction-manager.service'

// Batch Operations
export {
  BatchOperationManager,
  batchOperationManager,
  createBatchOperationManager,
} from './batch-operation.service'

// Real-time Subscriptions
export {
  RealTimeSubscriptionManager,
  realTimeSubscriptionManager,
  createRealTimeSubscriptionManager,
} from './realtime-subscription.service'

// Re-export types from their respective files
export type {
  OrderDirection,
  QueryOperator,
  QueryCondition,
  QuerySort,
  QueryCursor,
  QueryOptions,
} from './query-builder.service'

export type {
  TransactionOperationType,
  TransactionOperation,
  TransactionOptions,
  TransactionResult,
} from './transaction-manager.service'

export type {
  BatchOperationType,
  BatchOperation,
  BatchOptions,
  BatchResult,
} from './batch-operation.service'

export type {
  DocumentSnapshotCallback,
  QuerySnapshotCallback,
  SubscriptionOptions,
} from './realtime-subscription.service'

// ErrorCallback type
export type ErrorCallback = (error: Error) => void
