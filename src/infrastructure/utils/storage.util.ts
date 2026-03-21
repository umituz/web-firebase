import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';

/**
 * Firebase Storage Utils
 * @description Upload and delete helpers for Firebase Storage
 */

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadFile(
  storage: FirebaseStorage,
  path: string,
  file: File | Blob,
): Promise<UploadResult> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function uploadBase64(
  storage: FirebaseStorage,
  path: string,
  base64: string,
  mimeType = 'image/jpeg',
): Promise<UploadResult> {
  const storageRef = ref(storage, path);
  const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
  await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteFile(storage: FirebaseStorage, path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
