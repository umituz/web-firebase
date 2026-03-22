/**
 * Sign Up Use Case
 * @description Handles user registration with email/password
 */

import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { IUserRepository } from '../../../domain/interfaces/user.repository.interface'
import type { SignUpDTO, SignUpResult } from '../../dto/auth.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class SignUpUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute sign up use case
   */
  async execute(dto: SignUpDTO): Promise<SignUpResult> {
    try {
      // Validate input
      this.validateDTO(dto)

      // Check if user already exists
      const existingUser = await this.userRepository.getUserByEmail(dto.email)
      if (existingUser) {
        throw createAuthError(AuthErrorCode.USER_ALREADY_EXISTS, 'User already exists')
      }

      // Perform sign up
      const result = await this.authRepository.signUp(dto.email, dto.password, dto.displayName)

      // Return enhanced result
      return {
        ...result,
        userId: result.user.uid,
        emailVerified: result.user.emailVerified,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate DTO
   */
  private validateDTO(dto: SignUpDTO): void {
    if (!dto.email) {
      throw createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Email is required')
    }

    if (!dto.password) {
      throw createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Password is required')
    }

    if (!dto.displayName || dto.displayName.trim().length === 0) {
      throw createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Display name is required')
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(dto.email)) {
      throw createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Invalid email format')
    }

    // Password strength validation
    if (dto.password.length < 6) {
      throw createAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password must be at least 6 characters')
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      if (code === 'auth/email-already-in-use') {
        return createAuthError(AuthErrorCode.USER_ALREADY_EXISTS, 'Email already in use', error)
      }

      if (code === 'auth/invalid-email') {
        return createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Invalid email', error)
      }

      if (code === 'auth/weak-password') {
        return createAuthError(AuthErrorCode.WEAK_PASSWORD, 'Password is too weak', error)
      }

      if (code === 'auth/operation-not-allowed') {
        return createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Email/password accounts not enabled', error)
      }
    }

    return createAuthError(AuthErrorCode.SIGN_UP_FAILED, 'Sign up failed', error)
  }
}
