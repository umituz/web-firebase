/**
 * Sign In Use Case
 * @description Handles user sign in with email/password
 */

import type { UserCredential } from 'firebase/auth'
import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { SignInDTO } from '../../dto/auth.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class SignInUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute sign in use case
   */
  async execute(dto: SignInDTO): Promise<UserCredential> {
    try {
      // Validate input
      this.validateDTO(dto)

      // Perform sign in
      const result = await this.authRepository.signIn(dto.email, dto.password)

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate DTO
   */
  private validateDTO(dto: SignInDTO): void {
    if (!dto.email) {
      throw createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Email is required')
    }

    if (!dto.password) {
      throw createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Password is required')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(dto.email)) {
      throw createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email format')
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Firebase auth errors
      const message = error.message.toLowerCase()

      if (message.includes('user-not-found') || message.includes('invalid-email')) {
        return createAuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found', error)
      }

      if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        return createAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid credentials', error)
      }

      if (message.includes('too-many-requests')) {
        return createAuthError(AuthErrorCode.TOO_MANY_REQUESTS, 'Too many attempts', error)
      }

      if (message.includes('user-disabled')) {
        return createAuthError(AuthErrorCode.USER_NOT_FOUND, 'Account disabled', error)
      }
    }

    return createAuthError(AuthErrorCode.SIGN_IN_FAILED, 'Sign in failed', error)
  }
}
