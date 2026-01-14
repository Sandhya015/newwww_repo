/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Col,
  Input,
  AutoComplete,
  Modal,
  Row,
  Typography,
  Tag,
  message,
  Spin,
} from "antd";
import type { InputRef } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";

// Components
import dayjs, { Dayjs } from "dayjs";
import CustomSelect from "../../components/ui/CustomSelect";
import AssessmentHeader from "../../components/Assessment/AssessmentHeader";
import AssessmentFilters from "../../components/Assessment/AssessmentFilters";
import AssessmentTable, {
  createTableColumns,
} from "../../components/Assessment/AssessmentTable";
import DeleteAssessmentModal from "../../components/Assessment/DeleteAssessmentModal";
import CloneAssessmentModal from "../../components/Assessment/CloneAssessmentModal";
import InviteCandidateModalWrapper from "../../components/Assessment/InviteCandidateModalWrapper";
import {
  TestDataType,
  ApiResponse,
  INITIAL_FILTERS,
  DEFAULT_ASSESSMENT_TYPE,
  FetchAssessmentsFn,
} from "../../components/Assessment/types";

// Utils
import { showToast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import {
  searchSkills,
  isValidSkill,
  findBestMatch,
  type SkillSuggestion,
} from "../../utils/skillsTaxonomy";

// API
import {
  getAPI,
  postAPI,
  deleteAPI,
  getCandidateReports,
  cloneAssessment,
  publishAssessment,
  createSection,
  updateSection,
  uploadAndParseJD,
} from "../../lib/api";

// Store
import { useDispatch } from "react-redux";
import {
  clearCurrentAssessment,
  setCurrentAssessment,
} from "../../store/miscSlice";

const JD_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];
const JD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const isJDFileAllowed = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasValidExtension = JD_ALLOWED_EXTENSIONS.includes(extension);
  const hasValidMime = file.type ? JD_ALLOWED_MIME_TYPES.has(file.type) : true;
  return hasValidExtension && hasValidMime;
};

const { Title, Paragraph, Text } = Typography;

const durationOptions = [
  { label: "30 Minutes", value: "30" },
  { label: "45 Minutes", value: "45" },
  { label: "60 Minutes", value: "60" },
  { label: "90 Minutes", value: "90" },
  { label: "120 Minutes", value: "120" },
  { label: "150 Minutes", value: "150" },
  { label: "180 Minutes", value: "180" },
];

