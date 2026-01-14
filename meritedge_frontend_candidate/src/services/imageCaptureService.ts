/**
 * Image Capture Service
 * 
 * Handles image compression and optimization before upload
 */

import { ImageCaptureConfig } from '../types/imageCapture';
import { IMAGE_SIZE_LIMITS } from '../config/imageCaptureConfig';

export class ImageCaptureService {
    private readonly config: ImageCaptureConfig;

    constructor(config: ImageCaptureConfig) {
        this.config = config;
        console.log('📸 ImageCaptureService initialized with config:', config);
    }

    /**
     * Compress and optimize image blob
     */
    async compressImage(blob: Blob): Promise<Blob> {
        console.log('🔄 Starting image compression:', {
            originalSize: blob.size,
            originalType: blob.type
        });

        // If blob is already small enough, return as is
        if (blob.size <= IMAGE_SIZE_LIMITS.WARNING_SIZE) {
            console.log('✅ Image size acceptable, skipping compression');
            return blob;
        }

        try {
            // Create image element
            const img = await this.createImageFromBlob(blob);
            
            // Calculate new dimensions
            const { width, height } = this.calculateDimensions(
                img.width,
                img.height,
                this.config.maxWidth,
                this.config.maxHeight
            );

            // Create canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get canvas context');
            }

            // Draw image with high quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            const compressedBlob = await this.canvasToBlob(canvas, this.config.format, this.config.quality);

            console.log('✅ Image compression complete:', {
                originalSize: blob.size,
                compressedSize: compressedBlob.size,
                reduction: `${((1 - compressedBlob.size / blob.size) * 100).toFixed(2)}%`,
                dimensions: `${width}x${height}`
            });

            return compressedBlob;

        } catch (error) {
            console.error('❌ Image compression failed:', error);
            // Return original blob if compression fails
            return blob;
        }
    }

    /**
     * Create image element from blob
     */
    private createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Calculate dimensions maintaining aspect ratio
     */
    private calculateDimensions(
        width: number,
        height: number,
        maxWidth?: number,
        maxHeight?: number
    ): { width: number; height: number } {
        // If no limits, return original dimensions
        if (!maxWidth && !maxHeight) {
            return { width, height };
        }

        // Calculate scaling factor
        let scale = 1;

        if (maxWidth && width > maxWidth) {
            scale = Math.min(scale, maxWidth / width);
        }

        if (maxHeight && height > maxHeight) {
            scale = Math.min(scale, maxHeight / height);
        }

        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale)
        };
    }

    /**
     * Convert canvas to blob
     */
    private canvasToBlob(
        canvas: HTMLCanvasElement,
        format: string,
        quality: number
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                },
                format,
                quality
            );
        });
    }

    /**
     * Validate image blob
     */
    validateImage(blob: Blob): { valid: boolean; error?: string; warning?: string } {
        // Check if blob exists
        if (!blob) {
            return { valid: false, error: 'No image provided' };
        }

        // Check size
        if (blob.size < IMAGE_SIZE_LIMITS.MIN_SIZE) {
            return { valid: false, error: 'Image is too small' };
        }

        if (blob.size > IMAGE_SIZE_LIMITS.MAX_SIZE) {
            return { valid: false, error: 'Image is too large' };
        }

        // Check type
        if (!blob.type.startsWith('image/')) {
            return { valid: false, error: 'Invalid image format' };
        }

        // Warning for large images
        if (blob.size > IMAGE_SIZE_LIMITS.WARNING_SIZE) {
            return { 
                valid: true, 
                warning: 'Image is large and will be compressed' 
            };
        }

        return { valid: true };
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(blob: Blob): Promise<{
        width: number;
        height: number;
        size: number;
        format: string;
    }> {
        const img = await this.createImageFromBlob(blob);
        
        return {
            width: img.width,
            height: img.height,
            size: blob.size,
            format: blob.type
        };
    }
}

