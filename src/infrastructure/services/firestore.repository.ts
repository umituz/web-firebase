import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  type QueryConstraint,
  type DocumentData,
  type Firestore,
  type CollectionReference,
} from 'firebase/firestore';
import type { IBaseRepository } from '../../domain/interfaces/repository.interface';

/**
 * Firestore Repository Implementation
 * @description Generic CRUD operations for Firestore collections
 */
export class FirestoreRepository<T extends DocumentData> implements IBaseRepository<T> {
  constructor(
    protected db: Firestore,
    protected collectionName: string,
  ) {}

  protected getCollection(parentPath?: string): CollectionReference<T> {
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    return collection(this.db, fullPath) as CollectionReference<T>;
  }

  protected getDocRef(id: string, parentPath?: string) {
    const fullPath = parentPath ? `${parentPath}/${this.collectionName}` : this.collectionName;
    return doc(this.db, fullPath, id);
  }

  async getById(id: string, parentPath?: string): Promise<T | null> {
    const snap = await getDoc(this.getDocRef(id, parentPath));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as T) : null;
  }

  async getAll(constraints: QueryConstraint[] = [], parentPath?: string): Promise<T[]> {
    const q = query(this.getCollection(parentPath), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  }

  async create(id: string, data: Omit<T, 'id'>, parentPath?: string): Promise<void> {
    await setDoc(this.getDocRef(id, parentPath), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async update(id: string, data: Partial<T>, parentPath?: string): Promise<void> {
    await updateDoc(this.getDocRef(id, parentPath), {
      ...(data as DocumentData),
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string, parentPath?: string): Promise<void> {
    await deleteDoc(this.getDocRef(id, parentPath));
  }
}
