/**
 * File Repository Interface
 * @description Generic contract for file storage operations
 */

export interface IFileRepository {
  /**
   * Upload file to storage
   */
  uploadFile(userId: string, path: string, file: File | Blob, options?: any): Promise<any>

  /**
   * Upload image with automatic categorization
   */
  uploadImage(userId: string, file: File, filename?: string): Promise<any>

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: string, file: File): Promise<any>

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
   * List user files
   */
  listUserFiles(userId: string, path?: string): Promise<string[]>

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: any): boolean
}
