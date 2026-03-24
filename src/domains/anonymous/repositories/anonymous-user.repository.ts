/**
 * Anonymous User Repository Implementation
 * Firestore-based repository for anonymous user data
 */

import { FirestoreRepository } from '../../firestore'
import type { AnonymousUser, CreateAnonymousUserDto } from '../entities/anonymous-user.entity'
import type { IAnonymousUserRepository } from './anonymous-user.repository.interface'

export class AnonymousUserRepository extends FirestoreRepository<any> implements IAnonymousUserRepository {
  constructor() {
    super('users')
  }

  async createAnonymousUser(dto: CreateAnonymousUserDto): Promise<void> {
    const userData = {
      id: dto.uid,
      email: null,
      name: null,
      avatar: null,
      isAnonymous: true,
      anonymousMetadata: dto.metadata,
      metadata: dto.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.create(dto.uid, userData)
  }

  async updateActivity(userId: string): Promise<void> {
    const user = await this.getById(userId)
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
      uid: user.id,
      isAnonymous: user.isAnonymous || false,
      metadata: user.anonymousMetadata || user.metadata,
      additionalData: user.metadata,
    }
  }

  async isAnonymousUser(userId: string): Promise<boolean> {
    const user = await this.getById(userId)
    return user?.isAnonymous || false
  }
}
