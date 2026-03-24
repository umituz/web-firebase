import { FirestoreRepository } from '../../infrastructure/services/firestore.repository';
import { createQueryBuilder } from '../../domain/firestore/services/query-builder.service';
import { createTransactionManager } from '../../domain/firestore/services/transaction-manager.service';
import { createRealTimeSubscriptionManager } from '../../domain/firestore/services/realtime-subscription.service';
import { createBatchOperationManager } from '../../domain/firestore/services/batch-operation.service';

/**
 * Singleton instances
 */
export const transactionManager = createTransactionManager();
export const realTimeSubscriptionManager = createRealTimeSubscriptionManager();
export const batchOperationManager = createBatchOperationManager();

export {
  FirestoreRepository,
  createQueryBuilder,
};
