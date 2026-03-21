/**
 * Firebase Entity Types
 */

export type FirebaseTimestamp = { toDate(): Date } | Date;

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
