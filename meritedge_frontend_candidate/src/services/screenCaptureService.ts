/**
 * Screen Capture Service
 * Captures screen and uploads to S3 in chunks
 */

import { VideoChunkMetadata } from "../types/videoCapture";
import { getSupportedMimeType } from "../config/videoCaptureConfig";

export class ScreenCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunkNumber: number = 0;
  private recordingStartTime: number = 0;
  private sessionId: string = "";
  private candidateId: string = "";
  private assessmentId: string = "";
  private onChunkReadyCallback:
    | ((blob: Blob, metadata: VideoChunkMetadata) => void)
    | null = null;
  private isRecordingActive: boolean = false;
  private isCreatingRecorder: boolean = false;
  private nextChunkTimer: number | null = null;
  private chunkInterval: number;

  constructor(chunkInterval: number = 5000) {
    this.chunkInterval = chunkInterval;
  }

  /**
   * Start screen capture
   */
  async startCapture(
    candidateId: string,
    assessmentId: string,
    onChunkReady: (blob: Blob, metadata: VideoChunkMetadata) => void
  ): Promise<void> {
    try {
      // Check if we already have an active stream
      if (this.mediaStream && this.mediaStream.active) {
        const videoTracks = this.mediaStream.getVideoTracks();
        const activeTracks = videoTracks.filter(
          (track) => track.readyState === "live"
        );

        if (activeTracks.length > 0) {
          console.log(
            "✅ Screen capture stream already active, reusing existing stream"
          );
          // Update callback in case it changed
          this.onChunkReadyCallback = onChunkReady;
          // Resume recording if it was stopped
          if (!this.isRecordingActive) {
            this.isRecordingActive = true;
            this.startNewChunk();
          }
          return;
        }
      }

      // Request screen sharing only if we don't have an active stream
      console.log("🎥 Requesting screen sharing permission...");
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false, // Screen recording without audio
      });

      // Monitor stream disconnection
      this.mediaStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          console.warn("⚠️ Screen sharing track ended");
          if (this.isRecordingActive) {
            this.isRecordingActive = false;
            this.stopCapture();
          }
        };
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
      console.error("❌ Failed to start screen capture:", error);
      // If user cancelled, clean up
      if (error instanceof Error && error.name === "NotAllowedError") {
        this.mediaStream = null;
        this.isRecordingActive = false;
      }
      throw error;
    }
  }

  /**
   * Start a new chunk
   */
  private startNewChunk(): void {
    if (!this.mediaStream || !this.isRecordingActive) {
      return;
    }

    if (this.isCreatingRecorder) {
      return;
    }

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
    if (!this.mediaStream || !this.isRecordingActive || this.isCreatingRecorder)
      return;

    this.isCreatingRecorder = true;

    // Stop previous recorder if it's still recording
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // Silently handle
      }
    }

    setTimeout(() => {
      if (!this.isRecordingActive) {
        this.isCreatingRecorder = false;
        return;
      }

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for screen recording
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream!, options);

      this.chunkNumber++;
      const currentChunkNumber = this.chunkNumber;

      // Store chunk start time in basic ISO 8601 format (YYYYMMDDTHHmmss)
      const chunkStartTime = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0];

      // Handle data available (chunk ready)
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const metadata: VideoChunkMetadata = {
            candidateId: this.candidateId,
            assessmentId: this.assessmentId,
            sessionId: this.sessionId,
            chunkNumber: currentChunkNumber,
            timestamp: chunkStartTime,
            size: event.data.size,
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
        console.error("❌ Screen MediaRecorder error:", event);
      };

      // Start recording this chunk
      this.mediaRecorder.start();

      this.isCreatingRecorder = false;

      // Schedule next chunk
      this.nextChunkTimer = window.setTimeout(() => {
        if (this.isRecordingActive) {
          this.nextChunkTimer = null;
          this.startNewChunk();
        }
      }, this.chunkInterval);
    }, 200);
  }

  /**
   * Stop screen capture
   */
  stopCapture(): void {
    this.isRecordingActive = false;
    this.isCreatingRecorder = false;

    if (this.nextChunkTimer) {
      clearTimeout(this.nextChunkTimer);
      this.nextChunkTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return (
      this.mediaRecorder !== null && this.mediaRecorder.state === "recording"
    );
  }

  /**
   * Check if screen sharing stream is active
   */
  hasActiveStream(): boolean {
    return (
      this.mediaStream !== null &&
      this.mediaStream.active &&
      this.mediaStream
        .getVideoTracks()
        .some((track) => track.readyState === "live")
    );
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCapture();
    this.mediaRecorder = null;
  }
}
