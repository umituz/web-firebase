/**
 * Storage Hook
 * @description React hook for file storage operations
 * Migrated from: /Users/umituz/Desktop/github/umituz/apps/web/app-growth-factory/src/domains/firebase/hooks/useStorage.ts
 */

import { useState, useCallback } from 'react'
import type { IFileRepository } from '../../domain/interfaces/file.repository.interface'
import type { UploadProgress, UploadResult } from '../../domain/entities/file.entity'

export interface UseStorageOptions {
  fileRepository: IFileRepository
  userId: string
}

export function useStorage({ fileRepository, userId }: UseStorageOptions) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const uploadFile = useCallback(
    async (path: string, file: File): Promise<UploadResult> => {
      setUploading(true)
      setProgress(0)
      setError(null)

      try {
        const result = await fileRepository.uploadFile(userId, path, file, {
          onProgress: (progress: UploadProgress) => {
            setProgress(progress.progress)
          },
        })

        setProgress(100)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [fileRepository, userId]
  )

  const uploadImage = useCallback(
    async (file: File): Promise<UploadResult> => {
      return uploadFile('images', file)
    },
    [uploadFile]
  )

  const uploadVideo = useCallback(
    async (file: File): Promise<UploadResult> => {
      return uploadFile('videos', file)
    },
    [uploadFile]
  )

  const uploadDocument = useCallback(
    async (file: File): Promise<UploadResult> => {
      return uploadFile('documents', file)
    },
    [uploadFile]
  )

  const uploadProfilePicture = useCallback(
    async (file: File): Promise<UploadResult> => {
      setUploading(true)
      setError(null)

      try {
        const result = await fileRepository.uploadProfilePicture(userId, file)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [fileRepository, userId]
  )

  const deleteFile = useCallback(
    async (path: string): Promise<void> => {
      setUploading(true)
      setError(null)

      try {
        await fileRepository.deleteFile(path)
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [fileRepository]
  )

  const listUserImages = useCallback(
    async (): Promise<string[]> => {
      setError(null)
      try {
        return await fileRepository.listUserImages(userId)
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },
    [fileRepository, userId]
  )

  const listUserVideos = useCallback(
    async (): Promise<string[]> => {
      setError(null)
      try {
        return await fileRepository.listUserVideos(userId)
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },
    [fileRepository, userId]
  )

  return {
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadDocument,
    uploadProfilePicture,
    deleteFile,
    listUserImages,
    listUserVideos,
    uploading,
    progress,
    error,
  }
}