function Cognitive() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isDesktopView, setIsDesktopView] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.innerWidth > 768;
  });

  const [isTestTypeModalOpen, setIsTestTypeModalOpen] = useState(false);
  const [isCreationMethodModalOpen, setIsCreationMethodModalOpen] =
    useState(false);
  const [
    selectedAssessmentTypeForCreation,
    setSelectedAssessmentTypeForCreation,
  ] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<
    "private" | "public" | ""
  >("");
  const [selectedCreationMethod, setSelectedCreationMethod] = useState<
    "predefined" | "manual" | ""
  >("");
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] =
    useState(false);
  const [duration, setDuration] = useState<string>("");
  const [uploadedJD, setUploadedJD] = useState<any>(null);
  const [uploadJDLoading, setUploadJDLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [jdParseData, setJdParseData] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const skillsRef = useRef<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestion[]>(
    []
  );
  const [unknownSkillModal, setUnknownSkillModal] = useState<{
    visible: boolean;
    skill: string;
    suggestion: SkillSuggestion | null;
  }>({
    visible: false,
    skill: "",
    suggestion: null,
  });
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [pendingAssessmentData, setPendingAssessmentData] = useState<any>(null);

  // Assessment form state (separate from filters to prevent table filtering)
  const [assessmentName, setAssessmentName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [minExperience, setMinExperience] = useState<number | null>(null);
  const [maxExperience, setMaxExperience] = useState<number | null>(null);
  const [formDifficultyLevel, setFormDifficultyLevel] = useState<{
    label: string;
    code: string;
  } | null>(null);
  const [formAssessmentType, setFormAssessmentType] = useState<{
    label: string;
    code: string;
  } | null>({ ...DEFAULT_ASSESSMENT_TYPE });

  const [assessmentType, setAssessmentType] = useState<{
    label: string;
    code: string;
  } | null>(null);

  // Experience options (0-20 years)
  const experienceOptions = Array.from({ length: 21 }, (_, i) => ({
    label: `${i}`,
    value: i,
  }));

  // Get max experience options with disabled values less than minExperience
  const getMaxExperienceOptions = (minExp: number | null) => {
    return experienceOptions.map((option) => ({
      ...option,
      disabled: minExp !== null && option.value < minExp,
    }));
  };

  // Function to auto-set difficulty level based on experience
  const autoSetDifficultyLevel = (min: number | null, max: number | null) => {
    // Determine the reference value for difficulty calculation
    let referenceYears = 0;

    if (min !== null && max !== null) {
      // If both are set, use the average
      referenceYears = Math.floor((min + max) / 2);
    } else if (min !== null) {
      // If only min is set, use min
      referenceYears = min;
    } else if (max !== null) {
      // If only max is set, use max
      referenceYears = max;
    } else {
      return; // No experience selected
    }

    // Auto-select difficulty based on years (use form state, not filter state)
    if (referenceYears <= 2) {
      setFormDifficultyLevel({ label: "Beginner", code: "beginner" });
    } else if (referenceYears <= 7) {
      setFormDifficultyLevel({ label: "Intermediate", code: "intermediate" });
    } else {
      setFormDifficultyLevel({ label: "Advanced", code: "advanced" });
    }
  };

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    assessmentName: "",
    role: "",
    skills: "",
    experience: "",
  });

  const [description, setDescription] = useState("");

  // Optimized immediate input handlers for better responsiveness
  const handleAssessmentNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAssessmentName(e.target.value);
      if (validationErrors.assessmentName) {
        setValidationErrors((prev) => ({ ...prev, assessmentName: "" }));
      }
    },
    [validationErrors.assessmentName]
  );

  const handleRoleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRole(e.target.value);
      if (validationErrors.role) {
        setValidationErrors((prev) => ({ ...prev, role: "" }));
      }
    },
    [validationErrors.role]
  );

  // Handle skill input change with suggestions
  const handleSkillInputChange = useCallback((value: string) => {
    setSkillInput(value);

    // Update suggestions as user types
    if (value && value.trim().length > 0) {
      const suggestions = searchSkills(value);
      setSkillSuggestions(suggestions);
    } else {
      setSkillSuggestions([]);
    }
  }, []);

  // Update ref whenever skills state changes
  useEffect(() => {
    skillsRef.current = skills;
  }, [skills]);

  // Handle adding a skill with validation
  const handleAddSkillWithValidation = useCallback(
    (skill: string, skipValidation = false): boolean => {
      const trimmedSkill = skill.trim();
      if (!trimmedSkill) {
        return false;
      }

      // Check for duplicates first using the ref (most current state)
      const skillExists = skillsRef.current.some(
        (existingSkill) =>
          existingSkill.toLowerCase() === trimmedSkill.toLowerCase()
      );

      if (skillExists) {
        message.warning(`"${trimmedSkill}" is already in your skills list.`);
        return false;
      }

      // Validate against taxonomy if not skipping validation
      if (!skipValidation && !isValidSkill(trimmedSkill)) {
        // Find best match suggestion
        const bestMatch = findBestMatch(trimmedSkill);

        // Show modal for user confirmation
        setUnknownSkillModal({
          visible: true,
          skill: trimmedSkill,
          suggestion: bestMatch,
        });
        return false;
      }

      // Add the skill
      setSkills((prev) => [...prev, trimmedSkill]);

      // Clear validation error when a skill is added
      if (validationErrors.skills) {
        setValidationErrors((prev) => ({ ...prev, skills: "" }));
      }

      return true;
    },
    [validationErrors.skills]
  );

  // Confirm adding unknown skill
  const handleConfirmUnknownSkill = useCallback(() => {
    const { skill } = unknownSkillModal;
    if (skill) {
      handleAddSkillWithValidation(skill, true); // Skip validation
      showToast({
        message: "Skill Added",
        description: `"${skill}" has been added. Please verify this skill is correct.`,
        type: "info",
        position: "top-right",
        duration: 3000,
      });
    }
    setUnknownSkillModal({ visible: false, skill: "", suggestion: null });
    setSkillInput("");
  }, [unknownSkillModal, handleAddSkillWithValidation]);

  // Use suggested skill instead
  const handleUseSuggestion = useCallback(
    (suggestion: SkillSuggestion) => {
      if (suggestion) {
        handleAddSkillWithValidation(suggestion.value, true);
        showToast({
          message: "Skill Added",
          description: `Added "${suggestion.value}" based on your input.`,
          type: "success",
          position: "top-right",
          duration: 3000,
        });
      }
      setUnknownSkillModal({ visible: false, skill: "", suggestion: null });
      setSkillInput("");
    },
    [handleAddSkillWithValidation]
  );

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setSkills((prev) => {
      const newSkills = prev.filter((skill) => skill !== skillToRemove);
      return newSkills;
    });
  }, []);

  useEffect(() => {
    const handleViewportChange = () => {
      setIsDesktopView(window.innerWidth > 768);
    };

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);

    return () => window.removeEventListener("resize", handleViewportChange);
  }, []);

  const handleTestTypeSelection = (testType: "private" | "public") => {
    setSelectedTestType(testType);
    setIsTestTypeModalOpen(false);
    setIsCreationMethodModalOpen(true);
  };

  const handleTestTypeModalCancel = () => {
    setIsTestTypeModalOpen(false);
    setSelectedAssessmentTypeForCreation("");
    setSelectedTestType("");
  };

  const handleSwitchTestType = () => {
    // Toggle between private and public directly without going back
    setSelectedTestType(selectedTestType === "private" ? "public" : "private");
  };

  const handleCreationMethodSelection = (method: "predefined" | "manual") => {
    setSelectedCreationMethod(method);
    setIsCreationMethodModalOpen(false);

    if (method === "predefined") {
      // For predefined, directly open the create assessment modal with AI
      setIsCreateAssessmentModalOpen(true);
    } else {
      // For manual, open the create assessment modal
      setIsCreateAssessmentModalOpen(true);
    }
  };

  const handleCreationMethodModalCancel = () => {
    setIsCreationMethodModalOpen(false);
    setSelectedCreationMethod("");
    setSelectedTestType("");
    setSelectedAssessmentTypeForCreation("");
  };

  // Validate form and return form data if valid
  const validateAndPrepareFormData = () => {
    // Reset validation errors
    const errors = {
      assessmentName: "",
      role: "",
      skills: "",
      experience: "",
    };

    // Validate required fields (assessmentName, role, skills, and experience are required)
    let hasError = false;

    if (!assessmentName.trim()) {
      errors.assessmentName = "Assessment name is required";
      hasError = true;
    }

    if (!role.trim()) {
      errors.role = "Role is required";
      hasError = true;
    }

    if (!skills || skills.length === 0) {
      errors.skills = "At least one skill is required";
      hasError = true;
    }

    // Validate experience range - at least one value (min or max) must be set
    if (minExperience === null && maxExperience === null) {
      errors.experience = "Experience is required";
      hasError = true;
    } else if (
      minExperience !== null &&
      maxExperience !== null &&
      maxExperience < minExperience
    ) {
      errors.experience =
        "Maximum experience cannot be less than minimum experience";
      hasError = true;
      message.error({
        content: "Maximum experience cannot be less than minimum experience",
        duration: 3,
      });
    }

    // Update validation errors state
    setValidationErrors(errors);

    // If there are errors, don't proceed with API call
    if (hasError) {
      return null;
    }

    // Prepare form data for API
    const formData = {
      title: assessmentName.trim(),
      target_role: role.trim(),
      skills_required: skills,
      target_experience: experience.trim(),
      description: description.trim() || "", // Send empty string if no description
      assessment_type: formAssessmentType?.label || "Cognitive", // Default value for backend
      difficulty_level: formDifficultyLevel?.code || "intermediate", // Default to intermediate
    };

    return formData;
  };

  // Create assessment and optionally publish it
  const createAssessment = async (
    formData: any,
    shouldPublish: boolean = false
  ) => {
    try {
      // Call the API to create assessment
      const response = await postAPI("/assessments", formData);
      console.log("response", response);

      if (response.success) {
        // Extract assessment ID from response - try multiple possible fields
        const assessmentId =
          response.data?.assessment_id ||
          response.data?.id ||
          response.data?.key ||
          response.data?.assessment?.assessment_id ||
          response.data?.assessment?.id ||
          response.data?.assessment?.key;

        if (!assessmentId) {
          message.error("Failed to get assessment ID from response");
          return;
        }

        // Store assessment response for later use
        const assessmentResponse = response.data?.assessment || response.data;

        // If should publish, publish the assessment
        if (shouldPublish && assessmentId) {
          try {
            const publishResponse = await publishAssessment(assessmentId, {
              publish_immediately: true,
              scheduled_publish_date: "",
              send_notifications: true,
              auto_archive_date: "",
              archive_after_days: 0,
            });

            if (publishResponse.success) {
              showToast({
                message: "Assessment Created and Published Successfully",
                description: `"${assessmentName.trim()}" has been created and published successfully`,
                type: "success",
              });
            } else {
              showToast({
                message: "Assessment Created but Publishing Failed",
                description: `"${assessmentName.trim()}" has been created in draft mode. Publishing failed: ${
                  publishResponse.data?.message || "Unknown error"
                }`,
                type: "warning",
              });
            }
          } catch (publishError) {
            console.error("Error publishing assessment:", publishError);
            showToast({
              message: "Assessment Created but Publishing Failed",
              description: `"${assessmentName.trim()}" has been created in draft mode. Please publish it manually.`,
              type: "warning",
            });
          }
        } else {
          showToast({
            message: "Assessment Created Successfully",
            description: `"${assessmentName.trim()}" has been created in draft mode`,
            type: "success",
          });
        }

        // If API call succeeds, proceed with navigation
        setUploadedJD(null);
        setIsCreateAssessmentModalOpen(false);
        setIsPublishModalOpen(false);

        // Reset form fields
        setAssessmentName("");
        setRole("");
        setExperience("");
        setMinExperience(null);
        setMaxExperience(null);
        setDuration("");
        setFormDifficultyLevel(null);
        setFormAssessmentType({ ...DEFAULT_ASSESSMENT_TYPE });
        setDescription("");
        setSkills([]);
        setSkillInput("");
        setPendingAssessmentData(null);

        // Prepare assessment data for Redux store
        // Use response data if available, otherwise construct from form data
        const responseAssessment = assessmentResponse;
        const assessmentData = {
          // Primary identifier - MUST be set correctly for question-add page
          key: assessmentId,
          // Alternative identifiers
          assessment_id: assessmentId,
          id: assessmentId,
          unique_id:
            responseAssessment?.unique_id ||
            response.data?.unique_id ||
            assessmentId,
          // Title/Name
          title:
            responseAssessment?.title ||
            response.data?.title ||
            assessmentName.trim(),
          name:
            responseAssessment?.name ||
            response.data?.name ||
            responseAssessment?.title ||
            response.data?.title ||
            assessmentName.trim(),
          // Form data
          target_role:
            responseAssessment?.target_role ||
            response.data?.target_role ||
            role.trim(),
          skills_required:
            responseAssessment?.skills_required ||
            response.data?.skills_required ||
            skills,
          target_experience:
            responseAssessment?.target_experience ||
            response.data?.target_experience ||
            experience.trim(),
          description:
            responseAssessment?.description ||
            response.data?.description ||
            description.trim() ||
            "",
          assessment_type:
            responseAssessment?.assessment_type ||
            response.data?.assessment_type ||
            formAssessmentType?.label ||
            "Cognitive",
          difficulty_level:
            responseAssessment?.difficulty_level ||
            response.data?.difficulty_level ||
            formDifficultyLevel?.code ||
            "intermediate",
          // Status
          status: shouldPublish
            ? "active"
            : responseAssessment?.status || response.data?.status || "draft",
          // Counts
          section_count:
            responseAssessment?.section_count ||
            response.data?.section_count ||
            0,
          question_count:
            responseAssessment?.question_count ||
            response.data?.question_count ||
            0,
          total_score:
            responseAssessment?.total_score || response.data?.total_score || 0,
          // Timestamps
          created_at:
            responseAssessment?.created_at ||
            response.data?.created_at ||
            new Date().toISOString(),
          updated_at:
            responseAssessment?.updated_at ||
            response.data?.updated_at ||
            new Date().toISOString(),
          // Additional fields that might be needed
          sections:
            responseAssessment?.sections || response.data?.sections || [],
        };

        // Handle default section creation/renaming
        // Check if assessment has sections
        const sections =
          assessmentResponse?.sections || response.data?.sections || [];
        const hasSections = sections.length > 0;

        if (!hasSections && assessmentId) {
          // No sections exist, create "Section 1"
          try {
            const sectionResponse = await createSection(assessmentId, {
              section_name: "Section 1",
              description: "",
            });

            if (!sectionResponse.success) {
              console.warn(
                "Failed to create default section:",
                sectionResponse.data
              );
            }
          } catch (sectionError) {
            console.error("Error creating default section:", sectionError);
            // Don't block navigation if section creation fails
          }
        } else if (hasSections && assessmentId) {
          // Check if any section is named "Untitled Section" and rename it to "Section 1"
          const untitledSection = sections.find(
            (section: any) =>
              section.section_name?.toLowerCase() === "untitled section" ||
              section.section_name?.toLowerCase() === "untitled" ||
              !section.section_name?.trim()
          );

          if (untitledSection && untitledSection.section_id) {
            try {
              const updateResponse = await updateSection(
                assessmentId,
                untitledSection.section_id,
                {
                  section_name: "Section 1",
                  description:
                    untitledSection.description ||
                    untitledSection.instructions ||
                    "",
                }
              );

              if (updateResponse.success) {
                console.log("Renamed 'Untitled Section' to 'Section 1'");
              } else {
                console.warn("Failed to rename section:", updateResponse.data);
              }
            } catch (updateError) {
              console.error("Error renaming section:", updateError);
              // Don't block navigation if rename fails
            }
          }
        }

        // Set the assessment in Redux store for question-add page
        // This ensures the question-add page knows which specific assessment to edit
        dispatch(setCurrentAssessment(assessmentData as any));

        // Refresh the assessments list in the background
        setCurrentPage(1);
        fetchAssessments(1, pageSize, true);

        // Navigate to question-add page to edit this specific assessment
        navigate("/question-add");
      } else {
        // Handle API error
        if (response.status_code === 401) {
          message.error("Authentication failed. Please login again.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        } else {
          message.error(
            `Failed to create assessment: ${
              response.data?.message || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      message.error("Failed to create assessment. Please try again.");
    }
  };

  const handleCreateCognitiveTestOk = async () => {
    const formData = validateAndPrepareFormData();
    if (!formData) {
      return;
    }

    await createAssessment(formData, false);
  };

  // Handle Auto Generate button click
  const handleAutoGenerate = () => {
    const formData = validateAndPrepareFormData();
    if (!formData) {
      return;
    }

    // Store form data and open publish modal
    setPendingAssessmentData(formData);
    setIsPublishModalOpen(true);
  };

  // Handle publish confirmation
  const handlePublishConfirm = async () => {
    if (!pendingAssessmentData) {
      return;
    }

    await createAssessment(pendingAssessmentData, true);
  };

  // Handle keep as draft
  const handleKeepAsDraft = async () => {
    if (!pendingAssessmentData) {
      return;
    }

    await createAssessment(pendingAssessmentData, false);
  };

  // Handle publish modal cancel
  const handlePublishModalCancel = () => {
    setIsPublishModalOpen(false);
    setPendingAssessmentData(null);
  };

  const handleCreateCognitiveTestCancel = () => {
    setIsCreateAssessmentModalOpen(false);

    // Reset form fields
    setAssessmentName("");
    setRole("");
    setExperience("");
    setMinExperience(null);
    setMaxExperience(null);
    setDuration("");
    setFormDifficultyLevel(null);
    setFormAssessmentType({ ...DEFAULT_ASSESSMENT_TYPE });
    setDescription("");
    setSkills([]);
    setSkillInput("");
    setUploadedJD(null);
    setValidationErrors({
      assessmentName: "",
      role: "",
      skills: "",
      experience: "",
    });

    // Reset test type selections
    setSelectedTestType("");
    setSelectedAssessmentTypeForCreation("");
    setSelectedCreationMethod("");
  };

  // Assessment action handlers
  const handleCloneAssessment = (record: TestDataType) => {
    setAssessmentToClone(record);
    const defaultTitle = `${record.name} (Copy)`;
    setCloneTitle(defaultTitle);
    setIsCloneModalOpen(true);
  };

  const handleCloneCancel = () => {
    setIsCloneModalOpen(false);
    setAssessmentToClone(null);
    setCloneTitle("");
    setCloneLoading(false);
  };

  const handleCloneConfirm = async () => {
    if (!assessmentToClone) {
      message.error("Assessment not found");
      return;
    }

    // Get the value from state instead of ref
    const titleValue = cloneTitle.trim();

    // Validate that the user has entered a title
    if (!titleValue || titleValue.length === 0) {
      showToast({
        message: "Give a new assessment name",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      // Focus the input to help user
      const inputElement = cloneTitleInputRef.current?.input as
        | HTMLInputElement
        | undefined;
      if (inputElement) {
        setTimeout(() => inputElement.focus(), 100);
      }
      return;
    }

    // Validate that the new title is different from the parent assessment
    if (titleValue === assessmentToClone.name.trim()) {
      showToast({
        message: "Please provide a different assessment name",
        description:
          "The new assessment title must be different from the parent assessment.",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      // Focus the input to help user
      const inputElement = cloneTitleInputRef.current?.input as
        | HTMLInputElement
        | undefined;
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
          inputElement.select();
        }, 100);
      }
      return;
    }

    const assessmentId = assessmentToClone.key as string;
    setCloneLoading(true);

    try {
      console.log("Calling cloneAssessment API with:", {
        assessmentId,
        title: titleValue,
      });
      const response = await cloneAssessment(assessmentId, titleValue);
      console.log("Clone API response:", response);

      if (response.success) {
        showToast({
          message: "Assessment Cloned Successfully",
          description: `"${titleValue}" has been created successfully.`,
          position: "top-right",
          duration: 4000,
          type: "success",
        });

        // Close modal and reset state
        handleCloneCancel();

        // Refresh the assessments list
        setCurrentPage(1);
        fetchAssessments(1, pageSize, true);
      } else {
        const errorMessage =
          typeof response.data === "string"
            ? response.data
            : response.data?.detail ||
              response.data?.message ||
              "Failed to clone assessment";
        console.error("Clone API error:", errorMessage, response);
        message.error(errorMessage);
      }
    } catch (error) {
      console.error("Error cloning assessment:", error);
      message.error("An error occurred while cloning the assessment");
    } finally {
      setCloneLoading(false);
    }
  };

  const handleDeleteAssessment = (record: TestDataType) => {
    // Set the assessment to delete and open the modal
    setAssessmentToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    const assessmentId = assessmentToDelete.key as string;
    setDeleteLoading(true);

    try {
      // Check if we have the correct assessment ID
      if (!assessmentId || assessmentId === "N/A") {
        message.error("Invalid assessment ID. Cannot delete this assessment.");
        return;
      }

      // Use the deleteAPI method from api.ts
      const response = await deleteAPI(`/assessments/${assessmentId}`);

      if (response.success) {
        showToast({
          message: "Assessment Deleted Successfully",
          description: `"${assessmentToDelete.name}" has been deleted`,
          type: "success",
        });

        // Close the modal
        setIsDeleteModalOpen(false);
        setAssessmentToDelete(null);

        // Refresh the assessments list
        setCurrentPage(1);
        fetchAssessments(1, pageSize, true);

        // Clear any selected rows if the deleted assessment was selected
        if (selectedRowKeys.includes(assessmentId)) {
          setSelectedRowKeys(
            selectedRowKeys.filter((key) => key !== assessmentId)
          );
        }
      } else {
        // Handle API errors - the deleteAPI function already handles 401, 403, 404, 500 errors
        if (response.status_code === 401) {
          message.error("Authentication failed. Please login again.");
        } else if (response.status_code === 403) {
          message.error(
            "Access denied. You do not have permission to delete this assessment."
          );
        } else if (response.status_code === 404) {
          message.error(
            "Assessment not found. It may have been already deleted."
          );
        } else if (response.status_code === 500) {
          message.error("Server error. Please try again later.");
        } else {
          message.error(
            `Failed to delete assessment: ${
              response.data?.message || response.data || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
      message.error("Failed to delete assessment. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setAssessmentToDelete(null);
    setDeleteLoading(false);
  };

  // Map table column keys to API field names
  const getApiFieldName = (columnKey: string) => {
    const fieldMap: { [key: string]: string } = {
      name: "title",
      testCode: "unique_id",
      type: "assessment_type",
      difficulty: "difficulty_level",
      sections: "section_count",
      questions: "question_count",
      invitedVsAttempted: "created_at", // Sort by creation date for invited/attempted
      score: "total_score",
      created: "created_at",
      updated: "updated_at",
      status: "status",
      action: "status", // Sort actions by status (active assessments first)
      inviteStart: "invite_start_date", // Sort by invite start date
      inviteEnd: "invite_end_date", // Sort by invite end date
    };
    return fieldMap[columnKey] || columnKey;
  };

  // Handle table changes (pagination, sorting, etc.)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    closeCustomDateDropdown();
    console.log("🔄 Table change detected:", { pagination, filters, sorter });

    // Update sorted info for UI feedback
    setSortedInfo(sorter);

    // Handle sorting
    if (sorter && sorter.field) {
      const apiFieldName = getApiFieldName(sorter.field);
      console.log("📊 Sorting by:", {
        field: sorter.field,
        apiFieldName,
        order: sorter.order,
        columnKey: sorter.columnKey,
      });
      setSortField(apiFieldName);
      setSortOrder(sorter.order);
      // Reset to first page when sorting changes
      setCurrentPage(1);
      // Pass sort params directly to ensure they're used immediately
      fetchAssessments(1, pageSize, true, apiFieldName, sorter.order);
    } else if (sorter && !sorter.field) {
      // Clear sorting when clicking on the same column again
      console.log("🔄 Clearing sorting");
      setSortField("");
      setSortOrder(null);
      setSortedInfo({});
      setCurrentPage(1);
      fetchAssessments(1, pageSize, true, "", null);
    }
    // Note: Pagination is handled separately by the pagination onChange handler
  };

  const handleAddCollaborators = (record: TestDataType) => {
    console.log("Add collaborators for assessment:", record);
    message.info("Add collaborators functionality coming soon");
  };

  const handleEditAssessment = (record: TestDataType) => {
    console.log("Edit assessment:", record);
    message.info("Edit functionality coming soon");
    dispatch(setCurrentAssessment(record as any));
    navigate("/question-add");
  };

  const handleViewAssessment = async (record: TestDataType) => {
    try {
      console.log("View assessment:", record);
      // Navigate to assessment detail page with unique_id
      navigate(`/assessment-detail/${record.unique_id}`);
    } catch (error) {
      console.error("Error navigating to assessment detail:", error);
    }
  };

  const handleExtendAssessment = (record: TestDataType) => {
    console.log("Extend assessment:", record);
    message.info("Extend functionality coming soon");
  };

  const [isInviteCandidateModalOpen, setIsInviteCandidateModalOpen] =
    useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [resetCandidateList, setResetCandidateList] = useState(false);

  // API State
  const [assessments, setAssessments] = useState<TestDataType[]>([]);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const maxTotalRef = useRef(0); // Store the maximum total count we've seen
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });

  // Custom date dropdown state
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customFromDate, setCustomFromDate] = useState<Dayjs | null>(null);
  const [customToDate, setCustomToDate] = useState<Dayjs | null>(null);
  const customDateForceCloseRef = useRef(false);

  const resetCustomDateSelection = useCallback(() => {
    if (filters.date_from) {
      const fromValue = dayjs(filters.date_from);
      setCustomFromDate(fromValue.isValid() ? fromValue : null);
    } else {
      setCustomFromDate(null);
    }

    if (filters.date_to) {
      const toValue = dayjs(filters.date_to);
      setCustomToDate(toValue.isValid() ? toValue : null);
    } else {
      setCustomToDate(null);
    }
  }, [filters.date_from, filters.date_to]);

  const closeCustomDateDropdown = useCallback(
    (options: { resetSelection?: boolean } = {}) => {
      if (options.resetSelection) {
        resetCustomDateSelection();
      }
      customDateForceCloseRef.current = true;
      setTimeout(() => setIsCustomDateOpen(false), 0);
    },
    [resetCustomDateSelection]
  );

  const handleApplyCustomDate = useCallback(() => {
    const fromDate = customFromDate
      ? customFromDate.startOf("day").format("YYYY-MM-DD")
      : "";
    const toDate = customToDate
      ? customToDate.endOf("day").format("YYYY-MM-DD")
      : "";

    setFilters((prev) => ({
      ...prev,
      date_from: fromDate,
      date_to: toDate,
      timeRange: fromDate || toDate ? `${fromDate}|${toDate}` : "",
    }));
    closeCustomDateDropdown();
    setCurrentPage(1);
  }, [customFromDate, customToDate, closeCustomDateDropdown]);

  const handleResetCustomDate = useCallback(() => {
    setCustomFromDate(null);
    setCustomToDate(null);
    setFilters((prev) => ({
      ...prev,
      date_from: "",
      date_to: "",
      timeRange: "",
    }));
    closeCustomDateDropdown();
    setCurrentPage(1);
  }, [closeCustomDateDropdown]);

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);
  const [sortedInfo, setSortedInfo] = useState<any>({});

  // Retry state
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Fetch assessments from API with pagination
  const fetchAssessments = useCallback(
    async (
      page: number = 1,
      size: number = pageSize,
      resetData: boolean = true,
      customSortField?: string,
      customSortOrder?: "ascend" | "descend" | null
    ) => {
      setLoading(true);

      // Use custom sort params if provided, otherwise use state
      const activeSortField =
        customSortField !== undefined ? customSortField : sortField;
      const activeSortOrder =
        customSortOrder !== undefined ? customSortOrder : sortOrder;

      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          message.error("Authentication token not found");
          return;
        }

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: size.toString(),
          sort_by: activeSortField || "created_at",
          sort_order: activeSortOrder
            ? activeSortOrder === "ascend"
              ? "asc"
              : "desc"
            : "desc",
          include_deleted: "false",
          search_type: "contains",
        });

        // Add search filter
        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }

        // Add status filter
        // Only send status if explicitly set (not empty string)
        // Empty string means "All Status" - don't send the parameter to get all statuses
        if (filters.status && filters.status.trim() !== "") {
          params.append("status", filters.status);
        }

        // Add assessment type filter
        // If assessmentType is explicitly set, use it
        // Otherwise, since we're on the Cognitive page, explicitly send "Cognitive" to ensure backend returns all Cognitive assessments
        if (assessmentType?.code) {
          params.append("assessment_type", assessmentType.code);
        } else {
          // Explicitly send the default assessment type to ensure backend doesn't apply unexpected filters
          params.append("assessment_type", DEFAULT_ASSESSMENT_TYPE.code);
        }

        // Add custom date filters
        if (filters.date_from) {
          const fromDayjs = dayjs(filters.date_from);
          if (fromDayjs.isValid()) {
            const formattedFrom = fromDayjs.startOf("day").format("YYYY-MM-DD");
            params.append("filters[date_range][created_from]", formattedFrom);
            params.append("created_from", formattedFrom);
          }
        }
        if (filters.date_to) {
          const toDayjs = dayjs(filters.date_to);
          if (toDayjs.isValid()) {
            const formattedTo = toDayjs.endOf("day").format("YYYY-MM-DD");
            params.append("filters[date_range][created_to]", formattedTo);
            params.append("created_to", formattedTo);
          }
        }
        if (filters.date_from || filters.date_to) {
          params.append("filters[date_range][date_range_applied]", "true");
        }

        // Use the getAPI method from api.ts
        const apiUrl = `/assessments?${params.toString()}`;
        console.log(`🔍 API Request URL: ${apiUrl}`);
        console.log(`🔍 Request params:`, {
          page: page.toString(),
          page_size: size.toString(),
          sort_by: activeSortField || "created_at",
          sort_order: activeSortOrder
            ? activeSortOrder === "ascend"
              ? "asc"
              : "desc"
            : "desc",
        });
        const data: ApiResponse | null = await getAPI<ApiResponse>(apiUrl);

        if (!data) {
          message.error("Failed to fetch assessments");
          if (resetData) {
            setAssessments([]);
            setTotalAssessments(0);
            setApiData(null);
          }
          return;
        }

        if (!data.assessments || !Array.isArray(data.assessments)) {
          message.warning("No assessment data received from API");
          if (resetData) {
            setAssessments([]);
            setTotalAssessments(0);
            setApiData(null);
          }
          return;
        }

        // Store the API data for use in columns
        setApiData(data);

        // Debug: Log the API response to check how many assessments are returned
        console.log(
          `📊 API Response: Received ${data.assessments.length} assessments, requested page_size: ${size}, page: ${page}`
        );
        console.log(`📊 Pagination info:`, data.pagination);

        // Transform API data to match our table structure
        const transformedData: TestDataType[] = data.assessments.map(
          (item, index) => ({
            key: item.unique_id || index.toString(),
            unique_id: item.unique_id || "",
            name: item.title || "N/A",
            testCode: `#${item.unique_id?.slice(-8) || "N/A"}`,
            invited: item.total_invited || 0,
            taken: item.total_completed || 0,
            sections: (() => {
              const serverCount = parseInt(item.section_count) || 0;
              const actualCount = item.sections?.length || 0;
              // Use the higher of the two counts to ensure consistency
              return Math.max(serverCount, actualCount);
            })(),
            sectionData: item.sections,
            settings: item.settings,
            questions: parseInt(item.question_count) || 0,
            created: item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--",
            ends: "--", // Not available in current API response
            createdBy: "--", // Not available in current API response
            status:
              ((item.status?.charAt(0).toUpperCase() +
                item.status?.slice(1)) as "Draft" | "Active" | "Inactive") ||
              "Draft",
          })
        );

        // Update state based on whether we're resetting or appending data
        if (resetData) {
          setAssessments(transformedData);
          console.log(
            `✅ Set ${transformedData.length} assessments to state (resetData=true)`
          );
        } else {
          setAssessments((prev) => [...prev, ...transformedData]);
          console.log(
            `✅ Appended ${transformedData.length} assessments to state (resetData=false)`
          );
        }

        // Update current page and page size from API response to ensure synchronization
        if (data.pagination?.page) {
          setCurrentPage(data.pagination.page);
        }
        if (
          data.pagination?.page_size &&
          data.pagination.page_size !== pageSize
        ) {
          // If API returns a different page size, update it (shouldn't happen normally, but ensures consistency)
          setPageSize(data.pagination.page_size);
        }

        // Set total count - check pagination object first, then fallback to other fields
        // Always use the API's total count, never use transformedData.length as it's just the current page
        const totalCount =
          data.pagination?.total_count ||
          data.total ||
          data.total_count ||
          data.count ||
          0; // Use 0 instead of transformedData.length to avoid showing page count

        const isFiltered =
          Boolean(filters.status || filters.date_from || filters.date_to) ||
          Boolean(searchTerm.trim()) ||
          Boolean(
            assessmentType?.code &&
              assessmentType.code !== DEFAULT_ASSESSMENT_TYPE.code
          );

        if (isFiltered) {
          maxTotalRef.current = totalCount;
        } else if (totalCount > maxTotalRef.current) {
          maxTotalRef.current = totalCount;
        }

        // Always show the actual total from API, not the page count
        const displayTotal = isFiltered
          ? totalCount
          : maxTotalRef.current > 0
          ? maxTotalRef.current
          : totalCount;
        setTotalAssessments(displayTotal);
        setRetryCount(0); // Reset retry count on success

        if (transformedData.length === 0 && resetData) {
          message.info("No assessments found");
        }

        // Fetch candidate counts from candidate-reports API
        if (resetData && transformedData.length > 0) {
          fetchCandidateCounts(transformedData);
        }
      } catch (error) {
        console.error("Error fetching assessments:", error);

        // Implement retry mechanism
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          message.warning(
            `Failed to fetch assessments. Retrying... (${
              retryCount + 1
            }/${maxRetries})`
          );

          // Retry after 2 seconds
          setTimeout(() => {
            fetchAssessments(page, size, resetData);
          }, 2000);
          return;
        }

        message.error(
          "Failed to fetch assessments after multiple attempts. Please check your connection and try again."
        );
        if (resetData) {
          setAssessments([]);
          setTotalAssessments(0);
          setApiData(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      retryCount,
      maxRetries,
      searchTerm,
      filters.status,
      filters.date_from,
      filters.date_to,
      assessmentType?.code,
      sortField,
      sortOrder,
    ]
  );

  const handlePageChange = useCallback(
    (page: number, newSize?: number) => {
      const actualSize = newSize !== undefined ? newSize : pageSize;
      const isPageSizeChange = newSize !== undefined && newSize !== pageSize;

      if (isPageSizeChange) {
        setPageSize(actualSize);
        setCurrentPage(1);
        setTimeout(() => fetchAssessments(1, actualSize, true), 0);
      } else if (page !== currentPage) {
        setCurrentPage(page);
        setTimeout(() => fetchAssessments(page, actualSize, true), 0);
      }
    },
    [pageSize, currentPage, fetchAssessments]
  );

  const fetchAssessmentsRef = useRef<FetchAssessmentsFn | null>(null);

  const formatDisplayDate = (value: string) => {
    if (!value) {
      return "";
    }
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD MMM YYYY") : "";
  };

  const selectedDateRangeLabel = (() => {
    const from = formatDisplayDate(filters.date_from);
    const to = formatDisplayDate(filters.date_to);

    if (from && to) {
      return `${from} - ${to}`;
    }
    if (from) {
      return `${from} onwards`;
    }
    if (to) {
      return `Until ${to}`;
    }
    return "";
  })();

  useEffect(() => {
    if (!isCustomDateOpen) {
      resetCustomDateSelection();
    }
  }, [
    filters.date_from,
    filters.date_to,
    isCustomDateOpen,
    resetCustomDateSelection,
  ]);

  const handleJDFileSelection = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isJDFileAllowed(file)) {
      showToast({
        message: "Unsupported file format",
        description: "Upload JD as PDF, DOC, DOCX, or TXT.",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    // Check file size (10 MB limit)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      showToast({
        message: "File too large",
        description:
          "JD file size must not exceed 10 MB. Please upload a smaller file.",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    setUploadedJD(file);
    setUploadJDLoading(true);

    try {
      const response = await uploadAndParseJD(file);

      if (response?.success && response.data) {
        const parseData = response.data;
        setJdParseData(parseData);

        // Populate form fields with parsed data
        if (parseData.assessment_name) {
          setAssessmentName(parseData.assessment_name);
        }

        if (parseData.role) {
          setRole(parseData.role);
        }

        if (parseData.skills && Array.isArray(parseData.skills)) {
          // Add skills to the skills array
          setSkills(parseData.skills);
          skillsRef.current = parseData.skills;
        }

        if (
          parseData.experience_min !== undefined &&
          parseData.experience_min !== null
        ) {
          setMinExperience(parseData.experience_min);
        }

        if (
          parseData.experience_max !== undefined &&
          parseData.experience_max !== null
        ) {
          setMaxExperience(parseData.experience_max);
        }

        // Update experience display string
        if (
          parseData.experience_min !== undefined &&
          parseData.experience_max !== undefined
        ) {
          setExperience(
            `${parseData.experience_min}-${parseData.experience_max}`
          );
        }

        showToast({
          message: "JD parsed successfully",
          description: "Form fields have been populated with parsed data.",
          type: "success",
          position: "top-right",
          duration: 4000,
        });
      } else {
        showToast({
          message: "Parsing failed",
          description: "Check the file format and structure and re-upload.",
          type: "error",
          position: "top-right",
          duration: 4000,
        });
        setUploadedJD(null);
      }
    } catch (error) {
      console.error("Error parsing JD:", error);
      showToast({
        message: "Parsing failed",
        description: "Check the file format and structure and re-upload.",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      setUploadedJD(null);
    } finally {
      setUploadJDLoading(false);
    }
  };

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<TestDataType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Clone Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [assessmentToClone, setAssessmentToClone] =
    useState<TestDataType | null>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const cloneTitleInputRef = useRef<InputRef>(null);

  // Set the input value when modal opens
  useEffect(() => {
    if (isCloneModalOpen && assessmentToClone) {
      const defaultTitle = `${assessmentToClone.name} (Copy)`;
      setCloneTitle(defaultTitle);
      // Set input value after a small delay to ensure input is rendered
      setTimeout(() => {
        if (cloneTitleInputRef.current?.input) {
          (cloneTitleInputRef.current.input as HTMLInputElement).value =
            defaultTitle;
        }
      }, 0);
    }
  }, [isCloneModalOpen, assessmentToClone]);

  // Handle input change for clear functionality
  const handleCloneTitleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCloneTitle(e.target.value);
    },
    []
  );

  // Fetch candidate counts from candidate-reports API
  const fetchCandidateCounts = useCallback(
    async (assessmentsList: TestDataType[]) => {
      try {
        // Fetch counts for all assessments in parallel
        const countPromises = assessmentsList.map(async (assessment) => {
          try {
            const response = await getCandidateReports(assessment.unique_id);

            if (response.success && response.data) {
              const data = response.data as any;
              return {
                assessment_id: assessment.unique_id,
                invited: data.summary?.total_invited || 0,
                completed: data.summary?.total_completed || 0,
              };
            }
            return {
              assessment_id: assessment.unique_id,
              invited: 0,
              completed: 0,
            };
          } catch (error) {
            console.error(
              `Error fetching counts for ${assessment.unique_id}:`,
              error
            );
            return {
              assessment_id: assessment.unique_id,
              invited: 0,
              completed: 0,
            };
          }
        });

        const counts = await Promise.all(countPromises);

        // Update assessments with fetched counts
        setAssessments((prev) =>
          prev.map((assessment) => {
            const countData = counts.find(
              (c) => c.assessment_id === assessment.unique_id
            );
            if (countData) {
              return {
                ...assessment,
                invited: countData.invited,
                taken: countData.completed,
              };
            }
            return assessment;
          })
        );
      } catch (error) {
        console.error("Error fetching candidate counts:", error);
      }
    },
    []
  );

  // Fetch assessments on component mount ONLY
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch(clearCurrentAssessment());
    fetchAssessments(1, pageSize, true);

    // Cleanup function to clear search timeout
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Trigger API call when filters change
  useEffect(() => {
    setCurrentPage(1);
    maxTotalRef.current = 0; // Reset max total when filters change
    fetchAssessments(1, pageSize, true);
  }, [
    filters.status,
    filters.date_from,
    filters.date_to,
    assessmentType?.code,
    pageSize,
    fetchAssessments,
  ]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R to refresh
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        setRetryCount(0);
        setCurrentPage(1);
        fetchAssessments(1, pageSize, true);
      }
      // Ctrl/Cmd + F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder="Search assessment..."]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search with debouncing
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    closeCustomDateDropdown();
    setSearchTerm(value);
  };

  // Debounce search term changes
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Determine delay: immediate if empty, 500ms if has content
    const delay = searchTerm.trim() === "" ? 0 : 500;

    // Set a new timeout to search
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      maxTotalRef.current = 0;
      fetchAssessments(1, pageSize, true);
    }, delay);

    // Cleanup on unmount or when searchTerm changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchAssessments, pageSize]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    closeCustomDateDropdown();
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const handleClearAllFilters = useCallback(() => {
    closeCustomDateDropdown();
    setFilters({ ...INITIAL_FILTERS });
    setCustomFromDate(null);
    setCustomToDate(null);
    setSearchTerm("");
    setAssessmentType({ ...DEFAULT_ASSESSMENT_TYPE });
    setCurrentPage(1);
    maxTotalRef.current = 0;
    fetchAssessmentsRef.current?.(1, pageSize, true);
  }, [closeCustomDateDropdown, pageSize]);

  useEffect(() => {
    const handleCognitiveRefresh = () => {
      handleClearAllFilters();
    };

    window.addEventListener("cognitive-refresh", handleCognitiveRefresh);

    return () => {
      window.removeEventListener("cognitive-refresh", handleCognitiveRefresh);
    };
  }, [handleClearAllFilters]);

  const rowSelection = {
    selectedRowKeys: selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  // Clear All Invite Candidate Selection
  const clearAllInviteCandidateSelection = () => {
    setSelectedRowKeys([]);
  };

  // Auto-select candidate when added
  const handleCandidateAdded = (key: React.Key) => {
    setSelectedRowKeys((prev) => [...prev, key]);
  };

  const handleCandidateRemoved = (key: React.Key) => {
    setSelectedRowKeys((prev) =>
      prev.filter((selectedKey) => selectedKey !== key)
    );
  };

  const openInviteCandidateModal = (assessmentId?: string) => {
    if (assessmentId) {
      setSelectedAssessmentId(assessmentId);
    }
    setResetCandidateList(false); // Reset flag when opening
    setIsInviteCandidateModalOpen(true);
  };

  const handleInviteCandidateOk = () => {
    setIsInviteCandidateModalOpen(false);
    setSelectedAssessmentId("");
    setSelectedRowKeys([]);
    setResetCandidateList(true); // Clear candidates after successful invite

    showToast({
      message: `You've successfully sent invites to ${
        selectedRowKeys.length
      } candidate${selectedRowKeys.length > 1 ? "s" : ""}.`,
      description:
        "They will receive an email with further instructions to take the assessment.",
      position: "top-right",
      duration: 3000,
    });
  };

  const handleInviteCandidateCancel = () => {
    setIsInviteCandidateModalOpen(false);
    setSelectedAssessmentId("");
  };

  // Create table columns using the helper function
  const columns = createTableColumns(
    currentPage,
    pageSize,
    apiData,
    navigate,
    openInviteCandidateModal,
    handleCloneAssessment,
    handleDeleteAssessment,
    handleAddCollaborators,
    handleEditAssessment,
    handleViewAssessment,
    handleExtendAssessment,
    sortedInfo,
    isDesktopView
  );

  useEffect(() => {
    fetchAssessmentsRef.current = fetchAssessments;
  }, [fetchAssessments]);

  // Prevent parent Content scroll when this page is mounted
  useEffect(() => {
    const contentElement = document.querySelector(".ant-layout-content");
    if (!contentElement) {
      return;
    }

    const originalOverflow = (contentElement as HTMLElement).style.overflow;

    const handleResize = () => {
      if (window.innerWidth <= 640) {
        (contentElement as HTMLElement).style.overflow = originalOverflow || "";
      } else {
        (contentElement as HTMLElement).style.overflow = "hidden";
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      (contentElement as HTMLElement).style.overflow = originalOverflow || "";
    };
  }, []);

  return (
    <div
      className="cognitive-page max-w-full overflow-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        height: "calc(100vh - 90px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 90px)",
      }}
    >
      <div style={{ flexShrink: 0, padding: "8px 16px", overflow: "visible" }}>
        <AssessmentHeader onClearAllFilters={handleClearAllFilters} />

        {/* Filters and Table Header Row */}
        <Row
          align="middle"
          justify="space-between"
          gutter={[12, 0]}
          className="flex-nowrap"
          style={{ marginTop: "16px", marginBottom: "0px" }}
        >
          {/* Left Side - Total Assessment Count */}
          <Col flex="none">
            <Row align="middle" gutter={[8, 0]} className="flex-nowrap">
              <Col>
                <span
                  className="whitespace-nowrap text-sm sm:text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Total Assessment:{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {loading ? "..." : totalAssessments}
                  </span>
                </span>
              </Col>
              {retryCount > 0 && (
                <Col>
                  <span
                    className="text-xs sm:text-sm"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Retry: {retryCount}/{maxRetries}
                  </span>
                </Col>
              )}
            </Row>
          </Col>

          {/* Right Side - Search, Filters, and Create Assessment Button */}
          <Col className="flex justify-start items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search and Filters */}
            <AssessmentFilters
              searchTerm={searchTerm}
              onSearch={handleSearch}
              loading={loading}
              filters={filters}
              onFilterChange={handleFilterChange}
              isCustomDateOpen={isCustomDateOpen}
              onCustomDateOpenChange={setIsCustomDateOpen}
              customFromDate={customFromDate}
              customToDate={customToDate}
              onCustomFromDateChange={setCustomFromDate}
              onCustomToDateChange={setCustomToDate}
              onCloseCustomDateDropdown={closeCustomDateDropdown}
              onApplyCustomDate={handleApplyCustomDate}
              onResetCustomDate={handleResetCustomDate}
              selectedDateRangeLabel={selectedDateRangeLabel}
              customDateForceCloseRef={customDateForceCloseRef}
            />

            {/* Create Assessment Button */}
            <div style={{ flexShrink: 0 }}>
              <div className="!relative !h-[45px] sm:!h-[50px] !w-[180px] sm:!w-[200px] !rounded-full !overflow-hidden">
                <div
                  className="!absolute !inset-0 !h-[500%] !w-[150%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 90deg at 50% 50%, #1E1E1E 90deg, #C401F7 139deg, #4700EA 180deg, #00A6E8 222deg, #1E1E1E 270deg)",
                  }}
                />

                <div
                  className="!absolute !inset-[2px] !rounded-full !flex !items-center !justify-center"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <Button
                    type="primary"
                    shape="round"
                    icon={<PlusOutlined />}
                    size="middle"
                    className="!border-none !text-sm sm:!text-base"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                    onClick={() => {
                      setSelectedAssessmentTypeForCreation("cognitive");
                      setSelectedTestType("private");
                      setSelectedCreationMethod("manual");
                      setIsCreateAssessmentModalOpen(true);
                    }}
                  >
                    <span className="hidden sm:inline">Create Assessment</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "visible",
          overflowX: "hidden",
          minHeight: 0,
          maxHeight: "100%",
          padding: "0 16px",
          marginTop: "0px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <AssessmentTable
          columns={columns}
          assessments={assessments}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalAssessments={totalAssessments}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onTableChange={handleTableChange}
          onPageChange={handlePageChange}
          onRetry={() => {
            setRetryCount(0);
            setCurrentPage(1);
            fetchAssessments(1, pageSize, true);
          }}
          onCloseCustomDateDropdown={closeCustomDateDropdown}
          fetchAssessments={fetchAssessments}
          isDesktopView={isDesktopView}
        />
      </div>

      {/* Test Type Selection Modal */}
      <Modal
        className="!w-[95vw] sm:!w-[90vw] md:!w-[1200px] !max-w-[1200px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
        open={isTestTypeModalOpen}
        onCancel={handleTestTypeModalCancel}
        footer={null}
        centered
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
          },
          body: {
            color: "var(--text-primary)",
            padding: "40px 50px",
          },
          mask: {
            backdropFilter: "blur(10px)",
            background: "#130E21",
            backgroundSize: "40px 40px",
            backgroundImage: ` linear-gradient(to right, #271C3C 2px, transparent 2px), linear-gradient(to bottom, #271C3C 2px, transparent 2px)`,
          },
        }}
      >
        <Row gutter={[32, 32]} justify="center">
          {/* Private Test */}
          <Col xs={24} md={12}>
            <div
              className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl transition-all duration-300 cursor-pointer border-2 hover:border-[#7C3AED] group"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
                minHeight: "420px",
              }}
              onClick={() => handleTestTypeSelection("private")}
            >
              <Title
                level={3}
                className="!text-xl sm:!text-2xl !mb-4 text-center"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                Private Test
              </Title>
              <Paragraph
                className="!text-sm sm:!text-base !mb-6 text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Only invited candidates can participate
              </Paragraph>

              {/* Illustration */}
              <div className="flex items-center justify-center mb-6 gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] mb-1"></div>
                  <div
                    className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                    style={{ backgroundColor: "#4A90E2" }}
                  ></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#5A9FD4] mb-1"></div>
                  <div
                    className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                    style={{ backgroundColor: "#5A9FD4" }}
                  ></div>
                </div>
                <div
                  className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                  style={{ borderColor: "var(--text-primary)" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED] mb-1"></div>
                  <div
                    className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                    style={{ backgroundColor: "#7C3AED" }}
                  ></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] mb-1"></div>
                  <div
                    className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                    style={{ backgroundColor: "#4A90E2" }}
                  ></div>
                </div>
                <div
                  className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                  style={{ borderColor: "var(--text-primary)" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#6B4E71] mb-1"></div>
                  <div
                    className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                    style={{ backgroundColor: "#6B4E71" }}
                  ></div>
                </div>
              </div>

              <Button
                type="primary"
                size="middle"
                className="!rounded-lg !font-semibold group-hover:!bg-[#6B21B6]"
                style={{
                  backgroundColor: "#5B21B6",
                  borderColor: "#5B21B6",
                  color: "#ffffff",
                }}
              >
                Continue
              </Button>
            </div>
          </Col>

          {/* Public Test */}
          <Col xs={24} md={12}>
            <div
              className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl transition-all duration-300 cursor-pointer border-2 hover:border-[#7C3AED] group"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
                minHeight: "420px",
              }}
              onClick={() => handleTestTypeSelection("public")}
            >
              <Title
                level={3}
                className="!text-xl sm:!text-2xl !mb-4 text-center"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                Public Test
              </Title>
              <Paragraph
                className="!text-sm sm:!text-base !mb-6 text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Candidates with the test link can participate
              </Paragraph>

              {/* Illustration */}
              <div className="flex items-center justify-center mb-6 relative">
                <div
                  className="border-4 border-dashed rounded-2xl p-4"
                  style={{ borderColor: "var(--text-primary)" }}
                >
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#8B4513] mb-1"></div>
                      <div
                        className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                        style={{ backgroundColor: "#8B4513" }}
                      ></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#A0522D] mb-1"></div>
                      <div
                        className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                        style={{ backgroundColor: "#A0522D" }}
                      ></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED] mb-1"></div>
                      <div
                        className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                        style={{ backgroundColor: "#7C3AED" }}
                      ></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] mb-1"></div>
                      <div
                        className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                        style={{ backgroundColor: "#4A90E2" }}
                      ></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#5A9FD4] mb-1"></div>
                      <div
                        className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full"
                        style={{ backgroundColor: "#5A9FD4" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                size="middle"
                className="!rounded-lg !font-semibold group-hover:!bg-[#6B21B6]"
                style={{
                  backgroundColor: "#5B21B6",
                  borderColor: "#5B21B6",
                  color: "#ffffff",
                }}
              >
                Continue
              </Button>
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Creation Method Selection Modal (Pre-defined vs Manual) */}
      <Modal
        className="!w-[95vw] sm:!w-[90vw] md:!w-[1100px] !max-w-[1100px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
        open={isCreationMethodModalOpen}
        onCancel={handleCreationMethodModalCancel}
        footer={null}
        centered
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
          },
          body: {
            color: "var(--text-primary)",
            padding: "20px",
          },
          mask: {
            backdropFilter: "blur(10px)",
            background: "#130E21",
            backgroundSize: "40px 40px",
            backgroundImage: ` linear-gradient(to right, #271C3C 2px, transparent 2px), linear-gradient(to bottom, #271C3C 2px, transparent 2px)`,
          },
        }}
      >
        {/* Back Button and Header */}
        <div className="mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleSwitchTestType}
            className="!text-base sm:!text-lg !p-2 hover:!bg-transparent"
            style={{ color: "var(--text-primary)" }}
          >
            Back
          </Button>
        </div>

        <Row gutter={[48, 32]}>
          {/* Left Side - Private Test Info */}
          <Col xs={24} md={10}>
            <div className="flex flex-col h-full justify-center">
              <Title
                level={2}
                className="!text-2xl sm:!text-3xl md:!text-4xl !mb-4"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                {selectedTestType === "private"
                  ? "Private Test"
                  : "Public Test"}
              </Title>
              <Paragraph
                className="!text-base sm:!text-lg !mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                {selectedTestType === "private"
                  ? "Only invited candidates can participate"
                  : "Candidates with the test link can participate"}
              </Paragraph>

              {/* Illustration */}
              {selectedTestType === "private" ? (
                <div className="flex items-center justify-start mb-8 gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                    <div
                      className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                      style={{ backgroundColor: "#4A90E2" }}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                    <div
                      className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                      style={{ backgroundColor: "#5A9FD4" }}
                    ></div>
                  </div>
                  <div
                    className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                    style={{ borderColor: "var(--text-primary)" }}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                    <div
                      className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                      style={{ backgroundColor: "#7C3AED" }}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                    <div
                      className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                      style={{ backgroundColor: "#4A90E2" }}
                    ></div>
                  </div>
                  <div
                    className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                    style={{ borderColor: "var(--text-primary)" }}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6B4E71] mb-1"></div>
                    <div
                      className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                      style={{ backgroundColor: "#6B4E71" }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-start mb-8 relative">
                  <div
                    className="border-4 border-dashed rounded-2xl p-4"
                    style={{ borderColor: "var(--text-primary)" }}
                  >
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#8B4513] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#8B4513" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#A0522D] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#A0522D" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#7C3AED" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#4A90E2" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#5A9FD4" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  type="default"
                  size="large"
                  className="!rounded-lg !font-semibold !px-4 !text-sm !mr-16 hover:!bg-[#4C1D95]"
                  style={{
                    backgroundColor: "#5B21B6",
                    borderColor: "#5B21B6",
                    color: "#ffffff",
                    maxWidth: "fit-content",
                  }}
                  onClick={handleSwitchTestType}
                >
                  Switch to{" "}
                  {selectedTestType === "private" ? "Public" : "Private"} test
                </Button>
              </div>
            </div>
          </Col>

          {/* Right Side - Creation Methods */}
          <Col xs={24} md={14}>
            <Row gutter={[24, 24]}>
              {/* Pre-defined Option */}
              <Col xs={24}>
                <div
                  className="p-6 rounded-xl transition-all duration-300 border-2"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <Title
                        level={3}
                        className="!text-xl sm:!text-2xl !mb-3"
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        Pre-Defined
                      </Title>
                      <Paragraph
                        className="!text-sm sm:!text-base !mb-0"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Our Machine learning and Artificial Intelligence engine
                        will create tests for you.
                      </Paragraph>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      className="!rounded-lg !font-semibold !px-8 hover:!bg-[#6B21B6]"
                      style={{
                        backgroundColor: "#5B21B6",
                        borderColor: "#5B21B6",
                        color: "#ffffff",
                        minWidth: "120px",
                      }}
                      onClick={() =>
                        handleCreationMethodSelection("predefined")
                      }
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </Col>

              {/* Manual Option */}
              <Col xs={24}>
                <div
                  className="p-6 rounded-xl transition-all duration-300 border-2"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <Title
                        level={3}
                        className="!text-xl sm:!text-2xl !mb-3"
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        Manual
                      </Title>
                      <Paragraph
                        className="!text-sm sm:!text-base !mb-0"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Choose questions from APW library or your library.
                      </Paragraph>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      className="!rounded-lg !font-semibold !px-8 hover:!bg-[#6B21B6]"
                      style={{
                        backgroundColor: "#5B21B6",
                        borderColor: "#5B21B6",
                        color: "#ffffff",
                        minWidth: "120px",
                      }}
                      onClick={() => handleCreationMethodSelection("manual")}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Modal>

      {/* Create Assessment Modal */}
      <Modal
        className={
          selectedCreationMethod === "predefined"
            ? "!w-[95vw] sm:!w-[90vw] md:!w-[1300px] !max-w-[1300px] [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5 [&_.ant-modal-close-x]:!text-base sm:!text-lg"
            : "!w-[95vw] sm:!w-[90vw] md:!w-[682px] !max-w-[682px] [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5 [&_.ant-modal-close-x]:!text-base sm:!text-lg"
        }
        centered
        getContainer={false}
        destroyOnHidden={false}
        maskClosable={false}
        keyboard={true}
        title={
          selectedCreationMethod === "predefined" ? null : (
            <Row
              justify="center"
              align="middle"
              style={{ marginBottom: "20px" }}
              className="sm:!mb-[30px]"
            >
              <Col span={24} style={{ textAlign: "center" }}>
                <Title
                  level={4}
                  className="!text-lg sm:!text-xl md:!text-2xl !mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Create{" "}
                  {selectedAssessmentTypeForCreation === "oto_video"
                    ? "Oto_Video"
                    : selectedAssessmentTypeForCreation
                        .charAt(0)
                        .toUpperCase() +
                      selectedAssessmentTypeForCreation.slice(1)}{" "}
                  Test
                </Title>
                <Paragraph
                  className="!font-medium !text-sm sm:!text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Let AI craft your perfect test — or build one your own way
                </Paragraph>
              </Col>
            </Row>
          )
        }
        open={isCreateAssessmentModalOpen}
        onCancel={handleCreateCognitiveTestCancel}
        footer={null}
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
          },
          body: {
            color: "var(--text-primary)",
            padding:
              selectedCreationMethod === "predefined" ? "40px 60px" : undefined,
            minHeight: "600px",
            maxHeight: "80vh",
            overflowY: "auto",
          },
          mask: {
            backdropFilter: "blur(2px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
          footer: {
            borderTop: "1px solid #333",
          },
        }}
      >
        {/* Pre-defined Layout */}
        {selectedCreationMethod === "predefined" && (
          <>
            {/* Back Button */}
            <div className="mb-6">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setIsCreateAssessmentModalOpen(false);
                  setIsCreationMethodModalOpen(true);
                }}
                className="!text-base sm:!text-lg !p-2 hover:!bg-transparent"
                style={{ color: "var(--text-primary)" }}
              >
                Back
              </Button>
            </div>

            <Row gutter={[48, 32]}>
              {/* Left Side - Test Type Info */}
              <Col xs={24} md={10}>
                <div className="flex flex-col h-full justify-center">
                  <Title
                    level={2}
                    className="!text-2xl sm:!text-3xl md:!text-4xl !mb-4"
                    style={{ color: "var(--text-primary)", fontWeight: 600 }}
                  >
                    {selectedTestType === "private"
                      ? "Private Test"
                      : "Public Test"}
                  </Title>
                  <Paragraph
                    className="!text-base sm:!text-lg !mb-8"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedTestType === "private"
                      ? "Only invited candidates can participate"
                      : "Candidates with the test link can participate"}
                  </Paragraph>

                  {/* Illustration */}
                  {selectedTestType === "private" ? (
                    <div className="flex items-center justify-start mb-8 gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#4A90E2" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#5A9FD4" }}
                        ></div>
                      </div>
                      <div
                        className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                        style={{ borderColor: "var(--text-primary)" }}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#7C3AED" }}
                        ></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#4A90E2" }}
                        ></div>
                      </div>
                      <div
                        className="flex flex-col items-center border-2 border-dashed rounded-lg p-2"
                        style={{ borderColor: "var(--text-primary)" }}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6B4E71] mb-1"></div>
                        <div
                          className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                          style={{ backgroundColor: "#6B4E71" }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start mb-8 relative">
                      <div
                        className="border-4 border-dashed rounded-2xl p-4"
                        style={{ borderColor: "var(--text-primary)" }}
                      >
                        <div className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#8B4513] mb-1"></div>
                            <div
                              className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                              style={{ backgroundColor: "#8B4513" }}
                            ></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#A0522D] mb-1"></div>
                            <div
                              className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                              style={{ backgroundColor: "#A0522D" }}
                            ></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                            <div
                              className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                              style={{ backgroundColor: "#7C3AED" }}
                            ></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                            <div
                              className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                              style={{ backgroundColor: "#4A90E2" }}
                            ></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                            <div
                              className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full"
                              style={{ backgroundColor: "#5A9FD4" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      type="default"
                      size="large"
                      className="!rounded-lg !font-semibold !px-4 !text-sm !mr-16 hover:!bg-[#4C1D95]"
                      style={{
                        backgroundColor: "#5B21B6",
                        borderColor: "#5B21B6",
                        color: "#ffffff",
                        maxWidth: "fit-content",
                      }}
                      onClick={handleSwitchTestType}
                    >
                      Switch to{" "}
                      {selectedTestType === "private" ? "Public" : "Private"}{" "}
                      test
                    </Button>
                  </div>
                </div>
              </Col>

              {/* Right Side - Form */}
              <Col xs={24} md={14}>
                <Row gutter={[0, 20]}>
                  {/* Duration */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Duration{" "}
                    </Text>
                    <Text className="!text-red-500 !font-medium !text-sm sm:!text-base">
                      *
                    </Text>
                    <div className="mt-2 relative">
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="!h-10 !w-full !pl-4 !pr-10 !rounded-xl !text-sm sm:!text-base !outline-none !cursor-pointer appearance-none"
                        style={{
                          color: duration
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-primary)",
                          border: "1px solid var(--border-primary)",
                        }}
                      >
                        <option
                          value=""
                          disabled
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Select duration
                        </option>
                        {durationOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1L6 6L11 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: "var(--text-primary)" }}
                          />
                        </svg>
                      </div>
                    </div>
                  </Col>

                  {/* Upload JD */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Upload JD{" "}
                    </Text>
                    <Text
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      (Optional)
                    </Text>
                    <div className="mt-2 flex gap-2 relative">
                      <Input
                        className="!h-10 !pl-4 !rounded-xl !text-sm sm:!text-base flex-1"
                        style={{
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-primary)",
                        }}
                        placeholder="Choose file"
                        value={uploadedJD?.name || ""}
                        readOnly
                        disabled={uploadJDLoading}
                      />
                      <input
                        type="file"
                        id="jd-file-upload"
                        accept=".pdf,.doc,.docx,.txt"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const fileInput = e.target;
                          const file = fileInput.files?.[0] ?? null;
                          if (file) {
                            handleJDFileSelection(file);
                          }
                          fileInput.value = "";
                        }}
                        disabled={uploadJDLoading}
                      />
                      <Button
                        className="!h-10 !rounded-xl !px-6 !font-semibold hover:!bg-[#4C1D95]"
                        style={{
                          backgroundColor: "#5B21B6",
                          borderColor: "#5B21B6",
                          color: "#ffffff",
                        }}
                        onClick={() => {
                          if (!uploadJDLoading) {
                            document.getElementById("jd-file-upload")?.click();
                          }
                        }}
                        loading={uploadJDLoading}
                        disabled={uploadJDLoading}
                      >
                        {uploadJDLoading ? "Parsing..." : "Browse"}
                      </Button>
                      {uploadJDLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] rounded-xl z-10">
                          <Spin size="large" tip="Parsing JD file...">
                            <div style={{ width: 200, height: 50 }} />
                          </Spin>
                        </div>
                      )}
                    </div>
                    {uploadJDLoading && (
                      <Text
                        className="!text-xs !mt-1 block"
                        style={{ color: "#7C3AED", fontWeight: 500 }}
                      >
                        Parsing job description and extracting information...
                      </Text>
                    )}
                    {!uploadJDLoading && (
                      <Text
                        className="!text-xs !mt-1 block"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Choose only pdf,docx,doc or txt file
                      </Text>
                    )}
                  </Col>

                  {/* Experience */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base block mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Experience{" "}
                      <Text className="!text-red-500 !font-medium !text-sm sm:!text-base">
                        *
                      </Text>
                    </Text>
                    <Row gutter={[8, 0]} align="middle">
                      <Col span={11}>
                        <CustomSelect
                          placeholder="Min"
                          prefix={<></>}
                          options={experienceOptions}
                          selectedBg="#1D1D23"
                          value={minExperience}
                          onChange={(value) => {
                            // Validate min is not greater than max
                            if (
                              maxExperience !== null &&
                              value !== null &&
                              value > maxExperience
                            ) {
                              showToast({
                                message: "Validation Error",
                                description:
                                  "Minimum experience cannot be greater than maximum experience",
                                type: "error",
                                position: "top-right",
                                duration: 3000,
                              });
                              return;
                            }
                            setMinExperience(value);
                            // Update experience string
                            if (value !== null) {
                              setExperience(
                                maxExperience !== null
                                  ? `${value}-${maxExperience}`
                                  : `${value}`
                              );
                            } else {
                              setExperience(
                                maxExperience !== null ? `${maxExperience}` : ""
                              );
                            }
                            // Auto-set difficulty level based on experience
                            autoSetDifficultyLevel(value, maxExperience);
                            // Clear validation error
                            if (validationErrors.experience) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                experience: "",
                              }));
                            }
                          }}
                          className="!w-full"
                        />
                      </Col>
                      <Col
                        span={2}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingTop: 0,
                          paddingBottom: 0,
                        }}
                      >
                        <Text
                          style={{
                            color: "var(--text-primary)",
                            fontSize: "18px",
                            lineHeight: "1",
                            margin: 0,
                          }}
                        >
                          -
                        </Text>
                      </Col>
                      <Col span={11}>
                        <CustomSelect
                          placeholder="Max"
                          prefix={<></>}
                          options={getMaxExperienceOptions(minExperience)}
                          selectedBg="#1D1D23"
                          value={maxExperience}
                          onChange={(value) => {
                            // Validate max is not less than min
                            if (
                              minExperience !== null &&
                              value !== null &&
                              value < minExperience
                            ) {
                              showToast({
                                message: "Validation Error",
                                description:
                                  "Maximum experience cannot be less than minimum experience",
                                type: "error",
                                position: "top-right",
                                duration: 3000,
                              });
                              return;
                            }
                            setMaxExperience(value);
                            // Update experience string
                            if (value !== null) {
                              setExperience(
                                minExperience !== null
                                  ? `${minExperience}-${value}`
                                  : `${value}`
                              );
                            } else {
                              setExperience(
                                minExperience !== null ? `${minExperience}` : ""
                              );
                            }
                            // Auto-set difficulty level based on experience
                            autoSetDifficultyLevel(minExperience, value);
                            // Clear validation error
                            if (validationErrors.experience) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                experience: "",
                              }));
                            }
                          }}
                          className="!w-full"
                        />
                      </Col>
                    </Row>
                    {validationErrors.experience && (
                      <Text
                        className="!text-xs !mt-1 block"
                        style={{ color: "#ff4d4f" }}
                      >
                        {validationErrors.experience}
                      </Text>
                    )}
                  </Col>

                  {/* Skill (s) */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Skill (s){" "}
                    </Text>
                    <Text className="!text-red-500 !font-medium !text-sm sm:!text-base">
                      *
                    </Text>
                    <div className="mt-2" style={{ position: "relative" }}>
                      <AutoComplete
                        className="!w-full"
                        value={skillInput}
                        onChange={handleSkillInputChange}
                        onSelect={(value) => {
                          // Add skill and immediately clear input to prevent duplicate adds
                          handleAddSkillWithValidation(value, false);
                          setSkillInput("");
                          setSkillSuggestions([]);
                        }}
                        onBlur={() => {
                          // Clear input on blur to prevent duplicate adds when Enter is pressed after selection
                          setTimeout(() => {
                            setSkillInput("");
                            setSkillSuggestions([]);
                          }, 100);
                        }}
                        options={skillSuggestions.map((suggestion) => ({
                          value: suggestion.value,
                          label: (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>{suggestion.label}</span>
                              <Tag
                                color={
                                  suggestion.category === "tech"
                                    ? "blue"
                                    : "purple"
                                }
                                style={{ marginLeft: 8, fontSize: "12px" }}
                              >
                                {suggestion.category === "tech"
                                  ? "Tech"
                                  : "Non-Tech"}
                              </Tag>
                            </div>
                          ),
                        }))}
                        filterOption={false}
                      >
                        <Input
                          id="skill-input-form"
                          className="!h-10 !pl-4 !rounded-xl !text-sm sm:!text-base !w-full"
                          style={{
                            color: "var(--text-primary)",
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: validationErrors.skills
                              ? "#ff4d4f"
                              : "var(--border-primary)",
                            width: "100%",
                          }}
                          placeholder={
                            skills.length === 0 && !skillInput
                              ? "e.g., JavaScript, Python, React"
                              : ""
                          }
                          onPressEnter={(e) => {
                            e.preventDefault();
                            if (skillInput.trim()) {
                              // Check if the input exactly matches a suggestion (case-insensitive)
                              const exactMatch = skillSuggestions.find(
                                (suggestion) =>
                                  suggestion.value.toLowerCase() ===
                                    skillInput.trim().toLowerCase() ||
                                  suggestion.label.toLowerCase() ===
                                    skillInput.trim().toLowerCase()
                              );

                              // If there's an exact match, don't add via Enter (it should be added via onSelect)
                              // Only add if it doesn't match any suggestion
                              if (!exactMatch) {
                                // Handle comma-separated values on Enter
                                const skillsToAdd = skillInput
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter((s) => s);
                                if (skillsToAdd.length > 0) {
                                  skillsToAdd.forEach((skill) =>
                                    handleAddSkillWithValidation(skill, false)
                                  );
                                  setSkillInput("");
                                  setSkillSuggestions([]);
                                }
                              } else {
                                // If exact match exists, just clear the input
                                setSkillInput("");
                                setSkillSuggestions([]);
                              }
                            }
                          }}
                        />
                      </AutoComplete>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                          {skills.map((skill) => (
                            <Tag
                              key={skill}
                              className="!bg-[#780dea] !text-white !border-none !text-xs sm:!text-sm"
                              closable
                              onClose={() => handleRemoveSkill(skill)}
                            >
                              {skill}
                            </Tag>
                          ))}
                        </div>
                      )}
                      {!validationErrors.skills && skills.length === 0 && (
                        <Text
                          className="!text-xs !mt-3 block"
                          style={{
                            color: "var(--text-secondary)",
                            lineHeight: "1.5",
                          }}
                        >
                          {/* Type skills separated by comma or press Enter */}
                        </Text>
                      )}
                      {validationErrors.skills && (
                        <Text
                          className="!text-xs !mt-3 block"
                          style={{ color: "#ff4d4f", lineHeight: "1.5" }}
                        >
                          {validationErrors.skills}
                        </Text>
                      )}
                    </div>
                  </Col>

                  {/* Save & Continue Button */}
                  <Col span={24}>
                    <button
                      className="flex justify-center rounded-lg py-2.5 sm:py-3 w-full font-semibold cursor-pointer text-sm sm:!text-base mt-4"
                      style={{
                        backgroundColor: "#5B21B6",
                        color: "#ffffff",
                        borderColor: "#5B21B6",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#4C1D95";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#5B21B6";
                      }}
                      onClick={handleCreateCognitiveTestOk}
                    >
                      Save & Continue
                    </button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        )}

        {/* Manual/Original Layout */}
        {selectedCreationMethod !== "predefined" && (
          <>
            {/* Job Description Upload Section */}
            <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
              <Col span={24}>
                <Text
                  strong
                  className="!text-sm sm:!text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Job Description{" "}
                </Text>
                <Text
                  className="!text-sm sm:!text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  (Optional)
                </Text>
                <div
                  className="mt-2 p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative"
                  style={{
                    borderColor: isDragOver
                      ? "#7C3AED"
                      : uploadJDLoading
                      ? "#7C3AED"
                      : "var(--border-primary)",
                    backgroundColor: isDragOver
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                    cursor: uploadJDLoading ? "not-allowed" : "pointer",
                    opacity: uploadJDLoading ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (!uploadJDLoading) {
                      const fileInput = document.getElementById(
                        "manual-jd-upload"
                      ) as HTMLInputElement;
                      fileInput?.click();
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!uploadJDLoading) {
                      setIsDragOver(true);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!uploadJDLoading) {
                      setIsDragOver(true);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);

                    if (uploadJDLoading) {
                      return;
                    }

                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      handleJDFileSelection(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    id="manual-jd-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const fileInput = e.target;
                      const file = fileInput.files?.[0] ?? null;
                      if (file && !uploadJDLoading) {
                        handleJDFileSelection(file);
                      }
                      fileInput.value = "";
                    }}
                    disabled={uploadJDLoading}
                  />
                  {uploadJDLoading ? (
                    <>
                      <Spin size="large" tip="Parsing JD file..." />
                      <Text
                        className="!text-sm sm:!text-base !mt-3"
                        style={{ color: "#7C3AED", fontWeight: 500 }}
                      >
                        Parsing job description...
                      </Text>
                      <Text
                        className="!text-xs sm:!text-sm !mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Extracting information from JD
                      </Text>
                    </>
                  ) : uploadedJD ? (
                    <>
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }login/envelope-simple.svg`}
                        className="w-8 h-8 mb-2"
                        style={{ filter: "var(--icon-filter)" }}
                        alt="File"
                      />
                      <Text
                        className="!text-sm sm:!text-base"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {uploadedJD.name} Uploaded
                      </Text>
                      <Text
                        className="!text-xs sm:!text-sm mt-1 underline cursor-pointer"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Upload new
                      </Text>
                    </>
                  ) : (
                    <>
                      <img
                        src={`${
                          import.meta.env.BASE_URL
                        }login/envelope-simple.svg`}
                        className="w-8 h-8 mb-2"
                        style={{ filter: "var(--icon-filter)" }}
                        alt="Upload"
                      />
                      <Text
                        className="!text-sm sm:!text-base"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Upload or Drag and Drop the JD (PDF or DOCX)
                      </Text>
                      <Text
                        className="!text-xs sm:!text-sm mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Supported Formats: PDF, DOCX
                      </Text>
                    </>
                  )}
                </div>
              </Col>
            </Row>

            {/* Assessment Name - Full width */}
            <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
              <Col span={24}>
                <Text
                  strong
                  className="!text-sm sm:!text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Assessment Name{" "}
                </Text>
                <Text
                  className="!text-sm sm:!text-base"
                  style={{ color: "#ff4d4f" }}
                >
                  (Required)
                </Text>
                <Input
                  className="!h-9 sm:!h-10 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: validationErrors.assessmentName
                      ? "#ff4d4f"
                      : "var(--border-primary)",
                  }}
                  placeholder="Enter assessment name"
                  value={assessmentName}
                  onChange={handleAssessmentNameChange}
                  required
                />
                {validationErrors.assessmentName && (
                  <Text
                    className="!text-xs sm:!text-sm !mt-1 block"
                    style={{ color: "#ff4d4f" }}
                  >
                    {validationErrors.assessmentName}
                  </Text>
                )}
              </Col>
            </Row>

            {/* Role and Experience in 2 columns */}
            <Row
              gutter={[16, 0]}
              style={{ marginBottom: "20px" }}
              className="sm:!mb-[30px]"
            >
              <Col xs={24} sm={12}>
                <Text
                  strong
                  className="!text-sm sm:!text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Role{" "}
                </Text>
                <Text
                  className="!text-sm sm:!text-base"
                  style={{ color: "#ff4d4f" }}
                >
                  (Required)
                </Text>
                <Input
                  className="!h-9 sm:!h-10 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: validationErrors.role
                      ? "#ff4d4f"
                      : "var(--border-primary)",
                  }}
                  placeholder="Enter role"
                  value={role}
                  onChange={handleRoleChange}
                  required
                />
                {validationErrors.role && (
                  <Text
                    className="!text-xs sm:!text-sm !mt-1 block"
                    style={{ color: "#ff4d4f" }}
                  >
                    {validationErrors.role}
                  </Text>
                )}
              </Col>

              <Col xs={24} sm={12}>
                <Text
                  strong
                  className="!text-sm sm:!text-base block mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Experience{" "}
                  <Text
                    className="!text-sm sm:!text-base"
                    style={{ color: "#ff4d4f", fontWeight: "normal" }}
                  >
                    (Required)
                  </Text>
                </Text>
                <Row gutter={[8, 0]} align="middle">
                  <Col span={11}>
                    <CustomSelect
                      placeholder="Min"
                      prefix={<></>}
                      options={experienceOptions}
                      selectedBg="#1D1D23"
                      value={minExperience}
                      onChange={(value) => {
                        // Validate min is not greater than max
                        if (
                          maxExperience !== null &&
                          value !== null &&
                          value > maxExperience
                        ) {
                          showToast({
                            message: "Validation Error",
                            description:
                              "Minimum experience cannot be greater than maximum experience",
                            type: "error",
                            position: "top-right",
                            duration: 3000,
                          });
                          return;
                        }
                        setMinExperience(value);
                        // Update experience string
                        if (value !== null) {
                          setExperience(
                            maxExperience !== null
                              ? `${value}-${maxExperience}`
                              : `${value}`
                          );
                        } else {
                          setExperience(
                            maxExperience !== null ? `${maxExperience}` : ""
                          );
                        }
                        // Auto-set difficulty level based on experience
                        autoSetDifficultyLevel(value, maxExperience);
                        // Clear validation error
                        if (validationErrors.experience) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            experience: "",
                          }));
                        }
                      }}
                      className="!w-full"
                    />
                  </Col>
                  <Col
                    span={2}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  >
                    <Text
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        lineHeight: "1",
                        margin: 0,
                      }}
                    >
                      -
                    </Text>
                  </Col>
                  <Col span={11}>
                    <CustomSelect
                      placeholder="Max"
                      prefix={<></>}
                      options={getMaxExperienceOptions(minExperience)}
                      selectedBg="#1D1D23"
                      value={maxExperience}
                      onChange={(value) => {
                        // Validate max is not less than min
                        if (
                          minExperience !== null &&
                          value !== null &&
                          value < minExperience
                        ) {
                          showToast({
                            message: "Validation Error",
                            description:
                              "Maximum experience cannot be less than minimum experience",
                            type: "error",
                            position: "top-right",
                            duration: 3000,
                          });
                          return;
                        }
                        setMaxExperience(value);
                        // Update experience string
                        if (value !== null) {
                          setExperience(
                            minExperience !== null
                              ? `${minExperience}-${value}`
                              : `${value}`
                          );
                        } else {
                          setExperience(
                            minExperience !== null ? `${minExperience}` : ""
                          );
                        }
                        // Auto-set difficulty level based on experience
                        autoSetDifficultyLevel(minExperience, value);
                        // Clear validation error
                        if (validationErrors.experience) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            experience: "",
                          }));
                        }
                      }}
                      className="!w-full"
                    />
                  </Col>
                </Row>
                {validationErrors.experience && (
                  <Text
                    className="!text-xs !mt-1 block"
                    style={{ color: "#ff4d4f" }}
                  >
                    {validationErrors.experience}
                  </Text>
                )}
              </Col>
            </Row>

            {/* Skill (s) - Full Width */}
            <Row
              gutter={[16, 0]}
              style={{ marginBottom: "20px" }}
              className="sm:!mb-[30px]"
            >
              <Col xs={24} span={24}>
                <Text
                  strong
                  className="!text-sm sm:!text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Skill(s){" "}
                </Text>
                <Text
                  className="!text-sm sm:!text-base"
                  style={{ color: "#ff4d4f" }}
                >
                  (Required)
                </Text>
                <div className="mt-2" style={{ position: "relative" }}>
                  <AutoComplete
                    className="!w-full"
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    onSelect={(value) => {
                      // Add skill and immediately clear input to prevent duplicate adds
                      handleAddSkillWithValidation(value, false);
                      setSkillInput("");
                      setSkillSuggestions([]);
                    }}
                    onBlur={() => {
                      // Clear input on blur to prevent duplicate adds when Enter is pressed after selection
                      setTimeout(() => {
                        setSkillInput("");
                        setSkillSuggestions([]);
                      }, 100);
                    }}
                    options={skillSuggestions.map((suggestion) => ({
                      value: suggestion.value,
                      label: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{suggestion.label}</span>
                          <Tag
                            color={
                              suggestion.category === "tech" ? "blue" : "purple"
                            }
                            style={{ marginLeft: 8, fontSize: "12px" }}
                          >
                            {suggestion.category === "tech"
                              ? "Tech"
                              : "Non-Tech"}
                          </Tag>
                        </div>
                      ),
                    }))}
                    filterOption={false}
                  >
                    <Input
                      id="skill-input"
                      className="!h-9 sm:!h-10 !pl-4 sm:!pl-5 !rounded-xl !text-sm sm:!text-base !w-full"
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: validationErrors.skills
                          ? "#ff4d4f"
                          : "var(--border-primary)",
                        width: "100%",
                      }}
                      placeholder={
                        skills.length === 0 && !skillInput
                          ? "e.g., JavaScript, Python, React"
                          : ""
                      }
                      onPressEnter={(e) => {
                        e.preventDefault();
                        if (skillInput.trim()) {
                          // Check if the input exactly matches a suggestion (case-insensitive)
                          const exactMatch = skillSuggestions.find(
                            (suggestion) =>
                              suggestion.value.toLowerCase() ===
                                skillInput.trim().toLowerCase() ||
                              suggestion.label.toLowerCase() ===
                                skillInput.trim().toLowerCase()
                          );

                          // If there's an exact match, don't add via Enter (it should be added via onSelect)
                          // Only add if it doesn't match any suggestion
                          if (!exactMatch) {
                            // Handle comma-separated values on Enter
                            const skillsToAdd = skillInput
                              .split(",")
                              .map((s) => s.trim())
                              .filter((s) => s);
                            if (skillsToAdd.length > 0) {
                              skillsToAdd.forEach((skill) =>
                                handleAddSkillWithValidation(skill, false)
                              );
                              setSkillInput("");
                              setSkillSuggestions([]);
                            }
                          } else {
                            // If exact match exists, just clear the input
                            setSkillInput("");
                            setSkillSuggestions([]);
                          }
                        }
                      }}
                    />
                  </AutoComplete>
                  {skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                      {skills.map((skill) => (
                        <Tag
                          key={skill}
                          className="!bg-[#780dea] !text-white !border-none !text-xs sm:!text-sm"
                          closable
                          onClose={() => handleRemoveSkill(skill)}
                        >
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {!validationErrors.skills && skills.length === 0 && (
                    <Text
                      className="!text-xs !mt-3 block"
                      style={{
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                      }}
                    >
                      {/* Type skills separated by comma or press Enter */}
                    </Text>
                  )}
                  {validationErrors.skills && (
                    <Text
                      className="!text-xs sm:!text-sm !mt-3 block"
                      style={{ color: "#ff4d4f", lineHeight: "1.5" }}
                    >
                      {validationErrors.skills}
                    </Text>
                  )}
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <button
                  className="flex justify-center rounded-lg py-2.5 sm:py-3 w-full font-semibold cursor-pointer text-sm sm:text-base"
                  style={{
                    backgroundColor: "#5B21B6",
                    color: "#ffffff",
                    borderColor: "#5B21B6",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#4C1D95";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#5B21B6";
                  }}
                  onClick={handleCreateCognitiveTestOk}
                >
                  Create Manually
                </button>
              </Col>
              <Col xs={24} sm={12}>
                <button
                  className="flex justify-center rounded-lg py-2.5 sm:py-3 w-full font-semibold cursor-pointer text-sm sm:text-base"
                  style={{
                    backgroundColor: "#7C3AED",
                    color: "#ffffff",
                    borderColor: "#7C3AED",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#6B21B6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#7C3AED";
                  }}
                  onClick={handleAutoGenerate}
                >
                  Auto Generate
                </button>
              </Col>
            </Row>
          </>
        )}
      </Modal>

      <InviteCandidateModalWrapper
        open={isInviteCandidateModalOpen}
        onCancel={handleInviteCandidateCancel}
        handleInviteCandidateOk={handleInviteCandidateOk}
        clearAllInviteCandidateSelection={clearAllInviteCandidateSelection}
        selectedRowKeys={selectedRowKeys}
        rowSelection={rowSelection}
        assessmentId={selectedAssessmentId}
        onCandidateAdded={handleCandidateAdded}
        onCandidateRemoved={handleCandidateRemoved}
        resetCandidateList={resetCandidateList}
      />

      <DeleteAssessmentModal
        open={isDeleteModalOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        assessmentToDelete={assessmentToDelete}
        loading={deleteLoading}
      />

      <CloneAssessmentModal
        open={isCloneModalOpen}
        onCancel={handleCloneCancel}
        onConfirm={handleCloneConfirm}
        assessmentToClone={assessmentToClone}
        loading={cloneLoading}
        cloneTitle={cloneTitle}
        onCloneTitleChange={handleCloneTitleInputChange}
      />

      {/* Unknown Skill Confirmation Modal */}
      <Modal
        open={unknownSkillModal.visible}
        onCancel={() =>
          setUnknownSkillModal({ visible: false, skill: "", suggestion: null })
        }
        footer={[
          <Button
            key="cancel"
            onClick={() =>
              setUnknownSkillModal({
                visible: false,
                skill: "",
                suggestion: null,
              })
            }
          >
            Cancel
          </Button>,
          unknownSkillModal.suggestion && (
            <Button
              key="use-suggestion"
              type="default"
              onClick={() => handleUseSuggestion(unknownSkillModal.suggestion!)}
              style={{
                backgroundColor: "#7C3AED",
                borderColor: "#7C3AED",
                color: "#ffffff",
              }}
            >
              Use "{unknownSkillModal.suggestion.value}" Instead
            </Button>
          ),
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmUnknownSkill}
            style={{
              backgroundColor: "#7C3AED",
              borderColor: "#7C3AED",
            }}
          >
            Yes, Add Anyway
          </Button>,
        ].filter(Boolean)}
        title={
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Skill Not Found in Database
          </span>
        }
        className="[&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-content]:!border-[var(--border-primary)]"
      >
        <div style={{ color: "var(--text-primary)" }}>
          <Paragraph style={{ color: "var(--text-primary)", marginBottom: 16 }}>
            The skill <strong>"{unknownSkillModal.skill}"</strong> is not found
            in our skills database.
          </Paragraph>

          {unknownSkillModal.suggestion && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "8px",
                marginBottom: 16,
                border: "1px solid var(--border-primary)",
              }}
            >
              <Text
                strong
                style={{
                  color: "var(--text-primary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Did you mean:{" "}
                <span style={{ color: "#7C3AED" }}>
                  {unknownSkillModal.suggestion.value}
                </span>
                ?
              </Text>
              <Button
                type="link"
                onClick={() =>
                  handleUseSuggestion(unknownSkillModal.suggestion!)
                }
                style={{ padding: 0, height: "auto", color: "#7C3AED" }}
              >
                Click to use this skill instead
              </Button>
            </div>
          )}

          <Paragraph
            style={{ color: "var(--text-secondary)", marginBottom: 0 }}
          >
            If you're sure this skill is correct, you can proceed to add it.
            Please verify the spelling and ensure it's a valid skill.
          </Paragraph>
        </div>
      </Modal>

      {/* Publish Confirmation Modal */}
      <Modal
        open={isPublishModalOpen}
        onCancel={handlePublishModalCancel}
        footer={[
          <Button
            key="draft"
            onClick={handleKeepAsDraft}
            disabled={true}
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            Keep as Draft
          </Button>,
          <Button
            key="publish"
            type="primary"
            onClick={handlePublishConfirm}
            disabled={true}
            style={{
              backgroundColor: "#7C3AED",
              borderColor: "#7C3AED",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            Publish
          </Button>,
        ]}
        title={
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Publish Assessment?
          </span>
        }
        className="[&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-content]:!border-[var(--border-primary)]"
      >
        <div style={{ color: "var(--text-primary)" }}>
          <Paragraph
            style={{
              color: "var(--text-primary)",
              marginBottom: 16,
              fontSize: "16px",
            }}
          >
            Would you like to publish this assessment now?
          </Paragraph>

          <Paragraph
            style={{ color: "var(--text-secondary)", marginBottom: 12 }}
          >
            • <strong>Publish:</strong> The assessment will be published
            immediately and available you can invite the candidates.
          </Paragraph>

          <Paragraph
            style={{ color: "var(--text-secondary)", marginBottom: 0 }}
          >
            • <strong>Keep as Draft:</strong> The assessment will be saved in
            draft mode. You can publish it later.
          </Paragraph>
        </div>
      </Modal>
    </div>
  );
}

export default Cognitive;
