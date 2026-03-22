/**
 * Firestore Hook
 * @description React hook for Firestore real-time data
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/hooks/useFirestore.ts
 */

import { useEffect, useState } from 'react'
import { doc, onSnapshot, query, collection, type QuerySnapshot, type DocumentData } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

export function useUser(db: Firestore, userId: string) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data())
      } else {
        setUser(null)
      }
      setLoading(false)
    }, (err) => {
      setError(err as Error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, userId])

  return { user, loading, error }
}

export function useUserRealtime<T>(db: Firestore, collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!docId) {
      setData(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, collectionName, docId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as T)
      } else {
        setData(null)
      }
      setLoading(false)
    }, (err) => {
      setError(err as Error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, collectionName, docId])

  return { data, loading, error }
}

export function useCollectionRealtime<T>(
  db: Firestore,
  collectionName: string,
  constraints?: any[]
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = constraints
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName)

    const unsubscribe = onSnapshot(q, (querySnap: QuerySnapshot<DocumentData>) => {
      const items = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
      setData(items)
      setLoading(false)
    }, (err) => {
      setError(err as Error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, collectionName, JSON.stringify(constraints)])

  return { data, loading, error }
}

export function useDocumentValue<T>(
  db: Firestore,
  collectionName: string,
  docId: string
) {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    if (!docId) {
      setData(null)
      return
    }

    const unsubscribe = onSnapshot(doc(db, collectionName, docId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as T)
      } else {
        setData(null)
      }
    })

    return () => unsubscribe()
  }, [db, collectionName, docId])

  return data
}
