/* eslint-disable @typescript-eslint/no-explicit-any */
import { DownOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Form, Input, InputNumber, Modal, Progress, Row, Select, notification, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AssessmentSummary,
  StandardField,
  CustomField,
  setCapturedImageBlob,
  setCapturedImagePreview,
  clearCapturedImage,
  setCandidateId,
  setAuthToken,
} from "../../store/miscSlice";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import { API_ENDPOINTS } from "../../config/apiConfig";
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';

// Extend Navigator interface for legacy getUserMedia support
declare global {
    interface Navigator {
        getUserMedia?: (
            constraints: MediaStreamConstraints,
            successCallback: (stream: MediaStream) => void,
            errorCallback: (error: any) => void
        ) => void;
        webkitGetUserMedia?: (
            constraints: MediaStreamConstraints,
            successCallback: (stream: MediaStream) => void,
            errorCallback: (error: any) => void
        ) => void;
        mozGetUserMedia?: (
            constraints: MediaStreamConstraints,
            successCallback: (stream: MediaStream) => void,
            errorCallback: (error: any) => void
        ) => void;
        msGetUserMedia?: (
            constraints: MediaStreamConstraints,
            successCallback: (stream: MediaStream) => void,
            errorCallback: (error: any) => void
        ) => void;
    }
}

// Type assertion for legacy getUserMedia support
const getLegacyGetUserMedia = () => {
    const nav = navigator as any;
  return (
    nav.getUserMedia ||
    nav.webkitGetUserMedia ||
    nav.mozGetUserMedia ||
    nav.msGetUserMedia
  );
};

const { Option } = Select;

const inputStyles = {
  height: "48px",
  borderRadius: "10px",
};

const formItemStyle = {
  marginBottom: 16,
};

const labelStyle = {
  color: "white",
  fontFamily: "Roboto-Regular, Helvetica",
  fontSize: "14px",
  marginBottom: "8px",
};

