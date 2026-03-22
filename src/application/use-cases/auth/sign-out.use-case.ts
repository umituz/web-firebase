/**
 * Sign Out Use Case
 * @description Handles user sign out
 */

import type { IAuthRepository } from '../../../domain/interfaces/auth.repository.interface'
import { createAuthError, AuthErrorCode } from '../../../domain/errors/auth.errors'

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute sign out use case
   */
  async execute(): Promise<void> {
    try {
      await this.authRepository.signOut()
    } catch (error) {
      throw createAuthError(AuthErrorCode.SIGN_OUT_FAILED, 'Sign out failed', error)
    }
  }
}
