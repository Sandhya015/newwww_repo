/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Col, Divider, Row, Typography, notification } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setCandidateId,
  setAuthToken,
  clearAuthToken,
  setQuestionTypes,
  setQuestionTypesLoading,
  setQuestionTypesError,
  setAssessmentSummary,
  setAssessmentSummaryLoading,
  setAssessmentSummaryError,
  setTokenValidation,
  setTokenValidationLoading,
  setTokenValidationError,
  enableSecureMode,
  clearStoreData,
} from "../../store/miscSlice";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";

// Function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true; // Invalid JWT format
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has exp claim and if it's expired
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    }

    return false; // No exp claim, assume valid
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // If we can't parse it, assume expired
  }
};
import {
  fetchQuestionTypes,
  fetchAssessmentSummary,
  validateToken,
} from "../../services/questionTypesApi";
import MissingCandidateModal from "../../components/Common/MissingCandidateModal";

const { Title, Paragraph } = Typography;

export default function Assessment() {
  const { candidate_id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showMissingCandidateModal, setShowMissingCandidateModal] =
    useState(false)

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

  // Secure mode hook
  const { secureMode, secureModeLoading, isTokenValid } = useSecureMode();
  
  // Fullscreen hook
  const { enterFullscreen, isSupported } = useFullscreen();

  // Countdown timer state
  const [countdown, setCountdown] = useState<number | null>(null);
  const COUNTDOWN_DURATION = 60; // 60 seconds countdown

  // Helper functions to get dynamic data
  const getAssessmentName = () => {
    if (assessmentSummary?.assessment_name) {
      return assessmentSummary.assessment_name;
    }
    return "Your Assessment"; // Fallback
  };

  const getTotalSections = () => {
    if (
      assessmentSummary?.sections &&
      Array.isArray(assessmentSummary.sections)
    ) {
      return assessmentSummary.sections.length;
    }
    return 0; // Fallback
  };

  const getTotalQuestions = () => {
    if (assessmentSummary?.assessment_overview?.total_questions) {
      return assessmentSummary.assessment_overview.total_questions;
    }
    return 0; // Fallback
  };

  const getTotalDuration = () => {
    if (assessmentSummary?.assessment_overview?.total_duration_minutes) {
      return assessmentSummary.assessment_overview.total_duration_minutes;
    }
    return 0; // Fallback
  };

  const getQuestionTypesForSections = () => {
    if (
      !assessmentSummary?.sections ||
      !questionTypes ||
      !Array.isArray(assessmentSummary.sections)
    ) {
      return ["Coding", "MCQ", "True or False"]; // Fallback
    }

    const questionTypeCodes = new Set();

    // Extract all question type codes from sections
    assessmentSummary.sections.forEach((section: any) => {
      if (section.question_types && Array.isArray(section.question_types)) {
        section.question_types.forEach((qt: any) => {
          if (qt.type) {
            questionTypeCodes.add(qt.type);
          }
        });
      }
    });

    // Map codes to display names
    const questionTypeNames = Array.from(questionTypeCodes).map((code: any) => {
      const questionType = questionTypes.find((qt: any) => qt.code === code);
      return questionType ? questionType.display_name : code;
    });

    return questionTypeNames.length > 0
      ? questionTypeNames
      : ["Coding", "MCQ", "True or False"];
  };

  // Get candidate name from token validation
  const getCandidateName = () => {
    if (tokenValidation?.decoded_token?.full_name) {
      return tokenValidation.decoded_token.full_name;
    }
    return ""; // Fallback - will show "Hi," without name
  };

  // Start countdown timer when assessment summary is loaded
  useEffect(() => {
    if (assessmentSummary && !assessmentSummaryLoading && countdown === null) {
      setCountdown(COUNTDOWN_DURATION);
    }
  }, [assessmentSummary, assessmentSummaryLoading]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Debug Redux state
  const tokenValidation = useSelector(
    (state: any) => state.misc?.tokenValidation
  );
  const secureModeState = useSelector((state: any) => state.misc?.secureMode);
  const secureModeLoadingState = useSelector(
    (state: any) => state.misc?.secureModeLoading
  );

  console.log("Assessment.tsx - Redux state:", {
    tokenValidation,
    secureModeState,
    secureModeLoadingState,
    hookSecureMode: secureMode,
    hookSecureModeLoading: secureModeLoading,
    hookIsTokenValid: isTokenValid,
  });

  // Notification functions
  const showAuthErrorNotification = (message: string) => {
    notification.error({
      message: "Authentication Error",
      description: message,
      placement: "topRight",
      duration: 8,
      style: {
        backgroundColor: "#fff2f0",
        border: "1px solid #ffccc7",
      },
    });
  };

  const showAuthWarningNotification = (message: string) => {
    notification.warning({
      message: "Authentication Warning",
      description: message,
      placement: "topRight",
      duration: 6,
      style: {
        backgroundColor: "#fffbe6",
        border: "1px solid #ffe58f",
      },
    });
  };

  const showSuccessNotification = (message: string) => {
    notification.success({
      message: "Authentication Success",
      description: message,
      placement: "topRight",
      duration: 4,
    });
  };

  useEffect(() => {
    // Clear the store data before any API calls to ensure fresh state
    console.log("Clearing store data before loading assessment...");
    dispatch(clearStoreData());

    // Always fetch candidate_id and auth token from URL and store them in Redux
    // This ensures both values are current on every page load/refresh

    // Handle candidate_id and auth token
    // The candidate_id parameter might actually be an auth token in some cases
    let finalAuthToken = null;

    if (!candidate_id) {
      // No candidate_id in URL - block access
      setShowMissingCandidateModal(true);
    } else {
      // Check if the candidate_id looks like a JWT token (starts with 'eyJ')
      const isJwtToken = candidate_id.startsWith("eyJ");
      console.log("Assessment.tsx - isJwtToken:", isJwtToken);

      if (!isJwtToken) {
        // candidate_id is not a valid JWT token - block access
        console.error('Invalid token format: Token must start with "eyJ"');
        setShowMissingCandidateModal(true);
      } else {
        // The candidate_id is actually an auth token
        dispatch(setAuthToken(candidate_id));
        // For JWT tokens, we might need to extract candidate_id from the token
        // For now, we'll use the token itself as candidate_id for routing purposes
        dispatch(setCandidateId(candidate_id));
        finalAuthToken = candidate_id;

        // Show success notification for valid token
        if (!isTokenExpired(candidate_id)) {
          showSuccessNotification(
            "Authentication token validated successfully"
          );
        }
      }
    }

    // If no JWT token in candidate_id, check for auth token in query parameters as fallback
    if (!finalAuthToken) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryAuthToken =
        urlParams.get("token") ||
        urlParams.get("auth") ||
        urlParams.get("authToken");

      if (queryAuthToken) {
        // Use query parameter auth token
        finalAuthToken = queryAuthToken;
        dispatch(setAuthToken(queryAuthToken));

        // Show success notification for valid query token
        if (!isTokenExpired(queryAuthToken)) {
          showSuccessNotification(
            "Authentication token from URL parameters validated successfully"
          );
        }
      } else {
        // Check if auth token exists in localStorage (from previous session)
        try {
          const persistedState = localStorage.getItem("persist:root");
          if (persistedState) {
            const parsed = JSON.parse(persistedState);

            // Check if misc key exists and is not undefined
            if (parsed.misc && parsed.misc !== "undefined") {
              const miscState = JSON.parse(parsed.misc);
              if (miscState.authToken) {
                // Token exists in localStorage, keep it
                dispatch(setAuthToken(miscState.authToken));
                finalAuthToken = miscState.authToken;

                // Show info notification for restored token
                if (!isTokenExpired(miscState.authToken)) {
                  showAuthWarningNotification(
                    "Authentication token restored from previous session"
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Error parsing persisted auth token:", error);
        }
      }
    }

    // Fetch question types when component loads
    const loadQuestionTypes = async (token?: string) => {
      try {
        dispatch(setQuestionTypesLoading(true));
        const questionTypes = await fetchQuestionTypes(token);
        dispatch(setQuestionTypes(questionTypes));

        // Show success notification if we got data
        if (questionTypes && questionTypes.length > 0) {
          showSuccessNotification(
            `Loaded ${questionTypes.length} question types successfully`
          );
        }
      } catch (error) {
        console.error("Failed to fetch question types:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch question types";
        dispatch(setQuestionTypesError(errorMessage));

        // If authentication failed, clear the token and show notification
        if (errorMessage.includes("Authentication failed")) {
          console.warn("Clearing expired/invalid auth token");
          showAuthErrorNotification(
            "Authentication failed while loading question types. Your session may have expired."
          );
          dispatch(clearAuthToken());
        } else {
          showAuthErrorNotification(
            "Failed to load question types. Please try again."
          );
        }
      }
    };

    // Fetch assessment summary when component loads
    const loadAssessmentSummary = async (token?: string) => {
      try {
        dispatch(setAssessmentSummaryLoading(true));
        const assessmentSummary = await fetchAssessmentSummary(token);
        dispatch(setAssessmentSummary(assessmentSummary));

        // Show success notification if we got data
        if (assessmentSummary) {
          showSuccessNotification("Assessment details loaded successfully");
        }
      } catch (error) {
        console.error("Failed to fetch assessment summary:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch assessment summary";
        dispatch(setAssessmentSummaryError(errorMessage));

        // Show blocking modal on any assessment summary API failure
        setShowMissingCandidateModal(true);

        // If authentication failed, clear the token and show notification
        if (
          errorMessage.includes("Authentication failed") ||
          errorMessage.includes("401")
        ) {
          console.warn("Clearing expired/invalid auth token");
          showAuthErrorNotification(
            "Authentication failed while loading assessment details. Your session may have expired."
          );
          dispatch(clearAuthToken());
        } else {
          showAuthErrorNotification(
            "Failed to load assessment details. Please try again."
          );
        }
      }
    };

    // Token validation function
    const validateTokenAPI = async (token: string) => {
      try {
        console.log("Starting token validation with token:", token);
        dispatch(setTokenValidationLoading(true));
        dispatch(setTokenValidationError(null));
        const validationResult = await validateToken(token);
        console.log("Token validation API response:", validationResult);
        dispatch(setTokenValidation(validationResult));

        if (validationResult.valid) {
          showSuccessNotification("Token validated successfully");
          console.log("Token validation successful:", validationResult);
        } else {
          showAuthErrorNotification("Token validation failed");
          dispatch(setTokenValidationError("Token is invalid"));
        }
      } catch (error) {
        console.error("Failed to validate token:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to validate token";
        dispatch(setTokenValidationError(errorMessage));
        showAuthErrorNotification("Token validation failed. Please try again.");
      }
    };

    // Debug logging
    console.log("Assessment.tsx - candidate_id:", candidate_id);
    console.log("Assessment.tsx - finalAuthToken:", finalAuthToken);
    console.log(
      "Assessment.tsx - isJwtToken:",
      candidate_id?.startsWith("eyJ")
    );

    // Check if token is expired before making API calls
    if (finalAuthToken && isTokenExpired(finalAuthToken)) {
      console.warn("Token is expired, clearing it and skipping API calls");
      showAuthErrorNotification(
        "Your authentication token has expired. Please refresh the page or contact support."
      );
      dispatch(clearAuthToken());
      finalAuthToken = null;
    }

    // Validate token first if available
    if (finalAuthToken) {
      validateTokenAPI(finalAuthToken);
    } else {
      showAuthWarningNotification(
        "No authentication token provided. Some features may not be available."
      );
    }

    // Load data with the auth token
    loadQuestionTypes(finalAuthToken);
    loadAssessmentSummary(finalAuthToken);
  }, [candidate_id, dispatch]); // Runs whenever candidate_id from URL changes

  // Prevent scrolling on the landing page
  useEffect(() => {
    // Disable scroll when component mounts
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Prevent touch scroll on mobile devices
    const preventTouchScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.body.addEventListener('touchmove', preventTouchScroll, { passive: false });

    // Cleanup: Re-enable scroll when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  // Handle Start Assessment with automatic fullscreen
  const handleStartAssessment = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Enter fullscreen immediately (browsers allow this on user click)
    if (isSupported) {
      try {
        await enterFullscreen();
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        // Continue navigation even if fullscreen fails
      }
    }
    
    // Navigate to camera capture page
    navigate(`/${candidate_id}/camera-capture`);
  };

  return (
    <div className="relative bg-[#0a0a0a] text-white overflow-hidden min-h-screen w-full m-0 p-0" style={{ borderLeft: '60px solid #1a1a2e', borderRight: '60px solid #1a1a2e' }}>
      {/* Header Bar - Dark Blue */}
      <div className="bg-[#1a1a2e] border-b border-[#2a2a3e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
            alt="Logo"
            className="h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((dot) => (
              <div key={dot} className="w-2 h-2 rounded-full bg-white/30"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Dark Blue Container */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-8">
        <div 
          className="bg-[#1a1a2e] rounded-lg w-full max-w-7xl transform transition-all duration-300 relative overflow-hidden"
          style={{
            boxShadow: `
              0 30px 80px rgba(124, 58, 237, 0.5),
              0 20px 50px rgba(0, 0, 0, 0.7),
              inset 0 2px 6px rgba(255, 255, 255, 0.15),
              inset 0 -2px 6px rgba(0, 0, 0, 0.5),
              0 0 0 4px rgba(124, 58, 237, 0.3)
            `,
            transform: 'perspective(1200px) rotateX(1deg) translateY(-10px)',
            background: 'linear-gradient(145deg, #1f1f3a 0%, #1a1a2e 50%, #151525 100%)',
            borderTop: '4px solid #9d5de8',
            borderBottom: '4px solid #6d28d9',
            borderLeft: '4px solid #8b5cf6',
            borderRight: '4px solid #8b5cf6',
          }}
        >
          {/* Two Column Layout with Central Timeline */}
          <div className="flex flex-col lg:flex-row relative">
            {/* Left Panel - Information/Summary */}
            <div className="w-full lg:w-[45%] p-8 lg:p-12 text-white flex flex-col justify-center">
              {/* Hi [Name] - Aligned with Question type */}
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-300">
                  Hi {getCandidateName() ? `${getCandidateName()},` : ","}
                </h2>
              </div>

              {/* Welcome Message */}
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-[#7C3AED]">
                  Welcome to your assessment
                </h1>
              </div>

              {/* Separator Line */}
              <div className="mb-6 border-t border-[#7C3AED]"></div>

              {/* Assessment Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED]"></div>
                  <span className="text-gray-200 font-medium">
                    Question count: {getTotalQuestions()} Questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED]"></div>
                  <span className="text-gray-200 font-medium">
                    Section count: {getTotalSections()} Sections
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED]"></div>
                  <span className="text-gray-200 font-medium">
                    Test Duration: {getTotalDuration()} Minutes
                  </span>
                </div>
              </div>

            </div>

            {/* Central Timeline */}
            <div className="hidden lg:flex flex-col items-center justify-center w-[10%] relative">
              <div className="absolute top-0 bottom-0 w-1 bg-[#7C3AED]"></div>
              
              {/* Top Circle - Monitor Icon */}
              <div className="relative z-10 bg-[#1a1a2e] rounded-full p-3 border-4 border-[#7C3AED]">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Middle Circle - Person Icon */}
              <div className="relative z-10 bg-[#1a1a2e] rounded-full p-3 border-4 border-[#7C3AED] mt-8">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Bottom Circle - Document Icon */}
              <div className="relative z-10 bg-[#1a1a2e] rounded-full p-3 border-4 border-[#7C3AED] mt-8">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Panel - Instructions and Actions */}
            <div className="w-full lg:w-[45%] p-8 lg:p-12 text-white border-l-0 lg:border-l border-[#7C3AED]">
              {/* You are about to begin test */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  You are about to begin test!
                </h3>
              </div>

              {/* Question Type */}
              <div className="mb-6 pb-6 border-b border-[#7C3AED]">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2"></div>
                  <div>
                    <p className="text-white font-semibold mb-1">Question type(s):</p>
                    <p className="text-gray-300">
                      {assessmentSummaryLoading || questionTypesLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        getQuestionTypesForSections().join(", ")
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2"></div>
                  <div>
                    <p className="text-white font-semibold mb-2">Instructions:</p>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li>• Read each question carefully before answering</li>
                      <li>• Ensure you have a stable internet connection</li>
                      <li>• Complete all sections in one session</li>
                      <li>• Review your answers before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* All done. Ready to start? */}
              <div className="mb-6">
                <p className="text-white font-semibold mb-2">
                  All done. Ready to start?
                </p>
                <p className="text-gray-300 text-sm mb-4">
                  Believe in yourself and give your best effort. Stay calm, showcase your skills.
                </p>
              </div>

              {/* All the best */}
              <div className="mb-6">
                <p className="text-[#7C3AED] font-semibold text-lg">All the best.</p>
              </div>

              {/* Start Test Button */}
              <div className="mt-8">
                <button
                  onClick={handleStartAssessment}
                  className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar - Dark Blue */}
      <div className="bg-[#1a1a2e] border-t border-[#2a2a3e] px-6 py-4 mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>© 2021-2031 MeritEdge Assessment</span>
            <span>Need Help? Contact us</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Privacy Notice</span>
            <span>Terms of Services</span>
            <div className="flex items-center gap-2">
              <span>Powered By</span>
              <img
                src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
                alt="Logo"
                className="h-6"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Missing Candidate Modal - Blocks access without candidate_id */}
      <MissingCandidateModal open={showMissingCandidateModal} />
    </div>
  );
}
