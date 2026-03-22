/**
 * FirebaseProvider
 * @description React Context Provider for Firebase with auth state tracking
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import type { FirebaseInstances } from '../../infrastructure/firebase/client'
import { getFirebaseInstances } from '../../infrastructure/firebase/client'
import { AuthAdapter } from '../../infrastructure/firebase/auth.adapter'

export interface FirebaseContextValue {
  instances: FirebaseInstances
  isInitialized: boolean
  user: User | null
  loading: boolean
  error: Error | null
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export interface FirebaseProviderProps {
  children: ReactNode
  config?: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
}

export function FirebaseProvider({ children, config }: FirebaseProviderProps) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      // Initialize Firebase (singleton - won't re-initialize)
      const firebaseInstances = getFirebaseInstances()
      setInstances(firebaseInstances)

      // Set up auth state listener
      const authAdapter = new AuthAdapter()
      const unsubscribe = authAdapter.onAuthStateChanged(
        (user) => {
          setUser(user)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
        }
      )

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } catch (err) {
      setError(err as Error)
      setLoading(false)
    }
  }, [config])

  const value: FirebaseContextValue = {
    instances: instances!,
    isInitialized: !!instances,
    user,
    loading,
    error,
  }

  if (!instances || loading) {
    return (
      <FirebaseContext.Provider value={{ ...value, isInitialized: false }}>
        {children}
      </FirebaseContext.Provider>
    )
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export function useFirebaseContext(): FirebaseContextValue {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebaseContext must be used within FirebaseProvider')
  }
  return context
}

