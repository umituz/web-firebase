/**
 * Update Profile Use Case
 * @description Handles user profile updates
 */

import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import type { UpdateProfileDTO } from '../../dto/auth.dto'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class UpdateProfileUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute profile update use case
   */
  async execute(dto: UpdateProfileDTO): Promise<void> {
    try {
      // Validate input
      this.validateDTO(dto)

      // Check if user is authenticated
      const currentUser = this.authRepository.getCurrentUser()
      if (!currentUser) {
        throw createAuthError(AuthErrorCode.UNAUTHENTICATED, 'No user logged in')
      }

      // Update profile
      await this.authRepository.updateProfile(dto)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate DTO
   */
  private validateDTO(dto: UpdateProfileDTO): void {
    if (!dto.displayName && !dto.photoURL) {
      throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'At least one field must be provided')
    }

    if (dto.displayName !== undefined) {
      if (typeof dto.displayName !== 'string') {
        throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Display name must be a string')
      }

      if (dto.displayName.trim().length === 0) {
        throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Display name cannot be empty')
      }

      if (dto.displayName.length > 100) {
        throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Display name too long (max 100 characters)')
      }
    }

    if (dto.photoURL !== undefined && dto.photoURL !== null) {
      if (typeof dto.photoURL !== 'string') {
        throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Photo URL must be a string')
      }

      // Basic URL validation
      if (dto.photoURL && !this.isValidURL(dto.photoURL)) {
        throw createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Invalid photo URL')
      }
    }
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
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

      if (code === 'auth/invalid-photo-url') {
        return createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Invalid photo URL', error)
      }
    }

    return createAuthError(AuthErrorCode.PROFILE_UPDATE_FAILED, 'Profile update failed', error)
  }
}
