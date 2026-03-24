/**
 * Anonymous Auth Types
 * Configuration and type definitions for anonymous authentication
 */

export interface AnonymousAuthConfig {
  enabled: boolean;
  autoCreate: boolean;
  storageKeys: {
    anonymousUserCreated: string;
    anonymousUid: string;
    deviceId: string;
  };
}

export const DEFAULT_ANONYMOUS_AUTH_CONFIG: AnonymousAuthConfig = {
  enabled: true,
  autoCreate: true,
  storageKeys: {
    anonymousUserCreated: 'anonymous_user_created',
    anonymousUid: 'anonymous_uid',
    deviceId: 'device_id',
  },
};

export type AnonymousUserStorageKeys = keyof AnonymousAuthConfig['storageKeys'];
