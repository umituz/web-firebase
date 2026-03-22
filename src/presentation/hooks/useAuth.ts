/**
 * Auth Hook
 * @description React hook for authentication operations
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/hooks/useAuth.ts
 * Refactored to use use cases
 */

import { useEffect, useState, useCallback } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import type { User } from '../../domain/entities/user.entity'
import type { IAuthRepository } from '../../domain/interfaces/auth.repository.interface'
import type { IUserRepository } from '../../domain/interfaces/user.repository.interface'
import type { SignInDTO, SignUpDTO } from '../../application/dto/auth.dto'

export interface UseAuthOptions {
  authRepository: IAuthRepository
  userRepository: IUserRepository
}

export function useAuth({ authRepository, userRepository }: UseAuthOptions) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const userData = await userRepository.getUser(fbUser.uid)
          setUser(userData)
        } catch (err) {
          console.error('Error fetching user data:', err)
          setError(err as Error)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [authRepository, userRepository])

  const signIn = useCallback(async (dto: SignInDTO) => {
    setError(null)
    try {
      return await authRepository.signIn(dto.email, dto.password)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const signUp = useCallback(async (dto: SignUpDTO) => {
    setError(null)
    try {
      return await authRepository.signUp(dto.email, dto.password, dto.displayName)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    try {
      return await authRepository.signInWithGoogle()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const signOut = useCallback(async () => {
    setError(null)
    try {
      await authRepository.signOut()
      setUser(null)
      setFirebaseUser(null)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null)
    try {
      await authRepository.sendPasswordReset(email)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const resendEmailVerification = useCallback(async () => {
    setError(null)
    try {
      await authRepository.resendEmailVerification()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository])

  const updateProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    setError(null)
    try {
      await authRepository.updateProfile(updates)
      if (firebaseUser) {
        const userData = await userRepository.getUser(firebaseUser.uid)
        setUser(userData)
      }
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [authRepository, userRepository, firebaseUser])

  const refreshUser = useCallback(async () => {
    setError(null)
    try {
      if (firebaseUser) {
        const userData = await userRepository.getUser(firebaseUser.uid)
        setUser(userData)
      }
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [userRepository, firebaseUser])

  return {
    firebaseUser,
    user,
    loading,
    error,
    isAuthenticated: !!firebaseUser,
    isEmailVerified: firebaseUser?.emailVerified || false,
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
