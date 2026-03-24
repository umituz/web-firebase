/**
 * Storage Adapter
 * @description Firebase Storage implementation of IFileRepository
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/services/storage.ts
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage'
import { getFirebaseStorage } from './client'
import type { IFileRepository } from '../../domain/interfaces/file.repository.interface'
import type {
  FileMetadata,
  UploadProgress,
  UploadResult,
  UploadOptions,
  StorageStats,
} from '../../domain/entities/file.entity'
import { createRepositoryError, RepositoryErrorCode } from '../../domain/errors/repository.errors'

export class StorageAdapter implements IFileRepository {
  private get storage() {
    const storage = getFirebaseStorage()
    if (!storage) {
      throw new Error('Firebase Storage not initialized. Call initializeFirebase() first.')
    }
    return storage
  }

  // Upload Methods

  async uploadFile(
    userId: string,
    path: string,
    file: File | Blob,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const storageRef = ref(this.storage, `users/${userId}/${path}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (options?.onProgress) {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              state: 'running',
            }
            options.onProgress(progress)
          }
        },
        (error) => reject(createRepositoryError(RepositoryErrorCode.STORAGE_ERROR, 'Upload failed', error)),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          const metadata = await getMetadata(uploadTask.snapshot.ref)

          resolve({
            id: uploadTask.snapshot.ref.name,
            name: metadata.name || uploadTask.snapshot.ref.name,
            fullPath: metadata.fullPath || uploadTask.snapshot.ref.fullPath,
            downloadURL,
            contentType: metadata.contentType || '',
            size: metadata.size || 0,
            createdAt: metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : Date.now(),
          })
        }
      )
    })
  }

  async uploadImage(userId: string, file: File, filename?: string): Promise<UploadResult> {
    const name = filename || `${Date.now()}_${file.name}`
    return this.uploadFile(userId, `images/${name}`, file)
  }

  async uploadVideo(userId: string, file: File, filename?: string): Promise<UploadResult> {
    const name = filename || `${Date.now()}_${file.name}`
    return this.uploadFile(userId, `videos/${name}`, file)
  }

  async uploadDocument(userId: string, file: File, filename?: string): Promise<UploadResult> {
    const name = filename || `${Date.now()}_${file.name}`
    return this.uploadFile(userId, `documents/${name}`, file)
  }

  async uploadProfilePicture(userId: string, file: File): Promise<UploadResult> {
    const storageRef = ref(this.storage, `users/${userId}/profile/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return {
      id: storageRef.name,
      name: file.name,
      fullPath: storageRef.fullPath,
      downloadURL,
      contentType: file.type,
      size: file.size,
      createdAt: Date.now(),
    }
  }

  // Download Methods

  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path)
      return await getDownloadURL(storageRef)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.FILE_NOT_FOUND, 'File not found', error)
    }
  }

  // Delete Methods

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path)
      await deleteObject(storageRef)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.FILE_NOT_FOUND, 'File not found', error)
    }
  }

  async deleteUserFiles(userId: string): Promise<void> {
    try {
      const userRef = ref(this.storage, `users/${userId}`)

      // Recursively delete all files and folders
      await this.deleteDirectoryRecursively(userRef)
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.STORAGE_ERROR, 'Failed to delete user files', error)
    }
  }

  /**
   * Recursively delete all files in a directory
   */
  private async deleteDirectoryRecursively(directoryRef: any): Promise<void> {
    const result = await listAll(directoryRef)

    // Delete all files in current directory (with concurrency limit)
    const concurrencyLimit = 10
    for (let i = 0; i < result.items.length; i += concurrencyLimit) {
      const batch = result.items.slice(i, i + concurrencyLimit)
      await Promise.all(batch.map((item) => deleteObject(item)))
    }

    // Recursively delete all subdirectories
    for (const prefix of result.prefixes) {
      await this.deleteDirectoryRecursively(prefix)
    }
  }

  async deleteImage(userId: string, filename: string): Promise<void> {
    await this.deleteFile(`users/${userId}/images/${filename}`)
  }

  async deleteVideo(userId: string, filename: string): Promise<void> {
    await this.deleteFile(`users/${userId}/videos/${filename}`)
  }

  async deleteProfilePicture(userId: string, filename: string): Promise<void> {
    await this.deleteFile(`users/${userId}/profile/${filename}`)
  }

  // List Methods

  async listUserFiles(userId: string, path?: string): Promise<string[]> {
    const userRef = ref(this.storage, path ? `users/${userId}/${path}` : `users/${userId}`)
    const result = await listAll(userRef)

    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)))
    return urls
  }

  async listUserImages(userId: string): Promise<string[]> {
    return this.listUserFiles(userId, 'images')
  }

  async listUserVideos(userId: string): Promise<string[]> {
    return this.listUserFiles(userId, 'videos')
  }

  // Metadata

  async getFileMetadata(path: string): Promise<FileMetadata> {
    try {
      const storageRef = ref(this.storage, path)
      const metadata = await getMetadata(storageRef)

      return {
        id: storageRef.name,
        name: metadata.name,
        fullPath: metadata.fullPath,
        contentType: metadata.contentType || 'application/octet-stream',
        size: metadata.size,
        createdAt: metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : Date.now(),
        updatedAt: metadata.updated ? new Date(metadata.updated).getTime() : Date.now(),
        userId: this.extractUserId(path) || 'unknown',
        type: this.extractFileType(metadata.contentType || ''),
      }
    } catch (error) {
      throw createRepositoryError(RepositoryErrorCode.FILE_NOT_FOUND, 'File not found', error)
    }
  }

  async queryFiles(userId: string, _filters?: Record<string, unknown>): Promise<{ files: FileMetadata[]; totalCount: number; hasMore: boolean }> {
    const userRef = ref(this.storage, `users/${userId}`)
    const result = await listAll(userRef)

    const files = await Promise.all(
      result.items.map(async (item) => {
        const metadata = await getMetadata(item)
        return {
          id: item.name,
          name: metadata.name,
          fullPath: metadata.fullPath,
          contentType: metadata.contentType || 'application/octet-stream',
          size: metadata.size,
          createdAt: metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : Date.now(),
          updatedAt: metadata.updated ? new Date(metadata.updated).getTime() : Date.now(),
          userId,
          type: this.extractFileType(metadata.contentType || ''),
        }
      })
    )

    return {
      files,
      totalCount: files.length,
      hasMore: false,
    }
  }

  async getStorageStats(userId: string): Promise<StorageStats> {
    const { files, totalCount } = await this.queryFiles(userId)

    const stats: StorageStats = {
      totalFiles: totalCount,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      filesByType: {
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        other: 0,
      },
      filesByCategory: {
        profile: 0,
        content: 0,
        document: 0,
        attachment: 0,
        backup: 0,
      },
    }

    files.forEach((file) => {
      stats.filesByType[file.type]++
      stats.lastUploadAt = Math.max(stats.lastUploadAt || 0, file.createdAt)
    })

    return stats
  }

  // Helper Methods

  private extractUserId(path: string): string {
    const match = path.match(/users\/([^\/]+)/)
    return match ? match[1] : ''
  }

  private extractFileType(contentType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (contentType.startsWith('image/')) return 'image'
    if (contentType.startsWith('video/')) return 'video'
    if (contentType.startsWith('audio/')) return 'audio'
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) {
      return 'document'
    }
    return 'other'
  }
}
