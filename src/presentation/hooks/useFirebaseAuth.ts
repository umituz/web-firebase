import { useState, useEffect, useCallback } from 'react';
import {
  type Auth,
  type UserCredential,
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { FirebaseUser } from '../../domain/entities/firebase.entity';

function mapUser(u: User): FirebaseUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
  };
}

/**
 * useFirebaseAuth Hook
 * @description Hook to manage Firebase authentication state and operations
 */

export interface UseFirebaseAuthOptions {
  onUserChange?: (user: FirebaseUser | null) => void;
}

export interface UseFirebaseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn(email: string, password: string): Promise<UserCredential>;
  signUp(email: string, password: string, name?: string): Promise<UserCredential>;
  signOut(): Promise<void>;
  updateUserProfile(name: string, photoURL?: string): Promise<void>;
  updateUserPassword(newPassword: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getIdToken(): Promise<string>;
}

export function useFirebaseAuth(
  auth: Auth,
  options?: UseFirebaseAuthOptions,
): UseFirebaseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      const mapped = firebaseUser ? mapUser(firebaseUser) : null;
      setUser(mapped);
      setLoading(false);
      options?.onUserChange?.(mapped);
    });
    return unsub;
  }, [auth, options]);

  const signIn = useCallback(
    (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    [auth],
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name && cred.user) await updateProfile(cred.user, { displayName: name });
      return cred;
    },
    [auth],
  );

  const signOut = useCallback(() => firebaseSignOut(auth), [auth]);

  const updateUserProfile = useCallback(
    async (name: string, photoURL?: string) => {
      if (!auth.currentUser) throw new Error('No authenticated user');
      await updateProfile(auth.currentUser, {
        displayName: name,
        ...(photoURL !== undefined && { photoURL }),
      });
    },
    [auth],
  );

  const updateUserPassword = useCallback(
    async (newPassword: string) => {
      if (!auth.currentUser) throw new Error('No authenticated user');
      await updatePassword(auth.currentUser, newPassword);
    },
    [auth],
  );

  const resetPassword = useCallback(
    (email: string) => sendPasswordResetEmail(auth, email),
    [auth],
  );

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    return auth.currentUser.getIdToken();
  }, [auth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    updateUserPassword,
    resetPassword,
    getIdToken,
  };
}
