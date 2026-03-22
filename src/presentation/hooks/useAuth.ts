/**
 * Auth Hook
 * @description React hook for authentication with Google & Apple OAuth
 */

import { useCallback, useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User as FirestoreUser } from '../../domains/firestore/entities'
import { authService } from '../../domains/auth/services'
import { firestoreService } from '../../domains/firestore/services'
import { useFirebaseContext } from '../providers/FirebaseProvider'
import { getAuthConfig } from '../../domain/config/auth.config'

export interface UseAuthResult {
  // State
  firebaseUser: FirebaseUser | null
  user: FirestoreUser | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  isEmailVerified: boolean

  // Email/Password Auth
  signIn: (email: string, password: string) => Promise<FirebaseUser>
  signUp: (email: string, password: string, displayName: string) => Promise<FirebaseUser>

  // OAuth Providers
  signInWithGoogle: (useRedirect?: boolean) => Promise<FirebaseUser>
  signInWithApple: (useRedirect?: boolean) => Promise<FirebaseUser>

  // Provider Management
  linkGoogle: () => Promise<void>
  linkApple: () => Promise<void>
  unlinkProvider: (providerId: string) => Promise<void>

  // Account Management
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resendEmailVerification: () => Promise<void>
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>
  updateEmail: (newEmail: string, password: string) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>

  // Token Management
  getIdToken: (forceRefresh?: boolean) => Promise<string>
  refreshToken: () => Promise<void>

  // User Data
  refreshUser: () => Promise<void>

  // Config
  googleEnabled: boolean
  appleEnabled: boolean
  emailPasswordEnabled: boolean
}

