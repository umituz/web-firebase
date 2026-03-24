import { authService } from './auth.service';

/**
 * Anonymous Authentication Service (Application Layer)
 * Handles anonymous sign-ins and tracking logic
 */
export class AnonymousAuthService {
  /**
   * Sign in as anonymous user
   * @param options - Optional tracking source
   */
  async signInAsAnonymous(options?: { source?: string }) {
    try {
      const result = await authService.signInAnonymously();
      if (options?.source) {
        console.debug(`[AnonymousAuth] Signed in from: ${options.source}`);
      }
      return result.user.uid;
    } catch (error) {
      console.error('[AnonymousAuth] Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Clear local anonymous data
   */
  clearAnonymousData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anonymous_uid');
      localStorage.removeItem('anonymous_data');
    }
  }

  /**
   * Get/Create device ID for session tracking
   */
  getDeviceIdForTracking(): string {
    if (typeof window === 'undefined') return 'ssr';
    
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Update anonymous user activity
   */
  async updateActivity(uid: string) {
    // Logic for syncing with analytics/storage
    console.debug(`[AnonymousAuth] Updating activity: ${uid}`);
  }
}

/**
 * Singleton instance
 */
export const anonymousAuthService = new AnonymousAuthService();
