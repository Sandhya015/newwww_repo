/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Button,
  Col,
  Collapse,
  Dropdown,
  Layout,
  Modal,
  Progress,
  Row,
  Tabs,
  Tooltip,
  Typography,
  message,
} from "antd";
import { toast } from "react-hot-toast";
import { ExclamationCircleOutlined, CheckOutlined, FlagOutlined, PlayCircleOutlined, LockOutlined, UnlockOutlined, DownOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import { useQuestions } from "../../hooks/useQuestions";
import { useVideoCapture } from "../../hooks/useVideoCapture";
import { useScreenCapture } from "../../hooks/useScreenCapture";
import FullscreenModal from "../../components/Test/FullscreenModal";
import CountdownTimer from "../../components/CountdownTimer";
import CountdownTimerFromSeconds from "../../components/Common/CountdownTimerFromSeconds";
import DynamicQuestionContent from "../../components/Test/DynamicQuestionContent";
import MediaPermissionsViolationModal from "../../components/Common/MediaPermissionsViolationModal";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/apiConfig";
import { fetchAssessmentSummary } from "../../services/questionTypesApi";
import { setAssessmentSummary } from "../../store/miscSlice";

const { Title, Text } = Typography;

const extractSections = (source: any): any[] => {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source;
  }

  if (Array.isArray(source?.sections)) {
    return source.sections;
  }

  if (Array.isArray(source?.assessment_summary?.sections)) {
    return source.assessment_summary.sections;
  }

  if (Array.isArray(source?.data?.sections)) {
    return source.data.sections;
  }

  return [];
};

const collectQuestionIdsByType = (sections: any[]) => {
  const questionIdsByType: Record<string, string[]> = {};
  const questionSectionLookup: Record<string, string> = {};
  const questionTypeLookup: Record<string, string> = {};

  sections.forEach((section) => {
    if (!section?.question_types) {
      return;
    }

    const sectionId = section.section_id || "";

    section.question_types.forEach((qt: any) => {
      const type = qt?.type;
      if (!type) {
        return;
      }

      if (!questionIdsByType[type]) {
        questionIdsByType[type] = [];
      }

      const ids = Array.isArray(qt?.question_ids) ? qt.question_ids : [];
      ids.forEach((id: string) => {
        if (!id) {
          return;
        }

        if (!questionIdsByType[type].includes(id)) {
          questionIdsByType[type].push(id);
        }

        if (sectionId && !questionSectionLookup[id]) {
          questionSectionLookup[id] = sectionId;
        }

        if (!questionTypeLookup[id]) {
          questionTypeLookup[id] = type;
        }
      });
    });
  });

  return { questionIdsByType, questionSectionLookup, questionTypeLookup };
};

  const { Content, Header } = Layout;

// Components
import CodingQuestionTab from "../../components/Test/tabs/CodingQuestionTab";
import MCQQuestionTab from "../../components/Test/tabs/MCQQuestionTab";
import Webcam from "react-webcam";