export function useAuth(): UseAuthResult {
  const { instances, loading, error } = useFirebaseContext()
  const [user, setUser] = useState<FirestoreUser | null>(null)
  const config = getAuthConfig()

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = instances?.auth.currentUser
      if (currentUser) {
        try {
          const userData = await firestoreService.getUser(currentUser.uid)
          setUser(userData)
        } catch (err) {
          console.error('Error fetching user data:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
    fetchUser()
  }, [instances?.auth.currentUser])

  // Email/Password Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn(email, password)
    return result.user
  }, [])

  // Email/Password Sign Up
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const userCredential = await authService.signUp(email, password, displayName)

    // Create user profile in Firestore if auto-create is enabled
    if (config.shouldCreateUserDocument()) {
      const now = Date.now()
      const defaultSettings = config.getConfig().defaultUserSettings

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
          theme: defaultSettings?.theme ?? 'system',
          language: defaultSettings?.language ?? 'en',
          timezone: defaultSettings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          currency: defaultSettings?.currency ?? 'USD',
          notifications: {
            email: defaultSettings?.notifications?.email ?? true,
            push: defaultSettings?.notifications?.push ?? true,
            marketing: defaultSettings?.notifications?.marketing ?? false,
            security: defaultSettings?.notifications?.security ?? true,
            weeklyDigest: defaultSettings?.notifications?.weeklyDigest ?? false,
          },
          privacy: {
            profileVisibility: defaultSettings?.privacy?.profileVisibility ?? 'public',
            showEmail: defaultSettings?.privacy?.showEmail ?? false,
            showPhone: defaultSettings?.privacy?.showPhone ?? false,
            dataSharing: defaultSettings?.privacy?.dataSharing ?? false,
          },
        },
        subscription: {
          plan: config.getConfig().defaultSubscriptionPlan ?? 'free',
          status: 'active',
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now,
        },
      })
    }

    return userCredential.user
  }, [config])

  // Google Sign In
  const signInWithGoogleCallback = useCallback(async (useRedirect = false): Promise<FirebaseUser> => {
    const result = await authService.signInWithGoogle(useRedirect)

    // Create user profile in Firestore if it doesn't exist
    if (config.shouldCreateUserDocument()) {
      const existingUser = await firestoreService.getUser(result.user.uid)
      if (!existingUser) {
        const now = Date.now()
        const defaultSettings = config.getConfig().defaultUserSettings

        await firestoreService.createUser(result.user.uid, {
          profile: {
            id: result.user.uid,
            email: result.user.email ?? '',
            displayName: result.user.displayName ?? '',
            photoURL: result.user.photoURL || undefined,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            emailVerified: result.user.emailVerified,
          },
          settings: {
            theme: defaultSettings?.theme ?? 'system',
            language: defaultSettings?.language ?? 'en',
            timezone: defaultSettings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            currency: defaultSettings?.currency ?? 'USD',
            notifications: {
              email: defaultSettings?.notifications?.email ?? true,
              push: defaultSettings?.notifications?.push ?? true,
              marketing: defaultSettings?.notifications?.marketing ?? false,
              security: defaultSettings?.notifications?.security ?? true,
              weeklyDigest: defaultSettings?.notifications?.weeklyDigest ?? false,
            },
            privacy: {
              profileVisibility: defaultSettings?.privacy?.profileVisibility ?? 'public',
              showEmail: defaultSettings?.privacy?.showEmail ?? false,
              showPhone: defaultSettings?.privacy?.showPhone ?? false,
              dataSharing: defaultSettings?.privacy?.dataSharing ?? false,
            },
          },
          subscription: {
            plan: config.getConfig().defaultSubscriptionPlan ?? 'free',
            status: 'active',
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
          },
        })
      }
    }

    return result.user
  }, [config])

  // Apple Sign In
  const signInWithAppleCallback = useCallback(async (useRedirect = false): Promise<FirebaseUser> => {
    const result = await authService.signInWithApple(useRedirect)

    // Create user profile in Firestore if it doesn't exist
    if (config.shouldCreateUserDocument()) {
      const existingUser = await firestoreService.getUser(result.user.uid)
      if (!existingUser) {
        const now = Date.now()
        const defaultSettings = config.getConfig().defaultUserSettings

        await firestoreService.createUser(result.user.uid, {
          profile: {
            id: result.user.uid,
            email: result.user.email ?? '',
            displayName: result.user.displayName ?? '',
            photoURL: result.user.photoURL || undefined,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            emailVerified: result.user.emailVerified,
          },
          settings: {
            theme: defaultSettings?.theme ?? 'system',
            language: defaultSettings?.language ?? 'en',
            timezone: defaultSettings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            currency: defaultSettings?.currency ?? 'USD',
            notifications: {
              email: defaultSettings?.notifications?.email ?? true,
              push: defaultSettings?.notifications?.push ?? true,
              marketing: defaultSettings?.notifications?.marketing ?? false,
              security: defaultSettings?.notifications?.security ?? true,
              weeklyDigest: defaultSettings?.notifications?.weeklyDigest ?? false,
            },
            privacy: {
              profileVisibility: defaultSettings?.privacy?.profileVisibility ?? 'public',
              showEmail: defaultSettings?.privacy?.showEmail ?? false,
              showPhone: defaultSettings?.privacy?.showPhone ?? false,
              dataSharing: defaultSettings?.privacy?.dataSharing ?? false,
            },
          },
          subscription: {
            plan: config.getConfig().defaultSubscriptionPlan ?? 'free',
            status: 'active',
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
          },
        })
      }
    }

    return result.user
  }, [config])

  // Provider Linking
  const linkGoogleCallback = useCallback(async () => {
    await authService.linkGoogle()
    // Refresh user data
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  const linkAppleCallback = useCallback(async () => {
    await authService.linkApple()
    // Refresh user data
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  const unlinkProviderCallback = useCallback(async (providerId: string) => {
    await authService.unlinkProvider(providerId)
    // Refresh user data
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  // Sign Out
  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  // Password Reset
  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email)
  }, [])

  // Email Verification
  const resendEmailVerification = useCallback(async () => {
    await authService.resendEmailVerification()
  }, [])

  // Update Profile
  const updateProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    await authService.updateProfile(updates)

    // Refresh user data from Firestore
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  // Update Email
  const updateEmailCallback = useCallback(async (newEmail: string, password: string) => {
    await authService.updateEmail(newEmail, password)

    // Refresh user data
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  // Update Password
  const updatePasswordCallback = useCallback(async (currentPassword: string, newPassword: string) => {
    await authService.updatePassword(currentPassword, newPassword)
  }, [])

  // Delete Account
  const deleteAccountCallback = useCallback(async (password: string) => {
    await authService.deleteAccount(password)
    setUser(null)
  }, [])

  // Token Management
  const getIdTokenCallback = useCallback(async (forceRefresh = false) => {
    return await authService.getIdToken(forceRefresh)
  }, [])

  const refreshTokenCallback = useCallback(async () => {
    await authService.refreshToken()
  }, [])

  // Refresh User Data
  const refreshUser = useCallback(async () => {
    const currentUser = instances?.auth.currentUser
    if (currentUser) {
      const userData = await firestoreService.getUser(currentUser.uid)
      setUser(userData)
    }
  }, [instances])

  return {
    // State
    firebaseUser: instances?.auth.currentUser || null,
    user,
    loading,
    error,
    isAuthenticated: !!instances?.auth.currentUser,
    isEmailVerified: instances?.auth.currentUser?.emailVerified || false,

    // Email/Password Auth
    signIn,
    signUp,

    // OAuth Providers
    signInWithGoogle: signInWithGoogleCallback,
    signInWithApple: signInWithAppleCallback,

    // Provider Management
    linkGoogle: linkGoogleCallback,
    linkApple: linkAppleCallback,
    unlinkProvider: unlinkProviderCallback,

    // Account Management
    signOut,
    sendPasswordReset,
    resendEmailVerification,
    updateProfile,
    updateEmail: updateEmailCallback,
    updatePassword: updatePasswordCallback,
    deleteAccount: deleteAccountCallback,

    // Token Management
    getIdToken: getIdTokenCallback,
    refreshToken: refreshTokenCallback,

    // User Data
    refreshUser,

    // Config
    googleEnabled: config.isGoogleEnabled(),
    appleEnabled: config.isAppleEnabled(),
    emailPasswordEnabled: config.isEmailPasswordEnabled(),
  }
}
