/**
 * @umituz/web-firebase
 * Firebase client initialization and core services
 *
 * Usage:
 * import { initializeFirebase, getFirebaseDB, FirestoreRepository } from '@umituz/web-firebase'
 * import { where, orderBy, limit } from '@umituz/web-firebase'
 */

// Firebase client initialization
export * from './infrastructure/firebase/client'

// Infrastructure layer
export * from './infrastructure'

// Re-export commonly used Firestore functions for convenience
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  startAt,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  getFirestore,
  serverTimestamp,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  clearIndexedDbPersistence,
  type Firestore,
  type FirestoreDataConverter,
  type QueryConstraint,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
  type CollectionReference,
  type DocumentReference,
  type Query,
  type SnapshotOptions,
  type Unsubscribe,
  type SetOptions,
  type UpdateData,
  type WithFieldValue,
} from 'firebase/firestore'
