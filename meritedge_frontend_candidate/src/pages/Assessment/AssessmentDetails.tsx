/* eslint-disable @typescript-eslint/no-explicit-any */
import { DownOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Modal,
  Typography,
} from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AssessmentSummary,
  StandardField,
  CustomField,
  setCandidateId,
  setAuthToken,
} from "../../store/miscSlice";
import { useSecureMode } from "../../hooks/useSecureMode";
import { useFullscreen } from "../../hooks/useFullscreen";
import { API_ENDPOINTS } from "../../config/apiConfig";

const { Title, Paragraph } = Typography;

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

export default function AssessmentDetails() {
  // Secure mode hook
  useSecureMode();

  // Fullscreen functionality
  const { isSupported: isFullscreenSupported, enterFullscreen, isFullscreen } = useFullscreen();
  const [showFullscreenWarningModal, setShowFullscreenWarningModal] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(7);

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
  const assessmentSummaryLoading = useSelector(
    (state: any) => state.misc?.assessmentSummaryLoading
  );

  // Helper functions for guidelines
  const getTotalDuration = () => {
    if (assessmentSummary?.assessment_overview?.total_duration_minutes) {
      return assessmentSummary.assessment_overview.total_duration_minutes;
    }
    return 0;
  };

  const getTotalSections = () => {
    if (
      assessmentSummary?.sections &&
      Array.isArray(assessmentSummary.sections)
    ) {
      return assessmentSummary.sections.length;
    }
    return 0;
  };

  const getTotalQuestions = () => {
    if (assessmentSummary?.assessment_overview?.total_questions) {
      return assessmentSummary.assessment_overview.total_questions;
    }
    return 0;
  };

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [step, setStep] = useState(1);

  // Redirect if no image captured
  useEffect(() => {
    if (!capturedImagePreview) {
      console.warn("No captured image found, redirecting to camera capture");
      navigate(`/${candidate_id}/camera-capture`);
    }
  }, [capturedImagePreview, candidate_id, navigate]);

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

  // Helper function to check if a field should be disabled
  const shouldFieldBeDisabled = (fieldName: string): boolean => {
    const prefilledValues = getPrefilledValues();
    return fieldName in prefilledValues;
  };

  // Set prefilled values when form is ready
  useEffect(() => {
    const prefilledValues = getPrefilledValues();
    if (Object.keys(prefilledValues).length > 0) {
      form.setFieldsValue(prefilledValues);
    }
  }, [tokenValidation, form]);

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
    options: string[] = [],
    disabled?: boolean,
    readOnly?: boolean
  ) => {
    const baseProps = {
      placeholder: `Enter ${fieldLabelMap[fieldName] || fieldName}`,
      style: inputStyles,
      ...(disabled && { disabled: true }),
      ...(readOnly && { readOnly: true }),
    };

    switch (fieldType) {
      case "email":
        return <Input {...baseProps} type="email" />;
      case "phone":
        return <Input {...baseProps} type="tel" />;
      case "date":
        return (
          <DatePicker
            {...baseProps}
            style={{ ...inputStyles, width: "100%" }}
            format="DD/MM/YYYY"
          />
        );
      case "number":
        return (
          <InputNumber
            {...baseProps}
            style={{ ...inputStyles, width: "100%" }}
          />
        );
      case "select":
        return (
          <Select
            {...baseProps}
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
        return <Input {...baseProps} type="text" />;
    }
  };

  // Generate form fields from assessment summary
  const generateFormFields = () => {
    if (
      !assessmentSummary?.assessment_overview?.general_settings
        ?.candidate_details
    ) {
      // Return default fields if assessment summary is not loaded
      return {
        leftColumnFields: [
          {
            fieldName: "full_name",
            field: { enabled: true, required: true, order: 1 },
            isCustom: false,
          },
        ],
        rightColumnFields: [
          {
            fieldName: "email",
            field: { enabled: true, required: true, order: 2 },
            isCustom: false,
          },
        ],
      };
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
    const maxFieldsPerStep = 6;

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
  const handleSubmit = async (values: any) => {
    // Block submission if no image is captured
    if (!capturedImageBlob) {
      alert("Image not found. Please go back and capture your image.");
      navigate(`/${candidate_id}/camera-capture`);
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

        // Navigate directly to section instructions (skipping guideline page since it's now combined)
        navigate(`/${storedCandidateId || candidate_id}/section-1-instructions`);
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
    <div className="relative bg-black overflow-hidden h-screen w-full m-0 p-0">
      {/* Logo - positioned at ultimate corner */}
      <div className="absolute top-0 left-0 z-30 p-4 sm:p-6 lg:p-8">
        <img
          src={`${import.meta.env.BASE_URL}assessment/logo.svg`}
          alt="Logo"
          className="h-8 sm:h-10 lg:h-auto max-w-[120px] sm:max-w-none"
        />
      </div>

      {/* Main Container - Two Columns with Divider */}
      <div className="w-full h-full overflow-hidden" style={{ borderLeft: '20px solid #1a1a2e', borderRight: '20px solid #1a1a2e', borderTop: '20px solid #1a1a2e', borderBottom: '20px solid #1a1a2e' }}>
        <div className="w-full flex flex-col lg:flex-row h-full">
          {/* Left Column - Image at top, Form below */}
          <div className="w-full lg:w-1/2 border-r-2 border-[#7C3AED] flex flex-col px-6 lg:px-8 py-8 lg:py-12 overflow-hidden">
            {/* Top Section - Captured Image */}
            <div className="w-full flex items-center justify-center mb-8">
              <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-white text-xl md:text-2xl font-semibold mb-2">
                    {/* Your Captured Photo */}
                </h2>
                <p className="text-white/60 text-sm">
                  Please verify your image before proceeding
                </p>
              </div>

              {capturedImagePreview ? (
                <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={capturedImagePreview}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-[#272727] rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-20 h-20 mx-auto mb-4 text-white/20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-white/40 text-sm">No image captured</p>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <Button
                  size="large"
                  onClick={() => navigate(`/${candidate_id}/camera-capture`)}
                  className="!h-12 !px-8 !bg-[#272727] !border-none !text-white !text-base !font-semibold !rounded-xl hover:!bg-[#333333]"
                >
                  Re-Capture Photo
                </Button>
              </div>
            </div>
          </div>

            {/* Bottom Section - Form */}
            <div className="w-full flex-1 overflow-y-auto">
              <div className="w-full max-w-2xl mx-auto">
              {/* Progress Section */}
              <div className="mb-8 sm:mb-10">
                {(() => {
                  const { totalSteps } = getStepConfiguration();
                  const progressPercent = (step / totalSteps) * 100;
                  const stepDisplay =
                    totalSteps > 1 && `Step 0${step}/0${totalSteps}`;

                  return (
                    <>
                      <div className="text-white/50 text-xs sm:text-sm">
                        {stepDisplay}
                      </div>
                      {stepDisplay && (
                        <Progress
                          percent={progressPercent}
                          showInfo={false}
                          strokeColor="#2dd46d"
                          trailColor="#ffffff36"
                          className="mb-4 sm:mb-6 max-w-full sm:max-w-md"
                        />
                      )}
                    </>
                  );
                })()}

                <div className="mt-4 sm:mt-6">
                  <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-medium mb-2 leading-tight">
                    Please fill in your details to begin the assessment.
                  </h1>
                  <p className="text-white/70 text-sm sm:text-base">
                    This helps us personalize your test experience and ensure
                    accurate evaluation.
                  </p>
                </div>
              </div>

              {/* Form */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={getPrefilledValues()}
                className="space-y-4"
              >
                {/* Step 1 Form Fields */}
                <Row gutter={[16, 0]} className={step === 1 ? "" : "!hidden"}>
                  {(() => {
                    const { step1Fields } = getStepConfiguration();

                    if (step1Fields.length === 0) {
                      // Fallback to default fields
                      return (
                        <>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={<span style={labelStyle}>Full Name</span>}
                              name="full_name"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter your full name",
                                },
                              ]}
                              style={formItemStyle}
                            >
                              <Input
                                placeholder="Enter Full Name"
                                style={inputStyles}
                                disabled={shouldFieldBeDisabled("full_name")}
                                readOnly={shouldFieldBeDisabled("full_name")}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label={
                                <span style={labelStyle}>Email Address</span>
                              }
                              name="email"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter your email",
                                },
                                {
                                  type: "email",
                                  message: "Please enter a valid email",
                                },
                              ]}
                              style={formItemStyle}
                            >
                              <Input
                                placeholder="Enter Email Address"
                                type="email"
                                style={inputStyles}
                                disabled={shouldFieldBeDisabled("email")}
                                readOnly={shouldFieldBeDisabled("email")}
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
                        {/* Left column */}
                        <Col xs={24} sm={12}>
                          {leftColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const customField = field as CustomField;
                              const label = isCustom
                                ? customField.label
                                : fieldLabelMap[fieldName];
                              const fieldType = isCustom
                                ? customField.type
                                : fieldName === "email"
                                ? "email"
                                : fieldName === "mobile_number"
                                ? "phone"
                                : fieldName === "date_of_birth"
                                ? "date"
                                : fieldName === "percentage_cgpa"
                                ? "number"
                                : "text";
                              const options =
                                isCustom && customField.options
                                  ? customField.options
                                  : [];

                              return (
                                <Form.Item
                                  key={fieldName}
                                  label={
                                    <span style={labelStyle}>{label}</span>
                                  }
                                  name={fieldName}
                                  rules={[
                                    {
                                      required: field.required,
                                      message: `Please enter ${label}`,
                                    },
                                    ...(fieldType === "email"
                                      ? [
                                          {
                                            type: "email" as const,
                                            message:
                                              "Please enter a valid email",
                                          },
                                        ]
                                      : []),
                                  ]}
                                  style={formItemStyle}
                                >
                                  {generateInputComponent(
                                    fieldType,
                                    fieldName,
                                    options,
                                    shouldFieldBeDisabled(fieldName),
                                    shouldFieldBeDisabled(fieldName)
                                  )}
                                </Form.Item>
                              );
                            }
                          )}
                        </Col>

                        {/* Right column */}
                        <Col xs={24} sm={12}>
                          {rightColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const customField = field as CustomField;
                              const label = isCustom
                                ? customField.label
                                : fieldLabelMap[fieldName];
                              const fieldType = isCustom
                                ? customField.type
                                : fieldName === "email"
                                ? "email"
                                : fieldName === "mobile_number"
                                ? "phone"
                                : fieldName === "date_of_birth"
                                ? "date"
                                : fieldName === "percentage_cgpa"
                                ? "number"
                                : "text";
                              const options =
                                isCustom && customField.options
                                  ? customField.options
                                  : [];

                              return (
                                <Form.Item
                                  key={fieldName}
                                  label={
                                    <span style={labelStyle}>{label}</span>
                                  }
                                  name={fieldName}
                                  rules={[
                                    {
                                      required: field.required,
                                      message: `Please enter ${label}`,
                                    },
                                    ...(fieldType === "email"
                                      ? [
                                          {
                                            type: "email" as const,
                                            message:
                                              "Please enter a valid email",
                                          },
                                        ]
                                      : []),
                                  ]}
                                  style={formItemStyle}
                                >
                                  {generateInputComponent(
                                    fieldType,
                                    fieldName,
                                    options,
                                    shouldFieldBeDisabled(fieldName),
                                    shouldFieldBeDisabled(fieldName)
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

                {/* Step 2 Form Fields (if any) */}
                <Row gutter={[16, 0]} className={step === 2 ? "" : "!hidden"}>
                  {(() => {
                    const { step2Fields, totalSteps } = getStepConfiguration();

                    if (totalSteps === 1 || step2Fields.length === 0) {
                      return null;
                    }

                    // Split step2 fields into two columns
                    const midPoint = Math.ceil(step2Fields.length / 2);
                    const leftColumnFields = step2Fields.slice(0, midPoint);
                    const rightColumnFields = step2Fields.slice(midPoint);

                    return (
                      <>
                        <Col xs={24} sm={12}>
                          {leftColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const customField = field as CustomField;
                              const label = isCustom
                                ? customField.label
                                : fieldLabelMap[fieldName];
                              const fieldType = isCustom
                                ? customField.type
                                : "text";
                              const options =
                                isCustom && customField.options
                                  ? customField.options
                                  : [];

                              return (
                                <Form.Item
                                  key={fieldName}
                                  label={
                                    <span style={labelStyle}>{label}</span>
                                  }
                                  name={fieldName}
                                  rules={[
                                    {
                                      required: field.required,
                                      message: `Please enter ${label}`,
                                    },
                                  ]}
                                  style={formItemStyle}
                                >
                                  {generateInputComponent(
                                    fieldType,
                                    fieldName,
                                    options,
                                    shouldFieldBeDisabled(fieldName),
                                    shouldFieldBeDisabled(fieldName)
                                  )}
                                </Form.Item>
                              );
                            }
                          )}
                        </Col>
                        <Col xs={24} sm={12}>
                          {rightColumnFields.map(
                            ({ fieldName, field, isCustom }) => {
                              const customField = field as CustomField;
                              const label = isCustom
                                ? customField.label
                                : fieldLabelMap[fieldName];
                              const fieldType = isCustom
                                ? customField.type
                                : "text";
                              const options =
                                isCustom && customField.options
                                  ? customField.options
                                  : [];

                              return (
                                <Form.Item
                                  key={fieldName}
                                  label={
                                    <span style={labelStyle}>{label}</span>
                                  }
                                  name={fieldName}
                                  rules={[
                                    {
                                      required: field.required,
                                      message: `Please enter ${label}`,
                                    },
                                  ]}
                                  style={formItemStyle}
                                >
                                  {generateInputComponent(
                                    fieldType,
                                    fieldName,
                                    options,
                                    shouldFieldBeDisabled(fieldName),
                                    shouldFieldBeDisabled(fieldName)
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

                {/* Action Buttons - Removed from here, will be in guidelines side */}
              </Form>
              </div>
            </div>
          </div>

          {/* Right Column - Guidelines */}
          <div className="w-full lg:w-1/2 overflow-y-auto px-6 lg:px-8 py-8 lg:py-12 flex flex-col">
            <div className="w-full">
              <div className="mb-6">
                <Title level={3} className="!text-white !text-xl !mb-2">
                  Assessment Guidelines
                </Title>
                <Paragraph className="!text-white/70 !text-sm !mb-0">
                  Follow these strictly to avoid disqualification. The test is monitored and fairness is enforced.
                </Paragraph>
              </div>

              {/* Info Cards */}
              <Row gutter={[12, 12]} className="mb-4">
                <Col xs={24} sm={12} md={8}>
                  <Card
                    bordered={false}
                    className="relative overflow-hidden border border-[#FFF] h-full"
                    style={{
                      background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                      borderRadius: "20px",
                    }}
                  >
                    <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />
                    <Row align="middle" justify="space-between">
                      <Col flex="1">
                        <Title level={5} className="!text-sm !text-white !opacity-80 !mb-2">
                          Total Duration
                        </Title>
                        <Title level={2} className="!text-2xl !text-white !m-0">
                          {assessmentSummaryLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            getTotalDuration()
                          )}
                        </Title>
                        <Paragraph className="!text-xs !text-white !opacity-50 !m-0">
                          Minutes Total
                        </Paragraph>
                      </Col>
                      <Col className="bg-[#5555554D] rounded-xl p-3">
                        <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                          <img
                            src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                            alt="File check"
                            className="w-7 h-7 m-2"
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    bordered={false}
                    className="relative overflow-hidden border border-[#FFF] h-full"
                    style={{
                      background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                      borderRadius: "20px",
                    }}
                  >
                    <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />
                    <Row align="middle" justify="space-between">
                      <Col flex="1">
                        <Title level={5} className="!text-sm !text-white !opacity-80 !mb-2">
                          Total Section
                        </Title>
                        <Title level={2} className="!text-2xl !text-white !m-0">
                          {assessmentSummaryLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            getTotalSections()
                          )}
                        </Title>
                        <Paragraph className="!text-xs !text-white !opacity-50 !m-0">
                          to Complete
                        </Paragraph>
                      </Col>
                      <Col className="bg-[#5555554D] rounded-xl p-3">
                        <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                          <img
                            src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                            alt="File check"
                            className="w-7 h-7 m-2"
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    bordered={false}
                    className="relative overflow-hidden border border-[#FFF] h-full"
                    style={{
                      background: "linear-gradient(180deg, #26262A 0%, #000 100%)",
                      borderRadius: "20px",
                    }}
                  >
                    <div className="absolute w-[136px] h-[136px] top-[-110px] left-[calc(50%-68px)] bg-[#dbe6ff] rounded-full blur-[57px] opacity-70" />
                    <Row align="middle" justify="space-between">
                      <Col flex="1">
                        <Title level={5} className="!text-sm !text-white !opacity-80 !mb-2">
                          Total Questions
                        </Title>
                        <Title level={2} className="!text-2xl !text-white !m-0">
                          {assessmentSummaryLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            getTotalQuestions()
                          )}
                        </Title>
                        <Paragraph className="!text-xs !text-white !opacity-50 !m-0">
                          to Answer
                        </Paragraph>
                      </Col>
                      <Col className="bg-[#5555554D] rounded-xl p-3">
                        <div className="flex items-center justify-center bg-[#000000] rounded-lg">
                          <img
                            src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                            alt="File check"
                            className="w-7 h-7 m-2"
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Guideline Cards */}
              <div className="mt-6 mb-6">
                <Card
                  bordered={false}
                  className="h-full !mb-4"
                  style={{ background: "#1f222aa6", borderRadius: "20px" }}
                >
                  <Row align="middle" justify="start" gutter={[20, 0]}>
                    <Col flex="none" className="flex items-center justify-center bg-[#2563EB4D] rounded-xl p-3">
                      <div className="bg-[#2563EB] rounded-lg">
                        <img
                          src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                          alt="File check"
                          className="w-5 h-5 m-2"
                        />
                      </div>
                    </Col>
                    <Col flex="1">
                      <Title level={5} className="!text-sm !text-[#C7D8FF] !mb-2">
                        System Compatibility Check
                      </Title>
                      <Paragraph className="!text-xs !text-white !mb-0">
                        Ensure your camera, microphone, and internet are functioning. A system check will run before the test begins.
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>

                <Card
                  bordered={false}
                  className="h-full !mb-4"
                  style={{ background: "#1f222aa6", borderRadius: "20px" }}
                >
                  <Row align="top" justify="start" gutter={[20, 0]}>
                    <Col flex="none" className="flex items-center justify-center bg-[#EB2C254D] rounded-xl p-3">
                      <div className="bg-[#F97B14] rounded-lg">
                        <img
                          src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                          alt="File check"
                          className="w-5 h-5 m-2"
                        />
                      </div>
                    </Col>
                    <Col flex="1">
                      <Title level={5} className="!text-sm !text-[#FFE0C7] !mb-2">
                        Proctoring in Effect
                      </Title>
                      <Paragraph className="!text-xs !text-white !mb-0">
                        Live proctoring, screen tracking, and AI monitoring are enabled — sit in a quiet, well-lit space.
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>

                <Card
                  bordered={false}
                  className="h-full !mb-4"
                  style={{ background: "#1f222aa6", borderRadius: "20px" }}
                >
                  <Row align="top" justify="start" gutter={[20, 0]}>
                    <Col flex="none" className="flex items-center justify-center bg-[#EB25434D] rounded-xl p-3">
                      <div className="bg-[#EB2543] rounded-lg">
                        <img
                          src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                          alt="File check"
                          className="w-5 h-5 m-2"
                        />
                      </div>
                    </Col>
                    <Col flex="1">
                      <Title level={5} className="!text-sm !text-[#FFC7CF] !mb-2">
                        No Tab Switching
                      </Title>
                      <Paragraph className="!text-xs !text-white !mb-0">
                        Switching tabs or minimizing the screen will be flagged and may lead to disqualification.
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>

                <Card
                  bordered={false}
                  className="h-full !mb-4"
                  style={{ background: "#1f222aa6", borderRadius: "20px" }}
                >
                  <Row align="top" justify="start" gutter={[20, 0]}>
                    <Col flex="none" className="flex items-center justify-center bg-[#AC25EB4D] rounded-xl p-3">
                      <div className="bg-[#AC25EB] rounded-lg">
                        <img
                          src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                          alt="File check"
                          className="w-5 h-5 m-2"
                        />
                      </div>
                    </Col>
                    <Col flex="1">
                      <Title level={5} className="!text-sm !text-[#EDC7FF] !mb-2">
                        Avoid Page Refreshing
                      </Title>
                      <Paragraph className="!text-xs !text-white !mb-0">
                        Do not refresh or close the browser during the test. It may cause your session to end permanently.
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>

                <Card
                  bordered={false}
                  className="h-full"
                  style={{ background: "#1f222aa6", borderRadius: "20px" }}
                >
                  <Row align="top" justify="start" gutter={[20, 0]}>
                    <Col flex="none" className="flex items-center justify-center bg-[#EBB9254D] rounded-xl p-3">
                      <div className="bg-[#EBB925] rounded-lg">
                        <img
                          src={`${import.meta.env.BASE_URL}assessment/file-check-line.svg`}
                          alt="File check"
                          className="w-5 h-5 m-2"
                        />
                      </div>
                    </Col>
                    <Col flex="1">
                      <Title level={5} className="!text-sm !text-[#FFF1C7] !mb-2">
                        Stay Honest – No External Help
                      </Title>
                      <Paragraph className="!text-xs !text-white !mb-0">
                        Avoid using phones, written notes, or getting outside help. Any suspicious behavior is automatically flagged and may lead to disqualification.
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>
              </div>

              {/* Submit Button - Moved to Guidelines Side */}
              <div className="mt-6">
                  {(() => {
                    const { totalSteps } = getStepConfiguration();

                    return (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                        {step > 1 && (
                          <button
                            type="button"
                            onClick={prevStep}
                            className="order-2 sm:order-1 w-full sm:w-auto sm:min-w-[160px] h-12 bg-[#272727] border-none font-semibold text-white rounded-xl transition-colors hover:bg-[#333333]"
                          >
                            Previous
                          </button>
                        )}

                        {step < totalSteps && (
                          <button
                            type="button"
                            onClick={nextStep}
                            className="order-1 sm:order-2 w-full sm:w-auto sm:min-w-[160px] h-12 bg-[#5843EE] border-none font-semibold text-white rounded-xl transition-colors hover:bg-[#6B52F0]"
                          >
                            Next
                          </button>
                        )}

                        {step === totalSteps && (
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                          onClick={() => form.submit()}
                            className="order-1 sm:order-2 w-full sm:w-auto sm:!min-w-[160px] !h-12 !bg-[#5843EE] !border-none !font-semibold !text-white !rounded-xl hover:!bg-[#6B52F0]"
                          >
                            {isSubmitting
                              ? "Submitting..."
                              : "Submit & Continue"}
                          </Button>
                        )}
                    </div>
                    );
                  })()}
                </div>
            </div>
            </div>
          </div>
        </div>

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
