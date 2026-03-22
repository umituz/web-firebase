/**
 * File Repository Interface
 * @description Defines contract for file storage operations
 */

import type {
  FileMetadata,
  UploadResult,
  UploadOptions,
  FileFilters,
  FileQueryResult,
  StorageStats,
} from '../entities/file.entity'

/**
 * File Repository Interface
 * Defines operations for file storage and management
 */
export interface IFileRepository {
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
   * Get file metadata
   */
  getFileMetadata(path: string): Promise<FileMetadata>

  /**
   * Query files with filters
   */
  queryFiles(userId: string, filters?: FileFilters): Promise<FileQueryResult>

  /**
   * Get storage statistics
   */
  getStorageStats(userId: string): Promise<StorageStats>

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: {
    maxSizeBytes?: number
    maxSizeMB?: number
    allowedTypes?: string[]
  }): boolean

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
