/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Badge,
  Button,
  Col,
  Input,
  InputRef,
  Modal,
  Row,
  Segmented,
  Table,
  TableColumnsType,
  Tabs,
  Typography,
  Tag,
  message,
  Dropdown,
  MenuProps,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  CopyOutlined,
  DeleteOutlined,
  UserAddOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

// Components
import CustomSelect from "../../components/ui/CustomSelect";
import InviteCandidate from "../../components/Cognitive/InviteCandidate";
import CustomDatePicker from "../../components/ui/CustomDatePicker";
import CloneAssessmentModal from "../../components/Assessment/CloneAssessmentModal";

// Utils
import { showToast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

// API
import { getAPI, postAPI, deleteAPI, getCandidateReports, cloneAssessment } from "../../lib/api";

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

// API Response Interface
interface AssessmentData {
  settings: any;
  sections: any;
  unique_id: string;
  title: string;
  description: string;
  assessment_type: string;
  difficulty_level: string;
  status: "draft" | "active" | "inactive";
  created_at: string;
  updated_at: string;
  section_count: string;
  question_count: string;
  total_score: string;
  total_duration: string | null;
  total_gaps: number;
  total_with_gaps: number | null;
  total_invited?: number;
  total_completed?: number;
}

interface ApiResponse {
  assessments: AssessmentData[];
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  count?: number;
  total?: number;
  total_count?: number;
  last_evaluated_key: string | null;
  has_more: boolean;
}

interface TestDataType {
  key: React.Key;
  unique_id: string;
  name: string;
  testCode: string;
  invited: number;
  taken: number;
  sections: number;
  questions: number;
  created: string;
  ends: string;
  createdBy: string;
  status: "Draft" | "Active" | "Inactive";
}

// const daysOptions = [
//     { label: "Today", value: "today" },
//     { label: "Yesterday", value: "yesterday" },
//     { label: "Last 2 days", value: "last-2-days" },
//     { label: "Last 3 days", value: "last-3-days" },
//     { label: "Last 4 days", value: "last-4-days" },
//     { label: "Last 5 days", value: "last-5-days" },
//     { label: "Last 6 days", value: "last-6-days" },
// ];

// const weekOptions = [
//     { label: "This week", value: "this-week" },
//     { label: "Last week", value: "last-week" },
//     { label: "Last 2 week", value: "last-2-week" },
//     { label: "Last 3 week", value: "last-3-week" },
// ];

// const monthOptions = [
//     { label: "This month", value: "this-month" },
//     { label: "Last month", value: "last-month" },
//     { label: "January", value: "january" },
//     { label: "February", value: "february" },
//     { label: "March", value: "march" },
//     { label: "April", value: "april" },
//     { label: "May", value: "may" },
//     { label: "June", value: "june" },
//     { label: "July", value: "july" },
//     { label: "August", value: "august" },
//     { label: "September", value: "september" },
//     { label: "October", value: "october" },
//     { label: "November", value: "november" },
//     { label: "December", value: "december" },
// ];

const statusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Draft", value: "draft" },
];

const difficultyLevelOptions = [
  { label: "Beginner", code: "Beginner" },
  { label: "Intermediate", code: "intermediate" },
  { label: "Advanced", code: "advanced" },
];

// Assessment type options - keeping for potential future use
// const assessmentTypeOptions = [
//   { label: "Technical", code: "OTO_TECH" },
//   { label: "Behavioral", code: "OTO_BEHAVIORAL" },
//   { label: "Cognitive", code: "OTO_COGNITIVE" },
//   { label: "Aptitude", code: "OTO_APTITUDE" },
//   { label: "Personality", code: "OTO_PERSONALITY" },
//   { label: "Leadership", code: "OTO_LEADERSHIP" },
//   { label: "Communication", code: "OTO_COMMUNICATION" },
//   { label: "Problem Solving", code: "OTO_PROBLEM_SOLVING" },
//   { label: "Critical Thinking", code: "OTO_CRITICAL_THINKING" },
//   { label: "Domain Specific", code: "OTO_DOMAIN_SPECIFIC" },
// ];

const durationOptions = [
  { label: "30 Minutes", value: "30" },
  { label: "45 Minutes", value: "45" },
  { label: "60 Minutes", value: "60" },
  { label: "90 Minutes", value: "90" },
  { label: "120 Minutes", value: "120" },
  { label: "150 Minutes", value: "150" },
  { label: "180 Minutes", value: "180" },
];

