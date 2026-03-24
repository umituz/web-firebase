/**
 * Base Firestore Entity
 * @description Base entity for all Firestore documents with audit fields
 * @domain Firestore
 * @layer Domain
 */

export interface BaseFirestoreEntity {
  /**
   * Document ID (optional for create operations)
   */
  id?: string;

  /**
   * Document creation timestamp (ISO 8601 format)
   * @example "2024-03-23T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * Last update timestamp (ISO 8601 format)
   * @example "2024-03-23T12:00:00.000Z"
   */
  updatedAt: string;

  /**
   * User ID who created the document
   */
  createdBy?: string;

  /**
   * User ID who last updated the document
   */
  updatedBy?: string;

  /**
   * Document version for optimistic locking
   * @default 1
   */
  version?: number;

  /**
   * Soft delete flag
   * @default false
   */
  isDeleted?: boolean;

  /**
   * Soft delete timestamp
   */
  deletedAt?: string;

  /**
   * Tenant ID for multi-tenant applications
   */
  tenantId?: string;
}

/**
 * Create base audit fields for new documents
 * @param userId - User ID creating the document
 * @param tenantId - Optional tenant ID
 * @returns Base audit fields
 */
export function createAuditFields(
  userId?: string,
  tenantId?: string
): Omit<BaseFirestoreEntity, 'id'> {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    version: 1,
    isDeleted: false,
    tenantId,
  };
}

/**
 * Update audit fields for document updates
 * @param userId - User ID updating the document
 * @param currentVersion - Current document version
 * @returns Updated audit fields
 */
export function updateAuditFields(
  userId?: string,
  currentVersion = 1
): Pick<BaseFirestoreEntity, 'updatedAt' | 'updatedBy' | 'version'> {
  return {
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
    version: currentVersion + 1,
  };
}

/**
 * Mark document as deleted (soft delete)
 * @returns Soft delete fields
 */
export function softDeleteFields(): Pick<BaseFirestoreEntity, 'isDeleted' | 'deletedAt' | 'updatedAt'> {
  return {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
