/**
 * FirebaseProvider
 * @description React Context Provider for Firebase initialization
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { FirebaseInstances } from '../../infrastructure/firebase/client'
import { getFirebaseInstances } from '../../infrastructure/firebase/client'

interface FirebaseContextValue {
  instances: FirebaseInstances
  isInitialized: boolean
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export interface FirebaseProviderProps {
  children: ReactNode
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  // Note: Firebase is already initialized via environment variables
  // This provider just makes instances available via context
  const instances = getFirebaseInstances()

  const value: FirebaseContextValue = {
    instances,
    isInitialized: true,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export function useFirebaseContext() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebaseContext must be used within FirebaseProvider')
  }
  return context
}
