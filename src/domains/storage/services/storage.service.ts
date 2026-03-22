/**
 * Storage Service
 * @description Firebase Storage implementation of IStorageService
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
import { getFirebaseStorage } from '../../../infrastructure/firebase/client'
import type { IStorageService } from '../types'
import type {
  UploadResult,
  UploadOptions,
} from '../entities'

class StorageService implements IStorageService {
  private get storage() {
    return getFirebaseStorage()
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
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              state: 'running' as const,
            }
            options.onProgress(progress)
          }
        },
        () => reject(new Error('Upload failed')),
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
    } catch {
      throw new Error('File not found')
    }
  }

  // Delete Methods

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path)
      await deleteObject(storageRef)
    } catch {
      throw new Error('File not found')
    }
  }

  async deleteUserFiles(userId: string): Promise<void> {
    try {
      const userRef = ref(this.storage, `users/${userId}`)
      const result = await listAll(userRef)

      // Delete all files in all prefixes
      for (const prefix of result.prefixes) {
        const prefixResult = await listAll(prefix)
        await Promise.all(prefixResult.items.map((item) => deleteObject(item)))
      }

      // Delete all files in root
      await Promise.all(result.items.map((item) => deleteObject(item)))
    } catch {
      throw new Error('Failed to delete user files')
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

  // Validation

  validateFile(file: File, options?: { maxSizeBytes?: number; maxSizeMB?: number; allowedTypes?: string[] }): boolean {
    const maxSizeBytes = options?.maxSizeBytes || (options?.maxSizeMB ? options.maxSizeMB * 1024 * 1024 : 10 * 1024 * 1024)

    if (file.size > maxSizeBytes) {
      return false
    }

    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return false
    }

    return true
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }

  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/')
  }

  isDocumentFile(file: File): boolean {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]
    return docTypes.includes(file.type)
  }

  // Utility Methods

  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = this.getFileExtension(originalName)
    return `${timestamp}_${random}.${extension}`
  }

  getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
  }
}

// Export class and singleton instance
export const storageService = new StorageService()
