/**
 * Storage Domain Entities
 * @description File and storage-related entities
 */

/**
 * File Metadata Entity
 * Contains metadata about uploaded files
 */
export interface FileMetadata {
  readonly id: string
  readonly name: string
  readonly fullPath: string
  readonly contentType: string
  readonly size: number
  readonly createdAt: number
  readonly updatedAt: number
  readonly userId: string
  readonly type: FileType
  category?: FileCategory
  description?: string
  tags?: string[]
}

/**
 * File Types
 */
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other'

/**
 * File Categories
 */
export type FileCategory = 'profile' | 'content' | 'document' | 'attachment' | 'backup'

/**
 * Upload Progress Entity
 * Tracks upload progress for resumable uploads
 */
export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  progress: number // 0-100
  state: UploadState
  speed?: number // bytes per second
  remaining?: number // seconds remaining
}

/**
 * Upload States
 */
export type UploadState =
  | 'paused'
  | 'running'
  | 'success'
  | 'canceled'
  | 'error'

/**
 * File Upload Result Entity
 * Result of a file upload operation
 */
export interface FileUploadResult {
  readonly id: string
  readonly name: string
  readonly fullPath: string
  readonly downloadURL: string
  readonly contentType: string
  readonly size: number
  readonly createdAt: number
}

// Export as UploadResult for backward compatibility
export type UploadResult = FileUploadResult

/**
 * Upload Options
 * Configuration for file uploads
 */
export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  metadata?: FileMetadata
  customMetadata?: Record<string, string>
}

/**
 * Storage Statistics
 */
export interface StorageStats {
  totalFiles: number
  totalSize: number
  filesByType: Record<FileType, number>
  filesByCategory: Record<FileCategory, number>
  lastUploadAt?: number
}
