/**
 * Screen Recording S3 Upload Service
 * Handles uploading screen recording chunks to S3 using presigned POST URLs
 */

import { VideoChunkMetadata } from '../types/videoCapture';

export interface PresignedPostFields {
    "Content-Type": string;
    key: string;
    "x-amz-algorithm": string;
    "x-amz-credential": string;
    "x-amz-date": string;
    "x-amz-security-token": string;
    policy: string;
    "x-amz-signature": string;
}

export interface PresignedPost {
    url: string;
    fields: PresignedPostFields;
}

export interface ScreenS3Config {
    presignedPost: PresignedPost;
}

export class ScreenS3UploadService {
    private readonly config: ScreenS3Config;

    constructor(config: ScreenS3Config) {
        this.config = config;
    }

    /**
     * Generate filename for screen recording chunk
     * Format: {startTime}_{endTime}.webm (ISO 8601 basic format)
     * Example: 20251009T101941_20251009T101951.webm
     */
    private generateFilename(metadata: VideoChunkMetadata): string {
        // Start time from metadata (already in format: 20251009T101941)
        const startTime = metadata.timestamp;
        
        // Generate end time (current time in ISO 8601 basic format: 20251009T101951)
        const endTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        
        return `${startTime}_${endTime}.webm`;
    }

    /**
     * Upload screen recording chunk to S3 using presigned POST
     */
    async uploadChunk(blob: Blob, metadata: VideoChunkMetadata): Promise<string> {
        const filename = this.generateFilename(metadata);

        try {
            // Create FormData with presigned POST fields
            const formData = new FormData();
            
            // Add all presigned fields
            Object.entries(this.config.presignedPost.fields).forEach(([key, value]) => {
                // Replace ${filename} placeholder in the key field
                if (key === 'key') {
                    formData.append(key, value.replace('${filename}', filename));
                } else {
                    formData.append(key, value);
                }
            });
            
            // Add the file last
            formData.append('file', blob, filename);

            // Upload to S3
            const response = await fetch(this.config.presignedPost.url, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            // Construct the uploaded file URL
            const uploadedKey = this.config.presignedPost.fields.key.replace('${filename}', filename);
            const url = `${this.config.presignedPost.url}${uploadedKey}`;
            
            console.log(`✅ Screen recording chunk uploaded successfully: ${filename}`);
            return url;

        } catch (error) {
            console.error(`❌ Screen chunk upload failed:`, error);
            throw error;
        }
    }
}

