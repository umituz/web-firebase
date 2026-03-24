/**
 * Anonymous User Entity
 * Represents an anonymous user in the system
 */

export interface AnonymousUserMetadata {
  deviceId: string;
  firstVisitAt: string;
  lastActivityAt: string;
  sessionCount: number;
}

export interface AnonymousUser {
  uid: string;
  isAnonymous: true;
  metadata: AnonymousUserMetadata;
  additionalData?: Record<string, unknown>;
}

export interface CreateAnonymousUserDto {
  uid: string;
  deviceId: string;
  metadata?: Record<string, unknown>;
}
