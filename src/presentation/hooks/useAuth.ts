/**
 * Auth Hook
 * @description React hook for authentication operations
 * Uses new domain services - no adapter injection needed
 */

import { useCallback, useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User as FirestoreUser } from '../../domains/firestore/entities'
import { authService } from '../../domains/auth/services'
import { firestoreService } from '../../domains/firestore/services'
import { useFirebaseContext } from '../providers/FirebaseProvider'

export interface UseAuthResult {
  firebaseUser: FirebaseUser | null
  user: FirestoreUser | null
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
  const { instances, loading, error } = useFirebaseContext()
  const [user, setUser] = useState<FirestoreUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = instances?.auth.currentUser
      if (currentUser) {
        const userData = await firestoreService.getUser(currentUser.uid)
        setUser(userData)
      } else {
        setUser(null)
      }
    }
    fetchUser()
  }, [instances?.auth.currentUser])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password)
    return result.user
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const userCredential = await authService.signUp(email, password, displayName)

    // Create user profile in Firestore
    const now = Date.now()
    await firestoreService.createUser(userCredential.user.uid, {
      profile: {
        id: userCredential.user.uid,
        email: email,
        displayName: displayName,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        emailVerified: false,
      },
      settings: {
        theme: 'light',
        language: 'tr',
        timezone: 'Europe/Istanbul',
        currency: 'TRY',
        notifications: {
          email: true,
          push: true,
          marketing: false,
          security: true,
          weeklyDigest: false,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          dataSharing: false,
        },
      },
      subscription: {
        plan: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      },
    })

    return userCredential.user
  }, [])

  const signInWithGoogleCallback = useCallback(async () => {
    const result = await authService.signInWithGoogle()
    return result.user
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email)
  }, [])

  const resendEmailVerification = useCallback(async () => {
    await authService.resendEmailVerification()
  }, [])

  const updateProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    await authService.updateProfile(updates)

    // Refresh user data from Firestore if available
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  const refreshUser = useCallback(async () => {
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
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
    signInWithGoogle: signInWithGoogleCallback,
    signOut,
    sendPasswordReset,
    resendEmailVerification,
    updateProfile,
    refreshUser,
  }
}
