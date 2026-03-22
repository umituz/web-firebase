/**
 * File Repository Interface
 * @description Generic contract for file storage operations
 */

import type { UploadResult, UploadOptions, FileValidationOptions } from '../entities/file.entity'

export interface IFileRepository {
  /**
   * Upload file to storage
   */
  uploadFile(userId: string, path: string, file: File | Blob, options?: UploadOptions): Promise<UploadResult>

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
   * Delete specific media types
   */
  deleteImage(userId: string, filename: string): Promise<void>
  deleteVideo(userId: string, filename: string): Promise<void>
  deleteProfilePicture(userId: string, filename: string): Promise<void>

  /**
   * List user files
   */
  listUserFiles(userId: string, path?: string): Promise<string[]>

  /**
   * List specific media types
   */
  listUserImages(userId: string): Promise<string[]>
  listUserVideos(userId: string): Promise<string[]>

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: FileValidationOptions): boolean
}
