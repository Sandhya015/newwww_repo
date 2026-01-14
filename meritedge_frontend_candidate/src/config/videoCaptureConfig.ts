/**
 * Video Capture Configuration
 */

import { VideoCaptureConfig } from '../types/videoCapture';

export const defaultVideoCaptureConfig: VideoCaptureConfig = {
    chunkInterval: 5000, // 5 seconds
    maxChunksInMemory: 3,
    memoryThreshold: 300 * 1024 * 1024, // 300MB
    emergencyThreshold: 600 * 1024 * 1024, // 600MB
    videoBitsPerSecond: 1000000, // 1 Mbps
    audioBitsPerSecond: 128000 // 128 kbps
};

// Get MIME type for MediaRecorder
export const getSupportedMimeType = (): string => {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return '';
};

