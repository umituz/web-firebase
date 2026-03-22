/**
 * Base Repository Interface
 */

export interface IBaseRepository<T> {
  getById(id: string, parentPath?: string): Promise<T | null>;
  getAll(constraints?: import('firebase/firestore').QueryConstraint[], parentPath?: string): Promise<T[]>;
  create(id: string, data: Omit<T, 'id'>, parentPath?: string): Promise<void>;
  update(id: string, data: Partial<T>, parentPath?: string): Promise<void>;
  delete(id: string, parentPath?: string): Promise<void>;
}
