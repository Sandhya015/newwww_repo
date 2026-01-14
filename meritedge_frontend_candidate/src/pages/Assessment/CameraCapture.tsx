/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal, message, Progress, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  setCapturedImageBlob,
  setCapturedImagePreview,
  setCandidateId,
  setAuthToken,
} from "../../store/miscSlice";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const { Title, Paragraph } = Typography;

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

// Note: Model file interceptors are set up in main.tsx before any modules load

export default function CameraCapture() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { candidate_id } = useParams();
    const storedCandidateId = useSelector((state: any) => state.misc.candidate_id);
    const assessmentSummary = useSelector((state: any) => state.misc.assessmentSummary);
    
    // Secure mode hook
    useSecureMode();
    
    // Fullscreen functionality
    const { isSupported: isFullscreenSupported, enterFullscreen, isFullscreen } = useFullscreen();
    const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
    const [fullscreenCountdown, setFullscreenCountdown] = useState(7);
    
    // Upload state tracking
    const [isUploading, setIsUploading] = useState(false);
    
    // Face detection state
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [modelLoadError, setModelLoadError] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    
    // Camera state
    const [isWebCAMOpen, setIsWebCAMOpen] = useState(false);
    const [cameraPermission, setCameraPermission] = useState('unknown');
    const webcamRef = useRef<any>(null);
    
    // Camera permission enforcement
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);
    
    // Face detection for visual feedback
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [facePositionValid, setFacePositionValid] = useState(false);
    const [faceDetectionMessage, setFaceDetectionMessage] = useState('Position your face in the oval');
    const faceDetectionIntervalRef = useRef<number | null>(null);
    
    // Auto-capture state
    const autoCaptureTimerRef = useRef<number | null>(null);
    const autoCaptureCountdownIntervalRef = useRef<number | null>(null);
    const [hasAutoCaptured, setHasAutoCaptured] = useState(false);
    const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);
    const AUTO_CAPTURE_DELAY = 3000; // 3 seconds in perfect position before auto-capture

    const [manualCaptureEnabled, setManualCaptureEnabled] = useState(false);
    const [manualCaptureMessage, setManualCaptureMessage] = useState<string | null>(null);
    const [autoCaptureFailure, setAutoCaptureFailure] = useState(false);

    const CAMERA_MIRRORED = true;
    const guideMessage = facePositionValid && !hasAutoCaptured && autoCaptureCountdown !== null
        ? `Perfect! Auto-capturing in ${autoCaptureCountdown}s...`
        : faceDetectionMessage;

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const preventTouchMove = (event: TouchEvent) => {
            event.preventDefault();
        };

        document.addEventListener('touchmove', preventTouchMove, { passive: false });

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener('touchmove', preventTouchMove);
        };
    }, []);

    // Store candidate_id and auth token from URL in Redux on component load
    useEffect(() => {
        if (candidate_id) {
      const isJwtToken = candidate_id.startsWith("eyJ");
            
            if (isJwtToken) {
                dispatch(setAuthToken(candidate_id));
                dispatch(setCandidateId(candidate_id));
            } else {
                dispatch(setCandidateId(candidate_id));
            }
        }

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
                if (!checkCameraSupport()) {
          setCameraPermission("unsupported");
                    setShowPermissionModal(true);
                    setIsCheckingPermission(false);
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "user" }, 
          audio: false,
                });
                
        setCameraPermission("granted");
                setIsWebCAMOpen(true);
                
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

    // Load face-api.js models with retry logic
    // Note: Interceptors are already set up globally when module loads
    useEffect(() => {
        // Store original functions at component level to restore later
        const originalFetch = window.fetch;
        const originalXHROpen = XMLHttpRequest.prototype.open;
        
        const loadModels = async (retryCount = 0) => {
            const MAX_RETRIES = 3;
            
            try {
                setIsLoadingModels(true);
                setModelLoadError(false);
                
                // Construct proper base path without double slashes or trailing slashes
                // CRITICAL: import.meta.env.BASE_URL might have trailing slash in production
        const baseUrl = import.meta.env.BASE_URL || "/";
                // Remove trailing slash from BASE_URL
        const cleanBase =
          baseUrl === "/"
            ? ""
            : baseUrl.endsWith("/")
            ? baseUrl.slice(0, -1)
            : baseUrl;
                
                // Normalize model base URL - ensure ABSOLUTELY NO trailing slash
                // face-api.js will append paths from manifest, so base must not end with /
                const normalizeModelUrl = (url: string): string => {
                    // Remove ALL trailing slashes
                    let normalized = url;
          while (normalized.endsWith("/") && normalized !== "/") {
                        normalized = normalized.slice(0, -1);
                    }
                    // Ensure it starts with http:// or https:// or /
          if (!normalized.startsWith("http") && !normalized.startsWith("/")) {
            normalized = "/" + normalized;
                    }
                    return normalized;
                };
                
                // Try multiple possible paths for model loading
                // CRITICAL: Ensure ABSOLUTELY NO trailing slashes - face-api.js will add them if base URL has one
                const possiblePaths = [
          cleanBase
            ? `${window.location.origin}${cleanBase}/models`
            : `${window.location.origin}/models`,
                    `${window.location.origin}/models`,
          "/models",
        ]
          .map(normalizeModelUrl)
          .map((url) => {
                    // Triple-check: remove ANY trailing slashes (defensive)
                    let clean = url;
            while (clean.endsWith("/") && clean !== "/") {
                        clean = clean.slice(0, -1);
                    }
                    if (clean !== url) {
              console.log("🔧 Cleaned model URL:", url, "→", clean);
                    }
                    // Final verification
            if (clean.endsWith("/")) {
              console.error(
                "❌ CRITICAL: URL still has trailing slash after cleaning!",
                clean
              );
                        clean = clean.slice(0, -1);
                    }
                    return clean;
                });
                
                let modelLoadSuccess = false;
                let lastError = null;
                
                // Try each path until one works
                for (let i = 0; i < possiblePaths.length; i++) {
                    let MODEL_URL = possiblePaths[i];
                    
                    // FINAL check: absolutely no trailing slash
          if (MODEL_URL.endsWith("/")) {
                        MODEL_URL = MODEL_URL.slice(0, -1);
            console.warn(
              "⚠️ Removed trailing slash from MODEL_URL:",
              MODEL_URL
            );
          }

          console.log(
            `🔄 Attempt ${i + 1}: Loading face detection models from:`,
            MODEL_URL
          );
          console.log(`🔍 URL ends with '/': ${MODEL_URL.endsWith("/")}`);
                    
                    try {
                        // AGGRESSIVE PATCH: Intercept ALL network requests from face-api.js
                        // Use the original functions stored at component level
                        
                        // Component-level fetch interceptor - VERY AGGRESSIVE
            const componentFetchInterceptor = (
              input: RequestInfo | URL,
              init?: RequestInit
            ): Promise<Response> => {
              let url: string = "";
                            const originalInput = input;
                            
              if (typeof input === "string") {
                                url = input;
                            } else if (input instanceof URL) {
                                url = input.toString();
                            } else if (input instanceof Request) {
                                url = input.url;
                            } else {
                                url = (input as any).url || String(input);
                            }
                            
                            // Log ALL requests to /models/ for debugging
              if (url.includes("/models/")) {
                console.log(
                  "🔍 [Component Interceptor] Intercepted request to /models/:",
                  url
                );
                            }
                            
                            // Fix model file URLs - be VERY aggressive
              if (
                url &&
                url.includes("/models/") &&
                (url.includes("-shard") ||
                  url.endsWith(".json") ||
                  url.includes("tiny_face_detector") ||
                  url.includes("face_landmark_68"))
              ) {
                                const originalUrl = url;
                                
                                // Remove trailing slash
                if (url.endsWith("/") && url !== "/") {
                                    url = url.slice(0, -1);
                  console.log(
                    "🔧 [Component Interceptor] REMOVED trailing slash:",
                    originalUrl,
                    "→",
                    url
                  );
                                    
                                    // Reconstruct input with fixed URL
                  if (typeof originalInput === "string") {
                                        input = url;
                                    } else if (originalInput instanceof URL) {
                                        input = new URL(url);
                                    } else if (originalInput instanceof Request) {
                                        input = new Request(url, originalInput);
                                    } else {
                                        // For Request objects, create new one
                                        input = new Request(url, init || {});
                                    }
                                } else {
                  console.log(
                    "✅ [Component Interceptor] URL already correct (no trailing slash):",
                    url
                  );
                                }
                            }
                            
                            return originalFetch.call(this, input, init);
                        };
                        
                        // Component-level XHR interceptor
            XMLHttpRequest.prototype.open = function (
              method: string,
              url: string | URL,
              ...args: any[]
            ) {
              const urlString = typeof url === "string" ? url : url.toString();
              if (
                urlString.includes("/models/") &&
                (urlString.includes("-shard") || urlString.endsWith(".json"))
              ) {
                if (urlString.endsWith("/") && urlString !== "/") {
                                    url = urlString.slice(0, -1);
                  console.log("🔧 [Component Interceptor] Fixed XHR:", url);
                                }
                            }
                            return originalXHROpen.call(this, method, url, ...args);
                        };
                        
                        // Set up interceptors BEFORE calling loadFromUri
                        window.fetch = componentFetchInterceptor as typeof fetch;
                        
                        // Verify interceptors are active
            console.log("🧪 [Test] Verifying interceptors are active...");
            console.log(
              "🧪 [Test] window.fetch === componentFetchInterceptor:",
              window.fetch === componentFetchInterceptor
            );
                        
                        // Test the interceptor with a fake request to verify it's working
            console.log(
              "🧪 [Test] Testing interceptor with console.log only..."
            );

            console.log("📦 Loading TinyFaceDetector from:", MODEL_URL);
            console.log("🔍 [Debug] MODEL_URL type:", typeof MODEL_URL);
            console.log("🔍 [Debug] MODEL_URL value:", MODEL_URL);
            console.log(
              "🔍 [Debug] MODEL_URL ends with /:",
              MODEL_URL.endsWith("/")
            );
            console.log("🔍 [Debug] MODEL_URL length:", MODEL_URL.length);
            console.log(
              "🔍 [Debug] MODEL_URL last char:",
              MODEL_URL[MODEL_URL.length - 1]
            );
                        
                        // CRITICAL: Ensure MODEL_URL has NO trailing slash before passing to face-api.js
                        // Also ensure it doesn't start with a slash if it's a full URL
                        // CRITICAL: Ensure finalModelUrl has ABSOLUTELY NO trailing slash
                        let finalModelUrl = MODEL_URL;
                        // Remove ALL trailing slashes (defensive)
            while (finalModelUrl.endsWith("/") && finalModelUrl !== "/") {
                            finalModelUrl = finalModelUrl.slice(0, -1);
                        }
                        // Final verification
            if (finalModelUrl.endsWith("/")) {
              console.error(
                "❌ CRITICAL: finalModelUrl still has trailing slash!",
                finalModelUrl
              );
                            finalModelUrl = finalModelUrl.slice(0, -1);
                        }
            console.log("🔍 [FINAL URL CHECK] finalModelUrl:", finalModelUrl);
            console.log(
              "🔍 [FINAL URL CHECK] ends with /:",
              finalModelUrl.endsWith("/")
            );
            console.log(
              "🔍 [FINAL URL CHECK] last char:",
              finalModelUrl[finalModelUrl.length - 1]
            );
                        
                        // If it's a full URL, ensure the path part has no trailing slash
                        try {
                            const urlObj = new URL(finalModelUrl);
              if (urlObj.pathname.endsWith("/") && urlObj.pathname !== "/") {
                                urlObj.pathname = urlObj.pathname.slice(0, -1);
                                finalModelUrl = urlObj.toString();
                console.log(
                  "🔧 [URL Path Fix] Removed trailing slash from pathname:",
                  MODEL_URL,
                  "→",
                  finalModelUrl
                );
                            }
                        } catch {
                            // Not a full URL, treat as relative path
              if (
                finalModelUrl.startsWith("/") &&
                finalModelUrl.length > 1 &&
                finalModelUrl.endsWith("/")
              ) {
                                finalModelUrl = finalModelUrl.slice(0, -1);
                console.log(
                  "🔧 [Relative Path Fix] Removed trailing slash:",
                  MODEL_URL,
                  "→",
                  finalModelUrl
                );
              }
            }

            console.log("🔍 [Debug] finalModelUrl:", finalModelUrl);
            console.log(
              "🔍 [Debug] finalModelUrl ends with /:",
              finalModelUrl.endsWith("/")
            );
            console.log("🔍 [Debug] finalModelUrl type:", typeof finalModelUrl);
            console.log(
              "🔍 [Debug] finalModelUrl length:",
              finalModelUrl.length
            );
                        if (finalModelUrl.length > 0) {
              console.log(
                "🔍 [Debug] finalModelUrl last char:",
                finalModelUrl[finalModelUrl.length - 1]
              );
                        }
                        
                        // CRITICAL PATCH: Intercept URL constructor to fix trailing slashes
                        const originalURL = window.URL;
                        window.URL = class extends originalURL {
                            constructor(url: string | URL, base?: string | URL) {
                let fixedUrl = typeof url === "string" ? url : url.toString();
                                
                                // Fix model file URLs with trailing slashes
                if (
                  fixedUrl.includes("/models/") &&
                  (fixedUrl.includes("-shard") ||
                    fixedUrl.endsWith(".json") ||
                    fixedUrl.includes("tiny_face_detector") ||
                    fixedUrl.includes("face_landmark_68"))
                ) {
                  if (fixedUrl.endsWith("/") && fixedUrl !== "/") {
                                        const original = fixedUrl;
                                        fixedUrl = fixedUrl.slice(0, -1);
                    console.log(
                      "🔧 [URL Constructor Patch] Fixed URL:",
                      original,
                      "→",
                      fixedUrl
                    );
                                    }
                                }
                                
                                super(fixedUrl, base);
                            }
                        } as typeof URL;
                        
                        // Also patch URL.prototype.toString to catch any URL stringification
                        const originalToString = URL.prototype.toString;
            URL.prototype.toString = function () {
                            const url = originalToString.call(this);
              if (
                url.includes("/models/") &&
                (url.includes("-shard") ||
                  url.endsWith(".json") ||
                  url.includes("tiny_face_detector") ||
                  url.includes("face_landmark_68"))
              ) {
                if (url.endsWith("/") && url !== "/") {
                                    const fixed = url.slice(0, -1);
                  console.log(
                    "🔧 [URL toString Patch] Fixed URL:",
                    url,
                    "→",
                    fixed
                  );
                                    return fixed;
                                }
                            }
                            return url;
                        };
                        
            console.log("✅ [Patch] URL constructor and toString patched");
                        
                        // CRITICAL: Patch face-api.js's internal fetch/loadWeights to intercept ALL model file requests
                        // face-api.js uses its own fetch wrapper, so we need to intercept at the lowest level
                        
                        // Patch String.prototype methods that might be used for URL construction
                        const originalConcat = String.prototype.concat;
            String.prototype.concat = function (...args: any[]) {
                            let result = originalConcat.apply(this, args);
                            // Check if this looks like a model file URL being constructed
              if (
                result.includes("/models/") &&
                (result.includes("-shard") || result.endsWith(".json"))
              ) {
                if (result.endsWith("/") && result !== "/") {
                                    const fixed = result.slice(0, -1);
                  console.log(
                    "🔧 [String.concat Patch] Fixed URL:",
                    result,
                    "→",
                    fixed
                  );
                                    result = fixed;
                                }
                            }
                            return result;
                        };
                        
                        // Patch Array.prototype.join which might be used for URL construction
                        const originalJoin = Array.prototype.join;
            Array.prototype.join = function (separator?: string) {
                            const result = originalJoin.call(this, separator);
              if (
                result.includes("/models/") &&
                (result.includes("-shard") || result.endsWith(".json"))
              ) {
                if (result.endsWith("/") && result !== "/") {
                                    const fixed = result.slice(0, -1);
                  console.log(
                    "🔧 [Array.join Patch] Fixed URL:",
                    result,
                    "→",
                    fixed
                  );
                                    return fixed;
                                }
                            }
                            return result;
                        };
                        
            console.log("✅ [Patch] String.concat and Array.join patched");
                        
                        // CRITICAL: Patch face-api.js's loadFromUri to prevent trailing slashes
            const originalTinyFaceDetectorLoadFromUri =
              faceapi.nets.tinyFaceDetector.loadFromUri.bind(
                faceapi.nets.tinyFaceDetector
              );
            const originalFaceLandmarkLoadFromUri =
              faceapi.nets.faceLandmark68Net.loadFromUri.bind(
                faceapi.nets.faceLandmark68Net
              );
                        
                        // Create wrapper that ensures base URL has no trailing slash
                        // IMPORTANT: Must preserve the original method's context (this binding)
            const createPatchedLoadFromUri = (
              originalMethod: any,
              netName: string
            ) => {
              return async function (this: any, uri: string | string[]) {
                                // Ensure URI has no trailing slash
                                let fixedUri: string | string[];
                if (typeof uri === "string") {
                  fixedUri =
                    uri.endsWith("/") && uri !== "/" ? uri.slice(0, -1) : uri;
                                    if (fixedUri !== uri) {
                    console.log(
                      `🔧 [loadFromUri Patch ${netName}] Fixed base URI:`,
                      uri,
                      "→",
                      fixedUri
                    );
                                    }
                                } else {
                  fixedUri = uri.map((u) =>
                    u.endsWith("/") && u !== "/" ? u.slice(0, -1) : u
                  );
                                    const changed = fixedUri.some((u, i) => u !== uri[i]);
                                    if (changed) {
                    console.log(
                      `🔧 [loadFromUri Patch ${netName}] Fixed URIs:`,
                      uri,
                      "→",
                      fixedUri
                    );
                                    }
                                }
                                
                                // Call original method with proper context
                                return originalMethod(fixedUri);
                            };
                        };
                        
            faceapi.nets.tinyFaceDetector.loadFromUri =
              createPatchedLoadFromUri(
                originalTinyFaceDetectorLoadFromUri,
                "TinyFaceDetector"
              );
            faceapi.nets.faceLandmark68Net.loadFromUri =
              createPatchedLoadFromUri(
                originalFaceLandmarkLoadFromUri,
                "FaceLandmark68Net"
              );

            console.log("✅ [Patch] face-api.js loadFromUri methods patched");
                        
                        // FINAL VERIFICATION: Log the exact URL we're passing
            console.log(
              "🔍 [FINAL] About to call loadFromUri with URL:",
              finalModelUrl
            );
            console.log("🔍 [FINAL] URL type:", typeof finalModelUrl);
            console.log("🔍 [FINAL] URL length:", finalModelUrl.length);
            console.log(
              "🔍 [FINAL] URL ends with /:",
              finalModelUrl.endsWith("/")
            );
            console.log(
              "🔍 [FINAL] URL last 10 chars:",
              finalModelUrl.slice(-10)
            );
                        
                        // CRITICAL: Intercept the manifest fetch to fix paths before face-api.js uses them
                        // face-api.js fetches the manifest JSON first, then constructs URLs from it
                        // We need to intercept that fetch and fix any trailing slashes in the paths
                        const originalFetchForManifest = window.fetch;
                        
                        // Use Object.defineProperty to override fetch (in case it's read-only)
                        try {
              Object.defineProperty(window, "fetch", {
                value: function (
                  input: RequestInfo | URL,
                  init?: RequestInit
                ): Promise<Response> {
                  const url =
                    typeof input === "string"
                      ? input
                      : input instanceof URL
                      ? input.toString()
                      : (input as Request).url;
                            
                            // Intercept manifest JSON requests
                  if (url.includes("weights_manifest.json")) {
                    console.log(
                      "🔍 [Manifest Interceptor] Intercepted manifest request:",
                      url
                    );

                    return originalFetchForManifest(input, init).then(
                      async (response) => {
                                    if (response.ok) {
                                        const clonedResponse = response.clone();
                                        const text = await clonedResponse.text();
                          console.log(
                            "🔍 [Manifest Interceptor] Manifest content:",
                            text.substring(0, 200)
                          );
                                        
                                        // Parse and fix any paths with trailing slashes
                                        try {
                                            const manifest = JSON.parse(text);
                                            let modified = false;
                                            
                                            if (Array.isArray(manifest)) {
                                                manifest.forEach((item: any) => {
                                                    if (item.paths && Array.isArray(item.paths)) {
                                  item.paths = item.paths.map(
                                    (path: string) => {
                                      if (path.endsWith("/") && path !== "/") {
                                                                const fixed = path.slice(0, -1);
                                        console.log(
                                          "🔧 [Manifest Interceptor] Fixed path:",
                                          path,
                                          "→",
                                          fixed
                                        );
                                                                modified = true;
                                                                return fixed;
                                                            }
                                                            return path;
                                    }
                                  );
                                                    }
                                                });
                                            }
                                            
                                            if (modified) {
                              console.log(
                                "✅ [Manifest Interceptor] Manifest paths fixed, returning modified manifest"
                              );
                                                return new Response(JSON.stringify(manifest), {
                                                    status: response.status,
                                                    statusText: response.statusText,
                                headers: response.headers,
                                                });
                                            }
                                        } catch (e) {
                            console.warn(
                              "⚠️ [Manifest Interceptor] Could not parse manifest:",
                              e
                            );
                                        }
                                    }
                                    return response;
                      }
                    );
                            }
                            
                            // For all other requests, check for model files and fix trailing slashes
                  if (
                    url.includes("/models/") &&
                    (url.includes("-shard") || url.endsWith(".json"))
                  ) {
                    if (url.endsWith("/") && url !== "/") {
                                    const fixedUrl = url.slice(0, -1);
                      console.log(
                        "🔧 [Manifest Interceptor] Fixed model file URL:",
                        url,
                        "→",
                        fixedUrl
                      );
                      const fixedInput =
                        typeof input === "string"
                          ? fixedUrl
                          : input instanceof URL
                          ? new URL(fixedUrl)
                          : new Request(fixedUrl, input);
                                    return originalFetchForManifest(fixedInput, init);
                                }
                            }
                            
                            return originalFetchForManifest(input, init);
                                },
                                writable: true,
                configurable: true,
                            });
              console.log(
                "✅ [Manifest Interceptor] Manifest and model file fetch interceptor set up"
              );
                        } catch (e) {
              console.warn(
                "⚠️ [Manifest Interceptor] Could not override window.fetch, using existing interceptor:",
                e
              );
                            // If we can't override fetch, the inline script's interceptor should handle it
                        }
                        
                        await faceapi.nets.tinyFaceDetector.loadFromUri(finalModelUrl);
            console.log("✅ TinyFaceDetector loaded");
                        
            console.log("📦 Loading FaceLandmark68Net...");
                        // Use the same cleaned URL
                        await faceapi.nets.faceLandmark68Net.loadFromUri(finalModelUrl);
            console.log("✅ FaceLandmark68Net loaded");
                        
                        modelLoadSuccess = true;
                        
                        // Keep interceptors active - don't restore yet
                        // They'll be restored when component unmounts or on next retry
            console.log(
              "✅ [Component Interceptor] Models loaded, keeping interceptors active"
            );
            console.log(
              "✅✅✅ All face detection models loaded successfully from:",
              MODEL_URL
            );
                        break;
                    } catch (pathError: any) {
                        console.warn(`⚠️ Failed to load from ${MODEL_URL}:`, pathError);
                        
                        // Check if error is related to 404 or tensor shape (corrupted data)
                        const errorMessage = pathError?.message || String(pathError);
            if (
              errorMessage.includes("404") ||
              errorMessage.includes("tensor") ||
              errorMessage.includes("shape")
            ) {
              console.warn(
                "⚠️ Possible 404 or corrupted file response detected"
              );
                            
                            // If it's a 404 or tensor error, it might be because of trailing slash
                            // Try to manually fix the manifest paths and reload
              if (
                errorMessage.includes("404") ||
                errorMessage.includes("tensor")
              ) {
                console.log(
                  "🔄 [Retry] Attempting to fix manifest paths and retry..."
                );
                                lastError = pathError;
                                continue; // Try next path
                            }
                        }
                        
                        lastError = pathError;
                        continue;
                    }
                }
                
                if (modelLoadSuccess) {
                    setModelsLoaded(true);
                    setModelLoadError(false);
                    setIsLoadingModels(false);
                } else {
          throw lastError || new Error("All model loading paths failed");
                }
            } catch (error) {
        console.error(
          "❌ Error loading face detection models (attempt " +
            (retryCount + 1) +
            "):",
          error
        );
                
                if (retryCount < MAX_RETRIES) {
          console.log(
            `🔄 Retrying model load... (${retryCount + 1}/${MAX_RETRIES})`
          );
                    setTimeout(() => loadModels(retryCount + 1), 2000);
                } else {
          console.error(
            "❌ Failed to load models after " + MAX_RETRIES + " attempts"
          );
          console.error(
            "⚠️ Face detection unavailable. Manual capture available."
          );
                    setModelsLoaded(false);
                    setModelLoadError(true);
                    setIsLoadingModels(false);
                }
            }
        };
        
        loadModels();
        
        // Cleanup: restore original functions when component unmounts
        return () => {
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXHROpen;
      console.log(
        "🧹 [Component Interceptor] Restored original fetch/XHR on unmount"
      );
        };
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

        const getUserMediaFallback = getLegacyGetUserMedia();

        if (getUserMediaFallback) {
            return (constraints: any) => {
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
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
        frameRate: { ideal: 15, max: 30 },
            },
      audio: false,
        };
    };

    // Function to request camera access
    const requestCameraAccess = async () => {
        try {
            if (!checkCameraSupport()) {
        setCameraPermission("unsupported");
                setShowPermissionModal(true);
                return;
            }

            const getUserMediaFunc = getUserMedia();
            if (!getUserMediaFunc) {
        throw new Error("getUserMedia not supported");
            }

            const constraints = getMobileConstraints();
            let stream;

            try {
                stream = await getUserMediaFunc(constraints);
            } catch (mobileError) {
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

      setCameraPermission("granted");
            setIsWebCAMOpen(true);
            setShowPermissionModal(false);

            stream.getTracks().forEach((track: any) => track.stop());

      console.log("Camera permission granted.");
        } catch (error: any) {
      console.error("Camera access error:", error);
      setCameraPermission("denied");
            setIsWebCAMOpen(false);
            setShowPermissionModal(true);
        }
    };

    // Retry camera permission
    const retryCameraPermission = async () => {
        setIsCheckingPermission(true);
        await requestCameraAccess();
        setIsCheckingPermission(false);
    };

    // Capture Image and Upload to S3 using presigned URL
    const captureImage = async (bypassValidation = false) => {
        console.log('🔍 Capture triggered');
        console.log('Face detected:', isFaceDetected, 'Position valid:', facePositionValid, 'Bypass:', bypassValidation);
        
        // Allow manual capture even if face is not detected (for deployment issues or user preference)
        // Auto-capture still uses validation
        if (!bypassValidation && !isFaceDetected) {
            // console.warn('⚠️ No face detected - showing warning but allowing capture');
            message.info('Tip: Position your face in the oval for better results', 2);
        }
        
        console.log('✅ Proceeding with capture');
        
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                console.warn('⚠️ Webcam returned empty screenshot');
                setAutoCaptureFailure(true);
                message.error('Camera feed is unavailable. Please ensure your camera is on and try manual capture.', 4);
                return;
            }
            
            try {
                const response = await fetch(imageSrc);
                const blob = await response.blob();
                
                dispatch(setCapturedImageBlob(blob));
                dispatch(setCapturedImagePreview(imageSrc));
                console.log('📸 Image captured and stored as blob:', blob);
                
                // Upload to S3 using presigned URL
                console.log('📤 Starting S3 upload using presigned URL...');
                
                const presignedPost = assessmentSummary?.presigned_urls?.candidate_image?.presigned_post;
                
                if (!presignedPost) {
                    console.error('❌ Presigned URL not found in assessmentSummary');
                    // Still navigate even if upload fails
                    navigate(`/${storedCandidateId || candidate_id}/assessment-details`);
                    return;
                }
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `candidate_image_${timestamp}.jpeg`;
                
                const formData = new FormData();
                
                Object.entries(presignedPost.fields).forEach(([key, value]) => {
                    if (key === 'key') {
                        const keyValue = (value as string).replace('${filename}', filename);
                        formData.append(key, keyValue);
                    } else {
                        formData.append(key, value as string);
                    }
                });
                
                formData.append('file', blob, filename);
                
                console.log('📂 Uploading to:', presignedPost.url);
                
                setIsUploading(true);
                
                const uploadResponse = await fetch(presignedPost.url, {
                    method: 'POST',
                    body: formData,
                });
                
                if (uploadResponse.ok || uploadResponse.status === 204) {
                    console.log('✅ Image uploaded to S3 successfully');
                } else {
                    const errorText = await uploadResponse.text();
                    console.error('❌ S3 upload failed:', uploadResponse.status, errorText);
                }
                
                setIsUploading(false);
                
                setAutoCaptureFailure(false);
                
                // Navigate to assessment details after capture
                navigate(`/${storedCandidateId || candidate_id}/assessment-details`);
                
            } catch (error) {
                console.error('❌ Error capturing/uploading image:', error);
                setIsUploading(false);
                setAutoCaptureFailure(true);
                message.error('Auto capture failed. Please use manual capture to continue.', 4);
            }
        } else {
            setAutoCaptureFailure(true);
            message.error('Camera not initialized. Please allow camera access and try again.', 4);
        }
    };

    // Real face detection
    const detectFacePosition = async () => {
        if (!webcamRef.current) {
            return {
                detected: false,
                centered: false,
        size: "unknown",
        message: "Initializing camera...",
            };
        }

        if (!modelsLoaded) {
            if (isLoadingModels) {
                return {
                    detected: false,
                    centered: false,
          size: "loading",
          message: "Loading face detection...",
                };
            } else if (modelLoadError) {
                return {
                    detected: false,
                    centered: false,
          size: "error",
          message: "Face detection unavailable - use manual capture",
                };
            } else {
                return {
                    detected: false,
                    centered: false,
          size: "unknown",
          message: "Face detection disabled",
                };
            }
        }

        try {
            const video = webcamRef.current.video;
            if (!video || video.readyState !== 4) {
                return {
                    detected: false,
                    centered: false,
          size: "unknown",
          message: "Camera loading...",
                };
            }

      const detections = await faceapi
        .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
            scoreThreshold: 0.5,
                })
        )
        .withFaceLandmarks();

            if (!detections || detections.length === 0) {
                return {
                    detected: false,
                    centered: false,
          size: "none",
          message: "No face detected",
                };
            }

            if (detections.length > 1) {
                return {
                    detected: true,
                    centered: false,
          size: "multiple",
          message: "Multiple faces detected",
                };
            }

            const detection = detections[0];
            const { box } = detection.detection;
            
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const centerX = videoWidth / 2;
            const centerY = videoHeight / 2;
            
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            
            const distanceX = Math.abs(faceCenterX - centerX) / videoWidth;
            const distanceY = Math.abs(faceCenterY - centerY) / videoHeight;
            
            const centerThreshold = 0.15;
            const minSizeThreshold = 0.25;
            const maxSizeThreshold = 0.7;
            
            const faceSize = box.width / videoWidth;
            
            const isCentered = distanceX < centerThreshold && distanceY < centerThreshold;
            
            let sizeStatus = 'good';
            let sizeMessage = '';
            
            if (faceSize < minSizeThreshold) {
                sizeStatus = 'too_small';
                sizeMessage = 'Move closer';
            } else if (faceSize > maxSizeThreshold) {
                sizeStatus = 'too_large';
                sizeMessage = 'Move back';
            }
            
            let positionMessage = '';
            if (!isCentered) {
                if (distanceX > centerThreshold) {
                    const moveLeftLabel = CAMERA_MIRRORED ? 'Move right' : 'Move left';
                    const moveRightLabel = CAMERA_MIRRORED ? 'Move left' : 'Move right';
                    positionMessage = faceCenterX < centerX ? moveRightLabel : moveLeftLabel;
                }
                if (distanceY > centerThreshold) {
                    const verticalMsg = faceCenterY < centerY ? 'Move down' : 'Move up';
                    positionMessage = positionMessage ? `${positionMessage}, ${verticalMsg}` : verticalMsg;
                }
            }
            
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

    // Start face detection monitoring
    const startFaceDetection = useCallback(() => {
    console.log("🎯 Starting face detection monitoring...");
    console.log(
      "📊 Models loaded:",
      modelsLoaded,
      "Loading:",
      isLoadingModels,
      "Error:",
      modelLoadError
    );
        
        if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
        }
        
        faceDetectionIntervalRef.current = setInterval(async () => {
            const detection = await detectFacePosition();
            
            setIsFaceDetected(detection.detected);
      setFaceDetectionMessage(
        detection.message || "Position your face in the oval"
      );
            
            // Update face position validity for visual feedback (green oval)
      const isPerfectPosition =
        modelsLoaded && detection.detected && detection.centered;
            
            if (isPerfectPosition) {
                setFacePositionValid(true);
                
                // Start auto-capture timer if not already started and hasn't captured yet
                if (!hasAutoCaptured && !autoCaptureTimerRef.current && !isUploading) {
          console.log("⏱️ Starting auto-capture timer...");
                    const initialCountdown = Math.ceil(AUTO_CAPTURE_DELAY / 1000);
                    setAutoCaptureCountdown(initialCountdown);
                    
                    // Clear any existing countdown interval
                    if (autoCaptureCountdownIntervalRef.current) {
                        clearInterval(autoCaptureCountdownIntervalRef.current);
                    }
                    
                    // Update countdown every second
                    autoCaptureCountdownIntervalRef.current = window.setInterval(() => {
                        setAutoCaptureCountdown((prev) => {
                            if (prev === null || prev <= 1) {
                                if (autoCaptureCountdownIntervalRef.current) {
                                    clearInterval(autoCaptureCountdownIntervalRef.current);
                                    autoCaptureCountdownIntervalRef.current = null;
                                }
                                return null;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    
                    autoCaptureTimerRef.current = window.setTimeout(() => {
            console.log("📸 Auto-capturing after perfect position maintained");
                        setHasAutoCaptured(true);
                        setAutoCaptureCountdown(null);
                        if (autoCaptureCountdownIntervalRef.current) {
                            clearInterval(autoCaptureCountdownIntervalRef.current);
                            autoCaptureCountdownIntervalRef.current = null;
                        }
                        captureImage(false);
                        autoCaptureTimerRef.current = null;
                    }, AUTO_CAPTURE_DELAY);
                }
            } else {
                setFacePositionValid(false);
                setAutoCaptureCountdown(null);
                
                // Clear auto-capture timer if face moves out of position
                if (autoCaptureTimerRef.current) {
          console.log(
            "🔄 Face moved out of position, clearing auto-capture timer"
          );
                    clearTimeout(autoCaptureTimerRef.current);
                    autoCaptureTimerRef.current = null;
                }
                
                // Clear countdown interval if face moves out of position
                if (autoCaptureCountdownIntervalRef.current) {
                    clearInterval(autoCaptureCountdownIntervalRef.current);
                    autoCaptureCountdownIntervalRef.current = null;
                }
            }
        }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWebCAMOpen, modelsLoaded, isLoadingModels, modelLoadError]);

    // Start face detection when camera opens
    useEffect(() => {
        if (isWebCAMOpen && cameraPermission === 'granted') {
            setTimeout(() => {
                startFaceDetection();
            }, 1000);
        } else {
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
        }
        
        return () => {
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
            if (autoCaptureTimerRef.current) {
                clearTimeout(autoCaptureTimerRef.current);
                autoCaptureTimerRef.current = null;
            }
            if (autoCaptureCountdownIntervalRef.current) {
                clearInterval(autoCaptureCountdownIntervalRef.current);
                autoCaptureCountdownIntervalRef.current = null;
            }
        };
    }, [isWebCAMOpen, cameraPermission, startFaceDetection]);
    
    // Reset auto-capture state when component unmounts or camera closes
    useEffect(() => {
        if (!isWebCAMOpen) {
            setHasAutoCaptured(false);
            setAutoCaptureCountdown(null);
            if (autoCaptureTimerRef.current) {
                clearTimeout(autoCaptureTimerRef.current);
                autoCaptureTimerRef.current = null;
            }
            if (autoCaptureCountdownIntervalRef.current) {
                clearInterval(autoCaptureCountdownIntervalRef.current);
                autoCaptureCountdownIntervalRef.current = null;
            }
            setManualCaptureEnabled(false);
            setManualCaptureMessage(null);
            setAutoCaptureFailure(false);
        }
    }, [isWebCAMOpen]);

    // Enable manual capture only when auto capture is unavailable
    useEffect(() => {
        if (!isWebCAMOpen || cameraPermission !== 'granted') {
            setManualCaptureEnabled(false);
            setManualCaptureMessage(null);
            setAutoCaptureFailure(false);
            return;
        }

        if (modelLoadError) {
            setManualCaptureEnabled(true);
            setManualCaptureMessage('Auto capture is unavailable. Please use manual capture to continue.');
            return;
        }

        if (autoCaptureFailure) {
            setManualCaptureEnabled(true);
            setManualCaptureMessage('Auto capture failed. Please capture manually to proceed.');
            return;
        }

        if (hasAutoCaptured) {
            setManualCaptureEnabled(false);
            setManualCaptureMessage(null);
            return;
        }

        setManualCaptureEnabled(false);
        setManualCaptureMessage(null);
    }, [
        autoCaptureFailure,
        cameraPermission,
        hasAutoCaptured,
        isWebCAMOpen,
        modelLoadError,
    ]);

    // Monitor fullscreen changes and show warning when user exits fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            // If user exited fullscreen, show warning modal and start countdown
            if (!isCurrentlyFullscreen && isFullscreenSupported) {
                setShowFullscreenWarningModal(true);
                setFullscreenCountdown(7);
            } else if (isCurrentlyFullscreen) {
                // If fullscreen is re-entered, close modal and reset countdown
                setShowFullscreenWarningModal(false);
                setFullscreenCountdown(7);
            }
        };

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

    // Handle ESC key to prevent exiting fullscreen
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                event.preventDefault();
                setShowFullscreenWarningModal(true);
                setFullscreenCountdown(7);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

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
                            setShowFullscreenWarningModal(false);
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

    // Handle re-entering fullscreen from warning modal
    const handleReenterFullscreen = async () => {
        try {
            await enterFullscreen();
            setShowFullscreenWarningModal(false);
            setFullscreenCountdown(7);
        } catch (error) {
            console.error("Error re-entering fullscreen:", error);
        }
    };

    return (
        <div className="relative flex h-screen w-full items-center justify-center bg-black text-white overflow-hidden m-0 p-0">
            {/* Logo - positioned at ultimate corner */}
            <div className="absolute top-0 left-0 z-30 p-4 sm:p-6 lg:p-8">
                <img
                    alt="Logo"
                    src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
                    className="h-8 sm:h-10 lg:h-auto max-w-[120px] sm:max-w-none"
                />
            </div>

            {/* Background Video */}
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
                <source src={`${import.meta.env.BASE_URL}common/getty-images.mp4`} type="video/mp4" />
            </video>

            {/* Background Glows */}
            <div className="absolute inset-0 overflow-hidden z-10">
                <div className="absolute w-60 h-60 sm:w-80 sm:h-80 -top-20 -left-20 sm:-top-32 sm:-left-32 bg-[#4f43b7] rounded-full blur-[120px] sm:blur-[172px] opacity-60" />
                <div className="absolute w-60 h-60 sm:w-80 sm:h-80 -bottom-10 -right-10 sm:-bottom-20 sm:-right-20 bg-[#4f43b7] rounded-full blur-[120px] sm:blur-[172px] opacity-60" />
            </div>

            {/* Centered Camera Container - Extended for fullscreen */}
            <div className="relative z-20 flex w-full h-full items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="relative w-full max-w-[500px] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] h-full max-h-[95vh] overflow-hidden rounded-[28px] border border-white/25 bg-[#090914]/92 px-6 sm:px-8 lg:px-10 py-6 md:py-8 lg:py-10 shadow-[0_38px_120px_rgba(4,4,10,0.85)] backdrop-blur-[32px] flex flex-col">
                    
                    {/* Title */}
                    <div className="mb-4 text-center flex-shrink-0">
                        <h2 className="text-white text-xl sm:text-2xl lg:text-3xl font-semibold mb-2">
                            Capture Your Photo
                        </h2>
                        <p className="mb-2 text-xs text-white/70 sm:text-sm">
                            Position your face within the oval to capture your photo
                        </p>
                        
                        {/* Instructions - Single Line */}
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-white">
                            <span>Look directly at the camera</span>
                            <span className="text-white/30">•</span>
                            <span>Keep your face centered</span>
                            <span className="text-white/30">•</span>
                            <span>Ensure good lighting</span>
                        </div>
                    </div>

                    {/* Camera View */}
                    <div className="flex-1 flex flex-col min-h-0 mb-3">
                        {isWebCAMOpen && cameraPermission === 'granted' ? (
                            <>
                                <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-black/65 shadow-[0_34px_96px_rgba(0,0,0,0.7)] flex-1 flex items-center justify-center min-h-0 w-full">
                                    <Webcam
                                        audio
                                        mirrored={false}
                                        disablePictureInPicture={true}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.95}
                                        className="h-full w-full object-cover"
                                        style={{ transform: CAMERA_MIRRORED ? 'scaleX(-1)' : 'none' }}
                                        videoConstraints={getMobileConstraints().video}
                                    />
                                    
                                    {/* Face Positioning Guide Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Main face oval guide */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <div className="relative">
                                                {/* Outer oval - green when face positioned, white otherwise */}
                                                <div className={`h-80 w-60 border-2 rounded-full transition-all duration-300 sm:h-[20rem] sm:w-64 md:h-[22rem] md:w-72 lg:h-[24rem] lg:w-80 ${
                                                    facePositionValid 
                                                        ? 'border-green-400 opacity-90' 
                                                        : 'border-white/70 opacity-80'
                                                }`}></div>
                                                
                                                {/* Inner face guide */}
                                                <div className="absolute inset-2 border border-white/50 rounded-full opacity-60"></div>
                                            </div>
                                        </div>
                                        
                                        {facePositionValid && !hasAutoCaptured && autoCaptureCountdown !== null && (
                                            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/70 border border-white/20 px-6 py-2 rounded-full shadow-lg">
                                                <span className="text-2xl sm:text-3xl font-semibold text-white tracking-wide">
                                                    {autoCaptureCountdown}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-center flex-shrink-0">
                                    <div className="max-w-[90%] rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-center shadow-lg backdrop-blur-sm">
                                        <span className="block text-xs font-medium leading-snug text-white">
                                            {guideMessage}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center min-h-0">
                                <img
                                    className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                                    alt="Scanner"
                                    src={`${import.meta.env.BASE_URL}assessment/scaner-image.jpg`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Capture Button */}
                    <div className="mt-2 flex flex-col items-center gap-2 flex-shrink-0">
                        <Button
                            size="large"
                            onClick={() => captureImage(true)}
                            disabled={!manualCaptureEnabled || isUploading}
                            className="!h-11 sm:!h-12 !px-8 sm:!px-10 !bg-[#5843EE] !border-none !text-white !text-sm sm:!text-base !font-semibold !rounded-xl hover:!bg-[#6B52F0] disabled:!bg-gray-500 disabled:!cursor-not-allowed disabled:!opacity-50 w-full sm:w-auto"
                        >
                            {isUploading ? 'Uploading...' : manualCaptureEnabled ? 'Capture Photo' : 'Capture'}
                        </Button>
                        {manualCaptureMessage && !isUploading && (
                            <p className="text-center text-xs text-white/70">
                                {manualCaptureMessage}
                            </p>
                        )}
                    </div>
                </div>
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
                onCancel={() => {}}
                footer={null}
                centered
                width={500}
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

            {/* Fullscreen Warning Modal - Shows when user exits fullscreen */}
            <Modal
                open={showFullscreenWarningModal}
                onCancel={() => {}}
                footer={null}
                closable={false}
                maskClosable={false}
                centered
                className="fullscreen-warning-modal"
                styles={{
                    content: {
                        backgroundColor: "#0a0a0a",
                        border: "2px solid #ef4444",
                        borderRadius: "12px",
                    },
                }}
            >
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                        <svg 
                            className="w-8 h-8 text-red-500" 
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
                    <Title level={3} className="!text-white !text-2xl !mb-4">
                        Fullscreen Mode Required
                    </Title>
                    <Paragraph className="!text-white !text-base !mb-2">
                        You are not supposed to exit fullscreen mode during the assessment.
                    </Paragraph>
                    <Paragraph className="!text-white !text-base !mb-6">
                        Returning to fullscreen automatically in <span className="!text-red-500 !font-bold !text-lg">{fullscreenCountdown}</span> seconds.
                    </Paragraph>
                    <div className="w-full max-w-xs mb-6">
                        <Progress 
                            percent={((7 - fullscreenCountdown) / 7) * 100} 
                            strokeColor="#ef4444"
                            trailColor="#ffffff36"
                            showInfo={false}
                        />
                    </div>
                    <Button
                        type="primary"
                        onClick={handleReenterFullscreen}
                        className="!bg-[#5843EE] !border-none !rounded-lg !px-8 !py-3 !h-auto !font-semibold hover:!bg-[#6B52F0]"
                        size="large"
                    >
                        Return to Fullscreen Now
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
