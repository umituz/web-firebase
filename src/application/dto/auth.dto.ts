/**
 * Authentication DTOs
 * @description Data Transfer Objects for authentication operations
 */

import type { UserCredential } from 'firebase/auth'

/**
 * Sign In DTO
 */
export interface SignInDTO {
  email: string
  password: string
}

/**
 * Sign Up DTO
 */
export interface SignUpDTO {
  email: string
  password: string
  displayName: string
}

/**
 * Sign Up Result
 */
export interface SignUpResult extends UserCredential {
  userId: string
  emailVerified: boolean
}

/**
 * Reset Password DTO
 */
export interface ResetPasswordDTO {
  email: string
}

/**
 * Update Profile DTO
 */
export interface UpdateProfileDTO {
  displayName?: string
  photoURL?: string
}

/**
 * Update Email DTO
 */
export interface UpdateEmailDTO {
  newEmail: string
  currentPassword: string
}

/**
 * Update Password DTO
 */
export interface UpdatePasswordDTO {
  currentPassword: string
  newPassword: string
}

/**
 * Delete Account DTO
 */
export interface DeleteAccountDTO {
  password: string
}
