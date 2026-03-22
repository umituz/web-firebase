/**
 * Domain Errors for Authentication
 * @description Custom error types for authentication-related failures
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export enum AuthErrorCode {
  // Auth Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Session Errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Provider Errors
  OAUTH_ERROR = 'OAUTH_ERROR',
  OAUTH_CANCELLED = 'OAUTH_CANCELLED',
  OAUTH_ACCOUNT_EXISTS = 'OAUTH_ACCOUNT_EXISTS',

  // Operation Errors
  SIGN_IN_FAILED = 'SIGN_IN_FAILED',
  SIGN_UP_FAILED = 'SIGN_UP_FAILED',
  SIGN_OUT_FAILED = 'SIGN_OUT_FAILED',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED',

  // Profile Errors
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  EMAIL_UPDATE_FAILED = 'EMAIL_UPDATE_FAILED',
  PASSWORD_UPDATE_FAILED = 'PASSWORD_UPDATE_FAILED',
  ACCOUNT_DELETE_FAILED = 'ACCOUNT_DELETE_FAILED',

  // Reauthentication Errors
  REAUTHENTICATION_REQUIRED = 'REAUTHENTICATION_REQUIRED',
  REAUTHENTICATION_FAILED = 'REAUTHENTICATION_FAILED',

  // Unknown Error
  UNKNOWN = 'UNKNOWN',
}

export function createAuthError(
  code: AuthErrorCode,
  message?: string,
  originalError?: unknown
): AuthError {
  const defaultMessage = getAuthErrorMessage(code)
  return new AuthError(message || defaultMessage, code, originalError)
}

function getAuthErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case AuthErrorCode.USER_NOT_FOUND:
      return 'User not found'
    case AuthErrorCode.USER_ALREADY_EXISTS:
      return 'User already exists'
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Invalid credentials'
    case AuthErrorCode.WEAK_PASSWORD:
      return 'Password is too weak'
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
      return 'Email not verified'
    case AuthErrorCode.SESSION_EXPIRED:
      return 'Session expired'
    case AuthErrorCode.UNAUTHENTICATED:
      return 'User not authenticated'
    case AuthErrorCode.TOO_MANY_REQUESTS:
      return 'Too many requests'
    case AuthErrorCode.OAUTH_ERROR:
      return 'OAuth error occurred'
    case AuthErrorCode.OAUTH_CANCELLED:
      return 'OAuth cancelled by user'
    case AuthErrorCode.OAUTH_ACCOUNT_EXISTS:
      return 'Account already exists with this provider'
    case AuthErrorCode.SIGN_IN_FAILED:
      return 'Sign in failed'
    case AuthErrorCode.SIGN_UP_FAILED:
      return 'Sign up failed'
    case AuthErrorCode.SIGN_OUT_FAILED:
      return 'Sign out failed'
    case AuthErrorCode.PASSWORD_RESET_FAILED:
      return 'Password reset failed'
    case AuthErrorCode.EMAIL_VERIFICATION_FAILED:
      return 'Email verification failed'
    case AuthErrorCode.PROFILE_UPDATE_FAILED:
      return 'Profile update failed'
    case AuthErrorCode.EMAIL_UPDATE_FAILED:
      return 'Email update failed'
    case AuthErrorCode.PASSWORD_UPDATE_FAILED:
      return 'Password update failed'
    case AuthErrorCode.ACCOUNT_DELETE_FAILED:
      return 'Account deletion failed'
    case AuthErrorCode.REAUTHENTICATION_REQUIRED:
      return 'Reauthentication required'
    case AuthErrorCode.REAUTHENTICATION_FAILED:
      return 'Reauthentication failed'
    case AuthErrorCode.UNKNOWN:
    default:
      return 'An unknown error occurred'
  }
}
