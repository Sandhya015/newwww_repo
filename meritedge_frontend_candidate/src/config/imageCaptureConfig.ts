/**
 * Image Capture Configuration
 * 
 * Configuration settings for image capture and S3 upload
 */

import { ImageCaptureConfig, S3UploadConfig } from '../types/imageCapture';

// Default image capture configuration
export const defaultImageCaptureConfig: ImageCaptureConfig = {
    quality: 0.9, // High quality JPEG
    maxWidth: 1920, // Max width for compression
    maxHeight: 1080, // Max height for compression
    format: 'image/jpeg'
};

// S3 configuration from environment variables
export const s3Config: S3UploadConfig = {
    bucket: import.meta.env.VITE_AWS_S3_BUCKET || 'meritedgecandidate',
    region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
    folder: import.meta.env.VITE_AWS_S3_FOLDER || 'candidate_images',
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
};

// Validate S3 configuration
export const validateS3Config = (): boolean => {
    if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
        console.warn('⚠️ S3 credentials not configured. Create .env.local file in project root.');
        console.warn('⚠️ Image will be captured locally only (no cloud upload).');
        return false;
    }
    
    if (!s3Config.bucket) {
        console.warn('⚠️ S3 bucket not configured. Please check your .env file.');
        return false;
    }
    
    console.log('✅ S3 configuration validated successfully');
    return true;
};

// Image size limits
export const IMAGE_SIZE_LIMITS = {
    MIN_SIZE: 1 * 1024, // 1 KB minimum (reduced for webcam captures)
    MAX_SIZE: 10 * 1024 * 1024, // 10 MB maximum
    WARNING_SIZE: 5 * 1024 * 1024 // 5 MB warning threshold
};

// Upload retry configuration
export const UPLOAD_RETRY_CONFIG = {
    MAX_RETRIES: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 5000, // 5 seconds
    BACKOFF_MULTIPLIER: 2
};

