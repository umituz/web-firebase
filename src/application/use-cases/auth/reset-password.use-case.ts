/**
 * Reset Password Use Case
 * @description Handles password reset flow
 */

import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { ResetPasswordDTO } from '../../dto/auth.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute password reset use case
   */
  async execute(dto: ResetPasswordDTO): Promise<void> {
    try {
      // Validate input
      this.validateDTO(dto)

      // Send password reset email
      await this.authRepository.sendPasswordReset(dto.email)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate DTO
   */
  private validateDTO(dto: ResetPasswordDTO): void {
    if (!dto.email) {
      throw createAuthError(AuthErrorCode.PASSWORD_RESET_FAILED, 'Email is required')
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(dto.email)) {
      throw createAuthError(AuthErrorCode.PASSWORD_RESET_FAILED, 'Invalid email format')
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      if (code === 'auth/invalid-email') {
        return createAuthError(AuthErrorCode.PASSWORD_RESET_FAILED, 'Invalid email', error)
      }

      if (code === 'auth/user-not-found') {
        // Don't reveal if user exists
        return createAuthError(AuthErrorCode.PASSWORD_RESET_FAILED, 'Password reset email sent if account exists')
      }

      if (code === 'auth/too-many-requests') {
        return createAuthError(AuthErrorCode.TOO_MANY_REQUESTS, 'Too many requests', error)
      }
    }

    return createAuthError(AuthErrorCode.PASSWORD_RESET_FAILED, 'Password reset failed', error)
  }
}
