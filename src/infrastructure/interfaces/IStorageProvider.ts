/**
 * @file IStorageProvider.ts
 * @module infrastructure/interfaces
 * @description Storage abstraction for audio recordings and certification documents (decoupled from Firebase Storage / S3 / GCS).
 */

export interface UploadOptions {
  contentType: string;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  uploadBlob(path: string, data: Blob | ArrayBuffer, options?: UploadOptions): Promise<string>;
  getDownloadUrl(path: string): Promise<string>;
  deleteBlob(path: string): Promise<void>;
}
