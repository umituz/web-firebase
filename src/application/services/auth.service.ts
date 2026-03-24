import { AuthAdapter } from '../../infrastructure/firebase/auth.adapter';

/**
 * Authentication Service (Application Layer)
 * Singleton instance of AuthAdapter
 */
export const authService = new AuthAdapter();

export { AuthAdapter };
