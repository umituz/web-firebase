/**
 * Delete Account Use Case
 * @description Handles user account deletion
 */

import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { DeleteAccountDTO } from '../../dto/auth.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class DeleteAccountUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute account deletion use case
   */
  async execute(dto: DeleteAccountDTO): Promise<void> {
    try {
      // Validate input
      this.validateDTO(dto)

      // Check if user is authenticated
      const currentUser = this.authRepository.getCurrentUser()
      if (!currentUser) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      if (!currentUser.email) {
        throw createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'User email not available')
      }

      // Delete account (includes password verification)
      await this.authRepository.deleteAccount(dto.password)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate DTO
   */
  private validateDTO(dto: DeleteAccountDTO): void {
    if (!dto.password) {
      throw createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'Password is required')
    }

    if (dto.password.length < 1) {
      throw createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'Password cannot be empty')
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code

      if (code === 'auth/requires-recent-login') {
        return createAuthError(AuthErrorCode.REAUTHENTICATION_REQUIRED, 'Please reauthenticate first', error)
      }

      if (code === 'auth/wrong-password') {
        return createAuthError(AuthErrorCode.REAUTHENTICATION_FAILED, 'Invalid password', error)
      }

      if (code === 'auth/too-many-requests') {
        return createAuthError(AuthErrorCode.TOO_MANY_REQUESTS, 'Too many requests', error)
      }

      if (code === 'auth/user-not-found') {
        return createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'User not found', error)
      }
    }

    return createAuthError(AuthErrorCode.ACCOUNT_DELETE_FAILED, 'Account deletion failed', error)
  }
}
