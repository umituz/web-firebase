/**
 * Firestore Adapter
 * @description Firebase Firestore implementation of IUserRepository
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/services/firestore.ts
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  collection,
  getDocs,
} from 'firebase/firestore'
import { getFirebaseDB } from './client'
import type { IUserRepository } from '../../domain/interfaces/user.repository.interface'
import type { User } from '../../domain/entities/user.entity'
import { createRepositoryError, RepositoryErrorCode } from '../../domain/errors/repository.errors'

export class FirestoreAdapter implements IUserRepository {
  private get db() {
    const db = getFirebaseDB()
    if (!db) {
      throw new Error('Firestore not initialized. Call initializeFirebase() first.')
    }
    return db
  }

  private readonly USERS_COLLECTION = 'users'

  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      const snap = await getDoc(docRef)

      if (!snap.exists()) {
        return null
      }

      return snap.data() as User
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'User not found', error)
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(this.db, this.USERS_COLLECTION), where('profile.email', '==', email))
      const snap = await getDocs(q)

      if (snap.empty) {
        return null
      }

      const doc = snap.docs[0]
      return doc.data() as User
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.QUERY_FAILED, 'Failed to query user', error)
    }
  }

  async createUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await setDoc(docRef, data, { merge: true })
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_INVALID, 'Failed to create user', error)
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        ...data,
        'profile.updatedAt': Date.now(),
      } as Partial<User> & { 'profile.updatedAt': number })
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to update user', error)
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await deleteDoc(docRef)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to delete user', error)
    }
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL' | 'phoneNumber'>>
  ): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      const updateData: Record<string, string | number> = {
        'profile.updatedAt': Date.now(),
      }

      if (updates.displayName !== undefined) {
        updateData['profile.displayName'] = updates.displayName
      }
      if (updates.photoURL !== undefined) {
        updateData['profile.photoURL'] = updates.photoURL
      }
      if (updates.phoneNumber !== undefined) {
        updateData['profile.phoneNumber'] = updates.phoneNumber
      }

      await updateDoc(docRef, updateData)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to update profile', error)
    }
  }

  async updateSettings(userId: string, settings: Partial<User['settings']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        settings: {
          ...settings,
          updatedAt: Date.now(),
        } as Partial<User['settings']> & { updatedAt: number },
      })
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to update settings', error)
    }
  }

  async updateSubscription(userId: string, subscription: Partial<User['subscription']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        subscription: {
          ...subscription,
          updatedAt: Date.now(),
        } as Partial<User['subscription']> & { updatedAt: number },
      })
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to update subscription', error)
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        'profile.lastLoginAt': Date.now(),
      } as { 'profile.lastLoginAt': number })
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.DOCUMENT_NOT_FOUND, 'Failed to update last login', error)
    }
  }

  async queryUsers(constraints: import('firebase/firestore').QueryConstraint[]): Promise<User[]> {
    try {
      const q = query(collection(this.db, this.USERS_COLLECTION), ...constraints)
      const snap = await getDocs(q)
      return snap.docs.map((doc) => doc.data() as User)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.QUERY_FAILED, 'Failed to query users', error)
    }
  }

  subscribeToUser(
    userId: string,
    callback: (user: User | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const docRef = doc(this.db, this.USERS_COLLECTION, userId)

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as User)
        } else {
          callback(null)
        }
      },
      (error) => {
        onError?.(error as Error)
      }
    )

    return unsubscribe
  }
}