function Dynamic() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [time, setTime] = useState("am");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [isTestTypeModalOpen, setIsTestTypeModalOpen] = useState(false);
  const [isCreationMethodModalOpen, setIsCreationMethodModalOpen] = useState(false);
  const [selectedAssessmentTypeForCreation, setSelectedAssessmentTypeForCreation] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<"private" | "public" | "">("");
  const [selectedCreationMethod, setSelectedCreationMethod] = useState<"predefined" | "manual" | "">("");
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] =
    useState(false);
  const [duration, setDuration] = useState<string>("");
  const [uploadedJD, setUploadedJD] = useState<any>(null);
  // const [uploadJDLoading, setUploadJDLoading] = useState(false);
  // const [uploadedJDAnalyzedLoading, setUploadedJSAnalyzedLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Optimized skills handlers
  const handleAddSkill = useCallback(
    (skill: string): boolean => {
      let skillAdded = false;
      
      setSkills((prev) => {
      // Check if skill already exists (case-insensitive)
        const skillExists = prev.some(
        (existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase()
      );

      if (skillExists) {
        message.warning(`Skill "${skill}" already exists`);
          skillAdded = false;
          return prev;
        }

        skillAdded = true;
        return [...prev, skill];
      });
      
      return skillAdded;
    },
    []
  );

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setSkills((prev) => {
      const newSkills = prev.filter((skill) => skill !== skillToRemove);
      return newSkills;
    });
  }, []);

  // Assessment form state
  const [assessmentName, setAssessmentName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<{
    label: string;
    code: string;
  } | null>(null);
  const [assessmentType, setAssessmentType] = useState<{
    label: string;
    code: string;
  } | null>({ label: "Dynamic", code: "Dynamic" });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    assessmentName: "",
    role: "",
    skills: "",
    experience: "",
  });

  // Optimized dropdown handlers
  const handleDifficultyLevelChange = useCallback((value: string) => {
    if (value === "") {
      setDifficultyLevel(null);
    } else {
      const selectedOption = difficultyLevelOptions.find(
        (option) => option.code === value
      );
      setDifficultyLevel(selectedOption || null);
    }
  }, []);
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

  const handleExperienceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setExperience(value);
    },
    []
  );

  // Description handler - kept for backend compatibility but hidden from UI
  // const handleDescriptionChange = useCallback(
  //   (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //     setDescription(e.target.value);
  //   },
  //   []
  // );

  // const handleChange = (info) => {
  //     setUploadedJD(info.file);

  //     setUploadJDLoading(true);

  //     setTimeout(() => {
  //         setUploadJDLoading(false);

  //         setUploadedJSAnalyzedLoading(true);

  //         setTimeout(() => {
  //             setUploadedJSAnalyzedLoading(false);
  //         }, 3000);
  //     }, 2000);
  // };

  // const showTestTypeModal = (assessmentType: string) => {
  //   setSelectedAssessmentTypeForCreation(assessmentType);
  //   setIsTestTypeModalOpen(true);
  // };

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

  const handleCreateCognitiveTestOk = async () => {
    // Reset validation errors
    const errors = {
      assessmentName: "",
      role: "",
      skills: "",
      experience: "",
    };

    // Validate required fields (only assessmentName and role are required)
    let hasError = false;

    if (!assessmentName.trim()) {
      errors.assessmentName = "Assessment name is required";
      hasError = true;
    }

    if (!role.trim()) {
      errors.role = "Role is required";
      hasError = true;
    }

    // Update validation errors state
    setValidationErrors(errors);

    // If there are errors, don't proceed with API call
    if (hasError) {
      return;
    }

    // Prepare form data for API
    const formData = {
      title: assessmentName.trim(),
      target_role: role.trim(),
      skills_required: skills,
      target_experience: experience.trim(),
      description: description.trim() || "", // Send empty string if no description
      assessment_type: assessmentType?.label || "Dynamic", // Default value for backend
      difficulty_level: difficultyLevel?.code || "intermediate", // Default to intermediate
    };

    console.log("Create Assessment Form Data:", formData);

    try {
      // Call the API to create assessment
      const response = await postAPI("/assessments", formData);
      console.log("response", response);
      if (response.success) {
        showToast({
          message: "Assessment Created Successfully",
          description: `"${assessmentName.trim()}" has been created successfully`,
          type: "success",
        });

        // Store the created assessment in Redux store
        // if (response.data && response.data.assessment) {
        //     dispatch(setCurrentAssessment(response.data.assessment));
        // }

        // If API call succeeds, proceed with navigation
        setUploadedJD(null);
        setIsCreateAssessmentModalOpen(false);

        // Reset form fields
        setAssessmentName("");
        setRole("");
        setExperience("");
        setDuration("");
        setDifficultyLevel(null);
        setAssessmentType(null);
        setDescription("");
        setSkills([]);
        setSkillInput("");

        // Refresh the assessments list
        setCurrentPage(1);
        fetchAssessments(currentPage, pageSize, true);

        // navigate('/question-add');
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

  const handleCreateCognitiveTestCancel = () => {
    setIsCreateAssessmentModalOpen(false);

    // Reset form fields
    setAssessmentName("");
    setRole("");
    setExperience("");
    setDuration("");
    setDifficultyLevel(null);
    setAssessmentType(null);
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

    // Get the value directly from the input ref
    const inputElement = cloneTitleInputRef.current?.input as
      | HTMLInputElement
      | undefined;
    const titleValue = inputElement?.value?.trim() || "";
    
    // Validate that the user has entered a title
    if (!titleValue || titleValue.length === 0) {
      showToast({
        message: "Give a new assessment name",
        type: "error",
        position: "top-right",
        duration: 4000,
      });
      // Focus the input to help user
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
      const response = await cloneAssessment(assessmentId, titleValue.trim());
      if (response.success) {
        showToast({
          message: "Assessment Cloned Successfully",
          description: `"${titleValue.trim()}" has been created successfully.`,
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
        message.error(errorMessage);
      }
    } catch (error) {
      console.error("Error cloning assessment:", error);
      message.error("An error occurred while cloning the assessment");
    } finally {
      setCloneLoading(false);
    }
  };

  const handleCloneTitleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCloneTitle(e.target.value);
    },
    []
  );

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
        fetchAssessments(currentPage, pageSize, true);

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
      score: "total_score",
      created: "created_at",
      updated: "updated_at",
      status: "status",
    };
    return fieldMap[columnKey] || columnKey;
  };

  // Handle table changes (pagination, sorting, etc.)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // Handle sorting
    if (sorter && sorter.field) {
      const apiFieldName = getApiFieldName(sorter.field);
      setSortField(apiFieldName);
      setSortOrder(sorter.order);
      // Reset to first page when sorting changes
      setCurrentPage(1);
      fetchAssessments(currentPage, pageSize, true);
    } else if (sorter && !sorter.field) {
      // Clear sorting when clicking on the same column again
      setSortField("");
      setSortOrder(null);
      setCurrentPage(1);
      fetchAssessments(pagination.current, pageSize, true);
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

  // const [selected, setSelected] = useState(["me"]);
  // const [tempSelected, setTempSelected] = useState([...selected]);

  // const handleCheckboxChange = (value, checked) => {
  //     if (checked) {
  //         setTempSelected([...tempSelected, value]);
  //     } else {
  //         setTempSelected(tempSelected.filter((val) => val !== value));
  //     }
  // };

  // const handleApply = () => {
  //     setSelected([...tempSelected]);
  // };

  // const handleReset = () => {
  //     setTempSelected([]);
  //     setSelected([]);
  // };

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
  const [filters, setFilters] = useState({
    status: "",
    createdBy: "",
    timeRange: "",
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleJDFileSelection = (file: File | null) => {
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

    setUploadedJD(file);
  };

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);

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

  // Fetch assessments from API with pagination
  const fetchAssessments = useCallback(
    async (
      page: number = 1,
      size: number = pageSize,
      resetData: boolean = true
    ) => {
      setLoading(true);
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
          sort_by: sortField || "created_at",
          sort_order: sortOrder ? (sortOrder === "ascend" ? "asc" : "desc") : "desc",
          include_deleted: "false",
          search_type: "contains",
        });

        // Add search filter
        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }

        // Add status filter
        if (filters.status) {
          params.append("status", filters.status);
        }

        // Add assessment type filter
        if (assessmentType?.code) {
          params.append("assessment_type", assessmentType.code);
        }

        // Add difficulty level filter
        if (difficultyLevel?.code) {
          params.append("difficulty_level", difficultyLevel.code);
        }

        // Use the getAPI method from api.ts
        const data: ApiResponse | null = await getAPI<ApiResponse>(
          `/assessments?${params.toString()}`
        );

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
              : "N/A",
            ends: "N/A", // Not available in current API response
            createdBy: "N/A", // Not available in current API response
            status:
              ((item.status?.charAt(0).toUpperCase() +
                item.status?.slice(1)) as "Draft" | "Active" | "Inactive") ||
              "Draft",
          })
        );

        // Update state based on whether we're resetting or appending data
        if (resetData) {
          setAssessments(transformedData);
        } else {
          setAssessments((prev) => [...prev, ...transformedData]);
        }

        // Set total count - check pagination object first, then fallback to other fields
        const totalCount = data.pagination?.total_count || data.total || data.total_count || data.count || transformedData.length;
        
        // Workaround for backend bug: Use the maximum total count we've ever seen
        if (totalCount > maxTotalRef.current) {
          maxTotalRef.current = totalCount;
        }
        
        const displayTotal = maxTotalRef.current > 0 ? maxTotalRef.current : totalCount;
        setTotalAssessments(displayTotal);
        setRetryCount(0); // Reset retry count on success

        if (transformedData.length === 0 && resetData) {
          message.info("No assessments found");
        }

        // Fetch candidate counts for each assessment (only if backend doesn't provide them)
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
      assessmentType?.code,
      difficultyLevel?.code,
      sortField,
      sortOrder,
    ]
  );

  // Fetch candidate counts from candidate-reports API
  const fetchCandidateCounts = async (assessmentsList: TestDataType[]) => {
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
      // Silently fail - counts will remain at 0
    }
  };

  // Fetch assessments on component mount ONLY
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    assessmentType?.code,
    difficultyLevel?.code,
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
        fetchAssessments(currentPage, pageSize, true);
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
    setSearchTerm(value);
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to search after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      // Reset pagination and fetch with new search term
      setCurrentPage(1);
      maxTotalRef.current = 0; // Reset max total when searching
      fetchAssessments(1, pageSize, true);
    }, 500);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    // Reset pagination and fetch with new filter
    setCurrentPage(1);
    maxTotalRef.current = 0; // Reset max total when filter changes
    fetchAssessments(1, pageSize, true);
  };

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
    setSelectedRowKeys((prev) => prev.filter((selectedKey) => selectedKey !== key));
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

  const columns: TableColumnsType<TestDataType> = [
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
      width: 300,
      sorter: true,
      render: (text, record) => (
        <span
          style={{
            color: "var(--text-primary)",
            fontSize: "14px",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/assessment-dashboard/${record.key}`)}
        >
          {text}
        </span>
      ),
    },
    // {
    //     title: 'Assessment ID',
    //     dataIndex: 'testCode',
    //     key: 'testCode',
    //     width: 140,
    //     sorter: true,
    //     render: (text) => <span className="!px-3 py-1 !bg-[#140F00] !border-1 !border-[#2A2106] !rounded-sm">{text}</span>,
    // },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      sorter: true,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        return (
          <Tag color="blue" className="capitalize">
            {assessment?.assessment_type || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      sorter: true,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        const difficulty = assessment?.difficulty_level?.toLowerCase();
        let color = "default";
        if (difficulty === "beginner") color = "green";
        else if (difficulty === "intermediate") color = "orange";
        else if (difficulty === "advanced") color = "red";

        return (
          <Tag color={color} className="capitalize">
            {assessment?.difficulty_level || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Sections",
      dataIndex: "sections",
      key: "sections",
      width: 80,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Questions",
      dataIndex: "questions",
      key: "questions",
      width: 90,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Invited vs Attempted",
      key: "invitedVsAttempted",
      width: 160,
      render: (_, record) => (
        <span
          style={{
            color: "var(--accent-primary)",
            fontSize: "14px",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => navigate(`/reports?assessment_id=${record.key}`)}
        >
          {record.invited || 0} / {record.taken || 0}
        </span>
      ),
    },
    // {
    //     title: 'Score',
    //     dataIndex: 'score',
    //     key: 'score',
    //     width: 80,
    //     sorter: true,
    //     render: (_, record) => {
    //         const assessment = apiData?.assessments?.find(a => a.unique_id === record.key);
    //         return (
    //             <span style={{ color: '#fff', fontSize: '14px' }}>
    //                 {assessment?.total_score || '0'}
    //             </span>
    //         );
    //     },
    // },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      width: 180,
      sorter: true,
      render: (text) => (
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Updated",
      dataIndex: "updated",
      key: "updated",
      width: 180,
      sorter: true,
      render: (_, record) => {
        const assessment = apiData?.assessments?.find(
          (a) => a.unique_id === record.key
        );
        return (
          <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
            {assessment?.updated_at
              ? new Date(assessment.updated_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      sorter: true,
      render: (status) => {
        let color = "";
        switch (status) {
          case "Draft":
            color = "#fdba74";
            break;
          case "Active":
            color = "#4ade80";
            break;
          case "Inactive":
            color = "#9ca3af";
            break;
          default:
            color = "var(--text-primary)";
        }
        return <Badge color={`${color}`} text={status} />;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          icon={
            <img
              src={`${import.meta.env.BASE_URL}cognitive/user-plus.svg`}
              className="w-[14px]"
              alt="Invite"
            />
          }
          size="small"
          disabled={record.status !== "Active"}
          style={{
            backgroundColor: record.status === "Active" ? "#5B21B6" : "#6B7280",
            borderRadius: "6px",
            fontSize: "12px",
            height: "28px",
            opacity: record.status === "Active" ? 1 : 0.5,
            borderColor: record.status === "Active" ? "#5B21B6" : "#6B7280",
            color: "#ffffff",
          }}
          onMouseEnter={(e) => {
            if (record.status === "Active") {
              e.currentTarget.style.backgroundColor = "#4C1D95";
            }
          }}
          onMouseLeave={(e) => {
            if (record.status === "Active") {
              e.currentTarget.style.backgroundColor = "#5B21B6";
            }
          }}
          onClick={() => openInviteCandidateModal(record.key as string)}
        >
          Invite
        </Button>
      ),
    },
    {
      title: "",
      key: "more",
      width: 60,
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "clone",
            icon: <CopyOutlined />,
            label: "Clone",
            onClick: () => handleCloneAssessment(record),
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete",
            onClick: () => handleDeleteAssessment(record),
            disabled: record.status === "Active",
          },
          {
            key: "add_collaborators",
            icon: <UserAddOutlined />,
            label: "Add Collaborators",
            onClick: () => handleAddCollaborators(record),
            disabled: true,
          },
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => handleEditAssessment(record),
            disabled: record.status === "Active",
          },
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "View",
            onClick: () => handleViewAssessment(record),
          },
          {
            key: "extend",
            icon: <CalendarOutlined />,
            label: "Extend",
            onClick: () => handleExtendAssessment(record),
            disabled: true,
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ color: "var(--text-primary)", minWidth: "32px" }}
              className="hover:!text-[#7C3AED]"
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div
      className="cognitive-page max-w-full overflow-x-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <Row
        align="middle"
        justify="space-between"
        className="flex-col sm:flex-row gap-4 sm:gap-0"
      >
        <Col xs={24} sm={12} md={16}>
          <Row>
            <Col>
              <div
                className="text-lg md:text-xl"
                style={{
                  fontFamily: "Helvetica_Neue-Medium, Helvetica",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Assessment
              </div>
              <p
                className="!mt-2 text-sm sm:text-base"
                style={{
                  fontFamily: "Helvetica_Neue-Regular, Helvetica",
                  fontWeight: "400",
                  color: "var(--text-secondary)",
                }}
              >
                Manage, create, or review all assessments for candidate
                evaluation.
              </p>
            </Col>
          </Row>
        </Col>

        <Col
          xs={24}
          sm={12}
          md={8}
          className="!flex !justify-center sm:!justify-end"
        >
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
              {/* Dropdown - Commented out for now */}
              {/* <Dropdown
                menu={{
                  items: [
                    {
                      key: "cognitive",
                      label: "Cognitive",
                      onClick: () => showTestTypeModal("cognitive"),
                    },
                    {
                      key: "dynamic",
                      label: "Dynamic",
                      onClick: () => showTestTypeModal("dynamic"),
                    },
                    {
                      key: "oto_video",
                      label: "Oto_Video",
                      onClick: () => showTestTypeModal("oto_video"),
                    },
                  ],
                  style: {
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-primary)",
                  },
                  className: `
                    [&_.ant-dropdown-menu-item]:!text-[var(--text-primary)]
                    [&_.ant-dropdown-menu-item]:!py-2
                    [&_.ant-dropdown-menu-item]:!px-4
                    [&_.ant-dropdown-menu-item:hover]:!bg-[#5B21B6]
                    [&_.ant-dropdown-menu-item:hover]:!text-white
                  `,
                }}
                trigger={["click"]}
                placement="bottomRight"
              > */}
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
                    setSelectedAssessmentTypeForCreation("dynamic");
                    setSelectedTestType("private");
                    setSelectedCreationMethod("manual");
                    setIsCreateAssessmentModalOpen(true);
                  }}
                >
                  <span className="hidden sm:inline">Create Assessment</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              {/* </Dropdown> */}
            </div>
          </div>
        </Col>
      </Row>

      <Row
        gutter={[8, 8]}
        align="middle"
        justify="space-between"
        className="flex-wrap items-center mt-3 sm:mt-4"
      >
        {/* Total Assessment */}
        <Col xs={24} sm={12} md={8} lg={6}>
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

        <Col xs={24} sm={12} md={16} lg={18}>
          <Row align="middle" gutter={[8, 8]} className="flex-wrap justify-end">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined />}
                className="!h-9 sm:!h-10 !rounded-xl w-full"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-primary)",
                }}
                onChange={(e) => handleSearch(e.target.value)}
                value={searchTerm}
                onPressEnter={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    // Trigger immediate search on Enter
                    console.log("Searching for:", target.value);
                  }
                }}
                suffix={
                  loading && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  )
                }
              />
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <CustomSelect
                placeholder={"Type"}
                prefix={
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }cognitive/calendar-slash.svg`}
                    style={{ filter: "var(--icon-filter)" }}
                  />
                }
                options={[
                  { label: "Dynamic", value: "Dynamic" }
                ]}
                selectedBg="var(--bg-secondary)"
                onChange={(value: string) => {
                  const selectedOption = { label: "Dynamic", code: value };
                    setAssessmentType(selectedOption);
                }}
                value={assessmentType?.code || "Dynamic"}
                disabled={true}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <CustomSelect
                placeholder={"Difficulty"}
                prefix={
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }cognitive/calendar-slash.svg`}
                    style={{ filter: "var(--icon-filter)" }}
                  />
                }
                options={[
                  { label: "All Levels", value: "" },
                  ...difficultyLevelOptions.map(opt => ({ label: opt.label, value: opt.code }))
                ]}
                selectedBg="var(--bg-secondary)"
                onChange={handleDifficultyLevelChange}
                value={difficultyLevel?.code || ""}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </Col>

            <Col>
              <CustomSelect
                placeholder={"Custom Date"}
                prefix={
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }cognitive/calendar-slash.svg`}
                    style={{ filter: "var(--icon-filter)" }}
                  />
                }
                options={statusOptions}
                onOpenChange={() => {}}
                popupRender={() => (
                  <div
                    style={{
                      padding: "20px",
                      background: "var(--bg-secondary)",
                      borderRadius: "10px",
                    }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div
                          style={{
                            color: "var(--text-primary)",
                            marginBottom: "8px",
                          }}
                        >
                          From
                        </div>
                        <CustomDatePicker />
                      </Col>
                      <Col span={12}>
                        <div
                          style={{
                            color: "var(--text-primary)",
                            marginBottom: "8px",
                          }}
                        >
                          To
                        </div>
                        <CustomDatePicker />
                      </Col>
                    </Row>
                    <Row
                      gutter={[16, 16]}
                      align="middle"
                      style={{ marginTop: "16px" }}
                    >
                      <Col>
                        <div style={{ color: "var(--text-primary)" }}>Time</div>
                      </Col>
                      <Col>
                        <Input
                          placeholder="00"
                          style={{
                            width: "50px",
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-primary)",
                            color: "var(--text-primary)",
                            textAlign: "center",
                          }}
                          onInput={(e) => {
                            const input = e.target as HTMLInputElement;
                            input.value = input.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 13);
                          }}
                        />
                      </Col>
                      <Col>
                        <div style={{ color: "var(--text-primary)" }}>:</div>
                      </Col>
                      <Col>
                        <Input
                          placeholder="00"
                          style={{
                            width: "50px",
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-primary)",
                            color: "var(--text-primary)",
                            textAlign: "center",
                          }}
                          onInput={(e) => {
                            const input = e.target as HTMLInputElement;
                            input.value = input.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 2);
                          }}
                        />
                      </Col>
                      <Col>
                        <Segmented
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--border-primary)",
                            marginBottom: 8,
                          }}
                          value={time}
                          onChange={setTime}
                          options={["am", "pm"]}
                        />
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
                      <Col>
                        <Button
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          Reset
                        </Button>
                      </Col>
                      <Col>
                        <Button
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
                        >
                          Apply
                        </Button>
                      </Col>
                    </Row>
                  </div>
                )}
              />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <CustomSelect
                placeholder={"Status"}
                prefix={
                  <img
                    src={`${
                      import.meta.env.BASE_URL
                    }cognitive/calendar-slash.svg`}
                    style={{ filter: "var(--icon-filter)" }}
                  />
                }
                options={statusOptions}
                selectedBg="var(--bg-secondary)"
                onChange={(value) => handleFilterChange("status", value)}
                value={filters.status}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      <div
        className="mt-4 sm:mt-5 md:mt-6 -mx-3 sm:mx-0"
        style={{ marginLeft: "0", marginRight: "0" }}
      >
        <Table
          columns={columns}
          dataSource={assessments}
          loading={loading}
          rowSelection={rowSelection}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <div className="text-center py-6 sm:py-8">
                <p
                  className="text-base sm:text-lg mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  No assessments found
                </p>
                <p
                  className="text-sm sm:text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Try adjusting your search or filters
                </p>
                {retryCount > 0 && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setRetryCount(0);
                      setCurrentPage(1);
                      fetchAssessments(1, pageSize, true);
                    }}
                    className="mt-3 sm:mt-4"
                  >
                    Retry
                  </Button>
                )}
              </div>
            ),
          }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalAssessments,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30", "50"],
            showTotal: (total, range) =>
              window.innerWidth >= 640
                ? `${range[0]}-${range[1]} of ${total} items`
                : `${range[0]}-${range[1]}`,
            onChange: (page, newSize) => {
              // Determine the actual page size to use
              const actualSize = newSize !== undefined ? newSize : pageSize;
              
              // Check if page size changed
              const isPageSizeChange = newSize !== undefined && newSize !== pageSize;
              
              if (isPageSizeChange) {
                // Page size changed - go to page 1
                setPageSize(actualSize);
                setCurrentPage(1);
                setTimeout(() => fetchAssessments(1, actualSize, true), 0);
              } else if (page !== currentPage) {
                // Page number changed - navigate to new page
                setCurrentPage(page);
                setTimeout(() => fetchAssessments(page, actualSize, true), 0);
              }
            },
            showLessItems: true,
            showQuickJumper: false,
            disabled: false,
            hideOnSinglePage: false,
            style: {
              marginTop: "12px",
              textAlign: "center",
            },
            className: "flex-wrap",
            simple: window.innerWidth < 640,
          }}
          scroll={{ x: 800 }}
          size="small"
          className="dark-table mt-3 sm:mt-4 md:mt-5"
          style={{
            backgroundColor: "var(--bg-secondary)",
            width: "100%",
            overflowX: "auto",
            margin: "0",
            padding: "0",
          }}
          onRow={(record) => ({
            onClick: () => {
              // You can add row click handling here
              console.log("Row clicked:", record);
            },
            style: { cursor: "pointer" },
          })}
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
                  <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#5A9FD4] mb-1"></div>
                  <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
                </div>
                <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED] mb-1"></div>
                  <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] mb-1"></div>
                  <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                </div>
                <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#6B4E71] mb-1"></div>
                  <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#6B4E71" }}></div>
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
                <div className="border-4 border-dashed rounded-2xl p-4" style={{ borderColor: "var(--text-primary)" }}>
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#8B4513] mb-1"></div>
                      <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#8B4513" }}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#A0522D] mb-1"></div>
                      <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#A0522D" }}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED] mb-1"></div>
                      <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4A90E2] mb-1"></div>
                      <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#5A9FD4] mb-1"></div>
                      <div className="w-8 h-16 sm:w-10 sm:h-20 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
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
                {selectedTestType === "private" ? "Private Test" : "Public Test"}
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
                    <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                    <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
                  </div>
                  <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                    <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                    <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                  </div>
                  <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6B4E71] mb-1"></div>
                    <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#6B4E71" }}></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-start mb-8 relative">
                  <div className="border-4 border-dashed rounded-2xl p-4" style={{ borderColor: "var(--text-primary)" }}>
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#8B4513] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#8B4513" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#A0522D] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#A0522D" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
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
                  Switch to {selectedTestType === "private" ? "Public" : "Private"} test
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
                        style={{ color: "var(--text-primary)", fontWeight: 600 }}
                      >
                        Pre-Defined
                      </Title>
                      <Paragraph
                        className="!text-sm sm:!text-base !mb-0"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Our Machine learning and Artificial Intelligence engine will create tests for you.
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
                      onClick={() => handleCreationMethodSelection("predefined")}
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
                        style={{ color: "var(--text-primary)", fontWeight: 600 }}
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
        className={selectedCreationMethod === "predefined" 
          ? "!w-[95vw] sm:!w-[90vw] md:!w-[1300px] !max-w-[1300px] [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5 [&_.ant-modal-close-x]:!text-base sm:!text-lg"
          : "!w-[95vw] sm:!w-[90vw] md:!w-[682px] !max-w-[682px] [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5 [&_.ant-modal-close-x]:!text-base sm:!text-lg"
        }
        centered
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
                  Create {selectedAssessmentTypeForCreation === "oto_video" 
                    ? "Oto_Video" 
                    : selectedAssessmentTypeForCreation.charAt(0).toUpperCase() + selectedAssessmentTypeForCreation.slice(1)
                  } Test
                </Title>
                <Paragraph
                  className="!font-medium !text-sm sm:!text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {/* Let AI generate a test from your job description — or skip ahead
                  and create one manually */}
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
            padding: selectedCreationMethod === "predefined" ? "40px 60px" : undefined,
          },
          mask: {
            backdropFilter: "blur(10px)",
            background: "#130E21",
            backgroundSize: "40px 40px",
            backgroundImage: ` linear-gradient(to right, #271C3C 2px, transparent 2px), linear-gradient(to bottom, #271C3C 2px, transparent 2px)`,
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
                    {selectedTestType === "private" ? "Private Test" : "Public Test"}
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
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
                      </div>
                      <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                      </div>
                      <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-2" style={{ borderColor: "var(--text-primary)" }}>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6B4E71] mb-1"></div>
                        <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#6B4E71" }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start mb-8 relative">
                      <div className="border-4 border-dashed rounded-2xl p-4" style={{ borderColor: "var(--text-primary)" }}>
                        <div className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#8B4513] mb-1"></div>
                            <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#8B4513" }}></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#A0522D] mb-1"></div>
                            <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#A0522D" }}></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] mb-1"></div>
                            <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#7C3AED" }}></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#4A90E2] mb-1"></div>
                            <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#4A90E2" }}></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A9FD4] mb-1"></div>
                            <div className="w-10 h-20 sm:w-12 sm:h-24 rounded-t-full" style={{ backgroundColor: "#5A9FD4" }}></div>
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
                      Switch to {selectedTestType === "private" ? "Public" : "Private"} test
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
                          color: duration ? "var(--text-primary)" : "var(--text-secondary)",
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-primary)",
                          border: "1px solid var(--border-primary)",
                        }}
                      >
                        <option value="" disabled style={{ color: "var(--text-secondary)" }}>
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
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}/>
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
                    <div className="mt-2 flex gap-2">
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
                      />
                      <input
                        type="file"
                        id="jd-file-upload"
                        accept=".pdf,.doc,.docx,.txt"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const inputEl = e.target;
                          const file = inputEl.files?.[0] ?? null;
                          if (file) {
                            handleJDFileSelection(file);
                          }
                          inputEl.value = "";
                        }}
                      />
                      <Button
                        className="!h-10 !rounded-xl !px-6 !font-semibold hover:!bg-[#4C1D95]"
                        style={{
                          backgroundColor: "#5B21B6",
                          borderColor: "#5B21B6",
                          color: "#ffffff",
                        }}
                        onClick={() => {
                          document.getElementById("jd-file-upload")?.click();
                        }}
                      >
                        Browse
                      </Button>
                    </div>
                    <Text
                      className="!text-xs !mt-1 block"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Choose only pdf,docx,doc or txt file
                    </Text>
                  </Col>

                  {/* Skills */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Skills{" "}
                    </Text>
                    <div className="mt-2">
                      <Input
                        className="!h-10 !pl-4 !rounded-xl !text-sm sm:!text-base"
                        style={{
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-primary)",
                        }}
                        placeholder={
                          skills.length === 0
                            ? "Type skills separated by comma or press Enter"
                            : ""
                        }
                        value={skillInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Check if user typed comma
                          if (value.includes(',')) {
                            // Split by comma and add all skills
                            const skillsToAdd = value.split(',').map(s => s.trim()).filter(s => s);
                            skillsToAdd.forEach(skill => {
                              if (skill) {
                                handleAddSkill(skill);
                              }
                            });
                            setSkillInput("");
                          } else {
                            setSkillInput(value);
                          }
                        }}
                        onPressEnter={() => {
                          if (skillInput.trim()) {
                            // Handle comma-separated values on Enter as well
                            const skillsToAdd = skillInput.split(',').map(s => s.trim()).filter(s => s);
                            if (skillsToAdd.length > 0) {
                              skillsToAdd.forEach(skill => handleAddSkill(skill));
                              setSkillInput("");
                            }
                          }
                        }}
                      />
                      {skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
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
                    </div>
                  </Col>

                  {/* Experience */}
                  <Col span={24}>
                    <Text
                      strong
                      className="!text-sm sm:!text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Experience{" "}
                    </Text>
                    <div className="mt-2">
                      <Input
                        className="!h-10 !pl-4 !rounded-xl !text-sm sm:!text-base"
                        style={{
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-primary)",
                        }}
                        placeholder="Type years of experience and press Enter"
                        value={experience}
                        onChange={handleExperienceChange}
                      />
                      <Text
                        className="!text-xs !mt-1 block"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        e.g (3 or 3.9 or 3-4)
                      </Text>
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
                  className="mt-2 p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-[#7C3AED] transition-all"
                  style={{
                    borderColor: "var(--border-primary)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById("manual-jd-upload") as HTMLInputElement;
                    fileInput?.click();
                  }}
                >
                  <input
                    type="file"
                    id="manual-jd-upload"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                    const inputEl = e.target;
                    const file = inputEl.files?.[0] ?? null;
                    if (file) {
                      handleJDFileSelection(file);
                    }
                    inputEl.value = "";
                    }}
                  />
                  {uploadedJD ? (
                    <>
                      <img
                        src={`${import.meta.env.BASE_URL}login/envelope-simple.svg`}
                        className="w-8 h-8 mb-2"
                        style={{ filter: "var(--icon-filter)" }}
                        alt="File"
                      />
                      <Text className="!text-sm sm:!text-base" style={{ color: "var(--text-primary)" }}>
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
                        src={`${import.meta.env.BASE_URL}login/envelope-simple.svg`}
                        className="w-8 h-8 mb-2"
                        style={{ filter: "var(--icon-filter)" }}
                        alt="Upload"
                      />
                      <Text className="!text-sm sm:!text-base" style={{ color: "var(--text-primary)" }}>
                        Upload JD (PDF or DOCX)
                      </Text>
                      <Text className="!text-xs sm:!text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        Supported Formats: PDF, DOCX, up to 10MB
                      </Text>
                    </>
                  )}
                </div>
              </Col>
            </Row>

            {uploadedJD && (
          <Col className="!absolute right-[-431px] top-[170px] !animate-[fadeInLeft_1s_ease-out_forwards]">
            <div className="bg-[#030206] border border-[#F8F7F9] rounded-tr-xl rounded-br-xl p-8 flex flex-col justify-center items-center h-full min-h-[500px]">
              <img
                src={`${import.meta.env.BASE_URL}common/ai-bot.png`}
                alt="AI Icon"
                className="absolute w-19 h-15 mb-4 jd-animate-bot-float"
              />

              <h3 className="text-white text-lg font-semibold text-center">
                <span className="bg-gradient-to-r from-white to-[#7C3AED] bg-clip-text text-transparent font-bold text-3xl">
                  Hang tight,
                </span>
                <br />
                <span className="font-normal">we’re reading your</span>{" "}
                <span className="font-bold">JD</span>{" "}
                <span className="font-normal">like a hiring detective...</span>
              </h3>
              <p className="text-[#999] text-center mt-2">
                To suggest a tailored assessment that fits the role perfectly.
              </p>
              <span className="text-[#999] mt-2">
                Loading your smart assessment...
              </span>

              {uploadedJD && (
                <div className="mt-4">
                  <img
                    src={`${import.meta.env.BASE_URL}common/loader.svg`}
                    alt="Loading"
                    className="animate-spin w-8 h-8"
                  />
                </div>
              )}
            </div>
          </Col>
        )}

        {uploadedJD && (
          <Col className="!absolute right-[-460px] top-[120px] !animate-[fadeInLeft_1s_ease-out_forwards]">
            <div className="bg-[#030206] border border-[#F8F7F9] rounded-tr-xl rounded-br-xl p-8 px-13 flex flex-col justify-start items-start h-full min-h-[500px] w-[460px] relative">
              <img
                className="absolute top-16 -right-8 w-15 h-12 animate-bot-float"
                alt="Bot"
                src={`${import.meta.env.BASE_URL}common/ai-bot.png`}
              />

              {/* Gradient Heading */}
              <Title
                className="text-left !font-[700]"
                style={{
                  background: "linear-gradient(90deg, #FFF 0%, #7C3AED 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  // fontWeight: "600",
                  fontSize: "28px",
                  // textAlign: "center",
                  marginBottom: 16,
                  lineHeight: "38px",
                }}
              >
                We’ve analyzed the Job Description.
              </Title>

              {/* Subtext */}
              <Paragraph
                className="text-left"
                style={{
                  fontSize: 16,
                  color: "#ffffff",
                  // textAlign: "center",
                  lineHeight: "24px",
                }}
              >
                Based on the role, we recommend the following assessment
                structure:
              </Paragraph>

              {/* Structure Details */}
              <div className="mt-2 text-left text-[14px] leading-[22px]">
                <div>
                  <Text style={{ color: "#c88dfb", fontWeight: "bold" }}>
                    • 3 Sections:
                  </Text>
                  <Text style={{ color: "#ffffffcc" }}>
                    &nbsp;Technical Skills, Problem Solving, and Communication
                  </Text>
                </div>
                <div>
                  <Text style={{ color: "#c88dfb", fontWeight: "bold" }}>
                    • 15 Questions:
                  </Text>
                  <Text style={{ color: "#ffffffcc" }}>
                    &nbsp;5 in each section
                  </Text>
                </div>
                <div>
                  <Text style={{ color: "#c88dfb", fontWeight: "bold" }}>
                    • 3 Types of Questions:
                  </Text>
                  <Text style={{ color: "#ffffffcc" }}>
                    &nbsp;Mix of MCQ, Coding &amp; True or false.
                  </Text>
                </div>
                <div>
                  <Text style={{ color: "#ffffffcc" }}>
                    • Suggested Duration: ~
                  </Text>
                  <Text style={{ color: "#c88dfb", fontWeight: "bold" }}>
                    45 minutes
                  </Text>
                </div>
              </div>

              {/* Additional Message */}
              <Paragraph
                style={{
                  fontSize: 14,
                  color: "#ffffffcc",
                  marginTop: 20,
                  // textAlign: "center"
                }}
              >
                This setup is tailored to evaluate the key competencies for this
                role.
                <br />
                <br />
                👉 Would you like to auto-create this assessment?
              </Paragraph>

              {/* Button with spinning conic ring */}
              <div className="relative mt-2 group rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 h-[1000%] w-[1000%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_2.3s_linear_infinite] rounded-full group-hover:!opacity-50"
                  style={{
                    background: `conic-gradient(from 360deg at 50% 50%, rgba(30,30,30,1) 25%, rgba(196,1,247,1) 39%, rgba(71,0,234,1) 50%, rgba(0,166,232,1) 62%, rgba(30,30,30,1) 75%)`,
                  }}
                />
                <Button
                  className="!backdrop-blur-[10px] !bg-black group-hover:!bg-transparent duration-400 !text-white !rounded-full !border-none flex items-center justify-start !px-13 !py-6 !m-[1.5px]"
                  onClick={handleCreateCognitiveTestOk}
                >
                  Click here
                </Button>
              </div>

              {/* Footer note */}
              <Paragraph
                style={{
                  fontSize: 14,
                  color: "#ffffffcc",
                  marginTop: 20,
                  // textAlign: "center"
                }}
              >
                Or you can skip and create using the form on the right..
              </Paragraph>
            </div>
          </Col>
        )}

        {/* <Row style={{ marginBottom: "30px" }}>
                    <Col span={24}>
                        <Text strong className="!text-white">Job Description </Text>
                        <Text className="!text-gray-500 !font-medium">(Optional)</Text>
                        <Upload.Dragger
                            name="file"
                            multiple={false}
                            showUploadList={false}
                            accept=".pdf,.docx"
                            beforeUpload={(file) => {
                                const isValidType = file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                if (!isValidType) {
                                    showToast({
                                        message: 'Invalid file type',
                                        description: 'Please upload only PDF or DOCX files.',
                                        position: 'top-right',
                                        duration: 3000
                                    });
                                    return false;
                                }
                                return true;
                            }}
                            className="flex flex-col justify-center items-center gap-[10px] p-[40px_30px] self-stretch custom-dragger-border"
                            onChange={handleChange}
                        >
                            {uploadJDLoading ? (
                                <Row align="middle" justify="center">
                                    <Col className="flex flex-col items-center space-y-2">
                                        <img
                                            src={`${import.meta.env.BASE_URL}common/loader.svg`}
                                            className="animate-spin"
                                            alt="loading"
                                        />
                                        <span className="text-white">Uploading</span>
                                    </Col>
                                </Row>
                            ) : (
                                <>
                                    {uploadedJD ? (
                                        <>
                                            <p className="ant-upload-drag-icon">
                                                <FileTextFilled className="!text-[#8C8C8C]" style={{ fontSize: "24px" }} />
                                            </p>

                                            <p className="ant-upload-text !text-white">{uploadedJD?.name} Uploaded</p>

                                            <p className="ant-upload-hint !text-[#979797] underline">
                                                Upload new
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="ant-upload-drag-icon">
                                                <FileTextFilled className="!text-[#8C8C8C]" style={{ fontSize: "24px" }} />
                                            </p>

                                            <p className="ant-upload-text !text-white">Upload JD (PDF or DOCX)</p>

                                            <p className="ant-upload-hint !text-[#979797]">
                                                Supported Formats: PDF, DOCX, up to 10MB
                                            </p>
                                        </>
                                    )}
                                </>
                            )}
                        </Upload.Dragger>
                    </Col>
                </Row> */}

        <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="!text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Assessment Name{" "}
            </Text>
            <Text className="!text-red-500 !font-medium !text-sm sm:!text-base">
              *
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

        <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="!text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Role{" "}
            </Text>
            <Text className="!text-red-500 !font-medium !text-sm sm:!text-base">
              *
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
        </Row>

        <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="!text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Skills
            </Text>
            <div className="mt-2">
              <Input
                className="!h-9 sm:!h-10 !pl-4 sm:!pl-5 !rounded-xl !text-sm sm:!text-base"
                style={{
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-primary)",
                }}
                placeholder="Type skills separated by comma or press Enter"
                id="skill-input"
                value={skillInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Check if user typed comma
                  if (value.includes(',')) {
                    // Split by comma and add all skills
                    const skillsToAdd = value.split(',').map(s => s.trim()).filter(s => s);
                    skillsToAdd.forEach(skill => {
                      if (skill) {
                        handleAddSkill(skill);
                      }
                    });
                    setSkillInput("");
                  } else {
                    setSkillInput(value);
                  }
                }}
                onPressEnter={() => {
                  if (skillInput.trim()) {
                    // Handle comma-separated values on Enter as well
                    const skillsToAdd = skillInput.split(',').map(s => s.trim()).filter(s => s);
                    if (skillsToAdd.length > 0) {
                      skillsToAdd.forEach(skill => handleAddSkill(skill));
                      setSkillInput("");
                    }
                  }
                }}
              />
              {skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
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
            </div>
          </Col>
        </Row>

        <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="!text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Experience
            </Text>
            <Input
              className="!h-9 sm:!h-10 !pl-4 sm:!pl-5 !mt-2 !rounded-xl !text-sm sm:!text-base"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
              }}
              placeholder="Enter years of experience (e.g., 3 or 3-4)"
              value={experience}
              onChange={handleExperienceChange}
            />
          </Col>
        </Row>

        <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="block mb-2 !text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Difficulty Level
            </Text>
            <div className="mt-2">
              <CustomSelect
                placeholder="Select difficulty level"
                prefix={<></>}
                options={difficultyLevelOptions.map((option) => ({
                  label: option.label,
                  value: option.code,
                }))}
                selectedBg="#1D1D23"
                value={difficultyLevel?.code}
                onChange={handleDifficultyLevelChange}
                className="!w-full"
              />
            </div>
          </Col>
        </Row>

        {/* Assessment Type - Hidden from UI but sent to backend */}
        {/* <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="block mb-2 !text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Assessment Type
            </Text>
            <div className="mt-2">
              <CustomSelect
                placeholder="Select assessment type"
                prefix={<></>}
                options={assessmentTypeOptions.map((option) => ({
                  label: option.label,
                  value: option.code,
                }))}
                selectedBg="#1D1D23"
                value={assessmentType?.code}
                onChange={handleAssessmentTypeChange}
                className="!w-full"
              />
            </div>
          </Col>
        </Row> */}

        {/* Description - Hidden from UI but sent to backend */}
        {/* <Row style={{ marginBottom: "20px" }} className="sm:!mb-[30px]">
          <Col span={24}>
            <Text
              strong
              className="block mb-2 !text-sm sm:!text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Description
            </Text>
            <Input.TextArea
              className="!mt-2 !rounded-xl !text-sm sm:!text-base"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
              }}
              placeholder="Enter assessment description"
              rows={3}
              value={description}
              onChange={handleDescriptionChange}
            />
          </Col>
        </Row> */}

        {/* <Row align="middle" style={{ marginBottom: "30px" }}>
                    <Col>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                className="
                                    [&_.ant-checkbox-inner]:!bg-[#030206]
                                    [&_.ant-checkbox-inner]:!border-[#4B5563]
                                    [&_.ant-checkbox-inner]:!rounded-md
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-[#780dea]
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-[#780dea]
                                    [&_.ant-checkbox-checked_.ant-checkbox-inner]:[&::after]:!border-white
                                "
                            >
                                <span className="!text-white font-medium">Build from scratch</span>
                            </Checkbox>
                        </div>
                    </Col>
                </Row> */}

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
              onClick={() => message.info("AI Generate functionality coming soon")}
            >
              AI Generate
            </button>
          </Col>
        </Row>
          </>
        )}
      </Modal>

      {/* Invite Candidate Modal */}
      <Modal
        className="!w-[95vw] sm:!w-[90vw] md:!w-[85vw] lg:!w-[1211px] !max-w-[1211px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg
                    [&_.ant-modal-close-x]:!text-[var(--text-primary)]"
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            borderBottom: "1px solid var(--border-primary)",
          },
          body: {
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-primary)",
          },
        }}
        open={isInviteCandidateModalOpen}
        onCancel={handleInviteCandidateCancel}
        footer={null}
      >
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-2">
                  <img
                    src={`${import.meta.env.BASE_URL}cognitive/user-plus.svg`}
                  />
                  Invite Candidate
                </span>
              ),
              children: (
                <InviteCandidate
                  handleInviteCandidateOk={handleInviteCandidateOk}
                  clearAllInviteCandidateSelection={
                    clearAllInviteCandidateSelection
                  }
                  selectedRowKeys={selectedRowKeys}
                  rowSelection={rowSelection}
                  assessmentId={selectedAssessmentId}
                  onCandidateAdded={handleCandidateAdded}
                  onCandidateRemoved={handleCandidateRemoved}
                  resetCandidateList={resetCandidateList}
                />
              ),
            },
            // {
            //     key: "2",
            //     label: (
            //         <span className="flex items-center gap-2">
            //             <img src={`${import.meta.env.BASE_URL}cognitive/identification-card.svg`} />
            //             Invite via Resume Match
            //         </span>
            //     ),
            //     children: <InviteCandidateViaResumeMatch handleInviteCandidateOk={handleInviteCandidateOk} />
            // },
          ]}
          className={`
                        [&_.ant-tabs-nav]:!bg-[var(--bg-primary)]
                        [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                        [&_.ant-tabs-tab-btn]:!font-semibold
                        [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                        [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold
                        [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                        [&_.ant-tabs-ink-bar]:h-1.5
                        [&_.ant-tabs-nav]:border-b-0
                        [&_.ant-tabs-content-holder]:border-0
                        [&_.ant-tabs-content-holder]:!bg-[var(--bg-primary)]
                        text-lg
                    `}
          style={{ backgroundColor: "var(--bg-primary)" }}
        />
      </Modal>

      {/* Clone Assessment Modal */}
      <CloneAssessmentModal
        open={isCloneModalOpen}
        onCancel={handleCloneCancel}
        onConfirm={handleCloneConfirm}
        assessmentToClone={assessmentToClone}
        loading={cloneLoading}
        cloneTitle={cloneTitle}
        onCloneTitleChange={handleCloneTitleInputChange}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        className="!w-[90vw] sm:!w-[500px] !max-w-[500px]
                    [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#F8F7F9] [&_.ant-modal-content]:!rounded-xl
                    [&_.ant-modal-close]:!top-3 sm:!top-5 [&_.ant-modal-close]:!right-3 sm:!right-5
                    [&_.ant-modal-close-x]:!text-base sm:!text-lg"
        title={<span className="text-base sm:text-lg">Delete Assessment</span>}
        open={isDeleteModalOpen}
        onCancel={handleDeleteCancel}
        footer={[
          <Button
            key="cancel"
            onClick={handleDeleteCancel}
            size="small"
            className="!bg-[#222223] !border !border-[#222223] hover:!text-[#ffffff] !text-xs sm:!text-sm"
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            size="small"
            loading={deleteLoading}
            onClick={handleDeleteConfirm}
            className="!bg-[#ff4d4f] !border-[#ff4d4f] hover:!bg-[#ff7875] !text-xs sm:!text-sm"
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>,
        ]}
        styles={{
          content: {
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
            border: "1px solid #F8F7F9",
            borderRadius: "12px",
          },
          header: {
            backgroundColor: "var(--bg-primary)",
            borderBottom: "none",
            borderRadius: "12px 12px 0 0",
          },
          body: {
            color: "var(--text-primary)",
          },
          mask: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.15)",
          },
          footer: {
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
          },
        }}
      >
        <div className="text-center py-3 sm:py-4">
          <div className="mb-3 sm:mb-4">
            <DeleteOutlined
              style={{
                fontSize: window.innerWidth < 640 ? "36px" : "48px",
                color: "#ff4d4f",
              }}
            />
          </div>
          <h3
            className="text-base sm:text-lg font-semibold mb-2 sm:mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Are you sure you want to delete this assessment?
          </h3>
          {assessmentToDelete && (
            <p
              className="mb-3 sm:mb-4 text-sm sm:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              <strong>"{assessmentToDelete.name}"</strong>
            </p>
          )}
          <p className="text-[#ff4d4f] text-xs sm:text-sm">
            ⚠️ This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default Dynamic;
