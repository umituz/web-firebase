/**
 * Anonymous Auth Service
 * Handles Firebase Anonymous Authentication and user tracking
 */

import { signInAnonymously } from 'firebase/auth'
import { getFirebaseAuth } from '../../../infrastructure/firebase/client'
import type { AnonymousUserMetadata } from '../entities/anonymous-user.entity'
import type { IAnonymousUserRepository } from '../repositories/anonymous-user.repository.interface'
import type { AnonymousAuthConfig } from '../types/anonymous-auth.types'

export class AnonymousAuthService {
  private config: AnonymousAuthConfig;
  private deviceId: string | null = null;
  private repository: IAnonymousUserRepository;

  constructor(
    repository: IAnonymousUserRepository,
    config?: Partial<AnonymousAuthConfig>
  ) {
    this.repository = repository;
    this.config = {
      enabled: config?.enabled ?? true,
      autoCreate: config?.autoCreate ?? true,
      storageKeys: config?.storageKeys ?? {
        anonymousUserCreated: 'anonymous_user_created',
        anonymousUid: 'anonymous_uid',
        deviceId: 'device_id',
      },
    };
  }

  /**
   * Get or create device ID
   */
  private getDeviceId(): string {
    if (this.deviceId) return this.deviceId;

    let storedDeviceId = localStorage.getItem(this.config.storageKeys.deviceId);
    if (!storedDeviceId) {
      storedDeviceId = this.generateDeviceId();
      localStorage.setItem(this.config.storageKeys.deviceId, storedDeviceId);
    }

    this.deviceId = storedDeviceId;
    return storedDeviceId;
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Check if anonymous user already exists in localStorage
   */
  hasAnonymousUser(): boolean {
    return localStorage.getItem(this.config.storageKeys.anonymousUserCreated) === 'true';
  }

  /**
   * Get stored anonymous UID from localStorage
   */
  getStoredAnonymousUid(): string | null {
    return localStorage.getItem(this.config.storageKeys.anonymousUid);
  }

  /**
   * Sign in as anonymous user
   * Creates new anonymous user or restores existing one
   */
  async signInAsAnonymous(additionalData?: Record<string, unknown>): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      // Check if already has anonymous user
      if (this.hasAnonymousUser()) {
        const storedUid = this.getStoredAnonymousUid();
        if (storedUid) {
          // Verify user still exists
          const user = await this.repository.getById(storedUid);
          if (user) {
            // Update activity
            await this.updateActivity(storedUid);
            return storedUid;
          }
        }
      }

      // Get Firebase auth
      const auth = getFirebaseAuth();
      if (!auth) {
        console.error('[AnonymousAuth] Firebase auth not initialized');
        return null;
      }

      // Create Firebase anonymous user
      const userCredential = await signInAnonymously(auth);
      const anonymousUid = userCredential.user.uid;

      // Prepare metadata
      const metadata: AnonymousUserMetadata = {
        deviceId: this.getDeviceId(),
        firstVisitAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        sessionCount: 1,
      };

      // Create user document via repository
      await this.repository.createAnonymousUser({
        uid: anonymousUid,
        deviceId: metadata.deviceId,
        metadata: {
          ...metadata,
          ...additionalData,
        },
      });

      // Store in localStorage
      localStorage.setItem(this.config.storageKeys.anonymousUserCreated, 'true');
      localStorage.setItem(this.config.storageKeys.anonymousUid, anonymousUid);

      console.log('[AnonymousAuth] Created anonymous user:', anonymousUid);

      return anonymousUid;
    } catch (error) {
      console.error('[AnonymousAuth] Failed to sign in anonymously:', error);
      return null;
    }
  }

  /**
   * Update anonymous user activity
   */
  async updateActivity(userId: string): Promise<void> {
    try {
      await this.repository.updateActivity(userId);
    } catch (error) {
      console.error('[AnonymousAuth] Failed to update activity:', error);
    }
  }

  /**
   * Clear anonymous user data from localStorage
   * Call after successful migration to authenticated user
   */
  clearAnonymousData(): void {
    localStorage.removeItem(this.config.storageKeys.anonymousUserCreated);
    localStorage.removeItem(this.config.storageKeys.anonymousUid);
    // Keep device ID for tracking continuity
    this.deviceId = null;
  }

  /**
   * Get device ID for analytics and tracking
   */
  getDeviceIdForTracking(): string {
    return this.getDeviceId();
  }

  /**
   * Check if anonymous auth is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable anonymous auth
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}
