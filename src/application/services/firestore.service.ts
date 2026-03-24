import { FirestoreRepository } from '../../infrastructure/services/firestore.repository';
import { createQueryBuilder } from '../../domains/firestore/services/query-builder.service';
import { createTransactionManager } from '../../domains/firestore/services/transaction-manager.service';
import { createRealTimeSubscriptionManager } from '../../domains/firestore/services/realtime-subscription.service';
import { createBatchOperationManager } from '../../domains/firestore/services/batch-operation.service';

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
