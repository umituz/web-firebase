/**
 * Anonymous User Repository Implementation
 * Firestore-based repository for anonymous user data
 */

import { FirestoreRepository } from '../../firestore'
import type { AnonymousUser, CreateAnonymousUserDto, AnonymousUserMetadata } from '../entities/anonymous-user.entity'
import type { IAnonymousUserRepository } from './anonymous-user.repository.interface'

/**
 * Shape of an anonymous user document as stored in the `users` collection.
 * Storage-only fields are optional so the mapped `AnonymousUser` view stays
 * assignable to this type.
 */
export interface AnonymousUserDocument {
  uid: string
  isAnonymous: boolean
  metadata: AnonymousUserMetadata
  additionalData?: Record<string, unknown>
  /** Storage-only fields written to Firestore */
  id?: string
  email?: string | null
  name?: string | null
  avatar?: string | null
  anonymousMetadata?: AnonymousUserMetadata
  createdAt?: string
  updatedAt?: string
}

export class AnonymousUserRepository extends FirestoreRepository<AnonymousUserDocument> implements IAnonymousUserRepository {
  constructor() {
    super('users')
  }

  async createAnonymousUser(dto: CreateAnonymousUserDto): Promise<void> {
    const now = new Date().toISOString()
    const metadata: AnonymousUserMetadata = {
      deviceId: dto.deviceId,
      firstVisitAt: now,
      lastActivityAt: now,
      sessionCount: 1,
      ...(dto.metadata ?? {}),
    }

    const userData: AnonymousUserDocument = {
      uid: dto.uid,
      isAnonymous: true,
      metadata,
      id: dto.uid,
      email: null,
      name: null,
      avatar: null,
      anonymousMetadata: metadata,
      createdAt: now,
      updatedAt: now,
    }

    await this.create(dto.uid, userData)
  }

  async updateActivity(userId: string): Promise<void> {
    const user = await super.getById(userId)
    if (user && user.isAnonymous && user.metadata) {
      await this.update(userId, {
        anonymousMetadata: {
          ...user.metadata,
          lastActivityAt: new Date().toISOString(),
          sessionCount: (user.metadata.sessionCount || 0) + 1,
        },
        updatedAt: new Date().toISOString(),
      })
    }
  }

  async getById(userId: string): Promise<AnonymousUser | null> {
    const user = await super.getById(userId)
    if (!user) return null

    return {
      uid: user.id ?? userId,
      // Documents in this repository are anonymous by construction; the
      // runtime flag is preserved for legacy documents that lack it.
      isAnonymous: (user.isAnonymous || false) as true,
      metadata: user.anonymousMetadata || user.metadata,
      additionalData: { ...user.metadata },
    }
  }

  async isAnonymousUser(userId: string): Promise<boolean> {
    const user = await this.getById(userId)
    return user?.isAnonymous || false
  }
}
