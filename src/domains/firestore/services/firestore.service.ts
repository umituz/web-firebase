/**
 * Firestore Service
 * @description Firebase Firestore implementation of IFirestoreService
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
import { getFirebaseDB } from '../../../infrastructure/firebase/client'
import type { IFirestoreService } from '../types'
import type { User } from '../entities'

class FirestoreService implements IFirestoreService {
  private get db() {
    return getFirebaseDB()
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
      throw new Error('User not found')
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
      throw new Error('Failed to query user')
    }
  }

  async createUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await setDoc(docRef, data, { merge: true })
    } catch (error) {
      throw new Error('Failed to create user')
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        ...data,
        'profile.updatedAt': Date.now(),
      } as any)
    } catch (error) {
      throw new Error('Failed to update user')
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await deleteDoc(docRef)
    } catch (error) {
      throw new Error('Failed to delete user')
    }
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User['profile'], 'displayName' | 'photoURL' | 'phoneNumber'>>
  ): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      const updateData: any = {
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
      throw new Error('Failed to update profile')
    }
  }

  async updateSettings(userId: string, settings: Partial<User['settings']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        settings: {
          ...settings,
          updatedAt: Date.now(),
        },
      } as any)
    } catch (error) {
      throw new Error('Failed to update settings')
    }
  }

  async updateSubscription(userId: string, subscription: Partial<User['subscription']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        subscription: {
          ...subscription,
          updatedAt: Date.now(),
        },
      } as any)
    } catch (error) {
      throw new Error('Failed to update subscription')
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        'profile.lastLoginAt': Date.now(),
      } as any)
    } catch (error) {
      throw new Error('Failed to update last login')
    }
  }

  async queryUsers(constraints: any[]): Promise<User[]> {
    try {
      const q = query(collection(this.db, this.USERS_COLLECTION), ...constraints)
      const snap = await getDocs(q)
      return snap.docs.map((doc) => doc.data() as User)
    } catch (error) {
      throw new Error('Failed to query users')
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

// Export class and singleton instance
export const firestoreService = new FirestoreService()
