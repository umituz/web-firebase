/**
 * Storage Service Interface
 * @description Abstract interface for storage operations
 */

import type {
  UploadResult,
  UploadOptions,
} from '../entities'
import type { FileValidationOptions } from '../../../domain/entities/file.entity'

export interface IStorageService {
  /**
   * Upload file to storage
   */
  uploadFile(
    userId: string,
    path: string,
    file: File | Blob,
    options?: UploadOptions
  ): Promise<UploadResult>

  /**
   * Upload image with automatic categorization
   */
  uploadImage(userId: string, file: File, filename?: string): Promise<UploadResult>

  /**
   * Upload video with automatic categorization
   */
  uploadVideo(userId: string, file: File, filename?: string): Promise<UploadResult>

  /**
   * Upload document with automatic categorization
   */
  uploadDocument(userId: string, file: File, filename?: string): Promise<UploadResult>

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: string, file: File): Promise<UploadResult>

  /**
   * Get download URL for a file
   */
  getDownloadURL(path: string): Promise<string>

  /**
   * Delete file by path
   */
  deleteFile(path: string): Promise<void>

  /**
   * Delete all user files
   */
  deleteUserFiles(userId: string): Promise<void>

  /**
   * Delete user image
   */
  deleteImage(userId: string, filename: string): Promise<void>

  /**
   * Delete user video
   */
  deleteVideo(userId: string, filename: string): Promise<void>

  /**
   * Delete profile picture
   */
  deleteProfilePicture(userId: string, filename: string): Promise<void>

  /**
   * List user files
   */
  listUserFiles(userId: string, path?: string): Promise<string[]>

  /**
   * List user images
   */
  listUserImages(userId: string): Promise<string[]>

  /**
   * List user videos
   */
  listUserVideos(userId: string): Promise<string[]>

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: FileValidationOptions): boolean

  /**
   * Check if file is an image
   */
  isImageFile(file: File): boolean

  /**
   * Check if file is a video
   */
  isVideoFile(file: File): boolean

  /**
   * Check if file is a document
   */
  isDocumentFile(file: File): boolean

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalName: string): string

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string
}
