/**
 * Auth Service
 * @description Firebase Auth implementation of IAuthService
 */

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateAuthProfile,
  updateEmail as updateAuthEmail,
  updatePassword as updateAuthPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  UserCredential,
} from 'firebase/auth'
import { GoogleAuthProvider } from 'firebase/auth'
import { getFirebaseAuth } from '../../../infrastructure/firebase/client'
import type { IAuthService } from '../types'
import type { AuthUser } from '../entities'

class AuthService implements IAuthService {
  private get auth() {
    return getFirebaseAuth()
  }

  // Authentication Methods

  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password)

      // Update profile
      await updateAuthProfile(result.user, { displayName })

      // Send email verification
      await sendEmailVerification(result.user)

      return result
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')

      return await signInWithPopup(this.auth, provider)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth)
    } catch (error) {
      throw new Error('Sign out failed')
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async resendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw new Error('No user logged in')
      }
      await sendEmailVerification(user)
    } catch (error) {
      throw new Error('Failed to resend verification')
    }
  }

  // Profile Management

  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user) {
        throw new Error('No user logged in')
      }

      await updateAuthProfile(user, updates)
    } catch (error) {
      throw new Error('Profile update failed')
    }
  }

  async updateEmail(newEmail: string, password: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw new Error('No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      await updateAuthEmail(user, newEmail)
    } catch (error) {
      throw new Error('Email update failed')
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw new Error('No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updateAuthPassword(user, newPassword)
    } catch (error) {
      throw new Error('Password update failed')
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      const user = this.auth.currentUser
      if (!user || !user.email) {
        throw new Error('No user logged in')
      }

      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      await user.delete()
    } catch (error) {
      throw new Error('Account deletion failed')
    }
  }

  // State Management

  getCurrentUser(): AuthUser | null {
    const user = this.auth.currentUser
    if (!user) return null

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      isAnonymous: user.isAnonymous,
      tenantId: user.tenantId,
      providerId: user.providerId,
      metadata: {
        creationTime: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : undefined,
        lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : undefined,
      },
    }
  }

  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.auth.onAuthStateChanged(
      (user) => {
        callback(
          user
            ? {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber,
                isAnonymous: user.isAnonymous,
                tenantId: user.tenantId,
                providerId: user.providerId,
                metadata: {
                  creationTime: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : undefined,
                  lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : undefined,
                },
              }
            : null
        )
      },
      (error) => {
        onError?.(error as Error)
      }
    )
  }

  /**
   * Handle Firebase Auth errors
   */
  private handleAuthError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return new Error('Invalid credentials')
        case 'auth/email-already-in-use':
          return new Error('Email already in use')
        case 'auth/weak-password':
          return new Error('Password is too weak')
        case 'auth/invalid-email':
          return new Error('Invalid email')
        case 'auth/user-disabled':
          return new Error('Account disabled')
        case 'auth/too-many-requests':
          return new Error('Too many requests')
        case 'auth/popup-closed-by-user':
          return new Error('Sign in cancelled')
        default:
          return new Error(`Auth error: ${code}`)
      }
    }

    return new Error('Unknown auth error')
  }
}

// Export class and singleton instance
export const authService = new AuthService()
