/**
 * Auth Hook
 * @description React hook for authentication operations
 * Uses FirebaseProvider context - no repository injection needed
 */

import { useCallback } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '../../domain/entities/user.entity'
import { AuthAdapter } from '../../infrastructure/firebase/auth.adapter'
import { FirestoreAdapter } from '../../infrastructure/firebase/firestore.adapter'
import { useFirebaseContext } from '../providers/FirebaseProvider'

export interface UseAuthResult {
  firebaseUser: FirebaseUser | null
  user: User | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  isEmailVerified: boolean
  signIn: (email: string, password: string) => Promise<FirebaseUser>
  signUp: (email: string, password: string, displayName: string) => Promise<FirebaseUser>
  signInWithGoogle: () => Promise<FirebaseUser>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resendEmailVerification: () => Promise<void>
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const { instances, user, loading, error } = useFirebaseContext()

  const authAdapter = new AuthAdapter()
  const firestoreAdapter = new FirestoreAdapter()

  const signIn = useCallback(async (email: string, password: string) => {
    return await authAdapter.signIn(email, password)
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const userCredential = await authAdapter.signUp(email, password, displayName)

    // Create user profile in Firestore
    await firestoreAdapter.createUser(userCredential.user.uid, {
      profile: {
        email: email,
        displayName: displayName,
        createdAt: Date.now(),
      },
      settings: {
        theme: 'light',
        language: 'tr',
      },
    })

    return userCredential.user
  }, [])

  const signInWithGoogle = useCallback(async () => {
    return await authAdapter.signInWithGoogle()
  }, [])

  const signOut = useCallback(async () => {
    await authAdapter.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    await authAdapter.sendPasswordReset(email)
  }, [])

  const resendEmailVerification = useCallback(async () => {
    await authAdapter.resendEmailVerification()
  }, [])

  const updateProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    await authAdapter.updateProfile(updates)

    // Refresh user data from Firestore if available
    if (instances?.auth.currentUser) {
      await firestoreAdapter.getUser(instances.auth.currentUser.uid)
    }
  }, [instances])

  const refreshUser = useCallback(async () => {
    if (instances?.auth.currentUser) {
      await firestoreAdapter.getUser(instances.auth.currentUser.uid)
    }
  }, [instances])

  return {
    firebaseUser: instances?.auth.currentUser || null,
    user,
    loading,
    error,
    isAuthenticated: !!instances?.auth.currentUser,
    isEmailVerified: instances?.auth.currentUser?.emailVerified || false,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    resendEmailVerification,
    updateProfile,
    refreshUser,
  }
}

