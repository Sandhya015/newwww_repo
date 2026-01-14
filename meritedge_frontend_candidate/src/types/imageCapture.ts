/**
 * Image Capture Types
 * 
 * TypeScript interfaces and types for image capture and S3 upload functionality
 */

export interface ImageCaptureConfig {
    quality: number; // 0-1, JPEG quality
    maxWidth?: number; // Maximum width for image compression
    maxHeight?: number; // Maximum height for image compression
    format: 'image/jpeg' | 'image/png';
}

export interface S3UploadConfig {
    bucket: string;
    region: string;
    folder: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface ImageCaptureStatus {
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
    warningMessage?: string;
    lastUploadedUrl?: string;
}

export interface ImageMetadata {
    candidateId: string;
    assessmentId: string;
    sessionId: string;
    timestamp: string;
    size: number;
    format: string;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
}

export interface ImageCaptureHookOptions {
    config?: Partial<ImageCaptureConfig>;
    s3Config?: Partial<S3UploadConfig>;
    onUploadComplete?: (result: UploadResult) => void;
    onUploadError?: (error: Error) => void;
    onStatusChange?: (status: ImageCaptureStatus) => void;
}

export interface ImageCaptureHook {
    captureAndUpload: (imageBlob: Blob, metadata: ImageMetadata) => Promise<UploadResult>;
    status: ImageCaptureStatus;
    isUploading: boolean;
    error: string | null;
}

