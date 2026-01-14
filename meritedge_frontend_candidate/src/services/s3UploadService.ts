/**
 * S3 Upload Service
 * 
 * Handles image uploads to AWS S3 with retry logic and error handling
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3UploadConfig, UploadResult, ImageMetadata } from '../types/imageCapture';
import { UPLOAD_RETRY_CONFIG } from '../config/imageCaptureConfig';

export class S3UploadService {
    private readonly s3Client: S3Client;
    private readonly config: S3UploadConfig;

    constructor(config: S3UploadConfig) {
        this.config = config;
        
        // Initialize S3 client
        this.s3Client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            }
        });

        console.log('🔧 S3UploadService initialized for bucket:', config.bucket);
    }

    /**
     * Generate S3 key for the image
     * Format: candidate_images/{candidate_id}/{assessment_id}/image_{timestamp}.{ext}
     */
    private generateS3Key(metadata: ImageMetadata): string {
        const { candidateId, assessmentId, timestamp } = metadata;
        const fileExtension = metadata.format.split('/')[1]; // jpeg or png
        
        // Clean IDs (remove any special characters that might cause issues)
        const cleanCandidateId = this.cleanS3Key(candidateId);
        const cleanAssessmentId = this.cleanS3Key(assessmentId);
        
        // Format: candidate_images/{candidate_id}/{assessment_id}/image_{timestamp}.{ext}
        return `${this.config.folder}/${cleanCandidateId}/${cleanAssessmentId}/image_${timestamp}.${fileExtension}`;
    }

    /**
     * Clean S3 key component (remove or replace invalid characters)
     */
    private cleanS3Key(str: string): string {
        // S3 keys allow: alphanumeric, !, -, _, ., *, ', (, ), /
        // Replace any other characters with underscore
        // Also limit length to avoid hitting S3's 1024 character limit
        return str
            .replace(/[^a-zA-Z0-9!_.*'()-]/g, '_') // Replace invalid chars
            .substring(0, 200); // Limit to 200 chars per component
    }

    /**
     * Upload image to S3 with retry logic
     */
    async uploadImage(
        imageBlob: Blob,
        metadata: ImageMetadata,
        onProgress?: (progress: number) => void
    ): Promise<UploadResult> {
        const key = this.generateS3Key(metadata);
        
        console.log('📤 Starting S3 upload:', {
            key,
            size: imageBlob.size,
            type: imageBlob.type
        });

        let lastError: Error | null = null;
        let delay = UPLOAD_RETRY_CONFIG.INITIAL_DELAY;

        // Retry loop
        for (let attempt = 1; attempt <= UPLOAD_RETRY_CONFIG.MAX_RETRIES; attempt++) {
            try {
                // Convert Blob to ArrayBuffer
                const arrayBuffer = await imageBlob.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);

                // Create upload command with public read access
                const command = new PutObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: imageBlob.type,
                    ACL: 'public-read', // Enable public read access
                    Metadata: {
                        'candidate-id': metadata.candidateId,
                        'session-id': metadata.sessionId,
                        'timestamp': metadata.timestamp,
                        'size': metadata.size.toString()
                    }
                });

                // Update progress
                if (onProgress) {
                    onProgress(50); // Starting upload
                }

                // Execute upload
                await this.s3Client.send(command);

                // Generate S3 URL
                const url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;

                // Update progress
                if (onProgress) {
                    onProgress(100); // Upload complete
                }

                console.log('✅ S3 upload successful:', url);

                return {
                    success: true,
                    url,
                    key
                };

            } catch (error) {
                lastError = error as Error;
                console.error(`❌ Upload attempt ${attempt} failed:`, error);

                // If not the last attempt, wait before retrying
                if (attempt < UPLOAD_RETRY_CONFIG.MAX_RETRIES) {
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                    delay = Math.min(delay * UPLOAD_RETRY_CONFIG.BACKOFF_MULTIPLIER, UPLOAD_RETRY_CONFIG.MAX_DELAY);
                }
            }
        }

        // All retries failed
        return {
            success: false,
            error: lastError?.message || 'Upload failed after multiple attempts'
        };
    }

    /**
     * Validate network connection before upload
     */
    async validateConnection(): Promise<boolean> {
        try {
            // Simple connectivity check
            await fetch(`https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            console.error('❌ Network validation failed:', error);
            return false;
        }
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get public URL for an uploaded image
     */
    getPublicUrl(key: string): string {
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
}

