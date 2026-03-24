/**
 * FirebaseProvider Component
 * @description Firebase provider for React app
 */

import { useEffect } from 'react'
import { initializeFirebase } from '../firebase/client'

interface FirebaseProviderProps {
  children: React.ReactNode
  config?: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId?: string
  }
}

export function FirebaseProvider({ children, config }: FirebaseProviderProps) {
  useEffect(() => {
    if (config) {
      initializeFirebase(config)
    }
  }, [config])

  return <>{children}</>
}
