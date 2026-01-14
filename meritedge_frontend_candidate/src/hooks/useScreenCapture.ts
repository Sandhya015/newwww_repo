/**
 * Screen Capture Hook
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { ScreenCaptureService } from "../services/screenCaptureService";
import { ScreenS3UploadService } from "../services/screenS3UploadService";
import { VideoCaptureStatus } from "../types/videoCapture";

interface ScreenCaptureHookOptions {
  chunkInterval?: number;
  autoStart?: boolean;
  onStatusChange?: (status: VideoCaptureStatus) => void;
  onError?: (error: Error) => void;
}

export const useScreenCapture = (options?: ScreenCaptureHookOptions) => {
  const screenCaptureServiceRef = useRef<ScreenCaptureService | null>(null);
  const screenS3UploadServiceRef = useRef<ScreenS3UploadService | null>(null);
  const isInitializedRef = useRef(false);

  // Get tokenValidation and assessmentSummary from Redux
  const tokenValidation = useSelector(
    (state: any) => state.misc?.tokenValidation
  );
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );

  const candidateId =
    tokenValidation?.decoded_token?.candidate_id ||
    tokenValidation?.token_metadata?.candidate_id ||
    "unknown";
  const assessmentId =
    tokenValidation?.decoded_token?.assessment_id ||
    tokenValidation?.token_metadata?.assessment_id ||
    "default_assessment";

  const [status, setStatus] = useState<VideoCaptureStatus>({
    isRecording: false,
    recordingDuration: 0,
    chunksUploaded: 0,
    chunksFailed: 0,
  });

  const [error, setError] = useState<string | null>(null);

  // Initialize services
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!assessmentSummary) return; // Wait for assessmentSummary to be available

    const chunkInterval = options?.chunkInterval || 5000;
    screenCaptureServiceRef.current = new ScreenCaptureService(chunkInterval);

    // Get presigned POST URL from assessmentSummary
    const presignedPost =
      assessmentSummary?.presigned_urls?.screencapture_video?.presigned_post;

    if (presignedPost?.url && presignedPost?.fields) {
      const s3Config = {
        presignedPost: presignedPost,
      };

      screenS3UploadServiceRef.current = new ScreenS3UploadService(s3Config);

      isInitializedRef.current = true;
      console.log(
        "✅ Screen S3 upload service initialized with presigned POST"
      );
    } else {
      console.error("❌ Presigned POST URL not found in assessmentSummary");
    }
  }, [options, assessmentSummary]);

  // Start screen recording
  const startRecording = useCallback(async () => {
    if (!screenCaptureServiceRef.current) {
      setError("Screen capture service not initialized");
      return;
    }

    if (!screenS3UploadServiceRef.current) {
      setError("S3 upload service not configured");
      return;
    }

    try {
      await screenCaptureServiceRef.current.startCapture(
        candidateId,
        assessmentId,
        async (blob, metadata) => {
          // Upload chunk to S3
          try {
            if (screenS3UploadServiceRef.current) {
              await screenS3UploadServiceRef.current.uploadChunk(
                blob,
                metadata
              );
            }

            setStatus((prev) => ({
              ...prev,
              chunksUploaded: prev.chunksUploaded + 1,
            }));

            if (options?.onStatusChange) {
              options.onStatusChange({
                ...status,
                chunksUploaded: status.chunksUploaded + 1,
              });
            }
          } catch (error) {
            // Upload failed
            setStatus((prev) => ({
              ...prev,
              chunksFailed: prev.chunksFailed + 1,
            }));

            if (options?.onError) {
              options.onError(error as Error);
            }
          }
        }
      );

      setStatus((prev) => ({ ...prev, isRecording: true }));
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start screen recording";
      setError(errorMessage);

      if (options?.onError) {
        options.onError(error as Error);
      }
    }
  }, [candidateId, assessmentId, options, status]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (screenCaptureServiceRef.current) {
      screenCaptureServiceRef.current.stopCapture();
      setStatus((prev) => ({ ...prev, isRecording: false }));
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (screenCaptureServiceRef.current) {
      screenCaptureServiceRef.current.cleanup();
    }
  }, []);

  // Check if screen sharing stream is active
  const hasActiveStream = useCallback(() => {
    return screenCaptureServiceRef.current?.hasActiveStream() || false;
  }, []);

  return {
    startRecording,
    stopRecording,
    cleanup,
    status,
    isRecording: status.isRecording,
    error,
    hasActiveStream,
  };
};
