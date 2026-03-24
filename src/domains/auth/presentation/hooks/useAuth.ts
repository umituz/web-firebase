/**
 * useAuth Hook
 * @description React hook for Firebase authentication
 */

import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { getFirebaseAuth } from '../../../../infrastructure/firebase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setIsLoading(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged((authUser: User | null) => {
      setUser(authUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, isLoading }
}
