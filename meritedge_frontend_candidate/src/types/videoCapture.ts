/**
 * Video Capture Types
 */

export interface VideoCaptureConfig {
    chunkInterval: number; // milliseconds
    maxChunksInMemory: number;
    memoryThreshold: number; // bytes
    emergencyThreshold: number; // bytes
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
}

export interface VideoCaptureStatus {
    isRecording: boolean;
    recordingDuration: number;
    chunksUploaded: number;
    chunksFailed: number;
    warningMessage?: string;
    error?: string;
}

export interface VideoChunkMetadata {
    candidateId: string;
    assessmentId: string;
    sessionId: string;
    chunkNumber: number;
    timestamp: string;
    size: number;
}

export interface VideoCaptureHookOptions {
    config?: Partial<VideoCaptureConfig>;
    autoStart?: boolean;
    onStatusChange?: (status: VideoCaptureStatus) => void;
    onError?: (error: Error) => void;
}

export interface VideoCaptureHook {
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    cleanup: () => void;
    status: VideoCaptureStatus;
    isRecording: boolean;
    error: string | null;
}

