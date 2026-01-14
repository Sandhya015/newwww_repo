/**
 * Video Capture Service
 */

import { VideoCaptureConfig, VideoChunkMetadata } from '../types/videoCapture';
import { getSupportedMimeType } from '../config/videoCaptureConfig';

export class VideoCaptureService {
    private mediaRecorder: MediaRecorder | null = null;
    private mediaStream: MediaStream | null = null;
    private config: VideoCaptureConfig;
    private chunkNumber: number = 0;
    private recordingStartTime: number = 0;
    private sessionId: string = '';
    private candidateId: string = '';
    private assessmentId: string = '';
    private onChunkReadyCallback: ((blob: Blob, metadata: VideoChunkMetadata) => void) | null = null;
    private recordingInterval: number | null = null;
    private isRecordingActive: boolean = false;
    private isCreatingRecorder: boolean = false;
    private nextChunkTimer: number | null = null;

    constructor(config: VideoCaptureConfig) {
        this.config = config;
    }

    /**
     * Start video capture
     */
    async startCapture(
        candidateId: string,
        assessmentId: string,
        onChunkReady: (blob: Blob, metadata: VideoChunkMetadata) => void
    ): Promise<void> {
        try {
            // Request camera and microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });

            // Store metadata
            this.candidateId = candidateId;
            this.assessmentId = assessmentId;
            this.onChunkReadyCallback = onChunkReady;
            this.sessionId = `${candidateId}-${Date.now()}`;
            this.chunkNumber = 0;
            this.recordingStartTime = Date.now();
            this.isRecordingActive = true;

            // Start the first chunk
            this.startNewChunk();

        } catch (error) {
            console.error('❌ Failed to start video capture:', error);
            throw error;
        }
    }

    /**
     * Start a new chunk (stop current recorder and start a new one)
     * This ensures each chunk has initialization data and is playable standalone
     */
    private startNewChunk(): void {
        if (!this.mediaStream || !this.isRecordingActive) {
            return;
        }

        if (this.isCreatingRecorder) {
            return;
        }

        // Clear any existing timer to prevent cascading
        if (this.nextChunkTimer) {
            clearTimeout(this.nextChunkTimer);
            this.nextChunkTimer = null;
        }

        this.createNewRecorder();
    }

    /**
     * Create and start a new MediaRecorder
     */
    private createNewRecorder(): void {
        if (!this.mediaStream || !this.isRecordingActive || this.isCreatingRecorder) return;

        this.isCreatingRecorder = true;

        // Stop previous recorder if it's still recording
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try {
                this.mediaRecorder.stop();
            } catch (e) {
                // Silently handle
            }
        }

        // Small delay to ensure previous recorder is fully stopped
        setTimeout(() => {
            if (!this.isRecordingActive) {
                this.isCreatingRecorder = false;
                return;
            }

            // Create new MediaRecorder for this chunk
            const mimeType = getSupportedMimeType();
            const options: MediaRecorderOptions = {
                mimeType: mimeType || undefined,
                videoBitsPerSecond: this.config.videoBitsPerSecond,
                audioBitsPerSecond: this.config.audioBitsPerSecond
            };

            this.mediaRecorder = new MediaRecorder(this.mediaStream!, options);

            // Increment chunk number
            this.chunkNumber++;
            const currentChunkNumber = this.chunkNumber;
            
            // Store chunk start time in basic ISO 8601 format (YYYYMMDDTHHmmss)
            const chunkStartTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];

            // Handle data available (chunk ready)
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    const metadata: VideoChunkMetadata = {
                        candidateId: this.candidateId,
                        assessmentId: this.assessmentId,
                        sessionId: this.sessionId,
                        chunkNumber: currentChunkNumber,
                        timestamp: chunkStartTime,
                        size: event.data.size
                    };
                    
                    if (this.onChunkReadyCallback) {
                        this.onChunkReadyCallback(event.data, metadata);
                    }
                }
            };

            // Handle stop event
            this.mediaRecorder.onstop = () => {
                // Chunk stopped
            };

            // Handle errors
            this.mediaRecorder.onerror = (event: Event) => {
                console.error('❌ MediaRecorder error:', event);
            };

            // Start recording this chunk
            this.mediaRecorder.start();
            
            // Mark as done creating
            this.isCreatingRecorder = false;
            
            // Schedule next chunk after interval
            this.nextChunkTimer = window.setTimeout(() => {
                if (this.isRecordingActive) {
                    this.nextChunkTimer = null;
                    this.startNewChunk();
                }
            }, this.config.chunkInterval);
        }, 200); // 200ms delay to ensure clean transition
    }

    /**
     * Stop video capture
     */
    stopCapture(): void {
        this.isRecordingActive = false;
        this.isCreatingRecorder = false;

        // Clear timers
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
        
        if (this.nextChunkTimer) {
            clearTimeout(this.nextChunkTimer);
            this.nextChunkTimer = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    /**
     * Check if recording is active
     */
    isRecording(): boolean {
        return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
    }

    /**
     * Get recording duration
     */
    getRecordingDuration(): number {
        if (this.recordingStartTime === 0) return 0;
        return Date.now() - this.recordingStartTime;
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.stopCapture();
        this.mediaRecorder = null;
    }
}

