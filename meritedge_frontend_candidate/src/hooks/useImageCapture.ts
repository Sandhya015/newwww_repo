/**
 * Image Capture Hook
 * 
 * React hook for capturing images and uploading to S3
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ImageCaptureService } from '../services/imageCaptureService';
import { S3UploadService } from '../services/s3UploadService';
import {
    ImageCaptureConfig,
    S3UploadConfig,
    ImageCaptureStatus,
    ImageMetadata,
    UploadResult,
    ImageCaptureHookOptions,
    ImageCaptureHook
} from '../types/imageCapture';
import { defaultImageCaptureConfig, s3Config, validateS3Config } from '../config/imageCaptureConfig';

export const useImageCapture = (options?: ImageCaptureHookOptions): ImageCaptureHook => {
    // Services
    const imageCaptureServiceRef = useRef<ImageCaptureService | null>(null);
    const s3UploadServiceRef = useRef<S3UploadService | null>(null);
    const isInitializedRef = useRef(false);

    // Store callbacks in refs to avoid dependency issues
    const onUploadCompleteRef = useRef(options?.onUploadComplete);
    const onUploadErrorRef = useRef(options?.onUploadError);
    const onStatusChangeRef = useRef(options?.onStatusChange);

    // Update refs when options change
    useEffect(() => {
        onUploadCompleteRef.current = options?.onUploadComplete;
        onUploadErrorRef.current = options?.onUploadError;
        onStatusChangeRef.current = options?.onStatusChange;
    }, [options]);

    // State
    const [status, setStatus] = useState<ImageCaptureStatus>({
        isUploading: false,
        uploadProgress: 0,
        error: null
    });

    // Initialize services (only once)
    useEffect(() => {
        if (isInitializedRef.current) {
            return;
        }

        // Validate S3 configuration
        if (!validateS3Config()) {
            console.warn('⚠️ S3 not configured - image upload will be skipped');
            isInitializedRef.current = true;
            return;
        }

        // Initialize image capture service
        const captureConfig: ImageCaptureConfig = {
            ...defaultImageCaptureConfig,
            ...options?.config
        };
        imageCaptureServiceRef.current = new ImageCaptureService(captureConfig);

        // Initialize S3 upload service
        const uploadConfig: S3UploadConfig = {
            ...s3Config,
            ...options?.s3Config
        };
        s3UploadServiceRef.current = new S3UploadService(uploadConfig);

        isInitializedRef.current = true;
        console.log('✅ Image capture hook initialized');
    }, []); // Empty dependency array - initialize only once

    /**
     * Update status and notify listeners
     */
    const updateStatus = useCallback((newStatus: Partial<ImageCaptureStatus>) => {
        setStatus(prev => {
            const updated = { ...prev, ...newStatus };
            // Use ref to avoid dependency on options
            if (onStatusChangeRef.current) {
                onStatusChangeRef.current(updated);
            }
            return updated;
        });
    }, []); // No dependencies - uses refs instead

    /**
     * Capture and upload image to S3
     */
    const captureAndUpload = useCallback(async (
        imageBlob: Blob,
        metadata: ImageMetadata
    ): Promise<UploadResult> => {
        console.log('📸 Starting image capture and upload process');

        // Check if services are initialized
        if (!imageCaptureServiceRef.current || !s3UploadServiceRef.current) {
            const error = 'S3 upload not configured - image saved locally only';
            console.warn('⚠️', error);
            
            // Don't treat this as an error - just skip upload
            return { 
                success: true, // Return success so user can proceed
                error: undefined 
            };
        }

        const imageCaptureService = imageCaptureServiceRef.current;
        const s3UploadService = s3UploadServiceRef.current;

        try {
            // Update status: Starting
            updateStatus({
                isUploading: true,
                uploadProgress: 0,
                error: null
            });

            // Step 1: Validate image
            console.log('🔍 Step 1: Validating image');
            const validation = imageCaptureService.validateImage(imageBlob);
            
            if (!validation.valid) {
                throw new Error(validation.error || 'Image validation failed');
            }

            if (validation.warning) {
                updateStatus({ warningMessage: validation.warning });
                console.warn('⚠️', validation.warning);
            }

            updateStatus({ uploadProgress: 20 });

            // Step 2: Compress image
            console.log('🔄 Step 2: Compressing image');
            const compressedBlob = await imageCaptureService.compressImage(imageBlob);
            
            updateStatus({ uploadProgress: 40 });

            // Step 3: Validate network
            console.log('🌐 Step 3: Validating network connection');
            const isConnected = await s3UploadService.validateConnection();
            
            if (!isConnected) {
                console.warn('⚠️ Network validation failed, attempting upload anyway');
            }

            updateStatus({ uploadProgress: 50 });

            // Step 4: Upload to S3
            console.log('📤 Step 4: Uploading to S3');
            const result = await s3UploadService.uploadImage(
                compressedBlob,
                metadata,
                (progress) => {
                    updateStatus({ uploadProgress: 50 + (progress / 2) }); // 50-100%
                }
            );

            if (result.success) {
                // Upload successful
                console.log('✅ Image capture and upload complete:', result.url);
                
                updateStatus({
                    isUploading: false,
                uploadProgress: 100,
                error: null,
                lastUploadedUrl: result.url
            });

                // Use ref to avoid dependency issues
                if (onUploadCompleteRef.current) {
                    onUploadCompleteRef.current(result);
                }
                
                return result;
            } else {
                // Upload failed
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('❌ Image capture and upload failed:', errorMessage);

            updateStatus({
                isUploading: false,
                uploadProgress: 0,
                error: errorMessage
            });

            // Use ref to avoid dependency issues
            if (onUploadErrorRef.current) {
                onUploadErrorRef.current(error instanceof Error ? error : new Error(errorMessage));
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [updateStatus]); // Only depend on updateStatus

    return {
        captureAndUpload,
        status,
        isUploading: status.isUploading,
        error: status.error
    };
};