export default function AssessmentForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { candidate_id } = useParams();
  const storedCandidateId = useSelector(
    (state: any) => state.misc.candidate_id
  );
  const assessmentSummary = useSelector(
    (state: any) => state.misc.assessmentSummary
  ) as AssessmentSummary | null;
  const capturedImageBlob = useSelector(
    (state: any) => state.misc.capturedImageBlob
  );
  const capturedImagePreview = useSelector(
    (state: any) => state.misc.capturedImagePreview
  );
  const tokenValidation = useSelector(
    (state: any) => state.misc?.tokenValidation
  );
    const authToken = useSelector((state: any) => state.misc.authToken);
    
    // Secure mode hook
    useSecureMode();
    
    // Fullscreen functionality
    const { isSupported: isFullscreenSupported, enterFullscreen } = useFullscreen();
    const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
    const [fullscreenCountdown, setFullscreenCountdown] = useState(7);
    const wasFullscreenRef = useRef(false);
    const [shouldBlockInterface, setShouldBlockInterface] = useState(false);

    // Upload state tracking
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    // Form submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Face detection state
    const [modelsLoaded, setModelsLoaded] = useState(false);
  const [lockedFields, setLockedFields] = useState<string[]>([]);
  const lockedFieldsSet = useMemo(() => new Set(lockedFields), [lockedFields]);

    // Helper function to get prefilled values from tokenValidation
    const getPrefilledValues = () => {
        if (!tokenValidation?.decoded_token) {
            return {};
        }

        const decodedToken = tokenValidation.decoded_token;
        const prefilledValues: Record<string, any> = {};

        // Prefill full_name if available
        if (decodedToken.full_name) {
            prefilledValues.full_name = decodedToken.full_name;
        }

        // Prefill email if available
        if (decodedToken.email) {
            prefilledValues.email = decodedToken.email;
        }

        return prefilledValues;
    };

    // Assessment Form
    const [form] = Form.useForm();
    const [step, setStep] = useState(1);

    // Calculate dynamic step configuration
    const getStepConfiguration = () => {
        const formFields = generateFormFields();
        
        if (!formFields) {
            return {
                totalSteps: 1,
                fieldsPerStep: 4,
                step1Fields: [],
        step2Fields: [],
            };
        }

    const allFields = [
      ...formFields.leftColumnFields,
      ...formFields.rightColumnFields,
    ];
        const totalFields = allFields.length;
        
        // Define maximum fields per step (adjust as needed)
        const maxFieldsPerStep = 4;
        
        // Calculate number of steps needed
        const totalSteps = Math.ceil(totalFields / maxFieldsPerStep);
        
        // Split fields across steps
        const step1Fields = allFields.slice(0, maxFieldsPerStep);
        const step2Fields = totalSteps > 1 ? allFields.slice(maxFieldsPerStep) : [];

        return {
            totalSteps,
            fieldsPerStep: maxFieldsPerStep,
            step1Fields,
      step2Fields,
        };
    };

    // Field mapping for standard fields
    const fieldLabelMap: Record<string, string> = {
    full_name: "Full Name",
    email: "Email Address",
    mobile_number: "Phone Number",
    date_of_birth: "Date of Birth",
    pan_number: "PAN Number",
    passport: "Passport Number",
    aadhar_number: "Aadhar Number",
    percentage_cgpa: "Percentage/CGPA",
    notice_period: "Notice Period (months)",
    };

    // Generate input component based on field type
  const generateInputComponent = (
    fieldType: string,
    fieldName: string,
    options: string[] = []
  ) => {
    const isLocked = lockedFieldsSet.has(fieldName);
    const sharedStyle = {
      ...inputStyles,
      ...(isLocked ? { cursor: "not-allowed" } : {}),
    };

    const baseProps = {
      placeholder: `Enter ${fieldLabelMap[fieldName] || fieldName}`,
      style: sharedStyle,
      className: isLocked ? "cursor-not-allowed" : undefined,
    } as const;

        switch (fieldType) {
      case "email":
        return <Input {...baseProps} type="email" readOnly={isLocked} />;
      case "phone":
        return <Input {...baseProps} type="tel" readOnly={isLocked} />;
      case "date":
        return (
          <DatePicker
            {...baseProps}
            style={{ ...inputStyles, width: "100%" }}
            disabled={isLocked}
            format="DD/MM/YYYY"
          />
        );
      case "number":
        return (
          <InputNumber
            {...baseProps}
            style={{ ...inputStyles, width: "100%" }}
            readOnly={isLocked}
          />
        );
      case "select":
                return (
                    <Select
                        {...baseProps}
            disabled={isLocked}
                        suffixIcon={<DownOutlined className="text-white/60" />}
                    >
                        {options.map((option: string, index: number) => (
              <Option key={index} value={option}>
                {option}
              </Option>
                        ))}
                    </Select>
                );
            default:
        return <Input {...baseProps} type="text" readOnly={isLocked} />;
        }
    };

    // Generate form fields from assessment summary
    const generateFormFields = () => {
    if (
      !assessmentSummary?.assessment_overview?.general_settings
        ?.candidate_details
    ) {
            return null;
        }

    const { standard_fields, custom_fields } =
      assessmentSummary.assessment_overview.general_settings.candidate_details;
        
        // Combine standard and custom fields
    const allFields: Array<{
      fieldName: string;
      field: StandardField | CustomField;
      isCustom: boolean;
    }> = [];
        
        // Add standard fields
        Object.entries(standard_fields).forEach(([fieldName, field]) => {
            if (field.enabled) {
                allFields.push({ fieldName, field, isCustom: false });
            }
        });
        
        // Add custom fields
        custom_fields.forEach((field) => {
            if (field.enabled) {
                allFields.push({ fieldName: field.id, field, isCustom: true });
            }
        });

        // Sort fields by order
        allFields.sort((a, b) => a.field.order - b.field.order);

        // Split into two columns
        const midPoint = Math.ceil(allFields.length / 2);
        const leftColumnFields = allFields.slice(0, midPoint);
        const rightColumnFields = allFields.slice(midPoint);

        return { leftColumnFields, rightColumnFields };
    };

    // Assessment Form Next Step
    const nextStep = async () => {
        try {
            // Get current step fields to validate only those
            const { step1Fields, step2Fields, totalSteps } = getStepConfiguration();
            const currentStepFields = step === 1 ? step1Fields : step2Fields;
            
            // Extract field names for validation
            const fieldNames = currentStepFields.map(({ fieldName }) => fieldName);
            
            // Validate only the current step fields
            await form.validateFields(fieldNames);
            
            setStep((prev) => {
                const newStep = Math.min(prev + 1, totalSteps);
                return newStep;
            });
        } catch (error) {
            console.log("Validation failed", error);
        }
    };

    // Assessment Form Previous Step
    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    // Submit Assessment Form
    const handleSubmit = async (values) => {
        // Block submission if camera permission is not granted
        if (!cameraPermissionGranted) {
            setShowPermissionModal(true);
            return;
        }
        
        // Block submission if no image is captured
        if (!capturedImageBlob) {
      alert("Please capture your image before proceeding.");
            return;
        }
        
        console.log("Submitted values:", values);
        console.log("Captured image blob:", capturedImageBlob);
        
        // Check if auth token is available
        if (!authToken) {
      console.warn("Auth token is not available. API call may fail.");
      alert(
        "Authentication token is missing. Please refresh the page and try again."
      );
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Call API to update candidate information
            const requestBody = {
        email: values.email || "",
        full_name: values.full_name || "",
      };

      console.log("Sending candidate info to API:", requestBody);
      console.log(
        "Using auth token:",
        authToken ? "Token available" : "No token"
      );
            
            // Prepare headers
            const headers: Record<string, string> = {
        accept: "application/json",
        "Content-Type": "application/json",
            };
            
            // Add Authorization header if token is available
            if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(API_ENDPOINTS.candidate.info, {
        method: "PUT",
                headers: headers,
        body: JSON.stringify(requestBody),
            });
            
            if (response.ok) {
                const responseData = await response.json();
        console.log("Candidate info updated successfully:", responseData);
                
                // Navigate to assessment guideline on success
                navigate(`/${storedCandidateId || candidate_id}/assessment-guideline`);
            } else {
                const errorText = await response.text();
        console.error(
          "Failed to update candidate info:",
          response.status,
          errorText
        );
                alert(`Failed to update candidate information: ${response.status}`);
                setIsSubmitting(false);
            }
        } catch (error) {
      console.error("Error updating candidate info:", error);
      alert(
        "An error occurred while updating candidate information. Please try again."
      );
            setIsSubmitting(false);
        }
    };

    // Retry camera permission
    const retryCameraPermission = async () => {
        setIsCheckingPermission(true);
        await requestCameraAccess();
        setIsCheckingPermission(false);
    };

    // Is Web CAM Open - now tracks if camera is actively being used
    const [isWebCAMOpen, setIsWebCAMOpen] = useState(false);
    // Track permission status separately
    const [cameraPermission, setCameraPermission] = useState('unknown'); // 'unknown', 'granted', 'denied', 'unsupported'
    // Web CAM
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    
    // Camera permission enforcement
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);
    const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
    
    // Auto-capture functionality
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [facePositionValid, setFacePositionValid] = useState(false);
    const [autoCaptureCountdown, setAutoCaptureCountdown] = useState(0);
    const [isAutoCapturing, setIsAutoCapturing] = useState(false);
    const [faceDetectionMessage, setFaceDetectionMessage] = useState('Position your face in the oval');
    const faceDetectionIntervalRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);

    // Store candidate_id and auth token from URL in Redux on component load
    useEffect(() => {
        if (candidate_id) {
            // Check if the candidate_id looks like a JWT token (starts with 'eyJ')
      const isJwtToken = candidate_id.startsWith("eyJ");
            
            if (isJwtToken) {
                // The candidate_id is actually an auth token
                dispatch(setAuthToken(candidate_id));
                dispatch(setCandidateId(candidate_id));
            } else {
                // It's a regular candidate_id
                dispatch(setCandidateId(candidate_id));
            }
        }

        // Handle auth token - fetch from URL parameters as fallback
        const urlParams = new URLSearchParams(window.location.search);
    const authToken =
      urlParams.get("token") ||
      urlParams.get("auth") ||
      urlParams.get("authToken");
        
        if (authToken) {
            dispatch(setAuthToken(authToken));
        }
    }, [candidate_id, dispatch]);

    // Force camera permission check on component load
    useEffect(() => {
        const checkCameraPermissionOnLoad = async () => {
            setIsCheckingPermission(true);
            
            try {
                // Check if camera is supported
                if (!checkCameraSupport()) {
          setCameraPermission("unsupported");
                    setShowPermissionModal(true);
                    setIsCheckingPermission(false);
                    return;
                }

                // Try to get camera permission
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "user" }, 
          audio: false,
                });
                
                // Permission granted
        setCameraPermission("granted");
                setCameraPermissionGranted(true);
                setIsWebCAMOpen(true);
                
                // Stop the stream as we just needed to check permission
        stream.getTracks().forEach((track) => track.stop());
            } catch (error) {
        console.error("Camera permission denied or error:", error);
        setCameraPermission("denied");
                setShowPermissionModal(true);
            }
            
            setIsCheckingPermission(false);
        };

        checkCameraPermissionOnLoad();
    }, []);

    // Prefill form fields when tokenValidation data is available
    useEffect(() => {
        console.log('AssessmentForm - tokenValidation changed:', tokenValidation);
        
        if (tokenValidation?.decoded_token) {
            const prefilledValues = getPrefilledValues();
            
            console.log('AssessmentForm - extracted prefilled values:', prefilledValues);
            
            if (Object.keys(prefilledValues).length > 0) {
                console.log('AssessmentForm - prefilling form with token data:', prefilledValues);
                form.setFieldsValue(prefilledValues);
        setLockedFields((prev) => {
          const next = new Set(prev);
          Object.entries(prefilledValues).forEach(([field, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              next.add(field);
            }
          });
          return Array.from(next);
        });
                
                // Verify the form was updated
                setTimeout(() => {
                    const currentValues = form.getFieldsValue();
                    console.log('AssessmentForm - form values after prefilling:', currentValues);
                }, 100);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenValidation, form]);

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Use proper base URL for production deployment
                const MODEL_URL = `${window.location.origin}${import.meta.env.BASE_URL}models`;
                console.log('🔄 Loading face detection models from:', MODEL_URL);
                
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                
                setModelsLoaded(true);
                console.log('✅ Face detection models loaded successfully');
            } catch (error) {
                console.error('❌ Error loading face detection models:', error);
                // Fallback: allow manual capture even if face detection fails
                setModelsLoaded(false);
            }
        };
        
        loadModels();
    }, []);

    // Check if getUserMedia is supported
    const checkCameraSupport = () => {
        return !!(
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
            getLegacyGetUserMedia()
        );
    };

    // Get cross-browser getUserMedia function
    const getUserMedia = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        }

        // Fallback for older browsers
        const getUserMediaFallback = getLegacyGetUserMedia();

        if (getUserMediaFallback) {
            return (constraints) => {
                return new Promise((resolve, reject) => {
                    getUserMediaFallback.call(navigator, constraints, resolve, reject);
                });
            };
        }

        return null;
    };

    // Enhanced mobile constraints
    const getMobileConstraints = (): MediaStreamConstraints => {
        return {
            video: {
                // Prefer back camera on mobile
                facingMode: { ideal: "environment" },
                // Mobile-friendly resolution
                width: { ideal: 1280 },
                height: { ideal: 720 },
                // Frame rate optimization
        frameRate: { ideal: 15, max: 30 },
            },
      audio: false,
        };
    };

    // Function to request camera access with mobile support
    const requestCameraAccess = async () => {
        try {
            // Check if camera is supported
            if (!checkCameraSupport()) {
        setCameraPermission("unsupported");
                setShowPermissionModal(true);
                return;
            }

            const getUserMediaFunc = getUserMedia();
            if (!getUserMediaFunc) {
        throw new Error("getUserMedia not supported");
            }

            // Try mobile-optimized constraints first
            const constraints = getMobileConstraints();
            let stream;

            try {
                stream = await getUserMediaFunc(constraints);
            } catch (mobileError) {
                // Fallback to basic constraints if mobile constraints fail
        console.log(
          "Mobile constraints failed, trying basic constraints:",
          mobileError
        );
        const basicConstraints: MediaStreamConstraints = {
          video: { facingMode: "user" },
          audio: false,
        };
                stream = await getUserMediaFunc(basicConstraints);
            }

            // If we get here, permission was granted
      setCameraPermission("granted");
            setCameraPermissionGranted(true);
            setIsWebCAMOpen(true);
            setShowPermissionModal(false);

            // Stop the stream immediately since Webcam component will handle it
      stream.getTracks().forEach((track) => track.stop());

      console.log("Camera permission granted.");
        } catch (error) {
      console.error("Camera access error:", error);
      setCameraPermission("denied");
            setIsWebCAMOpen(false);
            setShowPermissionModal(true);

            // More user-friendly error messages
      if (error.name === "NotAllowedError") {
        alert(
          "Camera access denied. Please enable camera permissions or use the file upload option."
        );
      } else if (error.name === "NotFoundError") {
        console.error(
          "No camera found on this device. Please use the file upload option."
        );
      } else if (
        error.name === "NotSupportedError" ||
        error.message.includes("getUserMedia")
      ) {
        console.error(
          "Camera not supported in this browser. Please use the file upload option or try a different browser."
        );
      } else if (error.name === "NotReadableError") {
        console.error(
          "Camera is being used by another application. Please close other apps using the camera and try again."
        );
            } else {
        console.error(
          "Camera error: " +
            error.message +
            ". You can still upload a photo using the file option."
        );
      }
    }
  };

    // Capture Image and Upload to S3 using presigned URL
    const captureImage = async () => {
        // Validate face position before capturing
        console.log('🔍 Checking face position before capture...');
        console.log('Face detected:', isFaceDetected, 'Position valid:', facePositionValid);
        
        if (!facePositionValid || !isFaceDetected) {
            console.warn('Face not properly aligned, blocking capture');
            
            // Try multiple notification methods as fallback
            try {
                notification.warning({
                    message: 'Face Not Aligned',
                    description: 'Please align your face properly within the oval before capturing. Follow the on-screen instructions.',
                    placement: 'topRight',
                    duration: 4,
                });
                console.log('✅ Notification displayed via notification.warning');
            } catch (notifError) {
                console.warn('⚠️ notification.warning failed, trying message.warning:', notifError);
                try {
                    message.warning('Please align your face properly within the oval before capturing', 4);
                    console.log('✅ Message displayed via message.warning');
                } catch (msgError) {
                    console.warn('⚠️ message.warning failed, using alert:', msgError);
                    alert('Please align your face properly within the oval before capturing');
                    console.log('✅ Alert displayed');
                }
            }
            
            return; // Don't proceed with capture
        }
        
        console.log('✅ Face position valid, proceeding with capture');
        
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            
            try {
                // Convert base64 to Blob
                const response = await fetch(imageSrc);
                const blob = await response.blob();
                
                // Store both blob and preview in Redux
                dispatch(setCapturedImageBlob(blob));
                dispatch(setCapturedImagePreview(imageSrc));
                console.log('📸 Image captured and stored as blob:', blob);
                
                // Also set local state for immediate preview
                setCapturedImage(imageSrc);
                
                // Upload to S3 using presigned URL
                console.log('📤 Starting S3 upload using presigned URL...');
                
                // Get presigned POST data from assessmentSummary
                const presignedPost = assessmentSummary?.presigned_urls?.candidate_image?.presigned_post;
                
                if (!presignedPost) {
                    console.error('❌ Presigned URL not found in assessmentSummary');
                    setUploadError('Presigned URL not available');
                    return;
                }
                
                // Generate unique filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `candidate_image_${timestamp}.jpeg`;
                
                // Create FormData for presigned POST upload
                const formData = new FormData();
                
                // Add all presigned fields first (order matters)
                Object.entries(presignedPost.fields).forEach(([key, value]) => {
                    if (key === 'key') {
                        // Replace ${filename} placeholder with actual filename
                        const keyValue = (value as string).replace('${filename}', filename);
                        formData.append(key, keyValue);
                    } else {
                        formData.append(key, value as string);
                    }
                });
                
                // Add the file blob as the last field (this is required by S3)
                formData.append('file', blob, filename);
                
                console.log('📂 Uploading to:', presignedPost.url);
                console.log('📄 Filename:', filename);
                
                // Upload to S3
                setIsUploading(true);
                setUploadError(null);
                
                const uploadResponse = await fetch(presignedPost.url, {
                    method: 'POST',
                    body: formData,
                });
                
                if (uploadResponse.ok || uploadResponse.status === 204) {
                    console.log('✅ Image uploaded to S3 successfully');
                    setUploadSuccess(true);
                    setIsUploading(false);
                } else {
                    const errorText = await uploadResponse.text();
                    console.error('❌ S3 upload failed:', uploadResponse.status, errorText);
                    setUploadError(`Upload failed: ${uploadResponse.status}`);
                    setIsUploading(false);
                }
                
            } catch (error) {
                console.error('❌ Error capturing/uploading image:', error);
                setUploadError(error instanceof Error ? error.message : 'Upload failed');
                setIsUploading(false);
                // Still set local state for preview even if upload fails
                setCapturedImage(imageSrc);
            }
        } else {
            console.warn('⚠️ Webcam is not ready yet.');
        }
    };

    // Switch camera (front/back) on mobile
    const switchCamera = async () => {
        if (isWebCAMOpen && webcamRef.current) {
            try {
                // This would require modifying the Webcam component to support camera switching
                // For now, just restart the camera
                setIsWebCAMOpen(false);
                setTimeout(() => {
                    requestCameraAccess();
                }, 100);
            } catch (error) {
        console.error("Error switching camera:", error);
            }
        }
    };

    const reCapture = () => {
        dispatch(clearCapturedImage());
        setCapturedImage(null);
        // Reset auto-capture states
        setIsFaceDetected(false);
        setFacePositionValid(false);
        setAutoCaptureCountdown(0);
        setIsAutoCapturing(false);
        // Clear any running intervals
        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
    }

    // Real face detection using face-api.js
    const detectFacePosition = async () => {
        if (!modelsLoaded || !webcamRef.current) {
            return {
                detected: false,
                centered: false,
                size: 'unknown',
                message: 'Loading face detection...'
            };
        }

        try {
            const video = webcamRef.current.video;
            if (!video || video.readyState !== 4) {
                return {
                    detected: false,
                    centered: false,
                    size: 'unknown',
                    message: 'Camera loading...'
                };
            }

            // Detect faces using TinyFaceDetector for better performance
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416, // Larger input size for better accuracy
                    scoreThreshold: 0.5 // Confidence threshold
                })
            ).withFaceLandmarks();

            if (!detections || detections.length === 0) {
                return {
                    detected: false,
                    centered: false,
                    size: 'none',
                    message: 'No face detected'
                };
            }

            if (detections.length > 1) {
                return {
                    detected: true,
                    centered: false,
                    size: 'multiple',
                    message: 'Multiple faces detected'
                };
            }

            // Get the single face detection
            const detection = detections[0];
            const { box } = detection.detection;
            
            // Calculate video center
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const centerX = videoWidth / 2;
            const centerY = videoHeight / 2;
            
            // Calculate face center
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            
            // Calculate distance from center (as percentage of video dimensions)
            const distanceX = Math.abs(faceCenterX - centerX) / videoWidth;
            const distanceY = Math.abs(faceCenterY - centerY) / videoHeight;
            
            // Define thresholds
            const centerThreshold = 0.15; // Face center should be within 15% of video center
            const minSizeThreshold = 0.25; // Face should be at least 25% of video width
            const maxSizeThreshold = 0.7; // Face should not exceed 70% of video width
            
            // Calculate face size relative to video
            const faceSize = box.width / videoWidth;
            
            // Determine if centered
            const isCentered = distanceX < centerThreshold && distanceY < centerThreshold;
            
            // Determine size appropriateness
            let sizeStatus = 'good';
            let sizeMessage = '';
            
            if (faceSize < minSizeThreshold) {
                sizeStatus = 'too_small';
                sizeMessage = 'Move closer';
            } else if (faceSize > maxSizeThreshold) {
                sizeStatus = 'too_large';
                sizeMessage = 'Move back';
            }
            
            // Determine positioning message
            let positionMessage = '';
            if (!isCentered) {
                if (distanceX > centerThreshold) {
                    positionMessage = faceCenterX < centerX ? 'Move right' : 'Move left';
                }
                if (distanceY > centerThreshold) {
                    const verticalMsg = faceCenterY < centerY ? 'Move down' : 'Move up';
                    positionMessage = positionMessage ? `${positionMessage}, ${verticalMsg}` : verticalMsg;
                }
            }
            
            // Overall message
            let message = '';
            if (isCentered && sizeStatus === 'good') {
                message = 'Perfect! ✓';
            } else if (sizeMessage && positionMessage) {
                message = `${sizeMessage}, ${positionMessage}`;
            } else if (sizeMessage) {
                message = sizeMessage;
            } else if (positionMessage) {
                message = positionMessage;
            } else {
                message = 'Adjust position';
            }
            
            return {
                detected: true,
                centered: isCentered && sizeStatus === 'good',
                size: sizeStatus,
                message: message,
                faceBox: box
            };
            
        } catch (error) {
            console.error('Face detection error:', error);
            return {
                detected: false,
                centered: false,
                size: 'error',
                message: 'Detection error'
            };
        }
    };

  // Start auto-capture countdown
  const startAutoCaptureCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setAutoCaptureCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setAutoCaptureCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          // Trigger auto-capture
          captureImage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [captureImage]);

    // Start face detection monitoring
    const startFaceDetection = useCallback(() => {
        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
        }
        
        faceDetectionIntervalRef.current = setInterval(async () => {
            if (!isWebCAMOpen || capturedImageBlob) return;
            
            const detection = await detectFacePosition();
            setIsFaceDetected(detection.detected);
            setFaceDetectionMessage(detection.message || 'Position your face in the oval');
            
            if (detection.detected && detection.centered) {
                setFacePositionValid(true);
                // Start countdown if not already running
                if (autoCaptureCountdown === 0 && !isAutoCapturing) {
                    startAutoCaptureCountdown();
                }
            } else {
                setFacePositionValid(false);
                // Reset countdown if face moves out of position
                if (autoCaptureCountdown > 0) {
                    setAutoCaptureCountdown(0);
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                    }
                }
            }
    }, 1000); // Check every 1 second
  }, [
    isWebCAMOpen,
    capturedImageBlob,
    autoCaptureCountdown,
    isAutoCapturing,
    startAutoCaptureCountdown,
  ]);

    // Start face detection when camera opens
    useEffect(() => {
    if (isWebCAMOpen && cameraPermission === "granted" && !capturedImageBlob) {
            // Small delay to ensure webcam is fully loaded
            setTimeout(() => {
                startFaceDetection();
            }, 1000);
        } else {
            // Clean up intervals when camera closes
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        }
        
        // Cleanup on unmount
        return () => {
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [isWebCAMOpen, cameraPermission, capturedImageBlob, startFaceDetection]);

    // Monitor fullscreen changes and show warning when user exits fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            // If user was in fullscreen and now exited, show warning modal and block interface
            if (wasFullscreenRef.current && !isCurrentlyFullscreen && isFullscreenSupported) {
                console.log('🚨 Fullscreen exited! Showing warning modal and blocking interface...');
                setShowFullscreenWarningModal(true);
                setShouldBlockInterface(true); // Block the test interface
                setFullscreenCountdown(7);
            } else if (isCurrentlyFullscreen) {
                // Update ref to track that we're now in fullscreen
                wasFullscreenRef.current = true;
                // If fullscreen is re-entered, close modal and unblock interface
                setShowFullscreenWarningModal(false);
                setShouldBlockInterface(false); // Unblock the test interface
                setFullscreenCountdown(7);
            } else {
                // Not in fullscreen - if we should be in fullscreen, block interface
                if (wasFullscreenRef.current) {
                    setShouldBlockInterface(true);
                } else {
                    wasFullscreenRef.current = false;
                }
            }
        };

        // Check initial fullscreen state
        const initialFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        );
        wasFullscreenRef.current = initialFullscreen;
        
        // If not in fullscreen initially, block interface and show warning
        // The test requires fullscreen mode
        if (!initialFullscreen && isFullscreenSupported) {
            setShouldBlockInterface(true);
            setShowFullscreenWarningModal(true);
            setFullscreenCountdown(7);
        } else if (!initialFullscreen) {
            // Fullscreen not supported, but still block to show message
            setShouldBlockInterface(true);
        }

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
    }, [isFullscreenSupported]);

    // Handle ESC key and fullscreen exit - More aggressive detection
    useEffect(() => {
        const checkFullscreen = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            
            // If we were in fullscreen and now we're not, show warning immediately
            if (wasFullscreenRef.current && !isCurrentlyFullscreen) {
                console.log('🚨 FULLSCREEN EXITED - Blocking interface immediately!');
                setShouldBlockInterface(true);
                setShowFullscreenWarningModal(true);
                setFullscreenCountdown(7);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            // If ESC is pressed, check immediately if we're still in fullscreen
            if (event.key === 'Escape') {
                // Small delay to let fullscreen exit first, then check
                setTimeout(() => {
                    checkFullscreen();
                }, 100);
            }
        };

        // Check fullscreen state periodically as backup
        const fullscreenCheckInterval = setInterval(() => {
            checkFullscreen();
        }, 500); // Check every 500ms

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', checkFullscreen);
        document.addEventListener('webkitfullscreenchange', checkFullscreen);
        document.addEventListener('mozfullscreenchange', checkFullscreen);
        document.addEventListener('MSFullscreenChange', checkFullscreen);

        return () => {
            clearInterval(fullscreenCheckInterval);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener('webkitfullscreenchange', checkFullscreen);
            document.removeEventListener('mozfullscreenchange', checkFullscreen);
            document.removeEventListener('MSFullscreenChange', checkFullscreen);
        };
    }, []);

    // Countdown timer for automatic fullscreen re-entry
    useEffect(() => {
        if (!showFullscreenWarningModal) {
            return;
        }

        // If countdown reaches 0, automatically re-enter fullscreen
        if (fullscreenCountdown <= 0) {
            const reenterFullscreen = async () => {
                try {
                    await enterFullscreen();
                    wasFullscreenRef.current = true;
                    setShowFullscreenWarningModal(false);
                    setFullscreenCountdown(7);
                } catch (error) {
                    console.error("Error re-entering fullscreen:", error);
                    // If re-entry fails, restart countdown
                    setFullscreenCountdown(7);
                }
            };
            reenterFullscreen();
            return;
        }

        // Set up countdown timer
        const timer = setInterval(() => {
            setFullscreenCountdown((prev) => {
                const newValue = prev - 1;
                // When countdown reaches 0, trigger automatic re-entry
                if (newValue <= 0) {
                    clearInterval(timer);
                    // Automatically re-enter fullscreen
                    const autoReenter = async () => {
                        try {
                            await enterFullscreen();
                            wasFullscreenRef.current = true;
                            setShowFullscreenWarningModal(false);
                            setShouldBlockInterface(false); // Unblock the test interface
                            setFullscreenCountdown(7);
                        } catch (error) {
                            console.error("Error re-entering fullscreen:", error);
                            setFullscreenCountdown(7);
                        }
                    };
                    autoReenter();
                    return 0;
                }
                return newValue;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showFullscreenWarningModal, fullscreenCountdown, enterFullscreen]);

    // Debug: Log modal state changes
    useEffect(() => {
        if (showFullscreenWarningModal) {
            console.log('✅ Fullscreen warning modal is now VISIBLE');
            console.log('Countdown:', fullscreenCountdown);
        } else {
            console.log('❌ Fullscreen warning modal is HIDDEN');
        }
    }, [showFullscreenWarningModal, fullscreenCountdown]);

    // Handle re-entering fullscreen from warning modal
    const handleReenterFullscreen = async () => {
        try {
            await enterFullscreen();
            wasFullscreenRef.current = true;
            setShowFullscreenWarningModal(false);
            setShouldBlockInterface(false); // Unblock the test interface
            setFullscreenCountdown(7);
        } catch (error) {
            console.error("Error re-entering fullscreen:", error);
        }
    };

    return (
    <div className="flex justify-center items-start relative bg-black text-white py-4 sm:py-6 px-4 min-h-screen overflow-y-auto">
            {/* Blocking Overlay - Prevents interaction when not in fullscreen */}
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
            {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
      >
        <source
          src={`${import.meta.env.BASE_URL}common/getty-images.mp4`}
          type="video/mp4"
        />
                Your browser does not support the video tag.
            </video>

            {/* Background Glows - Responsive positioning */}
            <div className="absolute inset-0 overflow-hidden z-0">
                <div className="absolute w-60 h-60 sm:w-80 sm:h-80 -top-20 -left-20 sm:-top-32 sm:-left-32 bg-[#4f43b7] rounded-full blur-[120px] sm:blur-[172px] opacity-60" />
                <div className="absolute w-60 h-60 sm:w-80 sm:h-80 -bottom-10 -right-10 sm:-bottom-20 sm:-right-20 bg-[#4f43b7] rounded-full blur-[120px] sm:blur-[172px] opacity-60" />
            </div>

            {/* Logo - Improved responsive positioning */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-14 z-20">
                <img
                    alt="Logo"
                    src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
                    className="h-8 sm:h-10 lg:h-auto max-w-[120px] sm:max-w-none"
                />
            </div>

            {/* Main Container - Improved responsive layout */}
            <div className="relative z-10 min-h-screen flex flex-col xl:flex-row">

                {/* Left - Scanner - Better responsive sizing */}
                <div className="w-full xl:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-8 sm:pt-24 xl:pt-8">
                    <div className="relative w-full max-w-[350px] sm:max-w-[450px] lg:max-w-[506px]">
                        {!capturedImage && (
                            isWebCAMOpen && cameraPermission === 'granted' ? (
                                <div className="relative">
                                    <Webcam
                                        audio
                                        mirrored={false}
                                        disablePictureInPicture={true}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.95}
                                        className="w-full h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[746px] object-cover rounded-2xl sm:rounded-3xl"
                                        videoConstraints={getMobileConstraints().video}
                                    />
                                    
                                    {/* Face Positioning Guide Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Main face oval guide */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <div className="relative">
                                                {/* Outer oval with dynamic color based on face detection */}
                                                <div className={`w-48 h-60 sm:w-56 sm:h-72 md:w-64 md:h-80 lg:w-72 lg:h-88 xl:w-80 xl:h-96 border-2 rounded-full opacity-80 animate-pulse transition-all duration-300 ${
                                                    isFaceDetected 
                                                        ? facePositionValid 
                                                            ? 'border-green-400' 
                                                            : 'border-yellow-400'
                                                        : 'border-white/70'
                                                }`}></div>
                                                
                                                {/* Inner face guide */}
                                                <div className="absolute inset-2 border border-white/50 rounded-full opacity-60"></div>
                                                
                                                {/* Corner guides with subtle animation */}
                                                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-white/70 rounded-tl-lg animate-pulse"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-white/70 rounded-tr-lg animate-pulse"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-white/70 rounded-bl-lg animate-pulse"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-white/70 rounded-br-lg animate-pulse"></div>
                                                
                                                {/* Center crosshair */}
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                    <div className="w-1 h-1 bg-white/80 rounded-full animate-ping"></div>
                                                </div>
                                                
                                                {/* Eye level indicators */}
                                                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-white/60 opacity-70"></div>
                                                <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-white/60 opacity-70"></div>
                                            </div>
                                        </div>
                                        
                                        {/* Face detection message with dynamic color based on face position */}
                                        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                                            facePositionValid 
                                                ? 'bg-green-600/80 border-green-400' 
                                                : isFaceDetected 
                                                    ? 'bg-yellow-600/80 border-yellow-400'
                                                    : 'bg-black/70 border-white/20'
                                        }`}>
                                            <span className="text-white text-xs sm:text-sm font-medium flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    facePositionValid 
                                                        ? 'bg-green-400 animate-pulse' 
                                                        : isFaceDetected 
                                                            ? 'bg-yellow-400 animate-pulse'
                                                            : 'bg-white/60'
                                                }`}></span>
                                                {faceDetectionMessage}
                                            </span>
                                        </div>
                                        
                                        {/* Enhanced instructions */}
                                        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                                            <div className="bg-black/70 px-4 py-3 rounded-lg border border-white/20 backdrop-blur-sm">
                                                <div className="text-white text-xs sm:text-sm space-y-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-blue-300">👁️</span>
                                                        <span>Look directly at the camera</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-green-300">🎯</span>
                                                        <span>Keep your face centered</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-yellow-300">💡</span>
                                                        <span>Ensure good lighting</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Countdown timer or progress indicator */}
                                        {autoCaptureCountdown > 0 ? (
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-red-600/90 px-4 py-2 rounded-full border border-red-400">
                                                    <span className="text-white text-sm font-bold flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
                                                        Capturing in {autoCaptureCountdown}...
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className={`px-3 py-1 rounded-full transition-all duration-300 ${
                                                    isFaceDetected 
                                                        ? facePositionValid 
                                                            ? 'bg-green-600/80 border border-green-400' 
                                                            : 'bg-yellow-600/80 border border-yellow-400'
                                                        : 'bg-black/50'
                                                }`}>
                                                    <span className={`text-xs ${
                                                        isFaceDetected 
                                                            ? facePositionValid 
                                                                ? 'text-white font-medium' 
                                                                : 'text-white/90'
                                                            : 'text-white/80'
                                                    }`}>
                                                        {isFaceDetected 
                                                            ? facePositionValid 
                                                                ? 'Auto-capture ready' 
                                                                : 'Adjusting position...'
                                                            : 'Ready to capture'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Camera switch button for mobile */}
                                    <button
                                        onClick={switchCamera}
                                        className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full text-sm hover:bg-opacity-70"
                                        title="Switch Camera"
                                    >
                                        🔄
                                    </button>
                                </div>
                            ) : (
                                <img
                                    className="w-full h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[746px] object-cover rounded-2xl sm:rounded-3xl"
                                    alt="Scanner"
                                    src={`${import.meta.env.BASE_URL}assessment/scaner-image.jpg`}
                                />
                            )
                        )}

                        {/* Show Captured Image */}
                        {(capturedImagePreview || capturedImage) && (
                            <div className="relative">
                            <img
                                className="w-full h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[746px] object-cover rounded-2xl sm:rounded-3xl"
                                alt="Captured"
                                    src={capturedImagePreview || capturedImage}
                                />
                                        {capturedImageBlob && (
                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                            ✓ Captured
                                        </div>
                                        {isUploading && (
                                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
                                                ☁️ Uploading...
                                            </div>
                                        )}
                                        {!isUploading && uploadSuccess && (
                                            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                                ☁️ Uploaded
                                            </div>
                                        )}
                                        {uploadError && (
                                            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                                ⚠️ Upload Failed
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* File input fallback */}
                        {/* {showFileInput && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <label className="bg-white bg-opacity-90 p-4 rounded-lg cursor-pointer hover:bg-opacity-100 transition-all">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileInput}
                                            className="hidden"
                                        />
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">📷</div>
                                            <div className="text-sm font-semibold">Upload Photo</div>
                                        </div>
                                    </label>
                                </div>
                            )} */}

                        {/* Gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-black to-transparent rounded-b-2xl sm:rounded-b-3xl pointer-events-none" />

                        {/* Camera button - Responsive sizing */}
                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {isWebCAMOpen && cameraPermission === "granted" ? (
                capturedImageBlob || capturedImage ? (
                                    <div className="flex gap-2">
                                        <Button
                                            className="!h-10 sm:!h-12 !px-4 sm:!px-6 !bg-red-500 !border-none !text-white !text-sm sm:!text-base !font-semibold !rounded-lg sm:!rounded-xl hover:!bg-red-600"
                                            onClick={() => {
                                                dispatch(clearCapturedImage());
                                                setCapturedImage(null);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    <Button
                                        className="!h-10 sm:!h-12 !px-6 sm:!px-10 lg:!px-20 !bg-[#FFFFFFB0] !border-none !text-black !text-sm sm:!text-base lg:!text-lg !font-semibold !rounded-lg sm:!rounded-xl"
                                        onClick={reCapture}
                                    >
                                        Re-Capture
                                    </Button>
                                    </div>
                ) : null
                            ) : (
                                <>
                                        <Button
                                            className="!h-10 sm:!h-12 !px-6 sm:!px-10 lg:!px-20 !bg-[#FFFFFFB0] !border-none !text-black !text-sm sm:!text-base lg:!text-lg !font-semibold !rounded-lg sm:!rounded-xl"
                                            onClick={requestCameraAccess}
                                        >
                    {cameraPermission === "unsupported"
                      ? "Camera N/A"
                      : "Capture Now"}
                                        </Button>

                                    {/* Always show file upload option */}
                                    {/* <label className="!h-10 sm:!h-12 !px-4 sm:!px-6 !bg-[#FFFFFFB0] !border-none !text-black !text-sm sm:!text-base !font-semibold !rounded-lg sm:!rounded-xl cursor-pointer flex items-center justify-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleFileInput}
                                                className="hidden"
                                            />
                                            📁
                                        </label> */}
                                </>
                            )}
                        </div>
                    </div>
                </div>

        {/* Right - Form - Improved responsive layout - Only show after image is captured */}
        {(capturedImageBlob || capturedImage) && (
          <div className="w-full xl:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-6 xl:pt-8 xl:pl-2">
            <div className="w-full max-w-2xl xl:ml-0">
                        {/* Progress Section - Better spacing */}
                        <div className="mb-8 sm:mb-10 lg:mb-12">
                            {(() => {
                                const { totalSteps } = getStepConfiguration();
                                const progressPercent = (step / totalSteps) * 100;
                  const stepDisplay =
                    totalSteps > 1
                      ? `Step 0${step}/0${totalSteps}`
                      : "Step 01/01";
                                
                                return (
                                    <>
                      <div className="text-white/50 text-xs sm:text-sm">
                        {stepDisplay}
                      </div>
                            <Progress
                                            percent={progressPercent}
                                showInfo={false}
                                strokeColor="#2dd46d"
                                trailColor="#ffffff36"
                                className="mb-4 sm:mb-6 max-w-full sm:max-w-md"
                            />
                                    </>
                                );
                            })()}

                            <div className="mt-4 sm:mt-6 lg:mt-7">
                                <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-medium mb-2 leading-tight">
                                    Please fill in your details to begin the assessment.
                                </h1>
                                <p className="text-white/70 text-sm sm:text-base">
                    This helps us personalize your test experience and ensure
                    accurate evaluation.
                                </p>
                            </div>
                        </div>

                        {/* Form with improved responsive styling */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            className="
                                    [&_.ant-input]:bg-[#1f222a] 
                                    [&_.ant-input]:border-[#21252d] 
                                    [&_.ant-input]:text-white 
                                    [&_.ant-input::placeholder]:text-white/50 
                                    [&_.ant-input:focus]:border-[#5843ee] 
                                    [&_.ant-input:focus]:shadow-[0_0_0_2px_rgba(88,67,238,0.2)] 

                                    [&_.ant-select-selector]:bg-[#1f222a] 
                                    [&_.ant-select-selector]:border-[#21252d] 
                                    [&_.ant-select-selector]:text-white 
                                    [&_.ant-select-selection-placeholder]:text-white/50 
                                    [&_.ant-select-selector:hover]:border-[#5843ee] 

                                    [&_.ant-radio-wrapper]:text-white 
                                    [&_.ant-radio-inner]:bg-transparent 
                                    [&_.ant-radio-inner]:border-white/30 
                                    [&_.ant-radio-checked_.ant-radio-inner]:bg-[#5843ee] 
                                    [&_.ant-radio-checked_.ant-radio-inner]:border-[#5843ee]

                                    [&_.ant-checkbox-wrapper]:text-white 
                                    [&_.ant-checkbox-inner]:bg-transparent 
                                    [&_.ant-checkbox-inner]:border-white/30 
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-[#5843ee] 
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:border-[#5843ee]
                                "
                        >
                            {/* Step 1 Form Fields - Dynamic fields from assessment summary */}
                            <Row gutter={[16, 0]} className={step === 1 ? "" : "!hidden"}>
                                {(() => {
                                    const { step1Fields } = getStepConfiguration();
                                    
                                    if (step1Fields.length === 0) {
                                        // Fallback to default fields if assessment summary is not loaded
                                        return (
                                            <>
                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={labelStyle}>Full Name</span>}
                                                        name="full_name"
                                                        rules={[{ required: true }]}
                                        style={formItemStyle}
                                    >
                                        {generateInputComponent("text", "full_name")}
                                    </Form.Item>

                                    <Form.Item
                              label={
                                <span style={labelStyle}>Phone Number</span>
                              }
                                                        name="mobile_number"
                                                        rules={[{ required: true }]}
                                        style={formItemStyle}
                                    >
                              {generateInputComponent("phone", "mobile_number")}
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                              label={
                                <span style={labelStyle}>Email Address *</span>
                              }
                                        name="email"
                              rules={[{ required: true, type: "email" }]}
                                        style={formItemStyle}
                                    >
                              {generateInputComponent("email", "email")}
                                    </Form.Item>

                                    <Form.Item
                              label={
                                <span style={labelStyle}>Date of Birth</span>
                              }
                                                        name="date_of_birth"
                                        style={formItemStyle}
                                                        >
                                <DatePicker
                                style={{ ...inputStyles, width: "100%" }}
                                                            format="DD/MM/YYYY"
                    disabled={lockedFieldsSet.has("date_of_birth")}
                                                            placeholder="Select date"
                                                        />
                                    </Form.Item>
                                                </Col>
                                            </>
                                        );
                                    }

                                    // Split step1 fields into two columns
                                    const midPoint = Math.ceil(step1Fields.length / 2);
                                    const leftColumnFields = step1Fields.slice(0, midPoint);
                                    const rightColumnFields = step1Fields.slice(midPoint);

                                    return (
                                        <>
                                            <Col xs={24} lg={12}>
                          {leftColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const label = isCustom
                                ? (field as CustomField).label
                                : fieldLabelMap[fieldName];
                                                    const required = field.required;
                                                    
                                                    return (
                                    <Form.Item
                                                            key={fieldName}
                                  label={
                                    <span style={labelStyle}>
                                      {label}
                                      {required ? " *" : ""}
                                    </span>
                                  }
                                                            name={fieldName}
                                  rules={
                                    required
                                      ? [
                                          {
                                            required: true,
                                            message: `${label} is required`,
                                          },
                                        ]
                                      : []
                                  }
                                        style={formItemStyle}
                                    >
                                  {generateInputComponent(
                                    field.type,
                                    fieldName,
                                    field.options
                                  )}
                                    </Form.Item>
                                                    );
                            }
                          )}
                                            </Col>

                                            <Col xs={24} lg={12}>
                          {rightColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const label = isCustom
                                ? (field as CustomField).label
                                : fieldLabelMap[fieldName];
                                                    const required = field.required;
                                                    
                                                    return (
                                    <Form.Item
                                                            key={fieldName}
                                  label={
                                    <span style={labelStyle}>
                                      {label}
                                      {required ? " *" : ""}
                                    </span>
                                  }
                                                            name={fieldName}
                                  rules={
                                    required
                                      ? [
                                          {
                                            required: true,
                                            message: `${label} is required`,
                                          },
                                        ]
                                      : []
                                  }
                                        style={formItemStyle}
                                    >
                                  {generateInputComponent(
                                    field.type,
                                    fieldName,
                                    field.options
                                  )}
                                    </Form.Item>
                                                    );
                            }
                          )}
                                </Col>
                                        </>
                                    );
                                })()}
                            </Row>

                            {/* Step 2 Form Fields - Dynamic remaining fields */}
                            <Row gutter={[16, 0]} className={step === 2 ? "" : "!hidden"}>
                                {(() => {
                                    const { step2Fields, totalSteps } = getStepConfiguration();
                                    
                                    // Only show Step 2 if there are actually fields for it
                                    if (totalSteps === 1 || step2Fields.length === 0) {
                                        return null;
                                    }

                                    // Split step2 fields into two columns
                                    const midPoint = Math.ceil(step2Fields.length / 2);
                                    const leftColumnFields = step2Fields.slice(0, midPoint);
                                    const rightColumnFields = step2Fields.slice(midPoint);

                                    return (
                                        <>
                                            <Col xs={24} lg={12}>
                          {leftColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const label = isCustom
                                ? (field as CustomField).label
                                : fieldLabelMap[fieldName];
                                                    const required = field.required;
                                                    
                                                    return (
                                    <Form.Item
                                                            key={fieldName}
                                  label={
                                    <span style={labelStyle}>
                                      {label}
                                      {required ? " *" : ""}
                                    </span>
                                  }
                                                            name={fieldName}
                                  rules={
                                    required
                                      ? [
                                          {
                                            required: true,
                                            message: `${label} is required`,
                                          },
                                        ]
                                      : []
                                  }
                                        style={formItemStyle}
                                    >
                                  {generateInputComponent(
                                    field.type,
                                    fieldName,
                                    field.options
                                  )}
                                    </Form.Item>
                                                    );
                            }
                          )}
                                </Col>

                                            <Col xs={24} lg={12}>
                          {rightColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const label = isCustom
                                ? (field as CustomField).label
                                : fieldLabelMap[fieldName];
                                                    const required = field.required;
                                                    
                                                    return (
                                    <Form.Item
                                                            key={fieldName}
                                  label={
                                    <span style={labelStyle}>
                                      {label}
                                      {required ? " *" : ""}
                                    </span>
                                  }
                                                            name={fieldName}
                                  rules={
                                    required
                                      ? [
                                          {
                                            required: true,
                                            message: `${label} is required`,
                                          },
                                        ]
                                      : []
                                  }
                                        style={formItemStyle}
                                    >
                                  {generateInputComponent(
                                    field.type,
                                    fieldName,
                                    field.options
                                  )}
                                    </Form.Item>
                                                    );
                            }
                          )}
                                </Col>
                                        </>
                                    );
                                })()}
                            </Row>

                            {/* Action buttons - Dynamic based on total steps */}
                            <div className="flex flex-col sm:flex-row justify-end pt-4 sm:pt-6 gap-3 sm:gap-4 lg:gap-6">
                                {(() => {
                                    const { totalSteps } = getStepConfiguration();
                                    
                                    return (
                                        <>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="order-2 sm:order-1 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] h-10 sm:h-12 bg-[#272727] border-none font-semibold text-white rounded-lg sm:rounded-xl transition-colors hover:bg-[#333333]"
                                    >
                                        Back
                                    </button>
                                )}

                                            {step < totalSteps && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => form.resetFields()}
                                            className="order-2 sm:order-1 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] h-10 sm:h-12 bg-[#272727] border-none font-semibold text-white rounded-lg sm:rounded-xl transition-colors hover:bg-[#333333]"
                                        >
                                            Reset
                                        </button>

                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="order-1 sm:order-2 w-full sm:w-auto sm:min-w-[160px] lg:min-w-[211px] h-10 sm:h-12 bg-[#5843EE] border-none font-semibold text-white rounded-lg sm:rounded-xl transition-colors hover:bg-[#6B52F0]"
                                        >
                                            Next
                                        </button>
                                    </>
                                )}

                                            {step === totalSteps && (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                            disabled={
                              !cameraPermissionGranted ||
                              !capturedImageBlob ||
                              isSubmitting
                            }
                                                    loading={isSubmitting}
                                                    className={`order-1 w-full sm:w-auto sm:!min-w-[200px] lg:!min-w-[250px] !h-10 sm:!h-12 !font-semibold !rounded-lg sm:!rounded-xl ${
                              cameraPermissionGranted &&
                              capturedImageBlob &&
                              !isSubmitting
                                ? "!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]"
                                : "!bg-gray-500 !border-none cursor-not-allowed"
                                                    }`}
                                                >
                                                    {isSubmitting
                              ? "Submitting..."
                                                        : !cameraPermissionGranted 
                              ? "Camera Permission Required"
                                                        : !capturedImageBlob 
                              ? "Image Capture Required"
                              : "Proceed to instruction"}
                                    </Button>
                                )}
                                        </>
                                    );
                                })()}
                            </div>
                        </Form>
                    </div>
                </div>
        )}
            </div>

            {/* Camera Permission Modal */}
            <Modal
                title={
                    <div className="text-center">
                        <div className="text-2xl mb-2">📷</div>
            <div className="text-lg font-semibold">
              Camera Permission Required
            </div>
                    </div>
                }
                open={showPermissionModal}
                onCancel={() => {}} // Prevent closing without permission
                footer={null}
                centered
                width={500}
                className="camera-permission-modal"
                styles={{
          body: { padding: "24px" },
          header: { borderBottom: "1px solid #f0f0f0", padding: "16px 24px" },
                }}
            >
                <div className="space-y-4">
                    <p className="text-gray-700 text-center">
            To proceed with the assessment, we need access to your camera for
            security and monitoring purposes.
                    </p>

          {cameraPermission === "denied" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Camera Access Denied
              </h4>
                            <p className="text-red-700 text-sm mb-3">
                                Please follow these steps to enable camera access:
                            </p>
                            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
                                <li>Look for the camera icon in your browser's address bar</li>
                                <li>Click on the camera icon and select "Allow"</li>
                                <li>If you don't see the icon, check your browser settings</li>
                                <li>Go to Site Settings → Camera → Allow</li>
                            </ol>
                        </div>
                    )}

          {cameraPermission === "unsupported" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Camera Not Supported
              </h4>
                            <p className="text-yellow-700 text-sm">
                Your browser or device doesn't support camera access. Please use
                a different browser or device.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-center space-x-3">
                        <Button
                            onClick={retryCameraPermission}
                            loading={isCheckingPermission}
                            type="primary"
                            className="!bg-[#5843EE] !border-none hover:!bg-[#6B52F0]"
                        >
              {isCheckingPermission ? "Checking..." : "Try Again"}
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            You can also refresh the page and try again
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Fullscreen Warning - Custom overlay with dark theme design */}
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
        </div>
    );
}
