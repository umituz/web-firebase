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

      return { id: snap.id, ...snap.data() } as User
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
      return { id: doc.id, ...doc.data() } as User
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
      } as Partial<User> & { 'profile.updatedAt': number })
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
      throw new Error('Failed to update profile')
    }
  }

  async updateSettings(userId: string, settings: Partial<User['settings']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)

      // Build update object with proper deep merge paths
      const updateData: Record<string, unknown> = {}

      // Update theme
      if (settings.theme !== undefined) {
        updateData['settings.theme'] = settings.theme
      }

      // Update language
      if (settings.language !== undefined) {
        updateData['settings.language'] = settings.language
      }

      // Update timezone
      if (settings.timezone !== undefined) {
        updateData['settings.timezone'] = settings.timezone
      }

      // Update currency
      if (settings.currency !== undefined) {
        updateData['settings.currency'] = settings.currency
      }

      // Update notifications (merge)
      if (settings.notifications !== undefined) {
        Object.entries(settings.notifications).forEach(([key, value]) => {
          updateData[`settings.notifications.${key}`] = value
        })
      }

      // Update privacy (merge)
      if (settings.privacy !== undefined) {
        Object.entries(settings.privacy).forEach(([key, value]) => {
          updateData[`settings.privacy.${key}`] = value
        })
      }

      await updateDoc(docRef, updateData)
    } catch (error) {
      throw new Error('Failed to update settings')
    }
  }

  async updateSubscription(userId: string, subscription: Partial<User['subscription']>): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)

      // Build update object with proper deep merge paths
      const updateData: Record<string, unknown> = {}

      // Update plan
      if (subscription.plan !== undefined) {
        updateData['subscription.plan'] = subscription.plan
      }

      // Update status
      if (subscription.status !== undefined) {
        updateData['subscription.status'] = subscription.status
      }

      // Update polarCustomerId
      if (subscription.polarCustomerId !== undefined) {
        updateData['subscription.polarCustomerId'] = subscription.polarCustomerId
      }

      // Update polarSubscriptionId
      if (subscription.polarSubscriptionId !== undefined) {
        updateData['subscription.polarSubscriptionId'] = subscription.polarSubscriptionId
      }

      // Update currentPeriodStart
      if (subscription.currentPeriodStart !== undefined) {
        updateData['subscription.currentPeriodStart'] = subscription.currentPeriodStart
      }

      // Update currentPeriodEnd
      if (subscription.currentPeriodEnd !== undefined) {
        updateData['subscription.currentPeriodEnd'] = subscription.currentPeriodEnd
      }

      // Update cancelAtPeriodEnd
      if (subscription.cancelAtPeriodEnd !== undefined) {
        updateData['subscription.cancelAtPeriodEnd'] = subscription.cancelAtPeriodEnd
      }

      updateData['subscription.updatedAt'] = Date.now()

      await updateDoc(docRef, updateData)
    } catch (error) {
      throw new Error('Failed to update subscription')
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.USERS_COLLECTION, userId)
      await updateDoc(docRef, {
        'profile.lastLoginAt': Date.now(),
      } as { 'profile.lastLoginAt': number })
    } catch (error) {
      throw new Error('Failed to update last login')
    }
  }

  async queryUsers(constraints: import('firebase/firestore').QueryConstraint[]): Promise<User[]> {
    try {
      const q = query(collection(this.db, this.USERS_COLLECTION), ...constraints)
      const snap = await getDocs(q)
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User))
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
          callback({ id: snap.id, ...snap.data() } as User)
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
