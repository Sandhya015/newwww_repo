/**
 * Video Capture Hook
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { VideoCaptureService } from '../services/videoCaptureService';
import { VideoS3UploadService } from '../services/videoS3UploadService';
import {
    VideoCaptureConfig,
    VideoCaptureStatus,
    VideoCaptureHookOptions,
    VideoCaptureHook
} from '../types/videoCapture';
import { defaultVideoCaptureConfig } from '../config/videoCaptureConfig';

export const useVideoCapture = (options?: VideoCaptureHookOptions): VideoCaptureHook => {
    const videoCaptureServiceRef = useRef<VideoCaptureService | null>(null);
    const videoS3UploadServiceRef = useRef<VideoS3UploadService | null>(null);
    const isInitializedRef = useRef(false);

    // Get tokenValidation and assessmentSummary from Redux
    const tokenValidation = useSelector((state: any) => state.misc?.tokenValidation);
    const assessmentSummary = useSelector((state: any) => state.misc?.assessmentSummary);
    
    // Extract IDs from tokenValidation
    const candidateId = tokenValidation?.decoded_token?.candidate_id || 
                       tokenValidation?.token_metadata?.candidate_id || 
                       'unknown';
    const assessmentId = tokenValidation?.decoded_token?.assessment_id || 
                        tokenValidation?.token_metadata?.assessment_id || 
                        'default_assessment';

    const [status, setStatus] = useState<VideoCaptureStatus>({
        isRecording: false,
        recordingDuration: 0,
        chunksUploaded: 0,
        chunksFailed: 0
    });

    const [error, setError] = useState<string | null>(null);

    // Initialize services
    useEffect(() => {
        if (isInitializedRef.current) return;
        if (!assessmentSummary) return; // Wait for assessmentSummary to be available

        console.log('🔧 Initializing video capture services...');

        const captureConfig: VideoCaptureConfig = {
            ...defaultVideoCaptureConfig,
            ...options?.config
        };
        videoCaptureServiceRef.current = new VideoCaptureService(captureConfig);

        // Get presigned POST URL from assessmentSummary
        const presignedPost = assessmentSummary?.presigned_urls?.audio_video?.presigned_post;

        if (presignedPost?.url && presignedPost?.fields) {
            const s3Config = {
                presignedPost: presignedPost
            };
            
            videoS3UploadServiceRef.current = new VideoS3UploadService(s3Config);
            
            isInitializedRef.current = true;
            console.log('✅ Video S3 upload service initialized with presigned POST');
        } else {
            console.error('❌ Presigned POST URL not found in assessmentSummary');
        }
    }, [options, assessmentSummary]);

    // Start recording
    const startRecording = useCallback(async () => {
        if (!videoCaptureServiceRef.current) {
            setError('Video capture service not initialized');
            return;
        }

        if (!videoS3UploadServiceRef.current) {
            setError('S3 upload service not configured');
            return;
        }

        try {

            await videoCaptureServiceRef.current.startCapture(
                candidateId,
                assessmentId,
                async (blob, metadata) => {
                    // Upload chunk to S3
                    try {
                        if (videoS3UploadServiceRef.current) {
                            await videoS3UploadServiceRef.current.uploadChunk(blob, metadata);
                        }
                        
                        setStatus(prev => ({
                            ...prev,
                            chunksUploaded: prev.chunksUploaded + 1
                        }));

                        if (options?.onStatusChange) {
                            options.onStatusChange({
                                ...status,
                                chunksUploaded: status.chunksUploaded + 1
                            });
                        }
                    } catch (error) {
                        // Upload failed silently
                        
                        setStatus(prev => ({
                            ...prev,
                            chunksFailed: prev.chunksFailed + 1
                        }));

                        if (options?.onError) {
                            options.onError(error as Error);
                        }
                    }
                }
            );

            setStatus(prev => ({ ...prev, isRecording: true }));
            setError(null);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
            setError(errorMessage);
            
            if (options?.onError) {
                options.onError(error as Error);
            }
        }
    }, [candidateId, assessmentId, options, status]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (videoCaptureServiceRef.current) {
            videoCaptureServiceRef.current.stopCapture();
            setStatus(prev => ({ ...prev, isRecording: false }));
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        if (videoCaptureServiceRef.current) {
            videoCaptureServiceRef.current.cleanup();
        }
    }, []);

    // Note: Auto-start removed - caller should manually call startRecording()

    return {
        startRecording,
        stopRecording,
        cleanup,
        status,
        isRecording: status.isRecording,
        error
    };
};