export default function Test() {
  // Navigation
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { candidate_id } = useParams();

  // Error state for visual error display
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    errorMessage: string;
  }>({ hasError: false, errorMessage: "" });

  // Secure mode functionality
  const { secureMode, secureModeLoading } = useSecureMode();

  // Fullscreen functionality
  const { isFullscreen, isSupported, enterFullscreen, toggleFullscreen } =
    useFullscreen();

  // Questions functionality
  const {
    currentQuestions,
    currentQuestionsLoading,
    currentQuestionsError,
    fetchQuestionsByType,
  } = useQuestions();
  const [showFullscreenModal, setShowFullscreenModal] = useState(false); // Don't show modal - enter fullscreen directly
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] =
    useState(false);
  const [showSubmitSummaryModal, setShowSubmitSummaryModal] = useState(false);
  const [isCompletingSection, setIsCompletingSection] = useState(false);
  const [showSectionTransitionModal, setShowSectionTransitionModal] = useState(false);
  const [showCompleteSectionModal, setShowCompleteSectionModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [nextSectionPath, setNextSectionPath] = useState<string | null>(null);
  const [showSwitchSectionModal, setShowSwitchSectionModal] = useState(false);
  const [selectedSectionToSwitch, setSelectedSectionToSwitch] = useState<string | null>(null);
  const [showLastSectionWarning, setShowLastSectionWarning] = useState(false);
  const [completedSectionName, setCompletedSectionName] = useState<string>("");
  const [isCompletingSectionAPI, setIsCompletingSectionAPI] = useState(false);
  // Store completed section stats to persist answered counts
  const [completedSectionStats, setCompletedSectionStats] = useState<Record<string, { answered: number; total: number }>>({});
  const [showReenterFullscreenButton, setShowReenterFullscreenButton] =
    useState(false);

  // Tab switch detection state
  const tabLeaveTimeRef = useRef<number | null>(null);
  const tabSwitchCountRef = useRef<number>(0);

  // Fullscreen violation tracking
  const fullscreenViolationCountRef = useRef<number>(0);
  const [showFullscreenViolationModal, setShowFullscreenViolationModal] =
    useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const FULLSCREEN_VIOLATION_LIMIT = 5; // Changed to 5 violations before auto-submit
  
  // Fullscreen warning modal (like AssessmentForm)
  const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(7);
  const wasFullscreenRef = useRef(false);
  const [shouldBlockInterface, setShouldBlockInterface] = useState(false);

  // Tab switch violation tracking
  const [showTabSwitchViolationModal, setShowTabSwitchViolationModal] =
    useState(false);
  const [tabSwitchViolationMessage, setTabSwitchViolationMessage] =
    useState("");
  const tabSwitchViolationCountRef = useRef<number>(0);
  const TAB_SWITCH_VIOLATION_LIMIT = 5;

  // Media permissions and video quality violation tracking
  const [showMediaViolationModal, setShowMediaViolationModal] = useState(false);
  const [mediaViolationType, setMediaViolationType] = useState<
    "permission" | "video_quality" | "microphone"
  >("permission");
  const [mediaViolationMessage, setMediaViolationMessage] = useState("");
  const [mediaPermissionsValid, setMediaPermissionsValid] = useState(false);
  const [videoQualityValid, setVideoQualityValid] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoQualityCheckIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Track if we're in the initial recording setup phase (to ignore screen share dialog exit)
  const isInitialRecordingSetupRef = useRef<boolean>(true);
  const screenSharingCompleteRef = useRef<boolean>(false);

  // Check media permissions and video quality
  const checkMediaPermissions = async (): Promise<{
    camera: boolean;
    microphone: boolean;
    error?: string;
  }> => {
    try {
      // Check if permissions API is available
      if (!navigator.permissions || !navigator.mediaDevices) {
        return {
          camera: false,
          microphone: false,
          error: "Media devices API not supported in this browser",
        };
      }

      // Check camera permission
      let cameraPermission = false;
      try {
        const cameraQuery = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        cameraPermission = cameraQuery.state === "granted";
      } catch (e) {
        // Fallback: try to request access directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          cameraPermission = true;
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          cameraPermission = false;
        }
      }

      // Check microphone permission
      let microphonePermission = false;
      try {
        const micQuery = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        microphonePermission = micQuery.state === "granted";
      } catch (e) {
        // Fallback: try to request access directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          microphonePermission = true;
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          microphonePermission = false;
        }
      }

      return {
        camera: cameraPermission,
        microphone: microphonePermission,
      };
    } catch (error) {
      console.error("Error checking media permissions:", error);
      return {
        camera: false,
        microphone: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Check video quality (detect black frames, frozen frames, blocked camera)
  const checkVideoQuality = (
    videoElement: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> => {
    return new Promise((resolve) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ isValid: false, reason: "Could not create canvas context" });
        return;
      }

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      // Draw current frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        // RGB values
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Calculate luminance (weighted average)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      // Check for black screen (very low brightness)
      if (avgBrightness < 5) {
        resolve({
          isValid: false,
          reason:
            "Camera appears to be blocked or covered (black screen detected)",
        });
        return;
      }

      // Check for very low brightness (might indicate finger on camera)
      if (avgBrightness < 20) {
        resolve({
          isValid: false,
          reason:
            "Very low light detected. Please ensure camera is not blocked.",
        });
        return;
      }

      // Check for variance (frozen frame would have low variance)
      let variance = 0;
      const mean = avgBrightness;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        variance += Math.pow(brightness - mean, 2);
      }
      variance = variance / (data.length / 4);

      // Very low variance might indicate frozen frame
      if (variance < 10) {
        resolve({
          isValid: false,
          reason: "Video appears frozen. Please check your camera connection.",
        });
        return;
      }

      resolve({ isValid: true });
    });
  };

  // Monitor video quality continuously
  const startVideoQualityMonitoring = () => {
    if (videoQualityCheckIntervalRef.current) {
      clearInterval(videoQualityCheckIntervalRef.current);
    }

    videoQualityCheckIntervalRef.current = window.setInterval(async () => {
      if (
        !videoElementRef.current ||
        !canvasRef.current ||
        !mediaStreamRef.current
      ) {
        return;
      }

      const video = videoElementRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      const qualityCheck = await checkVideoQuality(video, canvasRef.current);
      if (!qualityCheck.isValid) {
        console.warn("⚠️ Video quality issue detected:", qualityCheck.reason);
        setVideoQualityValid(false);
        setMediaViolationType("video_quality");
        setMediaViolationMessage(
          qualityCheck.reason ||
            "Video quality issue detected. Please check your camera."
        );
        setShowMediaViolationModal(true);
      } else {
        setVideoQualityValid(true);
      }
    }, 3000); // Check every 3 seconds
  };

  // Stop video quality monitoring
  const stopVideoQualityMonitoring = () => {
    if (videoQualityCheckIntervalRef.current) {
      clearInterval(videoQualityCheckIntervalRef.current);
      videoQualityCheckIntervalRef.current = null;
    }
  };

  // Initial media validation when component mounts
  useEffect(() => {
    const validateMedia = async () => {
      console.log("🔍 Validating media permissions and video quality...");

      // Check permissions
      const permissions = await checkMediaPermissions();
      console.log("📋 Permission check result:", permissions);

      if (!permissions.camera || !permissions.microphone) {
        let violationMsg = "";
        if (!permissions.camera && !permissions.microphone) {
          violationMsg =
            "Camera and microphone permissions are required to take this test. Please grant access to both devices.";
          setMediaViolationType("permission");
        } else if (!permissions.camera) {
          violationMsg =
            "Camera permission is required to take this test. Please grant camera access.";
          setMediaViolationType("permission");
        } else {
          violationMsg =
            "Microphone permission is required to take this test. Please grant microphone access.";
          setMediaViolationType("microphone");
        }

        setMediaViolationMessage(violationMsg);
        setMediaPermissionsValid(false);
        setShowMediaViolationModal(true);
        return;
      }

      setMediaPermissionsValid(true);

      // Request media stream for quality check
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        mediaStreamRef.current = stream;

        // Create hidden video element for quality checks
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.style.position = "absolute";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        video.style.width = "1px";
        video.style.height = "1px";
        document.body.appendChild(video);
        videoElementRef.current = video;

        // Create canvas for frame analysis
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.opacity = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.width = "1px";
        canvas.style.height = "1px";
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve(undefined);
          };
        });

        // Wait a bit for first frame
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Initial quality check
        const qualityCheck = await checkVideoQuality(video, canvas);
        if (!qualityCheck.isValid) {
          console.warn(
            "⚠️ Initial video quality check failed:",
            qualityCheck.reason
          );
          setVideoQualityValid(false);
          setMediaViolationType("video_quality");
          setMediaViolationMessage(
            qualityCheck.reason ||
              "Video quality issue detected. Please check your camera."
          );
          setShowMediaViolationModal(true);
        } else {
          setVideoQualityValid(true);
          // Start continuous monitoring
          startVideoQualityMonitoring();
        }
      } catch (error) {
        console.error("❌ Failed to access media devices:", error);
        setMediaPermissionsValid(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to access camera and microphone";
        setMediaViolationMessage(
          `Unable to access camera and microphone: ${errorMessage}. Please grant permissions and try again.`
        );
        setMediaViolationType("permission");
        setShowMediaViolationModal(true);
      }
    };

    validateMedia();

    // Cleanup
    return () => {
      stopVideoQualityMonitoring();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoElementRef.current && videoElementRef.current.parentNode) {
        document.body.removeChild(videoElementRef.current);
        videoElementRef.current = null;
      }
      if (canvasRef.current && canvasRef.current.parentNode) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  // Handle retry media check
  const handleRetryMediaCheck = async () => {
    setShowMediaViolationModal(false);
    // Small delay before retry
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Trigger re-validation
    const permissions = await checkMediaPermissions();
    if (!permissions.camera || !permissions.microphone) {
      let violationMsg = "";
      if (!permissions.camera && !permissions.microphone) {
        violationMsg =
          "Camera and microphone permissions are still required. Please grant access to both devices.";
        setMediaViolationType("permission");
      } else if (!permissions.camera) {
        violationMsg =
          "Camera permission is still required. Please grant camera access.";
        setMediaViolationType("permission");
      } else {
        violationMsg =
          "Microphone permission is still required. Please grant microphone access.";
        setMediaViolationType("microphone");
      }
      setMediaViolationMessage(violationMsg);
      setShowMediaViolationModal(true);
      return;
    }

    setMediaPermissionsValid(true);

    // If we don't have a video stream yet, try to get one
    if (!mediaStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        mediaStreamRef.current = stream;

        // Create or reuse video element
        if (!videoElementRef.current) {
          const video = document.createElement("video");
          video.srcObject = stream;
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.style.position = "absolute";
          video.style.opacity = "0";
          video.style.pointerEvents = "none";
          video.style.width = "1px";
          video.style.height = "1px";
          document.body.appendChild(video);
          videoElementRef.current = video;
        } else {
          videoElementRef.current.srcObject = stream;
        }

        // Create or reuse canvas
        if (!canvasRef.current) {
          const canvas = document.createElement("canvas");
          canvas.style.position = "absolute";
          canvas.style.opacity = "0";
          canvas.style.pointerEvents = "none";
          canvas.style.width = "1px";
          canvas.style.height = "1px";
          document.body.appendChild(canvas);
          canvasRef.current = canvas;
        }

        // Wait for video to be ready
        if (videoElementRef.current) {
          await new Promise((resolve) => {
            const video = videoElementRef.current!;
            const onReady = () => {
              video.play();
              resolve(undefined);
            };
            if (video.readyState >= 2) {
              onReady();
            } else {
              video.onloadedmetadata = onReady;
            }
          });
        }

        // Wait a bit for first frame
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("❌ Failed to access media devices on retry:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to access camera and microphone";
        setMediaViolationMessage(
          `Unable to access camera and microphone: ${errorMessage}. Please grant permissions and try again.`
        );
        setMediaViolationType("permission");
        setShowMediaViolationModal(true);
        return;
      }
    }

    // Re-check video quality
    if (videoElementRef.current && canvasRef.current) {
      const qualityCheck = await checkVideoQuality(
        videoElementRef.current,
        canvasRef.current
      );
      if (!qualityCheck.isValid) {
        setVideoQualityValid(false);
        setMediaViolationType("video_quality");
        setMediaViolationMessage(
          qualityCheck.reason ||
            "Video quality issue still detected. Please check your camera."
        );
        setShowMediaViolationModal(true);
      } else {
        setVideoQualityValid(true);
        startVideoQualityMonitoring();
      }
    } else {
      // Fallback: reload page to re-initialize
      window.location.reload();
    }
  };

  // Video capture functionality - Camera recording only (no screen share dialog)
  const videoCapture = useVideoCapture({
    config: {
      chunkInterval: 5000, // 5 seconds
      maxChunksInMemory: 3,
      memoryThreshold: 300 * 1024 * 1024, // 300MB
      emergencyThreshold: 600 * 1024 * 1024, // 600MB
    },
    autoStart: false, // We'll start manually
    onStatusChange: () => {
      // Silent monitoring
    },
    onError: (error) => {
      console.error("❌ Video capture error:", error);
    },
  });

  // Screen capture functionality for recording screen
  const screenCapture = useScreenCapture({
    autoStart: false,
    onError: (error) => {
      console.error("❌ Screen capture error:", error);
    },
  });

  // Start camera recording without interrupting fullscreen (only if media is valid)
  useEffect(() => {
    // Don't start recording if media validation hasn't passed
    if (!mediaPermissionsValid || !videoQualityValid) {
      console.log(
        "⏸️ Camera recording paused - waiting for media validation..."
      );
      return;
    }

    const startCameraRecording = async () => {
      try {
        console.log("📹 Starting camera recording in fullscreen mode...");

        // Wait for fullscreen to be fully established
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Start camera recording (doesn't exit fullscreen)
        try {
          await videoCapture.startRecording();
          console.log("✅ Camera recording started successfully");
          message.success(
            "✅ Camera recording started. Test is in secure fullscreen mode.",
            3
          );
        } catch (cameraError) {
          console.error("❌ Camera recording failed:", cameraError);
          message.warning("Camera recording failed. Test will continue.", 3);
        }

        // Mark setup as complete - violations will now be tracked
        isInitialRecordingSetupRef.current = false;
        screenSharingCompleteRef.current = true;
      } catch (error) {
        console.error("❌ Recording initialization failed:", error);
        message.error("Recording setup failed. Test will continue.", 3);
        isInitialRecordingSetupRef.current = false;
        screenSharingCompleteRef.current = true;
      }
    };

    startCameraRecording();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up camera recording...");
      videoCapture.stopRecording();
      videoCapture.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPermissionsValid, videoQualityValid]); // Start recording only when media is valid

  // Prevent browser back button - lock user in test
  useEffect(() => {
    console.log("🔒 Preventing browser back navigation...");

    // Push a dummy state to history
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      console.log("⚠️ User attempted to go back");
      // Push state again to prevent going back
      window.history.pushState(null, "", window.location.href);

      message.warning({
        content:
          "⚠️ You cannot go back during the test. Please complete or submit the assessment.",
        duration: 5,
        key: "back-button-warning",
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      console.log("🧹 Back button prevention removed");
    };
  }, []);

  // Check if test was already completed (prevent retaking)
  useEffect(() => {
    console.log("🔍 Checking if test was already taken...");

    const checkTestCompletion = () => {
      try {
        const testCompletionKey = `test_completed_${candidate_id}`;
        const isCompleted = localStorage.getItem(testCompletionKey);

        if (isCompleted === "true") {
          console.warn("⚠️ Test already completed by this candidate");
          message.error({
            content:
              "You have already completed this assessment. You cannot retake it.",
            duration: 8,
            key: "test-already-taken",
          });

          // Redirect to success page after 3 seconds
          setTimeout(() => {
            navigate(`/${candidate_id}/assessment-success`);
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking test completion:", error);
      }
    };

    checkTestCompletion();
  }, [candidate_id, navigate]);

  // Tab/Window Switch Detection (Alt+Tab, minimize, etc.)
  useEffect(() => {
    console.log("🔍 Tab/Window switch detection initialized");

    const handleVisibilityChange = () => {
      console.log(
        "👁️ Visibility change detected, document.hidden:",
        document.hidden
      );

      if (document.hidden) {
        // User left tab/window
        tabLeaveTimeRef.current = Date.now();
        console.log(
          "⚠️ Tab/Window switched away at:",
          new Date().toISOString()
        );
        console.log("⚠️ User left the assessment!");

        // Only show violation modal if user has interacted (test has started)
        if (hasUserInteracted) {
          tabSwitchViolationCountRef.current += 1;
          const currentViolations = tabSwitchViolationCountRef.current;

          if (currentViolations >= TAB_SWITCH_VIOLATION_LIMIT) {
            // Terminate the exam after exceeding the violation limit
            console.error(
              "❌ Tab switch violation limit exceeded! Terminating assessment..."
            );
            setTabSwitchViolationMessage(
              `You have switched tabs/windows ${TAB_SWITCH_VIOLATION_LIMIT} times.\n\nYour assessment is being terminated for security reasons.\n\nYou will be redirected in 3 seconds...`
            );
            setShowTabSwitchViolationModal(true);

            // End the assessment
            setTimeout(() => {
              endAssessmentDueToViolation();
            }, 3000);
          } else {
            // Show violation modal
            const remainingAttempts =
              TAB_SWITCH_VIOLATION_LIMIT - currentViolations;
            setTabSwitchViolationMessage(
              `⚠️ TAB SWITCH VIOLATION DETECTED!\n\nYou switched tabs or windows.\n\nViolation: ${currentViolations} of ${TAB_SWITCH_VIOLATION_LIMIT}\nRemaining warnings: ${remainingAttempts}\n\nPlease return to the assessment page immediately.\nFurther violations will terminate your assessment.`
            );
            setShowTabSwitchViolationModal(true);

            // Show toast warning
            message.error({
              content: `⚠️ Tab Switch Violation ${currentViolations}/${TAB_SWITCH_VIOLATION_LIMIT}! You switched tabs/windows. Return immediately or test will be terminated.`,
              duration: 10,
              key: "tab-switch-violation",
            });
          }
        } else {
          // Show warning toast for early tab switches
        message.warning({
          content:
            "⚠️ You switched tabs/windows! Please stay on the assessment page.",
          duration: 5,
          key: "tab-switch-warning",
        });
        }
      } else {
        // User returned to tab/window
        console.log("✅ Tab/Window is now visible");

        if (tabLeaveTimeRef.current) {
          const returnTime = Date.now();
          const duration = returnTime - tabLeaveTimeRef.current;

          tabSwitchCountRef.current += 1;

          console.log("✅ Returned to assessment:", {
            leftAt: new Date(tabLeaveTimeRef.current).toISOString(),
            returnedAt: new Date(returnTime).toISOString(),
            durationSeconds: Math.floor(duration / 1000),
            totalSwitches: tabSwitchCountRef.current,
          });

          // Show info toast with duration
          message.info({
            content: `You were away for ${Math.floor(
              duration / 1000
            )} seconds. Total switches: ${tabSwitchCountRef.current}`,
            duration: 5,
            key: "tab-return-info",
          });

          // Log tab switch event to API
          logTabSwitchEvent({
            leftAt: tabLeaveTimeRef.current,
            returnedAt: returnTime,
            duration: duration,
            switchCount: tabSwitchCountRef.current,
          });

          tabLeaveTimeRef.current = null;
        } else {
          console.log("ℹ️ Tab became visible (initial page load)");
        }
      }
    };

    // Additional event listeners for window focus/blur (Alt+Tab)
    const handleWindowBlur = () => {
      console.log("🪟 Window blur detected (Alt+Tab away)");
      if (!tabLeaveTimeRef.current && !document.hidden) {
        tabLeaveTimeRef.current = Date.now();
        console.log("⚠️ Window lost focus at:", new Date().toISOString());

        message.warning({
          content:
            "⚠️ You switched windows! Please stay focused on the assessment.",
          duration: 5,
          key: "window-blur-warning",
        });
      }
    };

    const handleWindowFocus = () => {
      console.log("🪟 Window focus detected (Alt+Tab back)");
      if (tabLeaveTimeRef.current) {
        const returnTime = Date.now();
        const duration = returnTime - tabLeaveTimeRef.current;

        tabSwitchCountRef.current += 1;

        console.log("✅ Window regained focus:", {
          leftAt: new Date(tabLeaveTimeRef.current).toISOString(),
          returnedAt: new Date(returnTime).toISOString(),
          durationSeconds: Math.floor(duration / 1000),
          totalSwitches: tabSwitchCountRef.current,
        });

        message.info({
          content: `You were away for ${Math.floor(
            duration / 1000
          )} seconds. Total switches: ${tabSwitchCountRef.current}`,
          duration: 5,
          key: "window-focus-info",
        });

        logTabSwitchEvent({
          leftAt: tabLeaveTimeRef.current,
          returnedAt: returnTime,
          duration: duration,
          switchCount: tabSwitchCountRef.current,
        });

        tabLeaveTimeRef.current = null;
      }
    };

    // Add all event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    console.log("✅ Tab/Window switch event listeners added");
    console.log("📊 Initial state:", {
      documentHidden: document.hidden,
      documentHasFocus: document.hasFocus(),
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      console.log("🧹 Tab/Window switch event listeners removed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // logTabSwitchEvent is stable

  // Track previous fullscreen state to detect exits
  const previousFullscreenRef = useRef<boolean>(false);

  // Enter fullscreen immediately on mount (if supported and not already in fullscreen)
  useEffect(() => {
    if (isSupported && !isFullscreen) {
      console.log("🚀 Attempting to enter fullscreen immediately on mount");
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        enterFullscreen().catch((err) => {
          console.warn("Could not auto-enter fullscreen on mount:", err);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isFullscreen, enterFullscreen]);

  // Fullscreen violation detection with vendor prefix support
  useEffect(() => {
    console.log("🖥️ Fullscreen violation detection initialized");

    const handleFullscreenChange = () => {
      // Check for fullscreen state with vendor prefixes
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );

      console.log("🖥️ Fullscreen state changed:", {
        isCurrentlyFullscreen,
        wasInFullscreen: previousFullscreenRef.current,
        isInitialSetup: isInitialRecordingSetupRef.current,
        screenSharingComplete: screenSharingCompleteRef.current,
        hasUserInteracted,
      });

      // Ignore fullscreen changes during initial recording setup (screen sharing dialog)
      if (isInitialRecordingSetupRef.current) {
        console.log(
          "ℹ️ Ignoring fullscreen change during initial recording setup"
        );
        previousFullscreenRef.current = isCurrentlyFullscreen;
        return;
      }

      // Detect fullscreen exit: was in fullscreen, now not in fullscreen, and user has interacted
      if (
        previousFullscreenRef.current &&
        !isCurrentlyFullscreen &&
        hasUserInteracted
      ) {
        // User has exited full-screen
        fullscreenViolationCountRef.current += 1;
        const currentViolations = fullscreenViolationCountRef.current;

        console.warn(`⚠️ Fullscreen violation #${currentViolations} detected`);

        if (currentViolations >= FULLSCREEN_VIOLATION_LIMIT) {
          // Terminate the exam after exceeding the violation limit
          console.error(
            "❌ Fullscreen violation limit exceeded! Terminating assessment..."
          );
          setViolationMessage(
            `You have violated the fullscreen requirement ${FULLSCREEN_VIOLATION_LIMIT} times.\n\nYour assessment is being terminated for security reasons.\n\nYou will be redirected in 3 seconds...`
          );
          setShowFullscreenViolationModal(true);

          // End the assessment
          setTimeout(() => {
            endAssessmentDueToViolation();
          }, 3000);
        } else {
          // Prompt user to return to full-screen and issue a warning
          const remainingAttempts =
            FULLSCREEN_VIOLATION_LIMIT - currentViolations;
          setViolationMessage(
            `FULLSCREEN VIOLATION DETECTED!\n\nYou exited fullscreen mode.\n\nViolation: ${currentViolations} of ${FULLSCREEN_VIOLATION_LIMIT}\nRemaining warnings: ${remainingAttempts}\n\nPlease return to fullscreen immediately.\nFurther violations will terminate your assessment.`
          );
          setShowFullscreenViolationModal(true);

          // Show toast warning
          message.error({
            content: `Fullscreen Violation ${currentViolations}/${FULLSCREEN_VIOLATION_LIMIT}! You exited fullscreen mode. Return immediately or test will be terminated.`,
            duration: 10,
            key: "fullscreen-violation",
          });

          // Attempt to re-enter fullscreen automatically
          setTimeout(() => {
            console.log(
              "🔄 Auto-attempting to restore fullscreen after violation..."
            );
            enterFullscreen();
          }, 1500);
        }
      }

      // Update previous state for next check
      previousFullscreenRef.current = isCurrentlyFullscreen;
    };

    // Add event listeners for all vendor prefixes
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    console.log("✅ Fullscreen violation listeners added");

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
      console.log("🧹 Fullscreen violation listeners removed");
    };
    // Initialize previous state
    previousFullscreenRef.current = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );

    // Sync with isFullscreen state from hook
    const syncFullscreenState = () => {
      const currentState = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      previousFullscreenRef.current = currentState;
    };

    // Sync periodically to catch any state changes
    const syncInterval = setInterval(syncFullscreenState, 500);

    return () => {
      clearInterval(syncInterval);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUserInteracted, enterFullscreen, isFullscreen]); // endAssessmentDueToViolation is stable

  // Sync previousFullscreenRef when isFullscreen changes
  useEffect(() => {
    previousFullscreenRef.current = isFullscreen;
    if (isFullscreen) {
      wasFullscreenRef.current = true;
      setShowFullscreenWarningModal(false);
      setShouldBlockInterface(false);
      setFullscreenCountdown(7);
    }
  }, [isFullscreen]);

  // Fullscreen exit warning with countdown - Clean implementation approach
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWarning = useCallback(() => {
    setShowFullscreenWarningModal(true);
    setShouldBlockInterface(true);
    setFullscreenCountdown(7);

    // Clear any existing timer
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
    }

    // Auto re-enter fullscreen after 7 seconds
    restoreTimerRef.current = setTimeout(() => {
      hideWarning();
      enterFullscreen();
    }, 7000);
  }, [enterFullscreen]);

  const hideWarning = useCallback(() => {
    setShowFullscreenWarningModal(false);
    setShouldBlockInterface(false);
    setFullscreenCountdown(7);
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  // Detect when user leaves fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen && wasFullscreenRef.current && hasUserInteracted) {
        // User has exited fullscreen - show warning
        showWarning();
      } else if (isCurrentlyFullscreen) {
        // User is back in fullscreen - hide warning
        wasFullscreenRef.current = true;
        hideWarning();
      }
    };

    // Add event listeners for all vendor prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [hasUserInteracted, showWarning, hideWarning]);

  // Countdown timer for fullscreen warning
  useEffect(() => {
    if (!showFullscreenWarningModal) return;

    const timer = setInterval(() => {
      setFullscreenCountdown((prev) => {
        if (prev <= 1) {
          return 7; // Reset, auto-reenter will be handled by timeout
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showFullscreenWarningModal]);

  // Handle manual re-entering fullscreen from warning modal
  const handleReenterFullscreen = async () => {
    try {
      hideWarning();
      await enterFullscreen();
      wasFullscreenRef.current = true;
    } catch (error) {
      console.error("Error re-entering fullscreen:", error);
    }
  };

  // Function to end assessment due to fullscreen violation
  const endAssessmentDueToViolation = async () => {
    try {
      console.log("❌ Ending assessment due to fullscreen violation");

      // Stop camera recording
      videoCapture.stopRecording();

      // Mark test as completed/terminated
      const testCompletionKey = `test_completed_${candidate_id}`;
      localStorage.setItem(testCompletionKey, "true");
      console.log(
        `✅ Test marked as terminated for candidate: ${candidate_id}`
      );

      // Log the violation to API
      const token = authToken || tokenValidation?.token;
      if (token) {
        const payload = {
          event_type: "fullscreen_violation_termination",
          violations: fullscreenViolationCountRef.current,
          timestamp: Date.now(),
          reason: "exceeded_fullscreen_exit_limit",
        };

        console.log("📤 Logging fullscreen violation termination:", payload);

        // TODO: Call actual API endpoint to log violation when available
      }

      // Show termination message and redirect
      message.error({
        content:
          "Assessment automatically submitted due to 5 fullscreen violations.",
        duration: 5,
      });

      // Redirect to success page (not blank page)
      setTimeout(() => {
        navigate(`/${candidate_id}/assessment-success`, {
          state: { terminated: true, reason: "fullscreen_violations" },
        });
      }, 3000);
    } catch (error) {
      console.error("Error ending assessment:", error);
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Log tab switch event to API
  const logTabSwitchEvent = async (data: {
    leftAt: number;
    returnedAt: number;
    duration: number;
    switchCount: number;
  }) => {
    try {
      const token = authToken || tokenValidation?.token;
      if (!token) {
        console.warn("⚠️ No auth token for tab switch logging");
        return;
      }

      const payload = {
        event_type: "tab_switch",
        leftAt: data.leftAt,
        returnedAt: data.returnedAt,
        duration: data.duration,
        durationSeconds: Math.floor(data.duration / 1000),
        switchCount: data.switchCount,
        timestamp: Date.now(),
      };

      console.log("📤 Logging tab switch to API:", payload);

      // TODO: Replace with actual API endpoint when available
      // const response = await fetch(`${API_BASE_URL}/candidate/events/tab-switch`, {
      //     method: 'POST',
      //     headers: {
      //         'accept': 'application/json',
      //         'Authorization': `Bearer ${token}`,
      //         'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify(payload)
      // });

      console.log("✅ Tab switch event logged (placeholder)");
    } catch (error) {
      console.error("❌ Failed to log tab switch:", error);
    }
  };

  // Redux store data
  const assessmentSummary = useSelector(
    (state: any) => state.misc?.assessmentSummary
  );
  const questionTypes = useSelector((state: any) => state.misc?.questionTypes);
  const assessmentSummaryLoading = useSelector(
    (state: any) => state.misc?.assessmentSummaryLoading
  );
  const questionTypesLoading = useSelector(
    (state: any) => state.misc?.questionTypesLoading
  );
  const authToken = useSelector((state: any) => state.misc?.authToken);
  const tokenValidation = useSelector(
    (state: any) => state.misc?.tokenValidation
  );
  const assessmentStarted = useSelector(
    (state: any) => state.misc?.assessmentStarted
  );

  const sectionsToUse = useMemo(() => {
    const combinedSections: any[] = [];

    if (assessmentSummary && Array.isArray(assessmentSummary.sections)) {
      combinedSections.push(...assessmentSummary.sections);
    }

    const startedSections = extractSections(assessmentStarted);
    if (startedSections.length > 0) {
      combinedSections.push(...startedSections);
    }

    return combinedSections;
  }, [assessmentSummary, assessmentStarted]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Filter sections to only include the active section when collecting question IDs
  const activeSectionsForQuestions = useMemo(() => {
    if (!activeSectionId) {
      // If no active section, return first section or empty
      return sectionsToUse.length > 0 ? [sectionsToUse[0]] : [];
    }
    return sectionsToUse.filter(
      (section: any) => section.section_id === activeSectionId
    );
  }, [sectionsToUse, activeSectionId]);

  const { questionIdsByType, questionSectionLookup, questionTypeLookup } = useMemo(
    () => {
      if (!activeSectionsForQuestions || activeSectionsForQuestions.length === 0) {
        return { questionIdsByType: {}, questionSectionLookup: {}, questionTypeLookup: {} };
      }
      return collectQuestionIdsByType(activeSectionsForQuestions);
    },
    [activeSectionsForQuestions]
  );

  const activeSection = useMemo(() => {
    if (sectionsToUse.length === 0) {
      return null;
    }
    if (activeSectionId) {
      return (
        sectionsToUse.find(
          (section: any) => section.section_id === activeSectionId
        ) || sectionsToUse[0]
      );
    }
    return sectionsToUse[0];
  }, [sectionsToUse, activeSectionId]);

  const activeSectionQuestionCount = useMemo(() => {
    if (!activeSection?.section_id) {
      return 0;
    }
    return Object.values(questionSectionLookup).filter(
      (sectionId) => sectionId === activeSection.section_id
    ).length;
  }, [activeSection, questionSectionLookup]);

  const activeSectionDisplayName = useMemo(() => {
    if (!activeSection) {
      return null;
    }
    const index = sectionsToUse.findIndex(
      (section: any) => section.section_id === activeSection.section_id
    );
    const fallbackName =
      index >= 0 ? `Section ${String(index + 1)}` : "Section";
    return activeSection.section_name || fallbackName;
  }, [activeSection, sectionsToUse]);

  const formattedActiveSectionQuestionCount = useMemo(() => {
    return String(activeSectionQuestionCount || 0).padStart(2, "0");
  }, [activeSectionQuestionCount]);

  // Section tabs state - declared early to be available for useEffect
  // Initialize active section based on assessment summary, localStorage, or first section
  useEffect(() => {
    if (sectionsToUse.length === 0) return;
    
    // Priority 1: Check localStorage for selected section (from section selection page)
    const storedSectionId = localStorage.getItem(`selected_section_id_${candidate_id}`);
    if (storedSectionId) {
      const sectionExists = sectionsToUse.some((s: any) => s.section_id === storedSectionId);
      if (sectionExists) {
        console.log("✅ Using stored section_id from localStorage:", storedSectionId);
        setActiveSectionId(storedSectionId);
        // Keep it in localStorage so fetchQuestionsByType can access it (don't remove)
        return;
      } else {
        console.warn("⚠️ Stored section_id not found in sections:", storedSectionId, "Available sections:", sectionsToUse.map((s: any) => s.section_id));
      }
    }
    
    // Try to get current section from assessment summary metadata
    let targetSectionId: string | null = null;
    
    // Check if assessment summary has current section info
    if (assessmentSummary?.metadata?.current_section_id) {
      targetSectionId = assessmentSummary.metadata.current_section_id;
    } else if (assessmentSummary?.assessment?.metadata?.current_section_id) {
      targetSectionId = assessmentSummary.assessment.metadata.current_section_id;
    }
    
    // If we found a current section ID, use it (even if activeSectionId is already set)
    // This ensures we update when assessment summary changes
    if (targetSectionId) {
      const sectionExists = sectionsToUse.some(
        (section: any) => section.section_id === targetSectionId
      );
      if (sectionExists) {
        if (activeSectionId !== targetSectionId) {
          setActiveSectionId(targetSectionId);
          // Store in localStorage so fetchQuestionsByType can access it
          if (candidate_id) {
            localStorage.setItem(`selected_section_id_${candidate_id}`, targetSectionId);
          }
          console.log("✅ Updated active section from assessment summary:", targetSectionId);
        }
        return;
      } else {
        console.warn("⚠️ Target section ID not found in sections:", targetSectionId, "Available sections:", sectionsToUse.map((s: any) => s.section_id));
      }
    }
    
    // Only set to first section if no active section is set
    if (!activeSectionId) {
      const firstSection = sectionsToUse[0];
      if (firstSection?.section_id) {
        setActiveSectionId(firstSection.section_id);
        // Store in localStorage so fetchQuestionsByType can access it
        if (candidate_id) {
          localStorage.setItem(`selected_section_id_${candidate_id}`, firstSection.section_id);
        }
        console.log("✅ Set active section to first section:", firstSection.section_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsToUse, assessmentSummary]);

  // Keep localStorage in sync with activeSectionId for fetchQuestionsByType
  useEffect(() => {
    if (activeSectionId && candidate_id) {
      localStorage.setItem(`selected_section_id_${candidate_id}`, activeSectionId);
    }
  }, [activeSectionId, candidate_id]);

  // Reset MCQ question state when section changes
  useEffect(() => {
    if (activeSectionId) {
      // Reset MCQ question key to first question when section changes
      setActiveMCQQuestionKey("1");
      // Clear MCQ cache to force reload of questions for new section
      setMcqQuestionsCache({});
      setMcqQuestionIdsMap({});
      hasInitializedMCQ.current = false;
    }
  }, [activeSectionId]);


  // Handle section transition countdown
  useEffect(() => {
    if (!showSectionTransitionModal) {
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Countdown finished, navigate to next section
      if (nextSectionPath) {
        console.log("🚀 Countdown finished, navigating to:", nextSectionPath);
        setShowSectionTransitionModal(false);
        
        // Use React Router navigate to preserve fullscreen mode
        // window.location.href would exit fullscreen, but navigate() preserves it
        setTimeout(() => {
          navigate(nextSectionPath, { replace: true });
        }, 500);
      }
    }
  }, [showSectionTransitionModal, countdown, nextSectionPath, navigate]);

  // Handle countdown completion - navigate to Section 2 instructions
  const handleCountdownComplete = useCallback(() => {
    setShowCountdownModal(false);
    
    // If switching to a specific section, navigate to that section
    if (selectedSectionToSwitch) {
      const selectedSection = sectionsToUse.find((s: any) => s.section_id === selectedSectionToSwitch);
      const selectedSectionIndex = sectionsToUse.findIndex((s: any) => s.section_id === selectedSectionToSwitch);
      const sectionOrder = selectedSectionIndex + 1;
      
      // Check if it's the last section
      const isSelectedLast = selectedSectionIndex === sectionsToUse.length - 1;
      
      if (isSelectedLast) {
        // Navigate to test page and show last section warning
        localStorage.setItem(`selected_section_id_${candidate_id}`, selectedSectionToSwitch);
        localStorage.setItem(`just_switched_to_last_section_${candidate_id}`, 'true');
        navigate(`/${candidate_id}/test`, { replace: true });
      } else {
        // Navigate to appropriate section instructions
        if (sectionOrder === 1) {
          navigate(`/${candidate_id}/section-1-instructions`, { replace: true });
        } else if (sectionOrder === 2) {
          navigate(`/${candidate_id}/section-2-instructions`, { replace: true });
        } else {
          // Fallback to test page
          localStorage.setItem(`selected_section_id_${candidate_id}`, selectedSectionToSwitch);
          navigate(`/${candidate_id}/test`, { replace: true });
        }
      }
      
      setSelectedSectionToSwitch(null);
    } else if (nextSectionPath) {
      // Original behavior for section transitions
      navigate(nextSectionPath, { replace: true });
      setNextSectionPath(null);
    } else {
      // Fallback: Navigate to Section 2 instructions
      navigate(`/${candidate_id}/section-2-instructions`, { replace: true });
    }
  }, [candidate_id, navigate, selectedSectionToSwitch, sectionsToUse, nextSectionPath]);

  const summaryRefreshAttemptedRef = useRef(false);

  // Fetch assessment summary on mount if not available
  const initialLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (initialLoadAttemptedRef.current) {
      return;
    }

    const fetchData = async () => {
      try {
        initialLoadAttemptedRef.current = true;
        const token = authToken || tokenValidation?.token;
        if (!token) {
          setErrorState({
            hasError: true,
            errorMessage: "Authentication token is missing. Please start the assessment again.",
          });
          message.error("Authentication required. Please start the assessment again.");
          setTimeout(() => navigate(`/${candidate_id}`), 2000);
          return;
        }

        // If assessment summary is missing, fetch it
        if (!assessmentSummary) {
          try {
            const summary = await fetchAssessmentSummary(token);
            if (summary && summary.sections && Array.isArray(summary.sections) && summary.sections.length > 0) {
              dispatch(setAssessmentSummary(summary));
              setErrorState({ hasError: false, errorMessage: "" });
            } else {
              const errorMsg = "Assessment data is incomplete. Please try starting the assessment again.";
              setErrorState({ hasError: true, errorMessage: errorMsg });
              message.error("Failed to load assessment data. Please try again.");
              setTimeout(() => navigate(`/${candidate_id}`), 3000);
            }
          } catch (error: any) {
            const errorMsg = error?.response?.data?.detail || error?.message || "Failed to load assessment data from server";
            setErrorState({ hasError: true, errorMessage: errorMsg });
            message.error(`${errorMsg}. Please start the assessment again.`);
            setTimeout(() => navigate(`/${candidate_id}`), 3000);
          }
        } else {
          // Assessment summary exists, clear any errors
          setErrorState({ hasError: false, errorMessage: "" });
        }
      } catch (error: any) {
        const errorMsg = error?.message || "An unexpected error occurred";
        setErrorState({ hasError: true, errorMessage: errorMsg });
        message.error(`Error: ${errorMsg}. Please try again.`);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    if (!assessmentSummary || !authToken) {
      return;
    }

    const sections = assessmentSummary.sections || [];
    const hasMissingQuestionIds = sections.some((section: any) =>
      section?.question_types?.some((qt: any) => {
        const hasCount = (qt?.count || 0) > 0;
        const hasIds =
          Array.isArray(qt?.question_ids) && qt.question_ids.length > 0;
        return hasCount && !hasIds;
      })
    );

    if (!hasMissingQuestionIds || summaryRefreshAttemptedRef.current) {
      return;
    }

    summaryRefreshAttemptedRef.current = true;

    (async () => {
      try {
        const refreshedSummary = await fetchAssessmentSummary(authToken);
        if (refreshedSummary) {
          dispatch(setAssessmentSummary(refreshedSummary));
        }
      } catch (error) {
        console.error(
          "Failed to refresh assessment summary with question IDs:",
          error
        );
      }
    })();
  }, [assessmentSummary, authToken, dispatch]);

  // Debug: Log secure mode status
  useEffect(() => {
    console.log("Test Component - Secure Mode Status:", {
      secureMode,
      secureModeLoading,
      showFullscreenModal,
      hasUserInteracted,
    });
  }, [secureMode, secureModeLoading, showFullscreenModal, hasUserInteracted]);

  // Debug: Log Redux state
  useEffect(() => {
    console.log("Test Component - Redux State:", {
      assessmentSummary: !!assessmentSummary,
      assessmentSummaryData: assessmentSummary,
      questionTypes: !!questionTypes,
      questionTypesData: questionTypes,
      authToken: !!authToken,
      authTokenValue: authToken ? authToken.substring(0, 20) + "..." : null,
      currentQuestions: currentQuestions.length,
      currentQuestionsData: currentQuestions,
    });
  }, [assessmentSummary, questionTypes, authToken, currentQuestions]);

  // Coding Question
  const [activeCodingQuestionKey, setActiveCodingQuestionKey] = useState("1");

  // MCQ Question - store questions by their ID
  const [activeMCQQuestionKey, setActiveMCQQuestionKey] = useState("1");
  const [mcqQuestionsCache, setMcqQuestionsCache] = useState<
    Record<string, any>
  >({});
  const [mcqQuestionIdsMap, setMcqQuestionIdsMap] = useState<
    Record<string, string>
  >({}); // Map tab ID to question_id

  const [loadingMCQQuestion, setLoadingMCQQuestion] = useState<string | null>(
    null
  );
  const [mcqQuestionError, setMcqQuestionError] = useState<string | null>(null);
  const hasInitializedMCQ = useRef(false); // Track if first question has been fetched

  // Header Main Tabs
  const [activeTabKey, setActiveTabKey] = useState("1");

  // Question management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>(
    {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(
    new Set()
  );
  
  // Ref to store debounce timeouts for auto-saving answers
  const answerSaveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Ref to store latest questionAnswers for access in closures
  const questionAnswersRef = useRef<Record<string, any>>({});
  // Ref to track which questions have had their candidate answers loaded
  const loadedCandidateAnswersRef = useRef<Set<string>>(new Set());

  const mcqExclusionSet = useMemo(() => new Set(["qt_007"]), []);
  const mcqTypeCodes = useMemo(() => new Set(["qt_001"]), []);

  const getMCQQuestionIds = useCallback(() => {
    const allQuestionIds = new Set<string>();

    Object.entries(questionIdsByType).forEach(([type, ids]) => {
      if (!mcqTypeCodes.has(type)) {
        return;
      }
      ids.forEach((id) => {
        // Filter by active section if a section is selected
        if (id) {
          if (activeSectionId) {
            // Only include questions from the active section
            if (questionSectionLookup[id] === activeSectionId) {
              allQuestionIds.add(id);
            }
          } else {
            // If no section is selected, include all questions
            allQuestionIds.add(id);
          }
        }
      });
    });

    const result = Array.from(allQuestionIds);

    console.log("Combined MCQ question IDs:", {
      total: result.length,
      byType: Object.entries(questionIdsByType).map(([type, ids]) => ({
        type,
        count: ids.length,
      })),
    });

    return result;
  }, [
    questionIdsByType,
    mcqTypeCodes,
    activeSectionId,
    questionSectionLookup,
  ]);

  const questionSectionMap = questionSectionLookup;

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const allQuestionIds = getMCQQuestionIds();
    if (allQuestionIds.length === 0) {
      return;
    }

    const idsMap: Record<string, string> = {};
    allQuestionIds.forEach((qid: string, index: number) => {
      idsMap[String(index + 1)] = qid;
    });

    setMcqQuestionIdsMap(idsMap);
    console.log("Question IDs Map initialized (MCQ only):", idsMap);
  }, [authToken, getMCQQuestionIds]);

  // Function to fetch a single MCQ question by tab key
  const fetchSingleMCQQuestion = useCallback(
    async (tabKey: string) => {
      // Get the actual question_id from the map
      const questionId = mcqQuestionIdsMap[tabKey];
      if (!questionId) {
        console.error(`No question_id found for tab key: ${tabKey}`);
        return;
      }

      if (!authToken) {
        console.error("No auth token available");
        return;
      }

      try {
        setLoadingMCQQuestion(tabKey);
        setMcqQuestionError(null);

        console.log(`Fetching question ${questionId} for tab ${tabKey}...`);

        // Retry logic for 500 errors
        let lastError: Error | null = null;
        const maxRetries = 2;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`Retrying fetch question ${questionId} (attempt ${attempt + 1}/${maxRetries + 1})...`);
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }

            const response = await fetch(
              API_ENDPOINTS.question.byId(questionId),
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            if (!response.ok) {
              const errorText = await response.text().catch(() => 'Unknown error');
              
              // If it's a 500 error and we have retries left, retry
              if (response.status === 500 && attempt < maxRetries) {
                lastError = new Error(`Server error (500): Attempt ${attempt + 1} failed`);
                continue; // Retry
              }
              
              const errorMessage = response.status === 500 
                ? `Server error (500): Unable to load question after ${attempt + 1} attempts. Please refresh the page or contact support.`
                : `Failed to fetch question (${response.status}): ${response.statusText}`;
              console.error(`Error fetching question ${questionId}:`, {
                status: response.status,
                statusText: response.statusText,
                errorText,
                attempt: attempt + 1
              });
              throw new Error(errorMessage);
            }

            // Success - break out of retry loop
            const question = await response.json();
            
            // Process the question (move the rest of the code here)
            const stripHtml = (value: string | null | undefined) => {
              if (!value) return "";
              return value
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            };

            const questionText = stripHtml(
              question.question_text || question.question
            );
            const questionDescription = stripHtml(
              question.description || question.question_text || question.question
            );

            const isEssay =
              question.question_type === "qt_006" ||
              !question.options ||
              question.options.length === 0;

            const sectionId = questionSectionMap[questionId] || "";

            // Transform to expected format (works for both MCQ and Essay)
            // IMPORTANT: Preserve candidate_answer and candidate_answer_html from API response
            const transformedQuestion = {
              id: tabKey,
              question_id: question.question_id,
              section_id: sectionId,
              question: questionText,
              question_text: questionText, // For essay questions
              question_type: question.question_type,
              question_time_limit: question.time_limit
                ? `${String(Math.floor(question.time_limit / 60)).padStart(
                    2,
                    "0"
                  )}:${String(question.time_limit % 60).padStart(2, "0")}`
                : "02:00",
              question_description: questionDescription,
              answer_type:
                question.question_type === "qt_001"
                  ? "singleselect"
                  : question.question_type === "qt_002"
                  ? "multiselect"
                  : question.question_type === "qt_006"
                  ? "essay"
                  : "singleselect",
              answers:
                question.options?.map((opt: any, optIndex: number) => {
                  // For true/false questions (2 options), show "True" and "False" labels
                  const isTrueFalse = question.options?.length === 2;
                  let label = "";
                  if (isTrueFalse) {
                    // For true/false questions, always show "True" and "False" labels
                    // First option is "True", second option is "False"
                    label = optIndex === 0 ? "True" : "False";
                  } else {
                    label = `${String.fromCharCode(65 + optIndex)}.) ${stripHtml(
                      opt.text ?? opt.value ?? ""
                    )}`.trim();
                  }
                  return {
                    id: opt.id || `option-${optIndex}`,
                    text: label,
                    label: label,
                    value: opt.value || opt.text || label,
                    is_correct: opt.is_correct || false,
                  };
                }) || [],
              is_answered: "0",
              is_flagged: "0",
              is_skipped: "0",
              max_score: question.max_score,
              difficulty_level: question.difficulty_level,
              tags: question.tags,
              concept: question.concept,
              shuffle_options: question.shuffle_options,
              hints: question.hints,
              skill: question.skill,
              domain: question.domain,
              time_limit: question.time_limit,
              // Preserve candidate_answer fields from API response (if available)
              candidate_answer: question.candidate_answer,
              candidate_answer_html: question.candidate_answer_html,
            };

            console.log("Question transformed:", {
              type: isEssay ? "Essay" : "MCQ",
              hasOptions: transformedQuestion.answers.length > 0,
            });

            // Cache the transformed question
            setMcqQuestionsCache((prev) => {
              const updated = {
                ...prev,
                [tabKey]: transformedQuestion,
              };
              // Update ref immediately for error handling
              mcqCacheRef.current = updated;
              return updated;
            });

            // Clear any previous error since question was successfully fetched
            setMcqQuestionError(null);

            console.log(
              `Successfully fetched and cached question ${tabKey}:`,
              transformedQuestion
            );
            
            return; // Success - exit function
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
              continue; // Retry
            }
            // If this was the last attempt, throw the error
            throw lastError;
          }
        }
        
        // This should never be reached, but just in case
        if (lastError) {
          throw lastError;
        }
      } catch (error) {
        console.error(`Error fetching MCQ question ${tabKey}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch question";
        
        // Check if question was successfully cached using ref (to avoid dependency issues)
        const wasCached = mcqCacheRef.current[tabKey];
        
        // Only set error if question wasn't successfully cached
        if (!wasCached) {
          setMcqQuestionError(errorMessage);
        } else {
          // Question was cached successfully, clear any previous error
          setMcqQuestionError(null);
        }
      } finally {
        setLoadingMCQQuestion(null);
      }
    },
    [authToken, mcqQuestionIdsMap, questionSectionMap]
  );

  // Fetch all MCQ questions when IDs map is ready
  useEffect(() => {
    if (
      Object.keys(mcqQuestionIdsMap).length > 0 &&
      !hasInitializedMCQ.current &&
      authToken
    ) {
      console.log("Fetching all MCQ questions...");
      hasInitializedMCQ.current = true;
      
      // Fetch all MCQ questions upfront (with a small delay between requests to avoid overwhelming the server)
      const allQuestionKeys = Object.keys(mcqQuestionIdsMap).sort((a, b) => Number(a) - Number(b));
      
      // Fetch questions sequentially with a small delay to avoid rate limiting
      allQuestionKeys.forEach((key, index) => {
        setTimeout(() => {
          // Only fetch if not already cached
          if (!mcqQuestionsCache[key] && !mcqCacheRef.current[key]) {
            fetchSingleMCQQuestion(key);
          }
        }, index * 100); // 100ms delay between each request
      });
    }
  }, [
    mcqQuestionIdsMap,
    fetchSingleMCQQuestion,
    authToken,
  ]);

  // Use ref to track cache without causing re-renders
  const mcqCacheRef = useRef<Record<string, any>>({});

  // Update ref when cache changes
  useEffect(() => {
    mcqCacheRef.current = mcqQuestionsCache;
  }, [mcqQuestionsCache]);

  // Fetch question when tab changes
  const handleMCQTabChange = useCallback(
    (newTabKey: string) => {
      setActiveMCQQuestionKey(newTabKey);
      // Fetch question for the new tab if not already cached
      if (!mcqCacheRef.current[newTabKey]) {
        fetchSingleMCQQuestion(newTabKey);
      }
    },
    [fetchSingleMCQQuestion]
  );

  // Function to mark question as answered in cache and store the answer
  const markQuestionAsAnswered = useCallback(
    (
      tabKey: string,
      answerData?: {
        selectedAnswer?: string | null;
        selectedAnswers?: string[];
      }
    ) => {
      console.log("🔄 Marking question as answered:", tabKey, answerData);
      
      // Update MCQ cache
      setMcqQuestionsCache((prev) => {
        const updated = { ...prev };
        if (updated[tabKey]) {
          updated[tabKey] = {
            ...updated[tabKey],
            is_answered: "1",
            ...(answerData?.selectedAnswer !== undefined && {
              storedSelectedAnswer: answerData.selectedAnswer,
            }),
            ...(answerData?.selectedAnswers !== undefined && {
              storedSelectedAnswers: answerData.selectedAnswers,
            }),
          };
          console.log("✅ Updated question in cache:", updated[tabKey]);
        } else {
          console.warn("⚠️ Question not found in cache:", tabKey);
        }
        return updated;
      });
      
      // Also update questionAnswers state for green tick display
      setQuestionAnswers((prev) => {
        const questionId = tabKey;
        let answerValue: any;
        
        if (answerData?.selectedAnswer !== undefined && answerData.selectedAnswer !== null) {
          // For single select, store the answer ID as the value
          answerValue = answerData.selectedAnswer;
        } else if (answerData?.selectedAnswers !== undefined && answerData.selectedAnswers.length > 0) {
          // For multi-select, store the array of answer IDs
          answerValue = answerData.selectedAnswers;
        } else {
          // If no answer provided, mark as answered with empty string
          answerValue = "";
        }
        
        return {
          ...prev,
          [questionId]: answerValue,
        };
      });
    },
    []
  );

  // Get section_id for a question (similar to MCQ's getSectionId)
  const getSectionIdForQuestion = useCallback((questionId: string) => {
    // First check questionSectionLookup
    if (questionSectionLookup[questionId]) {
      return questionSectionLookup[questionId];
    }

    // Check assessmentSummary
    if (assessmentSummary?.sections) {
      for (const section of assessmentSummary.sections) {
        if (!section?.question_types) continue;
        for (const qt of section.question_types) {
          if (qt?.question_ids?.includes?.(questionId)) {
            return section.section_id || "";
          }
        }
      }
    }

    // Check tokenValidation
    const tokenSections = tokenValidation?.sections || [];
    for (const section of tokenSections) {
      if (
        section?.section_id &&
        section?.question_ids?.includes?.(questionId)
      ) {
        return section.section_id;
      }
    }

    // Fallback to activeSectionId
    if (activeSectionId) {
      return activeSectionId;
    }

    // Last resort: first section
    const firstSection = assessmentSummary?.sections?.[0];
    return firstSection?.section_id || "";
  }, [questionSectionLookup, assessmentSummary, tokenValidation, activeSectionId]);

  // Submit answer to API (similar to MCQ's submitAnswer)
  const submitAnswer = useCallback(async (questionId: string, answerText: string, questionType: string) => {
    if (!questionId) {
      console.error("No question_id available");
      return false;
    }

    // CRITICAL: Validate that answerText is not the questionId itself
    if (answerText === questionId) {
      console.error("❌ Invalid answer - answer is same as questionId:", questionId);
      return false;
    }

    // For subjective questions, validate that answer is not a UUID
    if (questionType === 'qt_005' || questionType === 'qt_006') {
      if (typeof answerText === 'string') {
        const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answerText);
        if (looksLikeUUID && answerText === questionId) {
          console.error("❌ Invalid answer - answer is UUID matching questionId:", questionId);
          return false;
        }
      }
    }

    const token = authToken || tokenValidation?.token;
    if (!token) {
      console.error("No auth token available");
      return false;
    }

    const sectionId = getSectionIdForQuestion(questionId);
    if (!sectionId) {
      console.error("No section_id available for question:", questionId);
      return false;
    }

    try {
      // For subjective questions (qt_005, qt_006), convert HTML to plain text
      let finalAnswerText = answerText;
      if (questionType === 'qt_005' || questionType === 'qt_006') {
        if (typeof answerText === 'string') {
          // Convert HTML to plain text
          finalAnswerText = answerText
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Decode &amp;
            .replace(/&lt;/g, '<') // Decode &lt;
            .replace(/&gt;/g, '>') // Decode &gt;
            .replace(/&quot;/g, '"') // Decode &quot;
            .replace(/&#39;/g, "'") // Decode &#39;
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Validate that we have actual text content
          if (finalAnswerText.length === 0) {
            console.warn("⚠️ Answer has no text content after HTML conversion, skipping save");
            return false;
          }
        }
      }

      const payload = {
        section_id: sectionId,
        question_type: questionType,
        question_id: questionId,
        answer: finalAnswerText,
        time_spent: 0, // Could track this if needed
      };

      console.log("📤 Submitting answer:", payload);

      const response = await fetch(API_ENDPOINTS.candidate.answers, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Answer submission failed:",
          response.status,
          errorText
        );
        throw new Error(`Failed to submit answer: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Answer submitted successfully:", result);
      return true;
    } catch (error) {
      console.error("❌ Error submitting answer:", error);
      return false;
    }
  }, [authToken, tokenValidation, getSectionIdForQuestion]);

  // Handle answer change with auto-save for subjective/essay questions
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    // CRITICAL: Validate that answer is not the questionId itself
    // This prevents accidentally storing questionId as the answer
    if (answer === questionId || (typeof answer === 'string' && answer === questionId)) {
      console.error("❌ Invalid answer - answer is same as questionId:", questionId);
      return; // Don't store if answer is the questionId
    }
    
    // For subjective questions, validate that answer is not a UUID matching questionId
    if (typeof answer === 'string') {
      const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answer);
      if (looksLikeUUID && answer === questionId) {
        console.error("❌ Invalid answer - answer is UUID matching questionId:", questionId);
        return; // Don't store if answer is a UUID matching questionId
      }
    }
    
    // Mark that we've loaded/manually set this answer (so we don't overwrite it from API)
    loadedCandidateAnswersRef.current.add(questionId);
    
    // Update state immediately for UI responsiveness
    setQuestionAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: answer,
      };
      // Also update ref for access in closures
      questionAnswersRef.current = updated;
      return updated;
    });

    // Auto-save subjective/essay and True/False answers to API (debounced)
    // Find the question to get its type and section
    let question = currentQuestions?.find((q: any) => 
      (q.question_id === questionId || q.id === questionId)
    );
    
    // Check if answer is HTML (subjective) or simple text
    const answerIsHTML = typeof answer === 'string' && answer.includes('<') && answer.includes('>');
    
    // If question not found in currentQuestions, try to get question type from lookup
    let questionType = question?.question_type;
    if (!questionType && questionTypeLookup[questionId]) {
      questionType = questionTypeLookup[questionId];
      console.log("✅ Found question type from lookup:", questionType);
    }
    
    // If still not found, infer from answer format
    if (!questionType) {
      if (answerIsHTML) {
        questionType = 'qt_006'; // Subjective
        console.log("✅ Inferring qt_006 from HTML answer");
      } else if (answer === 'True' || answer === 'False') {
        questionType = 'qt_003'; // True/False
        console.log("✅ Inferring qt_003 from True/False answer");
      } else {
        questionType = 'qt_001'; // Default to MCQ
        console.log("⚠️ Question type not found, defaulting to qt_001");
      }
    }
    
    console.log("🔍 handleAnswerChange - questionId:", questionId, "question found:", !!question, "question_type:", questionType);
    console.log("🔍 Answer type:", typeof answer, "Answer preview:", typeof answer === 'string' ? answer.substring(0, 50) : answer, "isHTML:", answerIsHTML);
    
    // Use question if found, otherwise create a minimal question object
    if (!question && questionType) {
      question = {
        question_id: questionId,
        id: questionId,
        question_type: questionType,
      };
    }
    
    // Determine question type for auto-save logic
    const isSubjective = questionType === 'qt_005' || questionType === 'qt_006';
    const isTrueFalse = questionType === 'qt_003';
    
    // For subjective/essay: check if answer is a non-empty HTML string with actual content
    // IMPORTANT: Reject "True" or "False" for essay questions (those are for True/False questions)
    // For True/False: check if answer is 'True' or 'False'
    const textContentLength = typeof answer === 'string' ? answer.replace(/<[^>]*>/g, '').trim().length : 0;
    const shouldAutoSave = isSubjective 
      ? (typeof answer === 'string' && 
         answer !== 'True' && 
         answer !== 'False' && 
         textContentLength > 0)
      : isTrueFalse
      ? (answer === 'True' || answer === 'False')
      : false;
    
    console.log("🔍 shouldAutoSave:", shouldAutoSave, "textContentLength:", textContentLength, "isSubjective:", isSubjective, "questionType:", questionType);
    
    // CRITICAL: Validate that answer is not the questionId before processing
    const answerTextContent = typeof answer === 'string' ? answer.replace(/<[^>]*>/g, '').trim() : '';
    if (answerTextContent === questionId) {
      console.error("❌ handleAnswerChange: Answer text content matches questionId, skipping:", questionId);
      return;
    }
    
    // DISABLED: Auto-save to API on every keystroke
    // Answers are now saved only locally to state
    // API calls will happen only when:
    // 1. User navigates away (via forceSaveAnswerOnNavigation)
    // 2. User explicitly saves/submits
    // 3. Periodic saves (if implemented)
    
    // Only save True/False immediately to API (they're small and simple)
    if (isTrueFalse && (answer === 'True' || answer === 'False')) {
      console.log("✅ Auto-save triggered for True/False question:", questionId);
      // Clear existing timeout for this question
      if (answerSaveTimeoutsRef.current[questionId]) {
        clearTimeout(answerSaveTimeoutsRef.current[questionId]);
        delete answerSaveTimeoutsRef.current[questionId];
      }

      // Save function to be called immediately
      const saveAnswerToAPI = async () => {
        // Get the latest answer from ref (which is always up-to-date)
        const latestAnswer = questionAnswersRef.current[questionId] || answer;
        
        // CRITICAL: Validate that latestAnswer is not the questionId itself
        if (latestAnswer === questionId || (typeof latestAnswer === 'string' && latestAnswer === questionId)) {
          console.error("❌ Invalid answer detected - answer is same as questionId:", questionId);
          return;
        }
        
        const answerText = typeof latestAnswer === 'string' ? latestAnswer : String(latestAnswer);
        
        console.log("💾 Saving True/False answer for question:", questionId, "Answer:", answerText);
        
        // Submit answer using the same approach as MCQ
        const success = await submitAnswer(questionId, answerText, questionType);
        
        if (success) {
          console.log("✅ Successfully saved True/False answer for question:", questionId);
          // CRITICAL: Always update questionAnswers state after successful save
          // This ensures the tick mark appears immediately
          setQuestionAnswers((prev) => {
            const updated = { ...prev, [questionId]: answerText };
            // Also update ref for access in closures
            questionAnswersRef.current = updated;
            console.log("💾 Updated questionAnswers state for question:", questionId);
            return updated;
          });
        } else {
          console.error("❌ Failed to save True/False answer for question:", questionId);
        }
        
        // Clean up timeout reference
        delete answerSaveTimeoutsRef.current[questionId];
      };

      // Save immediately for True/False (small payload, no issue)
      saveAnswerToAPI().catch((err) => {
        console.error("❌ Error saving True/False answer:", err);
      });
    } else {
      // For subjective/essay questions, only save locally - API will be called on navigation
      console.log("💾 Answer saved locally only (no API call) - questionId:", questionId, "Type:", questionType);
      console.log("💾 API will be called when navigating away or on explicit save");
    }
  }, [authToken, tokenValidation, currentQuestions, questionSectionLookup, submitAnswer, questionTypeLookup]);

  // Function to force immediate save when navigating away
  const forceSaveAnswerOnNavigation = useCallback(async (questionId: string) => {
    console.log("🔍 forceSaveAnswerOnNavigation called for question:", questionId);
    
    // Clear any pending timeout for this question and save immediately
    if (answerSaveTimeoutsRef.current[questionId]) {
      clearTimeout(answerSaveTimeoutsRef.current[questionId]);
      delete answerSaveTimeoutsRef.current[questionId];
    }

    // Get the answer from ref first, then fallback to state
    let answer = questionAnswersRef.current[questionId];
    if (answer === undefined || answer === null) {
      // Fallback to state if not in ref
      answer = questionAnswers[questionId];
      console.log("📝 Answer not in ref, checking state:", answer ? "found" : "not found");
    }
    
    if (answer === undefined || answer === null) {
      console.log("⚠️ No answer to save for question:", questionId);
      return;
    }

    console.log("📝 Answer found:", typeof answer === 'string' ? answer.substring(0, 50) : answer);

    // CRITICAL: Validate that answer is not the questionId itself
    if (answer === questionId || (typeof answer === 'string' && answer === questionId)) {
      console.error("❌ Invalid answer - answer is same as questionId:", questionId);
      return;
    }

    // Find the question to get its type
    const question = currentQuestions?.find((q: any) => 
      (q.question_id === questionId || q.id === questionId)
    );
    
    if (!question) {
      console.log("⚠️ Question not found for ID:", questionId);
      return;
    }

    const isSubjective = question.question_type === 'qt_005' || question.question_type === 'qt_006';
    const isTrueFalse = question.question_type === 'qt_003';
    
    console.log("📝 Question type:", question.question_type, "isSubjective:", isSubjective, "isTrueFalse:", isTrueFalse);
    
    // For subjective questions, validate that answer is not a UUID
    if (isSubjective && typeof answer === 'string') {
      const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answer);
      if (looksLikeUUID && answer === questionId) {
        console.error("❌ Invalid answer - answer is UUID matching questionId:", questionId);
        return;
      }
    }
    
    // Check if answer should be saved
    const shouldSave = isSubjective 
      ? (typeof answer === 'string' && 
         answer !== 'True' && 
         answer !== 'False' && 
         answer.replace(/<[^>]*>/g, '').trim().length > 0)
      : isTrueFalse
      ? (answer === 'True' || answer === 'False')
      : false;

    console.log("📝 shouldSave:", shouldSave, "answer length:", typeof answer === 'string' ? answer.replace(/<[^>]*>/g, '').trim().length : 0);

    if (!shouldSave) {
      console.log("⚠️ Answer validation failed, not saving for question:", questionId);
      return;
    }

    // Use submitAnswer function (same as MCQ)
    // HTML will be converted to plain text in submitAnswer for subjective questions
    const answerText = typeof answer === 'string' ? answer : String(answer);
    console.log("🚀 Force saving answer on navigation for question:", questionId, "Answer preview:", answerText.substring(0, 100));
    const success = await submitAnswer(questionId, answerText, question.question_type);
    
    // CRITICAL: Update state after force save to ensure tick mark appears
    if (success) {
      setQuestionAnswers((prev) => {
        const updated = { ...prev, [questionId]: isSubjective ? answer : answerText };
        questionAnswersRef.current = updated;
        console.log("💾 Force saved and updated state for question:", questionId);
        return updated;
      });
    } else {
      console.error("❌ Failed to force save answer for question:", questionId);
    }
  }, [currentQuestions, submitAnswer, questionAnswers]);


  // Generate tabs dynamically
  const generateDynamicTabs = useCallback(() => {
    if (!questionTypes) {
      return [];
    }

    const allTabs: any[] = [];
    let tabKeyCounter = 1;
    const processedTypes = new Set<string>();
    let runningQuestionCount = 0;

    const typeOrder: string[] = [];
    // Only include question types from the active section
    sectionsToUse.forEach((section: any) => {
      // Filter by active section if one is selected
      if (activeSectionId && section.section_id !== activeSectionId) {
        return;
      }
      section?.question_types?.forEach((qt: any) => {
        if (qt?.type && !typeOrder.includes(qt.type)) {
          typeOrder.push(qt.type);
        }
      });
    });

    Object.keys(questionIdsByType).forEach((type) => {
      if (!typeOrder.includes(type)) {
        typeOrder.push(type);
      }
    });

    const questionTypeMetaMap = new Map<string, any>(
      questionTypes.map((qt: any) => [qt.code, qt])
    );

    const getFallbackCount = (typeCode: string) => {
      return sectionsToUse.reduce((total, section) => {
        // Filter by active section if one is selected
        if (activeSectionId && section.section_id !== activeSectionId) {
          return total;
        }
        const match = section?.question_types?.find(
          (qt: any) => qt?.type === typeCode
        );
        return total + (match?.count || 0);
      }, 0);
    };

    const buildLabel = (typeCode: string, totalCount: number) => {
      const questionType = questionTypeMetaMap.get(typeCode);
      const displayName =
        questionType?.display_name || questionType?.name || typeCode;
      return `${displayName} (${totalCount})`;
    };

    const mcqQuestionIds = getMCQQuestionIds();
    let mcqTabKey: string | null = null;

    typeOrder.forEach((typeCode) => {
      if (processedTypes.has(typeCode)) {
        return;
      }

      if (mcqTypeCodes.has(typeCode)) {
        if (mcqQuestionIds.length === 0) {
          processedTypes.add(typeCode);
          return;
        }

        const tabKey = tabKeyCounter.toString();
        mcqTabKey = tabKey;

        const mcqQuestionsArray = Object.keys(mcqQuestionIdsMap).map(
          (mcqKey) =>
            mcqQuestionsCache[mcqKey] || {
              id: mcqKey,
              question: "Loading...",
              question_text: "Loading...",
              question_type: "",
              question_time_limit: "02:00",
              question_description: "Loading question...",
              answer_type: "singleselect",
              answers: [],
              is_answered: "0",
              is_flagged: "0",
              is_skipped: "0",
            }
        );

        allTabs.push({
          key: tabKey,
          label: `Questions (${mcqQuestionIds.length})`,
          content: null,
          questionType: typeCode,
          count: mcqQuestionIds.length,
          globalOffset: runningQuestionCount,
          mcqProps: {
            activeMCQQuestionKey,
            setActiveMCQQuestionKey: handleMCQTabChange,
            datas: mcqQuestionsArray,
            loadingQuestion: !!loadingMCQQuestion,
            error: mcqQuestionError,
            totalQuestions: mcqQuestionsArray.length,
            onAnswerSubmitted: markQuestionAsAnswered,
            sectionName: activeSectionDisplayName,
            sectionQuestionCount: activeSectionQuestionCount,
          },
        });

        tabKeyCounter++;
        runningQuestionCount += mcqQuestionIds.length;
        processedTypes.add(typeCode);
        return;
      }

      // Filter question IDs by active section
      let filteredQuestionIds = questionIdsByType[typeCode] || [];
      if (activeSectionId) {
        filteredQuestionIds = filteredQuestionIds.filter(
          (id: string) => questionSectionLookup[id] === activeSectionId
        );
      }
      const questionCount =
        filteredQuestionIds.length || getFallbackCount(typeCode);

      if (typeCode === "qt_007") {
        allTabs.push({
          key: tabKeyCounter.toString(),
          label: buildLabel(typeCode, questionCount),
          content: (
            <CodingQuestionTab
              props={{
                activeCodingQuestionKey,
                setActiveCodingQuestionKey,
                codingDatas: [],
              }}
            />
          ),
          questionType: typeCode,
          count: questionCount,
        });
        processedTypes.add(typeCode);
        tabKeyCounter++;
        return;
      }

      const questionType = questionTypeMetaMap.get(typeCode);
      const displayName =
        questionType?.display_name || questionType?.name || typeCode;

      const placeholder = (
        <div className="p-6">
          <div className="flex items-center justify-center p-8">
            <Text className="text-white animate-pulse text-lg">
              Loading {displayName} questions...
            </Text>
          </div>
        </div>
      );

      const tabKey = tabKeyCounter.toString();

      allTabs.push({
        key: tabKey,
        label: buildLabel(typeCode, questionCount),
        content: placeholder,
        questionType: typeCode,
        count: questionCount,
        globalOffset: runningQuestionCount,
      });
      processedTypes.add(typeCode);
      tabKeyCounter++;
      runningQuestionCount += questionCount;
    });

    console.log("Generated dynamic tabs:", allTabs);
    return { tabs: allTabs, mcqTabKey, totalQuestionsInSection: runningQuestionCount };
  }, [
    questionTypes,
    sectionsToUse,
    questionIdsByType,
    questionSectionLookup,
    activeSectionId,
    getMCQQuestionIds,
    mcqQuestionIdsMap,
    mcqQuestionsCache,
    activeMCQQuestionKey,
    handleMCQTabChange,
    loadingMCQQuestion,
    mcqQuestionError,
    activeCodingQuestionKey,
    mcqTypeCodes,
    markQuestionAsAnswered,
    activeSectionDisplayName,
    activeSectionQuestionCount,
  ]);

  const memoizedTabs = useMemo(() => generateDynamicTabs(), [generateDynamicTabs]) as {
    tabs: any[];
    mcqTabKey: string | null;
    totalQuestionsInSection: number;
  };
  const tabs = memoizedTabs.tabs;
  const mcqTabKey = memoizedTabs.mcqTabKey;
  const totalQuestionsInSection = memoizedTabs.totalQuestionsInSection;

  // Load candidate answers from fetched questions into questionAnswers state
  useEffect(() => {
    if (!currentQuestions || currentQuestions.length === 0) {
      return;
    }

    // Load candidate answers from questions that haven't been loaded yet
    const newAnswers: Record<string, any> = {};
    let hasNewAnswers = false;

    currentQuestions.forEach((question: any) => {
      const questionId = question.question_id || question.id;
      if (!questionId) return;

      // For True/False and subjective questions, always check and update from API
      // This ensures tick marks persist when navigating back
      const questionType = question.question_type;
      const isTrueFalse = questionType === 'qt_003';
      const isSubjective = questionType === 'qt_005' || questionType === 'qt_006';
      
      // Skip only if:
      // 1. We've already loaded this question's candidate answer AND
      // 2. It exists in state AND
      // 3. It's NOT a True/False or subjective question (these need to be reloaded from API)
      // This ensures True/False and subjective answers are always synced with API
      if (loadedCandidateAnswersRef.current.has(questionId) && 
          questionAnswersRef.current[questionId] && 
          !isTrueFalse && !isSubjective) {
        return;
      }

      // Check for candidate_answer or candidate_answer_html
      let candidateAnswer: any = null;

      if (isSubjective) {
        // For subjective questions, prefer candidate_answer_html, fallback to candidate_answer
        candidateAnswer = question.candidate_answer_html || question.candidate_answer;
        
        // Validate: reject "True" or "False" (those are for True/False questions)
        if (candidateAnswer === 'True' || candidateAnswer === 'False') {
          candidateAnswer = null;
        }
        
        // Validate: reject hash/UUID values
        if (candidateAnswer && typeof candidateAnswer === 'string') {
          const looksLikeHash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateAnswer) ||
            (/^[0-9a-f]{20,}$/i.test(candidateAnswer) && !/\s/.test(candidateAnswer) && candidateAnswer.length > 20);
          
          if (looksLikeHash) {
            candidateAnswer = null;
          } else {
            // Check if it has actual content (not just HTML tags)
            const textContent = candidateAnswer.replace(/<[^>]*>/g, '').trim();
            if (textContent.length === 0) {
              candidateAnswer = null;
            }
          }
        }
      } else if (isTrueFalse) {
        // For True/False questions, use candidate_answer (should be 'True' or 'False')
        candidateAnswer = question.candidate_answer;
        
        // Validate: only accept 'True' or 'False'
        if (candidateAnswer !== 'True' && candidateAnswer !== 'False') {
          candidateAnswer = null;
        }
      }

      // If we have a valid candidate answer, add it to the state
      if (candidateAnswer !== null && candidateAnswer !== undefined) {
        newAnswers[questionId] = candidateAnswer;
        hasNewAnswers = true;
        loadedCandidateAnswersRef.current.add(questionId);
        console.log("📥 Loaded candidate answer for question:", questionId, "Type:", questionType, "Answer:", 
          typeof candidateAnswer === 'string' ? candidateAnswer.substring(0, 50) : candidateAnswer);
      }
    });

    // Update questionAnswers state with loaded candidate answers
    if (hasNewAnswers) {
      setQuestionAnswers((prev) => {
        const updated = { ...prev, ...newAnswers };
        // Also update ref
        questionAnswersRef.current = updated;
        console.log("📥 Loaded candidate answers into state:", Object.keys(newAnswers).length, "questions");
        return updated;
      });
    }
  }, [currentQuestions]);

  // Filter currentQuestions to only include questions from the active section
  const filteredCurrentQuestions = useMemo(() => {
    if (!activeSectionId || !currentQuestions || currentQuestions.length === 0) {
      return currentQuestions || [];
    }
    
    const filtered = currentQuestions.filter((question: any) => {
      const questionId = question.question_id || question.id;
      const questionSection = questionSectionLookup[questionId];
      return questionSection === activeSectionId;
    });
    
    console.log("🔍 Filtered questions by section:", {
      activeSectionId,
      totalQuestions: currentQuestions.length,
      filteredCount: filtered.length,
      questionIds: filtered.map((q: any) => q.question_id || q.id)
    });
    
    return filtered;
  }, [currentQuestions, activeSectionId, questionSectionLookup]);

  // Reset question index if it's out of bounds for filtered questions
  useEffect(() => {
    if (filteredCurrentQuestions.length > 0 && currentQuestionIndex >= filteredCurrentQuestions.length) {
      console.log("⚠️ Resetting question index - out of bounds for filtered questions");
      setCurrentQuestionIndex(0);
    }
  }, [filteredCurrentQuestions.length, currentQuestionIndex]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < filteredCurrentQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const currentTabIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
    if (currentTabIndex >= 0 && currentTabIndex < tabs.length - 1) {
      const nextTab = tabs[currentTabIndex + 1];
      if (nextTab) {
        setActiveTabKey(nextTab.key);
        setCurrentQuestionIndex(0);
        if (
          nextTab.questionType &&
          nextTab.questionType !== "qt_001" &&
          nextTab.questionType !== "qt_007"
        ) {
          fetchQuestionsByType(nextTab.questionType);
        }
      }
    }
  }, [
    currentQuestionIndex,
    filteredCurrentQuestions.length,
    tabs,
    activeTabKey,
    fetchQuestionsByType,
  ]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      return;
    }

    const currentTabIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
    if (currentTabIndex > 0) {
      const previousTab = tabs[currentTabIndex - 1];
      if (previousTab) {
        const previousCount = previousTab.count ?? 0;
        setActiveTabKey(previousTab.key);
        setCurrentQuestionIndex(previousCount > 0 ? previousCount - 1 : 0);

        if (
          previousTab.questionType &&
          previousTab.questionType !== "qt_001" &&
          previousTab.questionType !== "qt_007"
        ) {
          fetchQuestionsByType(previousTab.questionType);
        }
      }
    }
  }, [currentQuestionIndex, tabs, activeTabKey, fetchQuestionsByType]);

  // Navigate to a specific question by global question number
  const goToQuestionByNumber = useCallback((questionNum: number) => {
    if (questionNum < 1 || questionNum > totalQuestionsInSection) {
      return;
    }

    // Find which tab contains this question
    let accumulatedOffset = 0;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabCount = tab.count ?? 0;
      const tabStart = accumulatedOffset + 1;
      const tabEnd = accumulatedOffset + tabCount;

      if (questionNum >= tabStart && questionNum <= tabEnd) {
        // This question is in this tab
        const questionIndexInTab = questionNum - tabStart;
        
        // Switch to this tab if needed
        if (tab.key !== activeTabKey) {
          setActiveTabKey(tab.key);
          
          // Fetch questions if needed
          if (
            tab.questionType &&
            tab.questionType !== "qt_001" &&
            tab.questionType !== "qt_007"
          ) {
            fetchQuestionsByType(tab.questionType);
          }
        }
        
        // For MCQ questions (qt_001), use handleMCQTabChange
        if (tab.questionType === "qt_001" && tab.mcqProps?.datas) {
          const mcqQuestion = tab.mcqProps.datas[questionIndexInTab];
          if (mcqQuestion && mcqQuestion.id) {
            handleMCQTabChange(mcqQuestion.id);
          }
        } else {
          // For other question types, set the question index
          setCurrentQuestionIndex(questionIndexInTab);
        }
        return;
      }
      
      accumulatedOffset += tabCount;
    }
  }, [tabs, activeTabKey, totalQuestionsInSection, fetchQuestionsByType, setActiveTabKey, handleMCQTabChange]);

  // Helper to check if a question is answered by its global number
  const isQuestionAnswered = useCallback((questionNum: number): boolean => {
    // Find which tab contains this question
    let accumulatedOffset = 0;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabCount = tab.count ?? 0;
      const tabStart = accumulatedOffset + 1;
      const tabEnd = accumulatedOffset + tabCount;

      if (questionNum >= tabStart && questionNum <= tabEnd) {
        const questionIndexInTab = questionNum - tabStart;
        
        // For MCQ questions (qt_001), check the mcqQuestionsCache directly
        if (tab.questionType === "qt_001") {
          // Get question from datas array to get the questionId
          const question = tab.mcqProps?.datas?.[questionIndexInTab];
          if (question) {
            // The cache key is question.id (the MCQ key like "1", "2", "3")
            // question_details.id is what's passed to markQuestionAsAnswered
            const cacheKey = question.id; // This is the key used in mcqQuestionsCache
            const questionId = question.question_id; // This is the database question ID
            
            // Priority 1: Check mcqQuestionsCache directly using cacheKey (most up-to-date)
            // markQuestionAsAnswered stores answers using question_details.id as the key
            if (cacheKey && mcqQuestionsCache[cacheKey]) {
              const cachedQuestion = mcqQuestionsCache[cacheKey];
              // Check is_answered flag first
              if (cachedQuestion.is_answered === "1" || cachedQuestion.is_answered === 1) {
                return true;
              }
              // Check stored answers - if they exist, question is answered
              if (cachedQuestion.storedSelectedAnswer !== undefined && cachedQuestion.storedSelectedAnswer !== null) {
                return true;
              }
              if (cachedQuestion.storedSelectedAnswers && cachedQuestion.storedSelectedAnswers.length > 0) {
                return true;
              }
            }
            
            // Also check all cache entries by question_id if it exists
            if (questionId) {
              for (const [cacheKey, cachedQuestion] of Object.entries(mcqQuestionsCache)) {
                if (cachedQuestion?.question_id === questionId) {
                  if (cachedQuestion.is_answered === "1" || cachedQuestion.is_answered === 1) {
                    return true;
                  }
                  if (cachedQuestion.storedSelectedAnswer !== undefined && cachedQuestion.storedSelectedAnswer !== null) {
                    return true;
                  }
                  if (cachedQuestion.storedSelectedAnswers && cachedQuestion.storedSelectedAnswers.length > 0) {
                    return true;
                  }
                }
              }
            }
            
            // Priority 2: Check questionAnswers state (also updated by markQuestionAsAnswered)
            // Check with both cacheKey and questionId
            if (cacheKey && cacheKey in questionAnswers) {
              return true;
            }
            if (questionId && questionId in questionAnswers) {
              return true;
            }
            
            // Priority 3: Check if question in datas array is marked as answered (fallback)
            if (question.is_answered === "1" || question.is_answered === 1) {
              return true;
            }
            if (question.storedSelectedAnswer !== undefined && question.storedSelectedAnswer !== null) {
              return true;
            }
            if (question.storedSelectedAnswers && question.storedSelectedAnswers.length > 0) {
              return true;
            }
          }
        }
        // For other question types (True/False, Essay, etc.), check questionAnswers state
        else {
          // Helper function to check if answer is valid (handles HTML strings for essay questions and True/False)
          const isValidAnswer = (ans: any, qType?: string): boolean => {
            if (ans === undefined || ans === null) return false;
            
            if (typeof ans === 'string') {
              // For True/False questions, check if answer is 'True' or 'False'
              if (qType === 'qt_003') {
                return ans === 'True' || ans === 'False';
              }
              
              // For HTML strings (essay questions), check if there's actual content
              // Remove HTML tags and check if there's text content
              // IMPORTANT: Reject "True" or "False" for essay questions
              if (qType === 'qt_005' || qType === 'qt_006') {
                if (ans === 'True' || ans === 'False') {
                  return false; // Reject "True"/"False" for essay questions
                }
              }
              
              const textContent = ans.replace(/<[^>]*>/g, '').trim();
              return textContent.length > 0;
            }
            
            if (Array.isArray(ans)) {
              return ans.length > 0;
            }
            
            // For boolean or other types, check truthiness
            return !!ans;
          };
          
          // Get the specific question from this tab - must match the exact tab and index
          // CRITICAL: Only check questions from the current tab, not from other tabs
          let questionToCheck = null;
          let questionId: string | null = null;
          let questionType: string | null = null;
          
          // Priority 1: If this is the active tab, use filteredCurrentQuestions
          // This ensures we only check questions from the active tab
          if (tab.key === activeTabKey && filteredCurrentQuestions.length > 0) {
            if (questionIndexInTab < filteredCurrentQuestions.length) {
              questionToCheck = filteredCurrentQuestions[questionIndexInTab];
            }
          }
          // Priority 2: Try to get from tab's allQuestions if available (for non-active tabs)
          // Only use this if tab.allQuestions exists and is an array
          else if (tab.allQuestions && Array.isArray(tab.allQuestions) && questionIndexInTab < tab.allQuestions.length) {
            questionToCheck = tab.allQuestions[questionIndexInTab];
          }
          // Priority 3: For non-active tabs, we need to get questions from currentQuestions filtered by question type
          // This ensures we get the correct question even when not on the active tab
          // IMPORTANT: Don't filter by activeSectionId here - we need to check answers from ALL sections for persistence
          else if (tab.questionType && currentQuestions && Array.isArray(currentQuestions)) {
            // Filter currentQuestions by question type only (not by section, to allow cross-section persistence)
            const questionsOfType = currentQuestions.filter((q: any) => {
              const qType = q.question_type || q.type;
              return qType === tab.questionType;
            });
            
            // Get the question at the correct index within this tab
            if (questionIndexInTab < questionsOfType.length) {
              questionToCheck = questionsOfType[questionIndexInTab];
            }
          }
          
          // Extract question ID and type
          if (questionToCheck) {
            questionId = questionToCheck.question_id || questionToCheck.id || null;
            questionType = questionToCheck.question_type || questionToCheck.type || tab.questionType || null;
            
            // Verify this is the correct question by checking its type matches the tab
            if (tab.questionType && questionType && questionType !== tab.questionType) {
              // Wrong question type, don't mark as answered
              return false;
            }
            
            // Check if question is marked as answered
            if (questionToCheck.is_answered === "1" || questionToCheck.is_answered === 1) {
              return true;
            }
            
            // Priority 1: Check candidate_answer from API response (for when revisiting questions)
            if (questionId && questionType) {
              // Check candidate_answer_html for subjective questions
              if (questionType === 'qt_005' || questionType === 'qt_006') {
                const candidateAnswer = questionToCheck.candidate_answer_html || questionToCheck.candidate_answer;
                if (candidateAnswer && isValidAnswer(candidateAnswer, questionType)) {
                  return true;
                }
              }
              // Check candidate_answer for True/False questions
              else if (questionType === 'qt_003') {
                const candidateAnswer = questionToCheck.candidate_answer;
                if (candidateAnswer === 'True' || candidateAnswer === 'False') {
                  return true;
                }
              }
            }
          } else {
            // If we can't find the question object, try to get question ID from tab's question IDs
            // This is a fallback for when questions haven't been loaded yet
            if (tab.questionIds && Array.isArray(tab.questionIds) && questionIndexInTab < tab.questionIds.length) {
              questionId = tab.questionIds[questionIndexInTab];
              questionType = tab.questionType || null;
            }
          }
          
          // Priority 2: Check questionAnswers state using the exact question_id
          // This is the most reliable check since it's updated immediately after saving
          if (questionId && questionType) {
            // Check with questionId as-is from state
            const answer = questionAnswers[questionId];
            if (isValidAnswer(answer, questionType)) {
              return true;
            }
            
            // Also check from ref (latest state) - this is critical for immediate UI updates
            const answerFromRef = questionAnswersRef.current[questionId];
            if (isValidAnswer(answerFromRef, questionType)) {
              return true;
            }
            
            // Also check with string conversion (in case questionId is stored as string)
            if (typeof questionId !== 'string') {
              const questionIdStr = String(questionId);
              const answerStr = questionAnswers[questionIdStr];
              if (isValidAnswer(answerStr, questionType)) {
                return true;
              }
              const answerStrFromRef = questionAnswersRef.current[questionIdStr];
              if (isValidAnswer(answerStrFromRef, questionType)) {
                return true;
              }
            }
          }
        }
        return false;
      }
      
      accumulatedOffset += tabCount;
    }
    return false;
  }, [tabs, activeTabKey, filteredCurrentQuestions, questionAnswers, mcqQuestionsCache, currentQuestions]);

  // Count answered, flagged, and skipped questions - defined after isQuestionAnswered
  const questionStats = useMemo(() => {
    let answeredCount = 0;
    const flaggedCount = flaggedQuestions.size;
    const skippedCount = skippedQuestions.size;

    for (let i = 1; i <= totalQuestionsInSection; i++) {
      if (isQuestionAnswered(i)) {
        answeredCount++;
      }
    }

    return {
      answered: answeredCount,
      flagged: flaggedCount,
      skipped: skippedCount,
      total: totalQuestionsInSection,
    };
  }, [totalQuestionsInSection, flaggedQuestions, skippedQuestions, isQuestionAnswered]);

  // Helper function to check if a question is answered by question ID (comprehensive check)
  const isQuestionAnsweredById = useCallback((questionId: string, questionType?: string): boolean => {
    if (!questionId) return false;

    // Helper function to check if answer is valid (same as in isQuestionAnswered)
    const isValidAnswer = (ans: any, qType?: string): boolean => {
      if (ans === undefined || ans === null) return false;
      
      if (typeof ans === 'string') {
        // For True/False questions, check if answer is 'True' or 'False'
        if (qType === 'qt_003') {
          return ans === 'True' || ans === 'False';
        }
        
        // For HTML strings (essay questions), check if there's actual content
        if (qType === 'qt_005' || qType === 'qt_006') {
          if (ans === 'True' || ans === 'False') {
            return false; // Reject "True"/"False" for essay questions
          }
          const textContent = ans.replace(/<[^>]*>/g, '').trim();
          return textContent.length > 0;
        }
        
        const textContent = ans.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 0;
      }
      
      if (Array.isArray(ans)) {
        return ans.length > 0;
      }
      
      return !!ans;
    };

    // Check MCQ cache (for MCQ questions)
    if (questionType === 'qt_001' || !questionType) {
      // Check all MCQ cache entries for this question_id
      for (const [cacheKey, cachedQuestion] of Object.entries(mcqQuestionsCache)) {
        if (cachedQuestion?.question_id === questionId || cacheKey === questionId) {
          // Check is_answered flag first
          if (cachedQuestion.is_answered === "1" || cachedQuestion.is_answered === 1) {
            return true;
          }
          // Check stored answers
          if (cachedQuestion.storedSelectedAnswer !== undefined && cachedQuestion.storedSelectedAnswer !== null) {
            return true;
          }
          if (cachedQuestion.storedSelectedAnswers && cachedQuestion.storedSelectedAnswers.length > 0) {
            return true;
          }
        }
      }
    }

    // Check questionAnswers state
    const answer = questionAnswers[questionId];
    if (isValidAnswer(answer, questionType)) {
      return true;
    }

    // Check questionAnswersRef (latest state)
    const answerFromRef = questionAnswersRef.current[questionId];
    if (isValidAnswer(answerFromRef, questionType)) {
      return true;
    }

    // Also check with string conversion
    if (typeof questionId !== 'string') {
      const questionIdStr = String(questionId);
      const answerStr = questionAnswers[questionIdStr];
      if (isValidAnswer(answerStr, questionType)) {
        return true;
      }
      const answerStrFromRef = questionAnswersRef.current[questionIdStr];
      if (isValidAnswer(answerStrFromRef, questionType)) {
        return true;
      }
    }

    return false;
  }, [questionAnswers, mcqQuestionsCache, questionAnswersRef]);

  // Calculate answered questions per section for the preview dropdown
  const sectionStats = useMemo(() => {
    const stats: Record<string, { answered: number; total: number }> = {};
    
    // Get current section index to determine which sections are completed
    const currentSectionIndex = sectionsToUse.findIndex(
      (s: any) => s.section_id === activeSectionId
    );
    
    sectionsToUse.forEach((section: any, index: number) => {
      const sectionId = section.section_id;
      if (!sectionId) return;
      
      // Check if this section is completed (before current section)
      const isCompleted = currentSectionIndex >= 0 && index < currentSectionIndex;
      const isCurrent = currentSectionIndex >= 0 && index === currentSectionIndex;
      
      // If section is completed, use stored stats
      if (isCompleted && completedSectionStats[sectionId]) {
        stats[sectionId] = completedSectionStats[sectionId];
        return;
      }
      
      // For current section, always recalculate (never use saved stats)
      // This ensures real-time updates as user answers questions
      if (isCurrent) {
        // Don't use saved stats, recalculate below
      }
      
      // Get all question IDs for this section with their types
      const questionIdsWithTypes: Array<{ id: string; type: string }> = [];
      section.question_types?.forEach((qt: any) => {
        const questionType = qt?.type || qt?.question_type;
        if (Array.isArray(qt?.question_ids)) {
          qt.question_ids.forEach((id: string) => {
            if (id) {
              questionIdsWithTypes.push({ id, type: questionType });
            }
          });
        }
      });
      
      // Fallback to count if no question_ids
      const fallbackCount = section.question_types?.reduce(
        (sum: number, qt: any) => sum + (qt.count || 0),
        0
      ) || 0;
      
      const totalQuestions = questionIdsWithTypes.length > 0 ? questionIdsWithTypes.length : fallbackCount;
      
      // Count answered questions for this section using comprehensive check
      let answeredCount = 0;
      questionIdsWithTypes.forEach(({ id, type }) => {
        if (isQuestionAnsweredById(id, type)) {
          answeredCount++;
        }
      });
      
      // Debug logging for current section
      if (isCurrent) {
        console.log(`📊 Current section stats calculated:`, {
          sectionId,
          answeredCount,
          totalQuestions,
          questionIdsCount: questionIdsWithTypes.length,
        });
      }
      
      stats[sectionId] = {
        answered: answeredCount,
        total: totalQuestions,
      };
    });
    
    return stats;
  }, [sectionsToUse, activeSectionId, completedSectionStats, isQuestionAnsweredById, questionAnswers, mcqQuestionsCache, questionAnswersRef]);

  const currentTabIndex = useMemo(
    () => tabs.findIndex((tab) => tab.key === activeTabKey),
    [tabs, activeTabKey]
  );

  const questionNumberOffset = useMemo(() => {
    if (currentTabIndex < 0) {
      return 0;
    }
    return tabs[currentTabIndex]?.globalOffset ?? 0;
  }, [currentTabIndex, tabs]);

  const globalQuestionNumber = useMemo(() => {
    const currentTab = tabs[currentTabIndex];
    
    // For MCQ questions (qt_001), calculate based on activeMCQQuestionKey position
    if (currentTab?.questionType === "qt_001" && currentTab.mcqProps?.datas) {
      const mcqQuestions = currentTab.mcqProps.datas;
      const currentMCQIndex = mcqQuestions.findIndex(
        (q: any) => q.id === activeMCQQuestionKey
      );
      if (currentMCQIndex >= 0) {
        return questionNumberOffset + currentMCQIndex + 1;
      }
    }
    
    // For other question types, use currentQuestionIndex
    return questionNumberOffset + currentQuestionIndex + 1;
  }, [questionNumberOffset, currentQuestionIndex, currentTabIndex, tabs, activeMCQQuestionKey]);

  // Handle flag question - defined after globalQuestionNumber
  const handleFlagQuestion = useCallback((questionId: string) => {
    // Use the current global question number
    const questionNum = globalQuestionNumber;
    if (questionNum > 0) {
      setFlaggedQuestions((prev) => {
        const updated = new Set(prev);
        if (updated.has(questionNum)) {
          updated.delete(questionNum);
        } else {
          updated.add(questionNum);
        }
        return updated;
      });
    }
  }, [globalQuestionNumber]);

  // Mark questions as visited when navigating to them
  useEffect(() => {
    if (globalQuestionNumber > 0 && globalQuestionNumber <= totalQuestionsInSection) {
      setVisitedQuestions((prev) => {
        const updated = new Set(prev);
        updated.add(globalQuestionNumber);
        return updated;
      });
    }
  }, [globalQuestionNumber, totalQuestionsInSection]);

  const hasPreviousQuestion = useMemo(
    () => currentQuestionIndex > 0 || questionNumberOffset > 0,
    [currentQuestionIndex, questionNumberOffset]
  );

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [activeTabKey]);

  // Show fullscreen modal when test page loads, only if not already in fullscreen
  // Also check if we're continuing an assessment (coming from Section 2 instructions)
  useEffect(() => {
    if (!isSupported) {
      setHasUserInteracted(true);
      setShowFullscreenModal(false);
      return;
    }

    // Check if we're already in fullscreen (continuing assessment)
    if (isFullscreen) {
      setHasUserInteracted(true);
      setShowFullscreenModal(false);
      console.log("✅ Already in fullscreen - continuing assessment without showing modal");
      return;
    }

    // Check if assessment was already started (coming from Section 2 instructions)
    // Check localStorage flag first, then check Redux state
    const continuingFlag = localStorage.getItem(`assessment_continuing_${candidate_id}`);
    const isContinuingAssessment = continuingFlag === "true" || 
      assessmentStarted || 
      (activeSectionId && sectionsToUse.length > 1 && 
       sectionsToUse.findIndex((s: any) => s.section_id === activeSectionId) > 0);
    
    // Always enter fullscreen directly without showing modal
    if (isContinuingAssessment) {
      console.log("✅ Continuing assessment - not showing fullscreen modal");
      setHasUserInteracted(true);
      setShowFullscreenModal(false);
      // Try to enter fullscreen automatically if not already in it
      if (!isFullscreen) {
        enterFullscreen().catch((err) => {
          console.warn("Could not auto-enter fullscreen:", err);
        });
      }
    } else {
      // First time starting assessment - enter fullscreen directly without modal
      console.log("✅ Starting assessment - entering fullscreen directly");
      setShowFullscreenModal(false);
      setHasUserInteracted(true);
      // Try to enter fullscreen automatically if not already in it
      if (!isFullscreen && isSupported) {
        enterFullscreen().catch((err) => {
          console.warn("Could not auto-enter fullscreen:", err);
        });
      }
    }
  }, [isSupported, isFullscreen, assessmentStarted, activeSectionId, sectionsToUse, enterFullscreen, candidate_id]);

  // Prevent back navigation when fullscreen is active
  useEffect(() => {
    if (!isFullscreen) {
      return; // Only prevent navigation when in fullscreen
    }

    console.log("🚫 Back navigation prevention enabled - fullscreen is active");

    // Create a blocker state - push immediately to start with a fresh history entry
    window.history.pushState(
      { preventBack: true, timestamp: Date.now() },
      "",
      window.location.href
    );

    // Keep track of how many states we've added
    let historyDepth = 1;

    // Handle back button - popstate fires when user tries to go back
    const handleBackButton = (e: PopStateEvent) => {
      console.log("🚫 Back button pressed - preventing navigation");

      // Immediately push another state to prevent actually going back
      // This creates a "loop" where going back just adds another state
      window.history.pushState(
        { preventBack: true, timestamp: Date.now() },
        "",
        window.location.href
      );
      historyDepth++;

      // Show warning to user
      message.warning({
        content:
          "⚠️ You cannot go back during the test. Please continue with the assessment.",
        duration: 3,
        key: "back-navigation-warning",
      });
    };

    // Listen for popstate events - this is critical
    window.addEventListener("popstate", handleBackButton);

    // Periodically maintain history state to prevent back navigation
    // Continuously add to history stack so back button never works
    const historyInterval = setInterval(() => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (isCurrentlyFullscreen) {
        // Continuously add to history - this ensures back button can never reach previous pages
        window.history.pushState(
          { preventBack: true, timestamp: Date.now() },
          "",
          window.location.href
        );
        historyDepth++;
      }
    }, 500); // Update every 500ms to aggressively maintain history state

    // Disable browser back button with keyboard shortcuts
    const isFormInputElement = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable
      ) {
        return true;
      }

      const role = target.getAttribute("role");
      return role === "textbox" || role === "spinbutton";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent back navigation with Alt+Left Arrow (browser back shortcut)
      // or Ctrl+Left Arrow (some browsers)
      if (
        (e.altKey && e.key === "ArrowLeft") ||
        (e.ctrlKey && e.key === "ArrowLeft") ||
        (e.key === "Backspace" &&
          !isFormInputElement(e.target) &&
          (e.target === document.body ||
            (e.target as HTMLElement)?.tagName === "BODY" ||
            !(e.target as HTMLElement)?.isContentEditable))
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🚫 Keyboard back navigation prevented");
        message.warning({
          content: "⚠️ Back navigation is disabled during the test.",
          duration: 2,
          key: "keyboard-back-warning",
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Also wrap the navigate function to prevent programmatic back navigation
    const originalNavigate = navigate;
    const preventBackNavigate = (...args: Parameters<typeof navigate>) => {
      // Check if trying to navigate back (negative number or going to previous route)
      if (typeof args[0] === "number" && args[0] < 0) {
        console.log("🚫 Attempted programmatic back navigation prevented");
        message.warning({
          content: "⚠️ Back navigation is disabled during the test.",
          duration: 2,
          key: "programmatic-back-warning",
        });
        return;
      }
      // Allow forward navigation
      return originalNavigate(...args);
    };

    // Cleanup
    return () => {
      clearInterval(historyInterval);
      window.removeEventListener("popstate", handleBackButton);
      document.removeEventListener("keydown", handleKeyDown);
      console.log("✅ Back navigation prevention disabled");
    };
  }, [isFullscreen, navigate, tabs]);

  // Track if screen capture has been started to avoid multiple starts
  const screenCaptureStartedRef = useRef(false);
  const screenCaptureStartingRef = useRef(false); // Lock to prevent concurrent starts
  const wasInFullscreenRef = useRef(false);
  const fullscreenExitTimeoutRef = useRef<number | null>(null);
  // Store startRecording in ref to avoid dependency issues
  const startRecordingRef = useRef(screenCapture.startRecording);

  // Update ref when function changes
  useEffect(() => {
    startRecordingRef.current = screenCapture.startRecording;
  }, [screenCapture.startRecording]);

  // Monitor fullscreen exit and show re-entry button if needed
  useEffect(() => {
    if (isFullscreen) {
      wasInFullscreenRef.current = true;
      // Hide re-enter button if fullscreen is active
      setShowReenterFullscreenButton(false);
      // Clear any pending timeout
      if (fullscreenExitTimeoutRef.current) {
        clearTimeout(fullscreenExitTimeoutRef.current);
        fullscreenExitTimeoutRef.current = null;
      }
    } else {
      // Fullscreen exited
      if (wasInFullscreenRef.current && hasUserInteracted) {
        // User was in fullscreen and has interacted - show re-enter button after a short delay
        // This avoids showing it during the screen sharing prompt
        fullscreenExitTimeoutRef.current = window.setTimeout(() => {
          setShowReenterFullscreenButton(true);
          console.log("⚠️ Fullscreen exited - showing re-enter button");
        }, 1000);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (fullscreenExitTimeoutRef.current) {
        clearTimeout(fullscreenExitTimeoutRef.current);
        fullscreenExitTimeoutRef.current = null;
      }
    };
  }, [isFullscreen, hasUserInteracted]);

  // DISABLED: Screen capture auto-start to prevent screen sharing dialog
  // Can be re-enabled later if needed
  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    // Screen capture is disabled to avoid screen sharing dialog
    console.log("ℹ️ Screen capture disabled - no screen sharing dialog");

    // Mark as "started" to prevent retry loops
    screenCaptureStartedRef.current = true;
  }, [isFullscreen]);

  // DISABLED: Screen capture after skipping fullscreen
  useEffect(() => {
    if (isFullscreen || !hasUserInteracted) {
      return;
    }

    // Screen capture disabled to prevent screen sharing dialog
    console.log("ℹ️ Screen capture disabled (fullscreen skipped)");
    screenCaptureStartedRef.current = true;
  }, [hasUserInteracted, isFullscreen]);

  // Handle fullscreen entry
  const handleEnterFullscreen = async () => {
    console.log("🎯 handleEnterFullscreen called");
    try {
      // Request fullscreen immediately while we still have user interaction context
      const success = await enterFullscreen();
      console.log("🎯 enterFullscreen returned:", success);

      // Close modal and mark as interacted regardless of success
      setShowFullscreenModal(false);
      setHasUserInteracted(true);

      if (success) {
        console.log("✅ Fullscreen entered successfully");
      } else {
        console.error("❌ Failed to enter fullscreen");
      }
    } catch (error) {
      console.error("❌ Error entering fullscreen:", error);
      // On error, close modal and let user proceed
      setShowFullscreenModal(false);
      setHasUserInteracted(true);
    }
  };

  // Close modal and mark user as interacted once fullscreen is confirmed
  useEffect(() => {
    console.log("🔍 Fullscreen state check:", {
      isFullscreen,
      showFullscreenModal,
    });

    if (isFullscreen && showFullscreenModal) {
      console.log(
        "✅ Fullscreen confirmed! Closing modal and marking user as interacted"
      );
      setShowFullscreenModal(false);
      setHasUserInteracted(true);
    }
  }, [isFullscreen, showFullscreenModal]);

  // Handle skip fullscreen
  const handleSkipFullscreen = () => {
    setShowFullscreenModal(false);
    setHasUserInteracted(true);
  };

  // State for End Section saving
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Check if we're on the last question of the current section
  const isLastQuestionOfSection = useMemo(() => {
    if (!activeSectionId || tabs.length === 0) return false;
    
    const currentTab = tabs.find((tab) => tab.key === activeTabKey);
    if (!currentTab) return false;
    
    // Check if this is the last tab in the section
    // Since tabs are generated per section, the last tab should be the last question type
    const currentTabIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
    const isLastTab = currentTabIndex === tabs.length - 1;
    
    // For MCQ questions, we need to check if we're on the last MCQ question
    // This will be determined in MCQQuestionTab based on whether there's a nextItem
    if (currentTab.questionType === "qt_001") {
      // For MCQ, return true if we're on the last tab
      // The actual last question check (no nextItem) is done in MCQQuestionTab
      return isLastTab;
    }
    
    // For non-MCQ questions, check if we're on the last question in the current tab
    const isLastQuestionInTab = currentQuestionIndex >= (filteredCurrentQuestions.length - 1);
    
    return isLastQuestionInTab && isLastTab;
  }, [
    activeSectionId,
    tabs,
    activeTabKey,
    currentQuestionIndex,
    filteredCurrentQuestions.length,
  ]);

  // Check if there are more sections
  const hasNextSection = useMemo(() => {
    if (!activeSectionId || sectionsToUse.length === 0) return false;
    
    const currentSectionIndex = sectionsToUse.findIndex(
      (section: any) => section.section_id === activeSectionId
    );
    
    return currentSectionIndex >= 0 && currentSectionIndex < sectionsToUse.length - 1;
  }, [activeSectionId, sectionsToUse]);

  // Check if this is the last section
  const isLastSection = useMemo(() => {
    if (!activeSectionId || sectionsToUse.length === 0) return false;
    
    const currentSectionIndex = sectionsToUse.findIndex(
      (section: any) => section.section_id === activeSectionId
    );
    
    return currentSectionIndex >= 0 && currentSectionIndex === sectionsToUse.length - 1;
  }, [activeSectionId, sectionsToUse]);

  // Show last section warning when navigating to last section
  useEffect(() => {
    if (isLastSection && activeSectionId) {
      // Check if we just switched to this section (from localStorage flag)
      const justSwitched = localStorage.getItem(`just_switched_to_last_section_${candidate_id}`);
      if (justSwitched === 'true') {
        setShowLastSectionWarning(true);
        localStorage.removeItem(`just_switched_to_last_section_${candidate_id}`);
      }
    }
  }, [isLastSection, activeSectionId, candidate_id]);

  // Save all answers to backend
  const saveAllAnswers = useCallback(async (token: string) => {
    const answerEntries = Object.entries(questionAnswers);
    if (answerEntries.length === 0) {
      console.log("⚠️ No answers to save");
      return;
    }

    console.log("💾 Saving all answers to backend...", answerEntries.length);
    
    // Save each answer individually using the correct payload format
    const savePromises = answerEntries.map(async ([questionId, answer]) => {
      try {
        // Get section_id for the question
        const sectionId = getSectionIdForQuestion(questionId);
        if (!sectionId) {
          console.warn(`⚠️ Section ID not found for question: ${questionId}`);
          return false;
        }

        // Get question type from lookup or infer from answer
        let questionType = questionTypeLookup[questionId];
        if (!questionType) {
          // Try to find question in currentQuestions
          const question = currentQuestions?.find((q: any) => 
            (q.question_id === questionId || q.id === questionId)
          );
          questionType = question?.question_type;
          
          // If still not found, infer from answer format
          if (!questionType) {
            if (typeof answer === 'string' && answer.includes('<') && answer.includes('>')) {
              questionType = 'qt_006'; // Subjective
            } else if (answer === 'True' || answer === 'False') {
              questionType = 'qt_003'; // True/False
            } else {
              questionType = 'qt_001'; // Default to MCQ
            }
          }
        }

        // Format answer - for subjective, convert HTML to plain text
        let answerText = typeof answer === 'string' ? answer : String(answer);
        if (questionType === 'qt_005' || questionType === 'qt_006') {
          // Convert HTML to plain text
          answerText = answerText
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Decode &amp;
            .replace(/&lt;/g, '<') // Decode &lt;
            .replace(/&gt;/g, '>') // Decode &gt;
            .replace(/&quot;/g, '"') // Decode &quot;
            .replace(/&#39;/g, "'") // Decode &#39;
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        }

        // Skip if answer is empty or invalid
        if (!answerText || answerText.length === 0 || answerText === questionId) {
          console.log(`⚠️ Skipping empty/invalid answer for question: ${questionId}`);
          return false;
        }

        const payload = {
          section_id: sectionId,
          question_type: questionType,
          question_id: questionId,
          answer: answerText,
          time_spent: 0, // Could track this if needed
        };

        console.log("📤 Saving answer:", payload);

        const response = await fetch(API_ENDPOINTS.candidate.answers, {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to save answer for question ${questionId}:`, response.status, errorText);
          return false;
        }

        console.log(`✅ Successfully saved answer for question ${questionId}`);
        return true;
      } catch (error) {
        console.error(`❌ Error saving answer for question ${questionId}:`, error);
        return false;
      }
    });

    const results = await Promise.all(savePromises);
    const successCount = results.filter(r => r).length;
    console.log(`✅ Saved ${successCount}/${answerEntries.length} answers to backend`);
  }, [questionAnswers, getSectionIdForQuestion, questionTypeLookup, currentQuestions]);

  // Handle end section - Call API if last question of section, otherwise just save
  const handleEndSection = useCallback(async () => {
    console.log("🔖 End Section clicked - saving answers...");

    setIsSavingSection(true);
    const savingStartTime = Date.now();

    try {
      const token = authToken || tokenValidation?.token;

      if (!token) {
        console.error("❌ No auth token available for API call");
        throw new Error("Authentication token not found");
      }

      // Save all answers to backend first
      await saveAllAnswers(token);

      // Save current answers to localStorage as backup
      const sectionAnswersKey = `section_answers_${candidate_id}_${activeTabKey}`;
      localStorage.setItem(
        sectionAnswersKey,
        JSON.stringify({
          answers: questionAnswers,
          timestamp: new Date().toISOString(),
          tabKey: activeTabKey,
          questionsCount: filteredCurrentQuestions.length,
        })
      );
      console.log("✅ Section answers saved to localStorage");

      // If this is the last question of a section, show completion modal
      if (isLastQuestionOfSection) {
        // Get the current section name
        const currentSection = sectionsToUse.find((s: any) => s.section_id === activeSectionId);
        const sectionName = currentSection?.section_name || `Section ${currentSection?.section_order || 1}`;
        setCompletedSectionName(sectionName);
        
        // Ensure minimum 2 seconds of "Saving..." display
        const elapsedTime = Date.now() - savingStartTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
        
        // Set saving to false
        setIsSavingSection(false);
        
        // Show completion modal (simplified - no break options)
        setShowCompleteSectionModal(true);
        return;
      }

      // If not the last question of section, just save without showing toast (already saved above)
      // Ensure minimum 2 seconds of "Saving..." display
      const elapsedTime = Date.now() - savingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // Don't show toast for individual question answers - only show on End Section
    } catch (error) {
      console.error("❌ Error saving section answers:", error);

      // Still show minimum 2 seconds even on error
      const elapsedTime = Date.now() - savingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      toast.error("Failed to save section answers. Please try again.");
    } finally {
      setIsSavingSection(false);
    }
  }, [
    candidate_id,
    activeTabKey,
    questionAnswers,
    filteredCurrentQuestions.length,
    isLastQuestionOfSection,
    hasNextSection,
    authToken,
    tokenValidation,
    activeSectionId,
    sectionsToUse,
    saveAllAnswers,
    dispatch,
  ]);

  // Handle complete section confirmation (from modal)
  const handleConfirmCompleteSection = useCallback(async () => {
    console.log("🔖 Complete Section confirmed - calling API...");
    setIsCompletingSectionAPI(true);

    try {
      const token = authToken || tokenValidation?.token;

      if (!token) {
        console.error("❌ No auth token available for API call");
        throw new Error("Authentication token not found");
      }

      // Call complete-section API
      console.log("📤 Calling complete-section API...");
      const completeSectionResponse = await fetch(
        API_ENDPOINTS.candidate.assessment.completeSection,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "",
        }
      );

      if (!completeSectionResponse.ok) {
        const errorData = await completeSectionResponse.json().catch(() => ({}));
        console.error("❌ Complete-section API failed:", completeSectionResponse.status, errorData);
        throw new Error(`Failed to complete section: ${completeSectionResponse.status}`);
      }

      const result = await completeSectionResponse.json();
      console.log("✅ Complete-section API successful:", result);

      // Get completed section name
      const completedSection = result.completed_section;
      const sectionName = completedSection?.section_name || completedSectionName || "Section";

      // Show toast message
      message.success(`${sectionName} Completed!`);

      // Close modal
      setShowCompleteSectionModal(false);

      // Refresh assessment summary (in background)
      setTimeout(async () => {
        try {
          const refreshedSummary = await fetchAssessmentSummary(token);
          if (refreshedSummary) {
            dispatch(setAssessmentSummary(refreshedSummary));
            console.log("✅ Assessment summary refreshed");
          }
        } catch (summaryError) {
          console.error("Failed to refresh assessment summary:", summaryError);
        }
      }, 100);

      // Set a flag in localStorage to indicate we're continuing the assessment
      localStorage.setItem(`assessment_continuing_${candidate_id}`, "true");

      // Recalculate and save current section stats before completing (ensure accuracy)
      if (activeSectionId) {
        const currentSection = sectionsToUse.find((s: any) => s.section_id === activeSectionId);
        if (currentSection) {
          // Get all question IDs for this section with their types
          const questionIdsWithTypes: Array<{ id: string; type: string }> = [];
          currentSection.question_types?.forEach((qt: any) => {
            const questionType = qt?.type || qt?.question_type;
            if (Array.isArray(qt?.question_ids)) {
              qt.question_ids.forEach((id: string) => {
                if (id) {
                  questionIdsWithTypes.push({ id, type: questionType });
                }
              });
            }
          });
          
          const fallbackCount = currentSection.question_types?.reduce(
            (sum: number, qt: any) => sum + (qt.count || 0),
            0
          ) || 0;
          
          const totalQuestions = questionIdsWithTypes.length > 0 ? questionIdsWithTypes.length : fallbackCount;
          
          // Count answered questions using comprehensive check
          let answeredCount = 0;
          questionIdsWithTypes.forEach(({ id, type }) => {
            if (isQuestionAnsweredById(id, type)) {
              answeredCount++;
            }
          });
          
          const finalStats = {
            answered: answeredCount,
            total: totalQuestions,
          };
          
          setCompletedSectionStats(prev => ({
            ...prev,
            [activeSectionId]: finalStats
          }));
          console.log("💾 Saved completed section stats (recalculated):", activeSectionId, finalStats);
        }
      }

      // Close modal first
      setShowCompleteSectionModal(false);
      
      // Find next section
      const currentSectionIndex = sectionsToUse.findIndex(
        (s: any) => s.section_id === activeSectionId
      );
      const nextSectionIndex = currentSectionIndex + 1;
      const nextSection = sectionsToUse[nextSectionIndex];
      const isLast = nextSectionIndex >= sectionsToUse.length;
      
      // Determine next section path
      let nextPath: string;
      if (isLast || !nextSection) {
        // If no next section, stay on test page
        nextPath = `/${candidate_id}/test`;
      } else {
        const nextSectionOrder = nextSectionIndex + 1;
        if (nextSectionOrder === 1) {
          nextPath = `/${candidate_id}/section-1-instructions`;
        } else if (nextSectionOrder === 2) {
          nextPath = `/${candidate_id}/section-2-instructions`;
        } else {
          // For sections beyond 2, navigate to test with section ID
          localStorage.setItem(`selected_section_id_${candidate_id}`, nextSection.section_id);
          nextPath = `/${candidate_id}/test`;
        }
      }
      
      // Navigate to section transition page instead of showing modal
      navigate(`/${candidate_id}/section-transition`, {
        state: {
          nextSectionId: nextSection?.section_id,
          nextSectionPath: nextPath,
          countdown: 10,
          isLastSection: isLast
        },
        replace: false
      });
    } catch (error) {
      console.error("❌ Error completing section:", error);
      message.error("Failed to complete section. Please try again.");
    } finally {
      setIsCompletingSectionAPI(false);
    }
  }, [
    candidate_id,
    authToken,
    tokenValidation,
    completedSectionName,
    dispatch,
    navigate,
    activeSectionId,
    sectionsToUse,
    isQuestionAnsweredById,
  ]);

  // Calculate submit summary for all sections
  const calculateSubmitSummary = useCallback(() => {
    const summary: Array<{ sectionName: string; answered: number; total: number; percentage: number }> = [];
    let totalAnswered = 0;
    let totalQuestions = 0;

    const currentSectionIndex = sectionsToUse.findIndex(
      (s: any) => s.section_id === activeSectionId
    );

    sectionsToUse.forEach((section: any, index: number) => {
      const sectionId = section.section_id;
      if (!sectionId) return;

      // Check if this section is completed (before current section)
      const isCompleted = currentSectionIndex >= 0 && index < currentSectionIndex;
      const isCurrent = currentSectionIndex >= 0 && index === currentSectionIndex;
      
      let stats: { answered: number; total: number };
      
      // If section is completed, use stored stats
      if (isCompleted && completedSectionStats[sectionId]) {
        stats = completedSectionStats[sectionId];
      } 
      // If current section, recalculate to ensure accuracy
      else if (isCurrent) {
        // Recalculate current section stats for accuracy
        const questionIdsWithTypes: Array<{ id: string; type: string }> = [];
        section.question_types?.forEach((qt: any) => {
          const questionType = qt?.type || qt?.question_type;
          if (Array.isArray(qt?.question_ids)) {
            qt.question_ids.forEach((id: string) => {
              if (id) {
                questionIdsWithTypes.push({ id, type: questionType });
              }
            });
          }
        });
        
        const fallbackCount = section.question_types?.reduce(
          (sum: number, qt: any) => sum + (qt.count || 0),
          0
        ) || 0;
        
        const total = questionIdsWithTypes.length > 0 ? questionIdsWithTypes.length : fallbackCount;
        
        let answeredCount = 0;
        questionIdsWithTypes.forEach(({ id, type }) => {
          if (isQuestionAnsweredById(id, type)) {
            answeredCount++;
          }
        });
        
        stats = { answered: answeredCount, total };
      }
      // For upcoming sections, use sectionStats
      else {
        stats = sectionStats[sectionId] || { answered: 0, total: 0 };
      }

      const sectionName = section.section_name || `Section ${index + 1}`;
      const percentage = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;

      summary.push({
        sectionName,
        answered: stats.answered,
        total: stats.total,
        percentage,
      });

      totalAnswered += stats.answered;
      totalQuestions += stats.total;
    });

    const overallPercentage = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    return {
      sections: summary,
      totalAnswered,
      totalQuestions,
      overallPercentage,
    };
  }, [sectionsToUse, activeSectionId, completedSectionStats, sectionStats, isQuestionAnsweredById]);

  // Handle submit assessment - show summary modal first
  const handleSubmitAssessment = useCallback(() => {
    console.log("📝 Submit Assessment button clicked - showing summary");
    setShowSubmitSummaryModal(true);
  }, []);

  // Execute actual submit assessment API call
  const executeSubmitAssessment = useCallback(async () => {
    console.log("📝 Executing submit assessment API...");
    setIsCompletingSection(true);
    setShowSubmitSummaryModal(false);

    try {
      // Stop camera and screen recording immediately
      console.log("⏹️ Stopping camera recording...");
      try {
        videoCapture.stopRecording();
        videoCapture.cleanup();
        console.log("✅ Camera recording stopped and cleaned up");
      } catch (videoError) {
        console.error("❌ Error stopping video capture:", videoError);
      }
      
      console.log("⏹️ Stopping screen recording...");
      try {
        screenCapture.stopRecording();
        screenCapture.cleanup();
        console.log("✅ Screen recording stopped and cleaned up");
      } catch (screenError) {
        console.error("❌ Error stopping screen capture:", screenError);
      }
      
      // Stop all active media tracks as a safety measure
      // This ensures all camera, microphone, and screen share tracks are stopped
      try {
        // Get all media devices tracks
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          // Stop all tracks from any active streams
          const allTracks: MediaStreamTrack[] = [];
          
          // Try to access any stored streams
          if (typeof window !== 'undefined') {
            const storedStreams = (window as any).__activeMediaStreams || [];
            storedStreams.forEach((stream: MediaStream) => {
              stream.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                  allTracks.push(track);
                }
              });
            });
          }
          
          // Stop all found tracks
          allTracks.forEach(track => {
            try {
              track.stop();
              console.log("🛑 Stopped active track:", track.kind, track.label);
            } catch (e) {
              console.warn("Could not stop track:", e);
            }
          });
        }
      } catch (e) {
        console.warn("Error stopping additional tracks:", e);
      }
      
      // Exit fullscreen if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Ignore errors
        });
      }

      const token = authToken || tokenValidation?.token;
      if (!token) {
        console.error("❌ No auth token available for API call");
        throw new Error("Authentication token not found");
      }

      // Call submit assessment API
      console.log("📤 Calling submit assessment API...");
      const submitResponse = await fetch(
        API_ENDPOINTS.candidate.assessment.submit,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "",
        }
      );

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        console.error("❌ Submit assessment API failed:", submitResponse.status, errorData);
        throw new Error(`Failed to submit assessment: ${submitResponse.status}`);
      }

      const result = await submitResponse.json();
      console.log("✅ Assessment submitted successfully:", result);

      // Show success message
      message.success("Assessment submitted successfully!", 1);

      // Small delay to ensure message is visible, then navigate
      setTimeout(() => {
        console.log("🚀 Navigating to assessment success page...");
        navigate(`/${candidate_id}/assessment-success`, { replace: true });
      }, 300);
    } catch (error) {
      console.error("❌ Error submitting assessment:", error);
      message.error("Failed to submit assessment. Please try again.");
      setIsCompletingSection(false);
    }
  }, [candidate_id, authToken, tokenValidation, videoCapture, screenCapture, navigate]);

  // Handle complete section button (for non-last sections)
  const handleCompleteSection = useCallback(() => {
    // Check if this is the last section
    if (isLastSection) {
      // For last section, show submit summary modal
      handleSubmitAssessment();
      return;
    }

    console.log("📝 Complete Section button clicked - showing completion modal");
    // Get the current section name
    const currentSection = sectionsToUse.find((s: any) => s.section_id === activeSectionId);
    const sectionName = currentSection?.section_name || `Section ${currentSection?.section_order || 1}`;
    setCompletedSectionName(sectionName);
    setShowCompleteSectionModal(true);
  }, [activeSectionId, sectionsToUse, isLastSection, handleSubmitAssessment]);

  // Complete section for switching (without showing countdown modal, directly navigate)
  const handleConfirmCompleteSectionForSwitch = useCallback(async (targetSectionId: string) => {
    console.log("🔖 Completing section for switch...");
    setIsCompletingSectionAPI(true);

    try {
      const token = authToken || tokenValidation?.token;

      if (!token) {
        console.error("❌ No auth token available for API call");
        throw new Error("Authentication token not found");
      }

      // Call complete-section API
      console.log("📤 Calling complete-section API...");
      const completeSectionResponse = await fetch(
        API_ENDPOINTS.candidate.assessment.completeSection,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "",
        }
      );

      if (!completeSectionResponse.ok) {
        const errorData = await completeSectionResponse.json().catch(() => ({}));
        console.error("❌ Complete-section API failed:", completeSectionResponse.status, errorData);
        throw new Error(`Failed to complete section: ${completeSectionResponse.status}`);
      }

      const result = await completeSectionResponse.json();
      console.log("✅ Complete-section API successful:", result);

      // Refresh assessment summary
      setTimeout(async () => {
        try {
          const refreshedSummary = await fetchAssessmentSummary(token);
          if (refreshedSummary) {
            dispatch(setAssessmentSummary(refreshedSummary));
            console.log("✅ Assessment summary refreshed");
          }
        } catch (summaryError) {
          console.error("Failed to refresh assessment summary:", summaryError);
        }
      }, 100);

      // Recalculate and save current section stats before completing (ensure accuracy)
      if (activeSectionId) {
        const currentSection = sectionsToUse.find((s: any) => s.section_id === activeSectionId);
        if (currentSection) {
          // Get all question IDs for this section with their types
          const questionIdsWithTypes: Array<{ id: string; type: string }> = [];
          currentSection.question_types?.forEach((qt: any) => {
            const questionType = qt?.type || qt?.question_type;
            if (Array.isArray(qt?.question_ids)) {
              qt.question_ids.forEach((id: string) => {
                if (id) {
                  questionIdsWithTypes.push({ id, type: questionType });
                }
              });
            }
          });
          
          const fallbackCount = currentSection.question_types?.reduce(
            (sum: number, qt: any) => sum + (qt.count || 0),
            0
          ) || 0;
          
          const totalQuestions = questionIdsWithTypes.length > 0 ? questionIdsWithTypes.length : fallbackCount;
          
          // Count answered questions using comprehensive check
          let answeredCount = 0;
          questionIdsWithTypes.forEach(({ id, type }) => {
            if (isQuestionAnsweredById(id, type)) {
              answeredCount++;
            }
          });
          
          const finalStats = {
            answered: answeredCount,
            total: totalQuestions,
          };
          
          setCompletedSectionStats(prev => ({
            ...prev,
            [activeSectionId]: finalStats
          }));
          console.log("💾 Saved completed section stats (switch, recalculated):", activeSectionId, finalStats);
        }
      }

      // Set flag in localStorage
      localStorage.setItem(`assessment_continuing_${candidate_id}`, "true");
      localStorage.setItem(`selected_section_id_${candidate_id}`, targetSectionId);

      // Find target section and determine path
      const targetSection = sectionsToUse.find((s: any) => s.section_id === targetSectionId);
      const targetSectionIndex = sectionsToUse.findIndex((s: any) => s.section_id === targetSectionId);
      const isLast = targetSectionIndex >= 0 && targetSectionIndex === sectionsToUse.length - 1;
      
      let nextPath: string;
      if (targetSection) {
        const sectionOrder = targetSectionIndex + 1;
        if (sectionOrder === 1) {
          nextPath = `/${candidate_id}/section-1-instructions`;
        } else if (sectionOrder === 2) {
          nextPath = `/${candidate_id}/section-2-instructions`;
        } else {
          localStorage.setItem(`selected_section_id_${candidate_id}`, targetSectionId);
          nextPath = `/${candidate_id}/test`;
        }
      } else {
        nextPath = `/${candidate_id}/test`;
      }
      
      // Navigate to section transition page
      navigate(`/${candidate_id}/section-transition`, {
        state: {
          nextSectionId: targetSectionId,
          nextSectionPath: nextPath,
          countdown: 10,
          isLastSection: isLast
        },
        replace: false
      });
    } catch (error) {
      console.error("❌ Error completing section:", error);
      message.error("Failed to complete section. Please try again.");
    } finally {
      setIsCompletingSectionAPI(false);
    }
  }, [candidate_id, authToken, tokenValidation, dispatch, activeSectionId, sectionsToUse, navigate, isQuestionAnsweredById]);

  // Handle section switching
  const handleSwitchSection = useCallback(async () => {
    if (!selectedSectionToSwitch) return;

    const selectedSection = sectionsToUse.find((s: any) => s.section_id === selectedSectionToSwitch);
    if (!selectedSection) return;

    const selectedSectionIndex = sectionsToUse.findIndex((s: any) => s.section_id === selectedSectionToSwitch);
    const isSelectedLast = selectedSectionIndex === sectionsToUse.length - 1;

    // Close switch modal
    setShowSwitchSectionModal(false);

    // If switching to last section, show warning first
    if (isSelectedLast) {
      setShowLastSectionWarning(true);
      return;
    }

    // Complete current section and switch
    await handleConfirmCompleteSectionForSwitch(selectedSectionToSwitch);
  }, [selectedSectionToSwitch, sectionsToUse, handleConfirmCompleteSectionForSwitch]);

  // Execute completion after confirmation
  const executeCompleteSection = useCallback(async () => {
    console.log("Assessment completion confirmed - executing...");
    setIsCompletingSection(true);

    try {
      // Stop camera recording
      console.log("⏹️ Stopping camera recording...");
      videoCapture.stopRecording();

      // Call complete-section API
      const token = authToken || tokenValidation?.token;

      if (!token) {
        console.error("❌ No auth token available for API call");
        throw new Error("Authentication token not found");
      }

      console.log("📤 Step 1: Calling complete-section API...");
      const completeSectionResponse = await fetch(
        `${API_BASE_URL}/candidate/assessment/complete-section`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "",
        }
      );

      // Handle response - 400 with "No next section" is considered success
      if (!completeSectionResponse.ok) {
        const errorData = await completeSectionResponse
          .json()
          .catch(() => ({}));

        // Check if it's the "No next section available" message
        if (
          completeSectionResponse.status === 400 &&
          errorData.detail?.includes("No next section available")
        ) {
          console.log(
            "✅ Complete-section: No next section (assessment complete)"
          );
        } else {
          // Other errors are actual failures
          console.error(
            "❌ Complete-section API failed:",
            completeSectionResponse.status,
            errorData
          );
          throw new Error(`API call failed: ${completeSectionResponse.status}`);
        }
      } else {
        const result = await completeSectionResponse.json();
        console.log("✅ Complete-section API successful:", result);
      }

      // Step 2: Call submit API
      console.log("📤 Step 2: Calling assessment submit API...");
      const submitResponse = await fetch(
        `${API_BASE_URL}/candidate/assessment/submit`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "",
        }
      );

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error(
          "❌ Submit API failed:",
          submitResponse.status,
          errorText
        );
        throw new Error(`Submit API failed: ${submitResponse.status}`);
      }

      const submitResult = await submitResponse.json();
      console.log("✅ Assessment submit API successful:", submitResult);

      // Mark test as completed BEFORE clearing localStorage
      const testCompletionKey = `test_completed_${candidate_id}`;
      localStorage.setItem(testCompletionKey, "true");
      console.log(`✅ Test marked as completed for candidate: ${candidate_id}`);

      // Clear all localStorage EXCEPT the completion flag
      const completionFlag = localStorage.getItem(testCompletionKey);
      localStorage.clear();
      if (completionFlag) {
        localStorage.setItem(testCompletionKey, completionFlag);
      }
      console.log("✅ localStorage cleared (except completion flag)");

      // Navigate to success screen
      navigate(`/${candidate_id}/assessment-success`);
    } catch (error) {
      console.error("❌ Error completing section:", error);
      alert("Failed to complete section. Please try again.");
    } finally {
      setIsCompletingSection(false);
      setShowCompleteConfirmModal(false);
    }
  }, [navigate, candidate_id, authToken, tokenValidation, videoCapture]);

  // Handle Save All button - Just save answers, don't submit
  const handleSaveAll = useCallback(async () => {
    console.log("📝 Save All button clicked - saving answers only");
    const token = authToken || tokenValidation?.token;
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    
    try {
      // Save all answers to backend
      await saveAllAnswers(token);
      toast.success("All answers have been saved successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to save answers:", error);
      toast.error("Failed to save answers. Please try again.");
    }
  }, [authToken, tokenValidation, saveAllAnswers]);

  const questionCountsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    const seenIdsByType: Record<string, Set<string>> = {};
    const pendingFallbackByType: Record<string, number> = {};

    const relevantSections = sectionsToUse.filter((section: any) => {
      if (!activeSectionId) {
        return true;
      }
      return section?.section_id === activeSectionId;
    });

    relevantSections.forEach((section: any) => {
      const sectionId = section?.section_id;
      const sectionQuestionTypes = Array.isArray(section?.question_types)
        ? section.question_types
        : [];

      sectionQuestionTypes.forEach((qt: any) => {
        const type = qt?.type;
        if (!type) {
          return;
        }

        const ids = Array.isArray(qt?.question_ids)
          ? qt.question_ids.filter((id: string) => Boolean(id))
          : [];
        const fallbackCount = typeof qt?.count === "number" ? qt.count : 0;

        if (!seenIdsByType[type]) {
          seenIdsByType[type] = new Set<string>();
        }

        let addedFromIds = 0;

        ids.forEach((rawId: string) => {
          const id = rawId.trim();
          if (!id) {
            return;
          }

          if (sectionId) {
            const mappedSectionId = questionSectionLookup[id];
            if (mappedSectionId && mappedSectionId !== sectionId) {
        return;
            }
          }

          const idType = questionTypeLookup[id] || type;
          if (!seenIdsByType[idType]) {
            seenIdsByType[idType] = new Set<string>();
          }

          if (!seenIdsByType[idType].has(id)) {
            seenIdsByType[idType].add(id);
            counts[idType] = (counts[idType] || 0) + 1;
            addedFromIds++;
          }
        });

        if (addedFromIds > 0) {
        return;
      }

        if (!ids.length && fallbackCount > 0) {
          pendingFallbackByType[type] = Math.max(
            pendingFallbackByType[type] || 0,
            fallbackCount
          );
        }
      });
    });

    Object.entries(pendingFallbackByType).forEach(([type, fallbackCount]) => {
      if (!counts[type] || counts[type] === 0) {
        counts[type] = fallbackCount;
      }
    });

    return counts;
  }, [
    sectionsToUse,
    activeSectionId,
    questionSectionLookup,
    questionTypeLookup,
  ]);

  const questionTypeQuickLinks = useMemo(() => {
    const labelMap: Record<string, string> = {
      qt_001: "MCQ",
      qt_002: "Coding",
      qt_003: "True or false",
      qt_004: "Simulator",
      qt_006: "Essay",
      qt_007: "Match the following",
      qt_008: "Resequencing",
      qt_009: "Match the tables",
    };

    return Object.keys(labelMap)
      .map((code) => {
        const matchingTab = tabs.find((tab) => tab.questionType === code);
        const countFromMemo = questionCountsByType[code];
        const countFromTab = matchingTab && typeof matchingTab.count === "number"
          ? matchingTab.count
          : 0;

        const resolvedCount =
          typeof countFromMemo === "number" && countFromMemo >= 0
            ? countFromMemo
            : countFromTab;

        return {
          code,
          label: labelMap[code],
          count: resolvedCount,
          tabKey: matchingTab?.key ?? null,
        };
      })
      .filter((item) => item.count > 0); // Issue 2: Only show question types with count > 0
  }, [tabs, questionCountsByType]);

  // Expose test function to window for debugging
  useEffect(() => {
    (window as any).testQuestionAPI = () => {
      console.log("Testing question API...");
      console.log("Current state:", {
        assessmentSummary: !!assessmentSummary,
        authToken: !!authToken,
        tabs: tabs.length,
        activeTabKey,
      });

      if (tabs.length > 0 && activeTabKey) {
        const currentTab = tabs.find((tab) => tab.key === activeTabKey);
        if (currentTab?.questionType) {
          console.log("Fetching questions for:", currentTab.questionType);
          fetchQuestionsByType(currentTab.questionType);
        }
      } else {
        console.log("No tabs or activeTabKey available");
      }
    };

    (window as any).testDirectAPI = async () => {
      if (!authToken) {
        console.error("No auth token available");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/candidate/question/f6f2d73e-542d-4a5c-acf6-461ef4edbb78`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Direct API test successful:", data);
        } else {
          console.error(
            "Direct API test failed:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Direct API test error:", error);
      }
    };
  }, [assessmentSummary, authToken, tabs, activeTabKey, fetchQuestionsByType]);

  // Auto-select first tab when tabs are loaded
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((tab) => tab.key === activeTabKey)) {
      console.log("Auto-selecting first tab:", tabs[0].key);
      setActiveTabKey(tabs[0].key);
    }
  }, [tabs, activeTabKey]);

  // Load questions when tabs change, component mounts, or section changes
  useEffect(() => {
    console.log("📚 Questions Loading Effect Triggered:", {
      tabsLength: tabs.length,
      activeTabKey,
      activeSectionId,
      tabs,
      showFullscreenModal,
      hasUserInteracted,
    });

    if (tabs.length > 0 && activeTabKey) {
      const currentTab = tabs.find((tab) => tab.key === activeTabKey);
      console.log("📋 Current tab found:", currentTab);

      if (
        currentTab?.questionType &&
        currentTab.questionType !== "qt_001" &&
        currentTab.questionType !== "qt_007"
      ) {
        console.log("🔄 Fetching questions for type:", currentTab.questionType, "for section:", activeSectionId);
        fetchQuestionsByType(currentTab.questionType);
      } else {
        console.log(
          "ℹ️ Skipping question fetch - static question type or no question type"
        );
      }
    } else {
      console.log("⏸️ Waiting for tabs or activeTabKey");
    }
  }, [
    activeTabKey,
    activeSectionId,
    fetchQuestionsByType,
    tabs,
    showFullscreenModal,
    hasUserInteracted,
  ]);

  const currentQuestionType = useMemo(() => {
    const currentTab = tabs.find((tab) => tab.key === activeTabKey);
    return currentTab?.questionType || null;
  }, [tabs, activeTabKey]);

  const goToNextTabFromMCQ = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
    if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      if (nextTab) {
        setActiveTabKey(nextTab.key);
        setCurrentQuestionIndex(0);
      }
    }
  }, [tabs, activeTabKey]);

  const goToPreviousTabFromMCQ = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTabKey);
    if (currentIndex > 0) {
      const previousTab = tabs[currentIndex - 1];
      if (previousTab) {
        setActiveTabKey(previousTab.key);
        const previousCount =
          typeof previousTab.count === "number" ? previousTab.count : 0;
        setCurrentQuestionIndex(previousCount > 0 ? previousCount - 1 : 0);
      }
    }
  }, [tabs, activeTabKey]);

  // Show loading state if critical data is missing
  const token = authToken || tokenValidation?.token;
  if (!token) {
    return (
      <Layout className="!min-h-screen !bg-black">
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
          <Text className="text-white text-xl font-semibold">Loading Authentication...</Text>
          <Text className="text-white/70 text-base">Please wait while we verify your session</Text>
        </div>
      </Layout>
    );
  }

  // Show error state if there's an error
  if (errorState.hasError) {
    return (
      <Layout className="!min-h-screen !bg-black">
        <div className="flex flex-col items-center justify-center h-screen gap-6 px-4 text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
            <Text className="text-red-400 text-xl font-semibold block mb-2">Error Loading Assessment</Text>
            <Text className="text-white/80 text-base block mb-4">{errorState.errorMessage}</Text>
            <Button
              type="primary"
              onClick={() => navigate(`/${candidate_id}`)}
              className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !w-full"
              size="large"
            >
              Return to Start Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Wait for assessment summary to load
  if (!assessmentSummary) {
    // If we haven't attempted to load yet, show loading
    if (!initialLoadAttemptedRef.current || assessmentSummaryLoading) {
      return (
        <Layout className="!min-h-screen !bg-black">
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Text className="text-white text-xl font-semibold animate-pulse">Loading Assessment Data...</Text>
            <Text className="text-white/70 text-base">Please wait, this may take a moment</Text>
          </div>
        </Layout>
      );
    }
    // If we attempted to load but failed, show error
    return (
      <Layout className="!min-h-screen !bg-black">
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-4 text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
            <Text className="text-red-400 text-xl font-semibold block mb-2">Failed to Load Assessment</Text>
            <Text className="text-white/80 text-base block mb-4">Unable to load assessment data. Please try starting the assessment again.</Text>
            <Button
              type="primary"
              onClick={() => navigate(`/${candidate_id}`)}
              className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !w-full"
              size="large"
            >
              Return to Start Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Ensure sections exist before rendering
  if (!assessmentSummary.sections || !Array.isArray(assessmentSummary.sections) || assessmentSummary.sections.length === 0) {
    return (
      <Layout className="!min-h-screen !bg-black">
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-4 text-center">
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-6 max-w-md">
            <Text className="text-yellow-400 text-xl font-semibold block mb-2">No Assessment Sections Available</Text>
            <Text className="text-white/80 text-base block mb-4">The assessment does not have any sections configured. Please contact support.</Text>
            <Button
              type="primary"
              onClick={() => navigate(`/${candidate_id}`)}
              className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !w-full"
              size="large"
            >
              Return to Start Page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="!min-h-screen">
      {/* Video Background */}
      <video
        className="absolute top-0 left-0 w-screen h-screen object-cover z-0 brightness-19 [object-position:60%_190%]"
        autoPlay
        muted
        loop
      >
        <source
          src={`${import.meta.env.BASE_URL}common/technology-computer.mp4`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      <Header className="!bg-transparent !border !border-b-[#FFFFFF33] !border-t-transparent !border-l-transparent !border-r-transparent !h-auto !px-4 !py-1.5">
        <Row align="middle" justify="space-between">
          <Col>
            <Row align="middle" gutter={16}>
              {/* ORACLE Logo */}
              <Col>
                <div className="bg-red-600 px-3 py-1 rounded">
                  <span className="text-white font-bold text-sm">ORACLE</span>
                </div>
              </Col>
              {/* Gap between logos */}
              <Col span={1}></Col>
              {/* Otomeyt AI Logo */}
              <Col>
                <img
                  src={`${import.meta.env.BASE_URL}common/otomeyt-ai-logo.svg`}
                  className="object-contain shrink-0 w-[182px] h-[39px] aspect-square"
                  alt=""
                />
              </Col>
            </Row>
          </Col>

          {/* Section Name in Center */}
          <Col flex="auto" className="flex justify-center">
            {activeSectionDisplayName && (
              <div className="text-center">
                <span className="text-[#7C3AED] font-semibold text-base">
                  {activeSectionDisplayName}
                </span>
                {formattedActiveSectionQuestionCount && (
                  <span className="text-white/70 text-sm ml-2">
                    {formattedActiveSectionQuestionCount} Question
                    {activeSectionQuestionCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            )}
          </Col>

          <Col>
            <Row align="middle" gutter={16}>
              {/* Question Type Navigation */}
              {questionTypeQuickLinks.length > 0 && (
                <Col>
                  <div className="flex items-center gap-2 flex-wrap">
                    {questionTypeQuickLinks.map((item) => {
                      const countLabel = String(item.count || 0).padStart(2, "0");
                      const isActive = item.tabKey === activeTabKey;

                      return (
                        <Button
                          key={item.code}
                          type="default"
                          disabled={!item.tabKey}
                          className={`!rounded-full !px-4 !py-1 !h-auto !text-sm !border-[#7C3AED40] !bg-[#1A1A1F] !text-white hover:!border-[#7C3AED] hover:!text-[#FFFFFF] ${
                            !item.tabKey ? "!opacity-60 !cursor-not-allowed" : ""
                          } ${
                            isActive ? "!border-[#7C3AED] !bg-[#7C3AED33]" : ""
                          }`}
                          onClick={() => {
                            if (item.tabKey) {
                              setActiveTabKey(item.tabKey);
                            }
                          }}
                        >
                          {`${item.label} (${countLabel})`}
                        </Button>
                      );
                    })}
                  </div>
                </Col>
              )}
              {/* Time Remaining Display */}
              <Col>
                <CountdownTimerFromSeconds
                  timeLeftSeconds={
                    assessmentSummary?.metadata?.timing?.assessment?.time_left_seconds ||
                    assessmentSummary?.assessment?.metadata?.timing?.assessment?.time_left_seconds ||
                    (assessmentSummary?.assessment_overview?.total_duration_minutes 
                      ? assessmentSummary.assessment_overview.total_duration_minutes * 60 
                      : null)
                  }
                  onTimeUp={() => {
                    console.log("Assessment time is up!");
                  }}
                  label="Time Remaining"
                  className="!bg-[#00ff0033] !border-none !text-[#3afd8b] !font-semibold"
                />
              </Col>
              {/* Submit Assessment Button - Always Available in Header */}
              <Col>
                <div className="flex flex-col items-end gap-2">
                  <div className="!relative !w-full !rounded-full !overflow-hidden">
                    <div
                      className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 360deg at 50% 50%, rgba(30,30,30,1) 25%, rgba(45,212,191,1) 39%, rgba(79,70,229,1) 50%, rgba(124,58,237,1) 62%, rgba(30,30,30,1) 75%)",
                      }}
                    />
                    <Button
                      className="!backdrop-blur-[10px] !bg-[#000000] !text-white !rounded-full !border-none flex items-center justify-center !px-8 !py-6 !m-[1.5px] !min-w-[120px]"
                      onClick={handleSubmitAssessment}
                      loading={isCompletingSection}
                    >
                      Submit Assessment
                    </Button>
                  </div>
                  {/* {isLastSection && (
                    <Text className="!text-white/70 !text-sm text-right max-w-[200px]">
                      This is the last section. You can submit the assessment by clicking the above Submit Assessment button.
                    </Text>
                  )} */}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Header>

      {/* Generic Test Controls */}
      <Row
        className="border-b border-[#FFFFFF33] py-2 px-4 z-0"
        align="middle"
        justify="space-between"
      >
        <Col>
          {/* Status Bar - Answered, Flagged, Skipped */}
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">All</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-white/70 text-sm">
                {questionStats.answered} answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-white/70 text-sm">
                {questionStats.flagged} flagged
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-white/70 text-sm">
                {questionStats.skipped} skipped
              </span>
            </div>
            {/* Section Preview Dropdown */}
            <Dropdown
              menu={{
                items: sectionsToUse.map((section: any, index: number) => {
                  const isCurrentSection = section.section_id === activeSectionId;
                  const isLast = index === sectionsToUse.length - 1;
                  const sectionIndex = index + 1;
                  
                  // Get section stats
                  const stats = sectionStats[section.section_id] || { answered: 0, total: 0 };
                  const answeredCount = stats.answered;
                  const totalQuestions = stats.total;
                  
                  // Determine section status
                  const currentSectionIndex = sectionsToUse.findIndex(
                    (s: any) => s.section_id === activeSectionId
                  );
                  // Sections before current are completed (locked)
                  // Current section is active (unlocked but disabled)
                  // Sections after current are upcoming (unlocked, can switch to)
                  const isCompleted = currentSectionIndex >= 0 && index < currentSectionIndex;
                  const isUpcoming = currentSectionIndex >= 0 && index > currentSectionIndex;
                  
                  // Calculate progress percentage
                  const progressPercent = totalQuestions > 0 
                    ? Math.round((answeredCount / totalQuestions) * 100) 
                    : 0;
                  
                  // Determine lock status
                  // Completed sections are locked (cannot access)
                  // Current and upcoming sections are unlocked (but current is disabled)
                  const isLocked = isCompleted;
                  const LockIcon = isLocked ? LockOutlined : UnlockOutlined;
                  
                  return {
                    key: section.section_id,
                    label: (
                      <div 
                        className={`py-2 px-3 min-w-[280px] transition-colors ${
                          isLocked || isCurrentSection 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:bg-[#2a2a2a] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <LockIcon 
                              className={isLocked ? 'text-gray-400' : isCurrentSection ? 'text-[#7C3AED]' : 'text-green-400'} 
                              style={{ fontSize: '16px' }}
                            />
                            <span className={`font-semibold text-sm ${
                              isCurrentSection 
                                ? 'text-[#7C3AED]' 
                                : isLocked 
                                  ? 'text-gray-400' 
                                  : 'text-white'
                            }`}>
                              {section.section_name || `Section ${sectionIndex}`}
                            </span>
                            {isCurrentSection && (
                              <span className="text-xs text-[#7C3AED] bg-[#7C3AED]/20 px-2 py-0.5 rounded">Active</span>
                            )}
                            {isLast && !isCurrentSection && (
                              <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">Last</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/70">
                              {answeredCount} / {totalQuestions} answered
                            </span>
                            <span className="text-white/70">{progressPercent}%</span>
                          </div>
                          <Progress
                            percent={progressPercent}
                            size="small"
                            strokeColor={isCurrentSection ? '#7C3AED' : isLocked ? '#6B7280' : '#22C55E'}
                            trailColor="rgba(255, 255, 255, 0.1)"
                            showInfo={false}
                            className="section-progress"
                          />
                        </div>
                      </div>
                    ),
                    disabled: isLocked || isCurrentSection, // Disable completed sections and current section
                  };
                }),
                onClick: ({ key }) => {
                  const selectedSection = sectionsToUse.find((s: any) => s.section_id === key);
                  if (selectedSection && selectedSection.section_id !== activeSectionId) {
                    setSelectedSectionToSwitch(key);
                    setShowSwitchSectionModal(true);
                  }
                },
              }}
              trigger={['click']}
              placement="bottomLeft"
              overlayClassName="section-preview-dropdown"
              overlayStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '320px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              }}
            >
              <Tooltip
                title="Here you can switch the section if you're feeling this section difficult, but to switch you need to end the section"
                placement="bottom"
              >
                <Button
                  type="text"
                  className="!text-green-400 !text-sm hover:!text-green-300 !border-none !px-3 !h-auto !font-semibold !flex !items-center !gap-2"
                  style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                  }}
                >
                  <span>Switch Senction(s)</span>
                  <DownOutlined className="!text-green-400" style={{ fontSize: '12px' }} />
                </Button>
              </Tooltip>
            </Dropdown>
          </div>
        </Col>
        <Col className="mt-5 md:mt-0">
          <Row gutter={[16, 10]} align="middle">
            {activeSectionId && (
              <Col>
                {/* Section Timer - kept here */}
                <CountdownTimerFromSeconds
                  timeLeftSeconds={
                    assessmentSummary?.metadata?.timing?.all_sections?.[activeSectionId]?.time_left_seconds ||
                    assessmentSummary?.assessment?.metadata?.timing?.all_sections?.[activeSectionId]?.time_left_seconds ||
                    assessmentSummary?.metadata?.timing?.current_section?.time_left_seconds ||
                    assessmentSummary?.assessment?.metadata?.timing?.current_section?.time_left_seconds ||
                    (activeSection?.duration_minutes 
                      ? activeSection.duration_minutes * 60 
                      : null)
                  }
                  onTimeUp={() => {
                    console.log("Section time is up!");
                  }}
                  label={activeSection?.section_name || "Section"}
                  className="!bg-[#2563EB33] !border-none !text-[#60A5FA] !font-semibold"
                />
              </Col>
            )}
            <Col>
              <div className="flex flex-col items-end gap-2">
                {!isLastSection && (
                  // Complete Section Button - For non-last sections
                  <div className="!relative !w-full !rounded-full !overflow-hidden">
                    <div
                      className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 360deg at 50% 50%, rgba(30,30,30,1) 25%, rgba(45,212,191,1) 39%, rgba(79,70,229,1) 50%, rgba(124,58,237,1) 62%, rgba(30,30,30,1) 75%)",
                      }}
                    />
                    <Button
                      className="!backdrop-blur-[10px] !bg-[#000000] !text-white !rounded-full !border-none flex items-center justify-center !px-8 !py-6 !m-[1.5px] !min-w-[120px]"
                      onClick={handleCompleteSection}
                      loading={isCompletingSectionAPI}
                    >
                      Complete Section
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Layout className="!bg-[#000000]">
        <Layout className="!bg-[#000000] !text-white">
          <Content
            className="!text-white z-10"
            style={{ margin: 0, minHeight: 280 }}
          >
            {/* Question Navigation - Horizontal */}
            {totalQuestionsInSection > 0 && (
              <div className="px-4 pt-1 z-20">
                <div className="flex flex-row gap-2 flex-wrap pb-3">
                  {Array.from({ length: totalQuestionsInSection }, (_, i) => {
                    const questionNum = i + 1;
                    const isActive = globalQuestionNumber === questionNum;
                    const isAnswered = isQuestionAnswered(questionNum);
                    const isFlagged = flaggedQuestions.has(questionNum);
                    const isSkipped = skippedQuestions.has(questionNum);
                    const isVisited = visitedQuestions.has(questionNum);
                    
                    // Determine button styling and icon based on state
                    let buttonClasses = '';
                    let iconElement = null;
                    
                    if (isActive) {
                      // Currently viewing this question - Purple background with white circle icon
                      buttonClasses = 'border-[#7C3AED] bg-[#7C3AED] text-white';
                      iconElement = (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        </svg>
                      );
                    } else if (isAnswered) {
                      // Answered question - Green background with white checkmark
                      buttonClasses = 'border-[#2dd46d] bg-[#2dd46d] text-white';
                      iconElement = <CheckOutlined className="text-white text-sm" />;
                    } else if (isFlagged) {
                      // Flagged question - Orange background with white flag
                      buttonClasses = 'border-[#ff8c00] bg-[#ff8c00] text-white';
                      iconElement = <FlagOutlined className="text-white text-sm" />;
                    } else if (isSkipped) {
                      // Skipped question - Grey background with play icon
                      buttonClasses = 'border-[#303036] bg-[#1A1128] text-white hover:border-[#7C3AED40]';
                      iconElement = <PlayCircleOutlined className="text-white text-sm" />;
                    } else {
                      // Unvisited/unanswered - Grey background with white circle
                      buttonClasses = 'border-[#303036] bg-[#1A1128] text-white hover:border-[#7C3AED40]';
                      iconElement = (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        </svg>
                      );
                    }
                    
                    return (
                      <button
                        key={questionNum}
                        onClick={() => goToQuestionByNumber(questionNum)}
                        className={`relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${buttonClasses}`}
                      >
                        <span className="text-sm font-semibold">{`Q${questionNum}`}</span>
                        {iconElement}
                      </button>
                    );
                  })}
                </div>
                {/* Separator line below question numbers */}
                <div className="border-b border-[#FFFFFF33]"></div>
              </div>
            )}
            {!mediaPermissionsValid || !videoQualityValid ? (
              <div className="flex items-center justify-center p-8">
                <Text className="text-white text-lg">
                  Waiting for media validation to complete...
                </Text>
              </div>
            ) : assessmentSummaryLoading || questionTypesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Text className="text-white animate-pulse text-lg">
                  Loading assessment content...
                </Text>
              </div>
            ) : tabs.length > 0 ? (
              (() => {
                const currentTab = tabs.find((tab) => tab.key === activeTabKey);
                if (
                  currentTab?.questionType &&
                  currentTab.questionType !== "qt_001" &&
                  currentTab.questionType !== "qt_007"
                ) {
                  // For dynamic question types, render the dynamic content
                  return (
                    <DynamicQuestionContent
                      currentQuestions={filteredCurrentQuestions}
                      currentQuestionsLoading={currentQuestionsLoading}
                      currentQuestionsError={currentQuestionsError}
                      currentQuestionIndex={currentQuestionIndex}
                      questionAnswers={questionAnswers}
                      onAnswerChange={handleAnswerChange}
                      onForceSaveAnswer={forceSaveAnswerOnNavigation}
                      goToNextQuestion={goToNextQuestion}
                      goToPreviousQuestion={goToPreviousQuestion}
                      onEndSection={handleEndSection}
                      onCompleteSection={isLastSection && isLastQuestionOfSection ? handleCompleteSection : undefined}
                      onSaveAll={isLastSection && isLastQuestionOfSection ? handleSaveAll : undefined}
                      isSavingSection={isSavingSection}
                      displayName={currentTab.label.split(" (")[0]}
                      hasPreviousQuestion={hasPreviousQuestion}
                      globalQuestionNumber={globalQuestionNumber}
                      totalQuestionsInSection={totalQuestionsInSection}
                      isLastSection={isLastSection}
                      isLastQuestionOfSection={isLastQuestionOfSection}
                      hasNextSection={hasNextSection}
                      onFlagQuestion={handleFlagQuestion}
                      isQuestionFlagged={flaggedQuestions.has(globalQuestionNumber)}
                    />
                  );
                }
                if (currentTab?.questionType === "qt_001") {
                  return (
                    <MCQQuestionTab
                      props={{
                        ...(currentTab.mcqProps || {}),
                        globalOffset: currentTab.globalOffset ?? 0,
                        totalQuestionsInSection,
                        onGlobalNext: goToNextTabFromMCQ,
                        onGlobalPrevious: goToPreviousTabFromMCQ,
                        isLastSection,
                        isLastQuestionOfSection,
                        hasNextSection,
                        onCompleteSection: isLastSection && isLastQuestionOfSection ? handleCompleteSection : undefined,
                        onSaveAll: isLastSection && isLastQuestionOfSection ? handleSaveAll : undefined,
                        onEndSection: isLastQuestionOfSection && !isLastSection && hasNextSection ? handleEndSection : undefined,
                      }}
                    />
                  );
                }
                  // For static question types, use the tab content
                  return currentTab?.content;
              })()
            ) : (
              <div className="flex items-center justify-center p-8">
                <Text className="text-white text-lg">
                  No assessment content available
                </Text>
              </div>
            )}
            <div
              className={`fixed bottom-5 -left-3 z-10 px-10 z-20 !w-full sm:!w-[40%] md:!w-[29%] lg:!w-[22%] xl:!w-[19.5%]`}
            >
              <Collapse
                className="!rounded-lg !border !border-[#23263C] !bg-[#1D1D1F] [&_.ant-collapse-content]:!bg-[#1D1D1F] overflow-hidden"
                // defaultActiveKey={['1']}
                expandIcon={() => (
                  <img
                    src={`${import.meta.env.BASE_URL}common/minus.svg`}
                    alt="minus"
                  />
                )}
                expandIconPosition="end"
                items={[
                  {
                    key: "1",
                    label: (
                      <Row justify="space-between" align="middle" className="w-full">
                        <Col>
                          <Text className="!text-white">Video</Text>
                        </Col>
                        <Col>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#FF4D4F] animate-pulse" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#FFB3B8]">
                              Recording
                            </span>
                          </div>
                        </Col>
                      </Row>
                    ),
                    children: (
                      <div className="relative overflow-hidden rounded-lg border border-[#23263C]">
                        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-[#FF4D4F]/90 px-3 py-1.5 shadow-lg">
                          <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            Recording
                          </span>
                        </div>
                      <Webcam
                        audio
                        muted
                        mirrored={false}
                        disablePictureInPicture={true}
                        screenshotFormat="image/png"
                        className="w-full"
                        videoConstraints={{ facingMode: "user" }}
                      />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Media Permissions Violation Modal */}
      <MediaPermissionsViolationModal
        open={showMediaViolationModal}
        violationType={mediaViolationType}
        message={mediaViolationMessage}
        onRetry={handleRetryMediaCheck}
      />

      {/* Fullscreen Violation Modal (using unified component) */}
      <MediaPermissionsViolationModal
        open={showFullscreenViolationModal}
        violationType="fullscreen"
        message={violationMessage}
        violationCount={fullscreenViolationCountRef.current}
        violationLimit={FULLSCREEN_VIOLATION_LIMIT}
        onEnterFullscreen={enterFullscreen}
        onClose={() => setShowFullscreenViolationModal(false)}
      />

      {/* Blocking Overlay - Prevents interaction when not in fullscreen (Issue 1) */}
      {shouldBlockInterface && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Fullscreen Warning Modal - Custom overlay with dark theme design (Issue 1) */}
      {showFullscreenWarningModal && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="bg-[#1a1a1a] border-2 border-red-500 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '32rem',
              width: '100%',
              margin: '0 1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '2px solid #ef4444',
            }}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-white text-2xl font-bold text-center mb-4">
              Fullscreen Mode Required
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-center mb-6 text-base">
              You are not supposed to exit fullscreen mode during the assessment.
            </p>

            {/* Countdown Box */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 mb-6">
              <h4 className="text-white font-semibold text-center mb-3 text-lg">
                Returning to fullscreen automatically in{' '}
                <span className="text-red-500 font-bold text-2xl">
                  {fullscreenCountdown}
                </span>{' '}
                seconds
              </h4>
              <div className="w-full">
                <Progress 
                  percent={((7 - fullscreenCountdown) / 7) * 100} 
                  strokeColor="#ef4444"
                  trailColor="rgba(255, 255, 255, 0.1)"
                  showInfo={false}
                  strokeWidth={8}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center mb-4">
              <Button
                onClick={handleReenterFullscreen}
                type="primary"
                className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0] !rounded-lg !px-8 !py-3 !h-auto !font-semibold !text-base"
              >
                Return to Fullscreen Now
              </Button>
            </div>

            {/* Footer Text */}
            <p className="text-gray-400 text-center text-xs">
              Please return to fullscreen mode to continue with the assessment.
            </p>
          </div>
        </div>
      )}

      {/* Tab Switch Violation Modal (using unified component) */}
      <MediaPermissionsViolationModal
        open={showTabSwitchViolationModal}
        violationType="tab_switch"
        message={tabSwitchViolationMessage}
        violationCount={tabSwitchViolationCountRef.current}
        violationLimit={TAB_SWITCH_VIOLATION_LIMIT}
        onClose={() => setShowTabSwitchViolationModal(false)}
      />

      {/* Fullscreen Modal */}
      <FullscreenModal
        open={showFullscreenModal}
        onEnterFullscreen={handleEnterFullscreen}
        onSkip={secureMode ? undefined : handleSkipFullscreen}
        isSupported={isSupported}
        canSkip={!secureMode}
        secureMode={secureMode}
      />

      {/* Switch Section Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
            <span className="text-lg font-semibold">
              Switch Section
            </span>
          </div>
        }
        open={showSwitchSectionModal}
        onOk={handleSwitchSection}
        onCancel={() => {
          setShowSwitchSectionModal(false);
          setSelectedSectionToSwitch(null);
        }}
        okText="Yes, End Current Section"
        cancelText="Cancel"
        confirmLoading={isCompletingSectionAPI}
        centered
        width={500}
        okButtonProps={{
          danger: false,
          className: "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]",
        }}
      >
        <div className="py-4">
          <p className="text-white/90 mb-4">
            You are about to switch to another section. To proceed, you need to end the current section first.
          </p>
          <p className="text-white/70 text-sm">
            All your answers in the current section will be saved automatically. Click <strong>"Yes, End Current Section"</strong> to proceed or <strong>"Cancel"</strong> to continue with the current section.
          </p>
        </div>
      </Modal>

      {/* Last Section Warning Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
            <span className="text-lg font-semibold">
              Last Section Warning
            </span>
          </div>
        }
        open={showLastSectionWarning}
        onOk={async () => {
          setShowLastSectionWarning(false);
          if (selectedSectionToSwitch) {
            await handleConfirmCompleteSectionForSwitch(selectedSectionToSwitch);
          }
        }}
        onCancel={() => {
          setShowLastSectionWarning(false);
          setSelectedSectionToSwitch(null);
        }}
        okText="Yes, Continue"
        cancelText="Cancel"
        confirmLoading={isCompletingSectionAPI}
        centered
        width={500}
        okButtonProps={{
          danger: false,
          className: "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]",
        }}
      >
        <div className="py-4">
          <p className="text-white/90 mb-4 font-semibold">
            This is the last section.
          </p>
          <p className="text-white/70 text-sm mb-4">
            You are about to switch to the last section. Once you start this section, you will be able to submit the assessment.
          </p>
          <p className="text-white/70 text-sm">
            All your answers in the current section will be saved automatically. Click <strong>"Yes, Continue"</strong> to proceed or <strong>"Cancel"</strong> to continue with the current section.
          </p>
        </div>
      </Modal>

      {/* Section Transition Countdown Modal */}
      <Modal
        open={showSectionTransitionModal}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        className="section-transition-modal"
        styles={{
          content: {
            backgroundColor: "#0a0a0a",
            border: "1px solid #333",
          },
        }}
      >
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-white text-6xl font-bold mb-4 animate-pulse">
            {countdown > 0 ? countdown : "The next section will start"}
          </div>
          {countdown === 0 && (
            <div className="text-white/70 text-lg mt-4">
              Redirecting to Section 2 instructions...
            </div>
          )}
        </div>
      </Modal>

      {/* Submit Assessment Summary Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
            <span className="text-lg font-semibold text-white">
              Assessment Summary
            </span>
          </div>
        }
        open={showSubmitSummaryModal}
        onOk={executeSubmitAssessment}
        onCancel={() => setShowSubmitSummaryModal(false)}
        okText={
          isCompletingSection ? "Submitting..." : "Sure, Submit Assessment"
        }
        cancelText="Cancel"
        confirmLoading={isCompletingSection}
        centered
        width={600}
        okButtonProps={{
          danger: false,
          className: "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]",
        }}
        className="[&_.ant-modal-content]:!bg-[#1A1128] [&_.ant-modal-header]:!bg-[#1A1128] [&_.ant-modal-header]:!border-[#303036] [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white [&_.ant-modal-body]:!bg-[#1A1128] [&_.ant-modal-footer]:!bg-[#1A1128] [&_.ant-modal-footer]:!border-[#303036]"
      >
        <div className="py-4">
          {(() => {
            const summary = calculateSubmitSummary();
            return (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white text-base font-semibold">
                      Overall Progress
                    </p>
                    <p className="text-white/70 text-sm">
                      {summary.totalAnswered} / {summary.totalQuestions} answered
                    </p>
                  </div>
                  <Progress
                    percent={summary.overallPercentage}
                    strokeColor="#7C3AED"
                    trailColor="rgba(255, 255, 255, 0.1)"
                    size="default"
                  />
                  <p className="text-white/70 text-sm mt-2 text-center">
                    {summary.overallPercentage}% Complete
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-white text-base font-semibold mb-3">
                    Section-wise Breakdown
                  </p>
                  <div className="space-y-3">
                    {summary.sections.map((section, index) => (
                      <div
                        key={index}
                        className="bg-[#0a0a0a] border border-[#303036] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {section.sectionName}
                          </span>
                          <span className="text-white/70 text-sm">
                            {section.answered} / {section.total}
                          </span>
                        </div>
                        <Progress
                          percent={section.percentage}
                          strokeColor={
                            section.percentage === 100
                              ? "#22C55E"
                              : section.percentage >= 50
                              ? "#7C3AED"
                              : "#F59E0B"
                          }
                          trailColor="rgba(255, 255, 255, 0.1)"
                          size="small"
                          showInfo={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">
                    ⚠️ Important:
                  </h4>
                  <ul className="text-sm text-yellow-300/80 space-y-1 list-disc list-inside">
                    <li>Camera and screen recording will be stopped</li>
                    <li>Your answers will be submitted</li>
                    <li>You cannot return after submission</li>
                    <li>All local data will be cleared</li>
                  </ul>
                </div>

                <p className="text-white/70 text-sm text-center">
                  Click <strong className="text-white">"Sure, Submit Assessment"</strong> to proceed or{" "}
                  <strong className="text-white">"Cancel"</strong> to continue with the assessment.
                </p>
              </>
            );
          })()}
        </div>
      </Modal>

      {/* Submit Assessment Confirmation Modal (Legacy - keeping for backward compatibility) */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
            <span className="text-lg font-semibold">
              Confirm Submit Assessment
            </span>
          </div>
        }
        open={showCompleteConfirmModal}
        onOk={executeCompleteSection}
        onCancel={() => setShowCompleteConfirmModal(false)}
        okText={
          isCompletingSection ? "Submitting..." : "Yes, Submit Assessment"
        }
        cancelText="Cancel"
        confirmLoading={isCompletingSection}
        centered
        width={500}
        okButtonProps={{
          danger: false,
          className: "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]",
        }}
      >
        <div className="py-4">
          <p className="text-gray-700 text-base mb-4">
            Are you sure you want to submit your assessment?
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Important:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Camera and screen recording will be stopped</li>
              <li>Your answers will be submitted</li>
              <li>You cannot return after submission</li>
              <li>All local data will be cleared</li>
            </ul>
          </div>

          <p className="text-gray-600 text-sm">
            Click <strong>"Yes, Submit Assessment"</strong> to proceed or{" "}
            <strong>"Cancel"</strong> to continue with the assessment.
          </p>
        </div>
      </Modal>

      {/* Complete Section Modal (Simplified - No Break Options) */}
      <Modal
        open={showCompleteSectionModal}
        onOk={handleConfirmCompleteSection}
        onCancel={() => setShowCompleteSectionModal(false)}
        okText={isCompletingSectionAPI ? "Completing..." : "Yes, End Section"}
        cancelText="Cancel"
        confirmLoading={isCompletingSectionAPI}
        centered
        width={500}
        okButtonProps={{
          className: "!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6B52F0]",
        }}
        cancelButtonProps={{
          className: "!border-[#303036] !text-white hover:!border-[#7C3AED40]",
        }}
        className="[&_.ant-modal-content]:!bg-[#1A1128] [&_.ant-modal-header]:!bg-[#1A1128] [&_.ant-modal-header]:!border-[#303036] [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white [&_.ant-modal-body]:!bg-[#1A1128] [&_.ant-modal-footer]:!bg-[#1A1128] [&_.ant-modal-footer]:!border-[#303036]"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">
              {completedSectionName || "Section"} Completed!
            </span>
          </div>
        }
      >
        <div className="py-4 text-center">
          <Text className="!text-white/70 block mb-4">
            Are you sure you want to end this section?
          </Text>

          <div className="bg-[#0a0a0a] border border-[#303036] rounded-lg p-4">
            <Text className="!text-white/70 !text-sm block">
              All your answers will be saved and you can select the next section.
            </Text>
          </div>
        </div>
      </Modal>
      <Modal
        open={showCompleteSectionModal}
        onOk={handleConfirmCompleteSection}
        onCancel={() => setShowCompleteSectionModal(false)}
        okText={isCompletingSectionAPI ? "Completing..." : "Yes, End Section"}
        cancelText="Cancel"
        confirmLoading={isCompletingSectionAPI}
        centered
        width={500}
        okButtonProps={{
          className: "!bg-[#7C3AED] !border-[#7C3AED] hover:!bg-[#6B52F0]",
        }}
        cancelButtonProps={{
          className: "!border-[#303036] !text-white hover:!border-[#7C3AED40]",
        }}
        className="[&_.ant-modal-content]:!bg-[#1A1128] [&_.ant-modal-header]:!bg-[#1A1128] [&_.ant-modal-header]:!border-[#303036] [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white [&_.ant-modal-body]:!bg-[#1A1128] [&_.ant-modal-footer]:!bg-[#1A1128] [&_.ant-modal-footer]:!border-[#303036]"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">
              {completedSectionName || "Section"} Completed!
            </span>
          </div>
        }
      >
        <div className="py-4 text-center">
          <Text className="!text-white/70 block mb-4">
            Are you sure you want to end this section?
          </Text>

          <div className="bg-[#0a0a0a] border border-[#303036] rounded-lg p-4">
            <Text className="!text-white/70 !text-sm block">
              All your answers will be saved and you can select the next section.
            </Text>
          </div>
        </div>
      </Modal>

      {/* Countdown Timer Modal for Section Transition */}
      <CountdownTimer
        visible={showCountdownModal}
        onComplete={handleCountdownComplete}
        initialCount={10}
        isLastSection={isLastSection}
      />
    </Layout>
  );
}
