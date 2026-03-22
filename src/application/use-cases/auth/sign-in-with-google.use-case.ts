/**
 * Sign In With Google Use Case
 * @description Handles Google OAuth sign in/sign up
 */

import type { UserCredential } from 'firebase/auth'
import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { IUserRepository } from '../../../domain/interfaces/user.repository.interface'
import type { CreateUserDTO } from '../../dto/user.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class SignInWithGoogleUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute Google sign in use case
   */
  async execute(): Promise<UserCredential> {
    try {
      // Perform Google sign in
      const result = await this.authRepository.signInWithGoogle()

      // Check if user needs onboarding
      const existingUser = await this.userRepository.getUser(result.user.uid)
      if (!existingUser) {
        // New user - create user document
        const createUserDTO: CreateUserDTO = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || undefined,
          phoneNumber: result.user.phoneNumber || undefined,
          emailVerified: result.user.emailVerified,
        }

        await this.authRepository.createUserDocument(result.user.uid, createUserDTO)
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      if (code === 'auth/popup-closed-by-user') {
        return createAuthError(AuthErrorCode.OAUTH_CANCELLED, 'Google sign in cancelled', error)
      }

      if (code === 'auth/popup-blocked') {
        return createAuthError(AuthErrorCode.OAUTH_ERROR, 'Popup blocked by browser', error)
      }

      if (code === 'auth/account-exists-with-different-credential') {
        return createAuthError(
          AuthErrorCode.OAUTH_ACCOUNT_EXISTS,
          'Account already exists with different credential',
          error
        )
      }

      if (code === 'auth/auth-domain-policy-required') {
        return createAuthError(AuthErrorCode.OAUTH_ERROR, 'Auth domain not configured', error)
      }

      if (code === 'auth/unauthorized-domain') {
        return createAuthError(AuthErrorCode.OAUTH_ERROR, 'Unauthorized domain', error)
      }

      if (code === 'auth/cancelled-popup-request') {
        return createAuthError(AuthErrorCode.OAUTH_CANCELLED, 'Sign in cancelled', error)
      }
    }

    return createAuthError(AuthErrorCode.OAUTH_ERROR, 'Google sign in failed', error)
  }
}
