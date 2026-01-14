/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Button,
  Card,
  Col,
  Drawer,
  Row,
  Tabs,
  Modal,
  Input,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { selectCurrentAssessment } from "../../store/miscSlice";

// Components
import QuestionAddHeader from "../../components/QuestionAdd/QuestionAddHeader";
import QuestionAddSideBar from "../../components/QuestionAdd/QuestionAddSideBar";
import MCQQuestion from "../../components/QuestionAdd/MCQQuestion";
import CodingQuestion from "../../components/QuestionAdd/CodingQuestion";
import QuestionLibrarySideBar from "../../components/QuestionLibrary/QuestionLibrary/QuestionLibrarySideBar";
import QuestionList from "../../components/QuestionLibrary/QuestionLibrary/QuestionList";
import DeleteSectionModal from "../../components/Assessment/DeleteSectionModal";

// Toast
import { showToast, showSuccessToast, showErrorToast } from "../../utils/toast";

// API
import {
  createSection,
  getAssessment,
  updateSection,
  getQuestionTypes,
  getScopedQuestions,
  getSectionQuestions,
  removeQuestionsFromSection,
  deleteSection,
  reorderSections,
} from "../../lib/api";

export default function QuestionAdd() {
  // Get current assessment data from store
  const currentAssessment = useSelector(selectCurrentAssessment);

  // Add Collaborators Modal State
  const [isAddCollaboratorsModalOpen, setIsAddCollaboratorsModalOpen] =
    useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");

  // Add/Edit Section Modal State
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionName, setSectionName] = useState("");
  const [sectionInstruction, setSectionInstruction] = useState("");

  // Use ref to store editing section data for immediate access
  const editingSectionRef = useRef(null);

  const [isOpenLibrary, setIsOpenLibrary] = useState(false);

  // State for managing selected questions with category mapping
  const [selectedQuestions, setSelectedQuestions] = useState<
    Array<{ id: string; category_id: string }>
  >([]);

  // State for My Library questions (company)
  const [myLibraryQuestions, setMyLibraryQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);

  // State for Otomeyt Library questions (meritedge)
  const [otomeytLibraryQuestions, setOtomeytLibraryQuestions] = useState<any[]>(
    []
  );
  const [isLoadingOtomeytQuestions, setIsLoadingOtomeytQuestions] =
    useState(false);
  const [hasMoreOtomeytQuestions, setHasMoreOtomeytQuestions] = useState(true);

  // Filter state for question library
  const [questionFilters, setQuestionFilters] = useState({
    selectedQuestionTypes: [] as string[],
    questionTypeId: undefined as string | undefined,
  });

  // Question counts state - separate for company and otomeyt (unfiltered totals)
  const [companyQuestionCounts, setCompanyQuestionCounts] = useState<
    Record<string, number>
  >({});
  const [otomeytQuestionCounts, setOtomeytQuestionCounts] = useState<
    Record<string, number>
  >({});
  const [otomeytTotalCount, setOtomeytTotalCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("1"); // "1" = Otomeyt (DEFAULT), "2" = My Library

  // Favorite questions state - load from localStorage on mount
  const [favoriteQuestions, setFavoriteQuestions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("favoriteQuestions");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
    }
    return [];
  });

  // Filtered counts based on what's currently displayed
  const [currentFilteredCounts, setCurrentFilteredCounts] = useState<
    Record<string, number>
  >({});

  // Get current counts based on active tab - use filtered counts if available, otherwise use total counts
  const currentQuestionCounts =
    Object.keys(currentFilteredCounts).length > 0
      ? currentFilteredCounts
      : activeTab === "1"
      ? otomeytQuestionCounts
      : companyQuestionCounts;

  // Toggle favorite question and save to localStorage
  const toggleFavorite = (question: any) => {
    setFavoriteQuestions((prev) => {
      const questionId = question.unique_id || question.id;
      const isFavorite = prev.some((q) => (q.unique_id || q.id) === questionId);
      let updatedFavorites;
      if (isFavorite) {
        // Remove from favorites
        updatedFavorites = prev.filter(
          (q) => (q.unique_id || q.id) !== questionId
        );
      } else {
        // Add to favorites
        updatedFavorites = [...prev, question];
      }

      // Save to localStorage
      try {
        localStorage.setItem(
          "favoriteQuestions",
          JSON.stringify(updatedFavorites)
        );
      } catch (error) {
        console.error("Error saving favorites to localStorage:", error);
      }

      return updatedFavorites;
    });
  };

  // Check if question is favorite
  const isFavorite = (question: any) => {
    const questionId = question.unique_id || question.id;
    return favoriteQuestions.some((q) => (q.unique_id || q.id) === questionId);
  };

  const openLibrary = () => {
    setIsOpenLibrary(true);
    // Fetch both company and meritedge questions when library opens
    fetchMyLibraryQuestions();
    fetchOtomeytLibraryQuestions();
    fetchQuestionsForCounts();
  };

  // Fetch all questions to calculate counts (without filters)
  const fetchQuestionsForCounts = async () => {
    try {
      console.log("📊 Fetching question counts for both libraries...");

      // Fetch company questions for counts
      const companyResponse = await getScopedQuestions("company", 10000); // Increased limit
      const companyCounts: Record<string, number> = {};

      if (companyResponse && companyResponse.data) {
        console.log(
          "📦 Company library total questions:",
          companyResponse.data.length
        );
        companyResponse.data.forEach((q: any) => {
          const qtId = q.question_type_id;
          if (qtId) {
            companyCounts[qtId] = (companyCounts[qtId] || 0) + 1;
          }
        });
        setCompanyQuestionCounts(companyCounts);
        console.log("✅ Company counts by type:", companyCounts);
      }

      // Fetch otomeyt questions for counts
      const otomeytResponse = await getScopedQuestions("meritedge", 10000); // Increased limit
      const otomeytCounts: Record<string, number> = {};

      if (otomeytResponse && otomeytResponse.data) {
        const totalCount = otomeytResponse.data.length;
        console.log("📦 Otomeyt library total questions:", totalCount);
        setOtomeytTotalCount(totalCount); // Set total count for tab label

        otomeytResponse.data.forEach((q: any) => {
          const qtId = q.question_type_id;
          if (qtId) {
            otomeytCounts[qtId] = (otomeytCounts[qtId] || 0) + 1;
          }
        });
        setOtomeytQuestionCounts(otomeytCounts);
        console.log("✅ Otomeyt counts by type:", otomeytCounts);
      }

      console.log("🎉 Both libraries counted successfully!");
    } catch (error) {
      console.error("Failed to fetch questions for counts:", error);
    }
  };

  const closeLibrary = () => {
    setIsOpenLibrary(false);
    setSelectedSectionID(null);
  };

  // Function to fetch company questions from API
  const fetchMyLibraryQuestions = async (isLoadMore = false) => {
    if (isLoadingQuestions) return;

    setIsLoadingQuestions(true);
    try {
      console.log(
        "🔍 QuestionAdd - Fetching company questions with filter:",
        questionFilters.questionTypeId
      );

      // ALWAYS fetch all and filter on frontend for reliability
      const response = await getScopedQuestions(
        "company",
        1000, // Fetch all
        undefined, // No pagination when filtering
        undefined, // skill
        undefined, // domain
        undefined, // difficultyLevel
        undefined, // categoryId
        undefined, // Don't send to API - filter on frontend
        undefined, // status
        undefined, // tags
        undefined // concept
      );

      console.log("✅ Company questions response:", response);

      if (response && response.data) {
        console.log(
          "📦 Company total questions received:",
          response.data.length
        );

        let filteredData = response.data;

        // ALWAYS filter on frontend if questionTypeId is present
        if (questionFilters.questionTypeId) {
          const typeIds = questionFilters.questionTypeId.includes(",")
            ? questionFilters.questionTypeId.split(",")
            : [questionFilters.questionTypeId];

          console.log("🔧 Frontend filtering Company for type(s):", typeIds);

          filteredData = response.data.filter((q: any) =>
            typeIds.includes(q.question_type_id)
          );

          console.log(
            "✅ Company filtered to",
            filteredData.length,
            "questions"
          );
        }

        // Calculate counts based on currently filtered/displayed questions
        const displayedCounts: Record<string, number> = {};
        filteredData.forEach((q: any) => {
          const qtId = q.question_type_id;
          if (qtId) {
            displayedCounts[qtId] = (displayedCounts[qtId] || 0) + 1;
          }
        });
        setCurrentFilteredCounts(displayedCounts);
        console.log("📊 Displayed question counts:", displayedCounts);

        // Sort questions by created_at descending (newest first)
        const sortedData = [...filteredData].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

        if (isLoadMore) {
          setMyLibraryQuestions((prev) => [...prev, ...sortedData]);
        } else {
          setMyLibraryQuestions(sortedData);
        }

        // No pagination when we fetch all questions for filtering
        setHasMoreQuestions(false);
      }
    } catch (error) {
      console.error("Failed to fetch company questions:", error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Function to fetch meritedge questions from API
  const fetchOtomeytLibraryQuestions = async (isLoadMore = false) => {
    if (isLoadingOtomeytQuestions) return;

    setIsLoadingOtomeytQuestions(true);
    try {
      console.log(
        "🔍 QuestionAdd - Fetching otomeyt questions with filter:",
        questionFilters.questionTypeId
      );

      // ALWAYS fetch all and filter on frontend for reliability
      const response = await getScopedQuestions(
        "meritedge",
        1000, // Fetch all
        undefined, // No pagination when filtering
        undefined, // skill
        undefined, // domain
        undefined, // difficultyLevel
        undefined, // categoryId
        undefined, // Don't send to API - filter on frontend
        undefined, // status
        undefined, // tags
        undefined // concept
      );

      console.log("✅ Otomeyt questions response:", response);

      if (response && response.data) {
        console.log(
          "📦 Otomeyt total questions received:",
          response.data.length
        );

        let filteredData = response.data;

        // ALWAYS filter on frontend if questionTypeId is present
        if (questionFilters.questionTypeId) {
          const typeIds = questionFilters.questionTypeId.includes(",")
            ? questionFilters.questionTypeId.split(",")
            : [questionFilters.questionTypeId];

          console.log("🔧 Frontend filtering Otomeyt for type(s):", typeIds);

          filteredData = response.data.filter((q: any) =>
            typeIds.includes(q.question_type_id)
          );

          console.log(
            "✅ Otomeyt filtered to",
            filteredData.length,
            "questions"
          );
        }

        // Calculate counts based on currently filtered/displayed questions
        const displayedCounts: Record<string, number> = {};
        filteredData.forEach((q: any) => {
          const qtId = q.question_type_id;
          if (qtId) {
            displayedCounts[qtId] = (displayedCounts[qtId] || 0) + 1;
          }
        });
        setCurrentFilteredCounts(displayedCounts);
        console.log("📊 Displayed question counts:", displayedCounts);

        // Sort questions by created_at descending (newest first)
        const sortedData = [...filteredData].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

        if (isLoadMore) {
          setOtomeytLibraryQuestions((prev) => [...prev, ...sortedData]);
        } else {
          setOtomeytLibraryQuestions(sortedData);
        }

        // No pagination when we fetch all questions for filtering
        setHasMoreOtomeytQuestions(false);
      }
    } catch (error) {
      console.error("Failed to fetch meritedge questions:", error);
    } finally {
      setIsLoadingOtomeytQuestions(false);
    }
  };

  // Load more questions
  const loadMoreQuestions = () => {
    if (hasMoreQuestions && !isLoadingQuestions) {
      fetchMyLibraryQuestions(true);
    }
  };

  // Load more Otomeyt questions
  const loadMoreOtomeytQuestions = () => {
    if (hasMoreOtomeytQuestions && !isLoadingOtomeytQuestions) {
      fetchOtomeytLibraryQuestions(true);
    }
  };

  const handleSelectionSummaryOk = () => {
    showToast({
      message: `Successfully questions added`,
      description:
        "Now you  can rearrange and manage your questions in the section.",
      position: "top-right",
      duration: 3000,
    });
  };

  // Handle question type selection from sidebar
  const handleQuestionTypeSelection = (questionTypeIds: string[]) => {
    console.log("📋 Question types selected in QuestionAdd:", questionTypeIds);

    // If no types selected, clear the filter completely
    if (questionTypeIds.length === 0) {
      setQuestionFilters({
        selectedQuestionTypes: [],
        questionTypeId: undefined,
      });
    } else {
      setQuestionFilters({
        selectedQuestionTypes: questionTypeIds,
        questionTypeId: questionTypeIds.join(","),
      });
    }
  };

  // Function to handle question selection changes from QuestionLibrarySideBar
  const handleQuestionSelectionChange = (checkedKeys: string[]) => {
    // Convert checked keys to the new format with id and category_id
    if (
      questionTypes &&
      questionTypes.items &&
      questionTypes.items.length > 0
    ) {
      const questionTypeData = questionTypes.items[0]?.attributes?.data;
      if (questionTypeData) {
        const questionCategoryMap: Record<string, string> = {};

        // Create mapping of question IDs to category IDs
        questionTypeData.question_types.forEach((qt) => {
          questionCategoryMap[String(qt.id)] = String(qt.category_id || "");
        });

        const newSelectedQuestions = checkedKeys.map((questionId) => ({
          id: questionId,
          category_id: questionCategoryMap[questionId] || "",
        }));

        setSelectedQuestions(newSelectedQuestions);
        console.log(
          "Question selection changed in QuestionAdd:",
          newSelectedQuestions
        );
      }
    }
  };

  // Function to select all questions
  const handleSelectAllQuestions = () => {
    if (
      questionTypes &&
      questionTypes.items &&
      questionTypes.items.length > 0
    ) {
      const questionTypeData = questionTypes.items[0]?.attributes?.data;
      if (questionTypeData) {
        const allQuestions = questionTypeData.question_types.map((qt) => ({
          id: String(qt.id),
          category_id: String(qt.category_id || ""),
        }));

        setSelectedQuestions(allQuestions);
        console.log("All questions selected from QuestionAdd:", allQuestions);
      }
    }
  };

  // Function to clear all selections
  const handleClearAllQuestions = () => {
    setSelectedQuestions([]);
    // Also clear question type filters
    setQuestionFilters({
      selectedQuestionTypes: [],
      questionTypeId: undefined,
    });
    console.log("All selections and filters cleared from QuestionAdd");
  };

  // Function to select all questions from a specific category
  const handleSelectCategoryQuestions = (
    categoryId: string,
    select: boolean
  ) => {
    if (
      questionTypes &&
      questionTypes.items &&
      questionTypes.items.length > 0
    ) {
      const questionTypeData = questionTypes.items[0]?.attributes?.data;
      if (questionTypeData) {
        const categoryQuestions = questionTypeData.question_types.filter(
          (qt) => String(qt.category_id) === categoryId
        );
        const questionKeys = categoryQuestions.map((qt) => String(qt.id));

        let newSelected: Array<{ id: string; category_id: string }>;
        if (select) {
          // Add all questions from this category
          const newQuestions = questionKeys.filter(
            (key) => !selectedQuestions.some((q) => q.id === key)
          );
          newSelected = [
            ...selectedQuestions,
            ...newQuestions.map((key) => ({
              id: key,
              category_id: categoryId,
            })),
          ];
        } else {
          // Remove all questions from this category
          newSelected = selectedQuestions.filter(
            (q) => q.category_id !== categoryId
          );
        }

        setSelectedQuestions(newSelected);
        console.log(
          `${
            select ? "Selected" : "Deselected"
          } category ${categoryId} from QuestionAdd:`,
          questionKeys
        );
        console.log("Updated selection:", newSelected);
      }
    }
  };

  const [isQuestionAddSectionOpen, setIsQuestionAddSectionOpen] =
    useState(true);

  const openQuestionAddSection = () => {
    setIsQuestionAddSectionOpen((prev) => !prev);
  };

  const [isQuestionLibraryOpen, setIsQuestionLibraryOpen] = useState(true);

  const openQuestionLibrary = () => {
    setIsQuestionLibraryOpen((prev) => !prev);
  };

  const headerRef = useRef(null);

  useLayoutEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        // Update height logic if needed in the future
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const [selectedSectionID, setSelectedSectionID] = useState(null);

  // Section Questions State
  const [sectionQuestions, setSectionQuestions] = useState<any>(null);
  const [sectionQuestionsLoading, setSectionQuestionsLoading] = useState(false);

  // Question Types State
  const [questionTypes, setQuestionTypes] = useState<any>(null);
  const [questionTypesLoading, setQuestionTypesLoading] = useState(false);

  // Delete question modal state
  const [isDeleteQuestionModalOpen, setIsDeleteQuestionModalOpen] =
    useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [deleteQuestionLoading, setDeleteQuestionLoading] = useState(false);

  // Delete section modal state
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] =
    useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<any>(null);
  const [deleteSectionLoading, setDeleteSectionLoading] = useState(false);

  // Helper function to extract question types array from the API response structure
  const getQuestionTypesArray = useCallback(() => {
    if (!questionTypes) return [];

    // Handle the actual API response structure: questionTypes.items[0].attributes.data.question_types
    if (
      questionTypes.items &&
      Array.isArray(questionTypes.items) &&
      questionTypes.items.length > 0 &&
      questionTypes.items[0].attributes &&
      questionTypes.items[0].attributes.data &&
      questionTypes.items[0].attributes.data.question_types &&
      Array.isArray(questionTypes.items[0].attributes.data.question_types)
    ) {
      return questionTypes.items[0].attributes.data.question_types;
    }

    // Fallback: If questionTypes is already an array
    if (Array.isArray(questionTypes)) {
      return questionTypes;
    }

    // Fallback: If questionTypes has a data property
    if (questionTypes.data && Array.isArray(questionTypes.data)) {
      return questionTypes.data;
    }

    return [];
  }, [questionTypes]);

  // Handle question deletion - open modal
  const handleDeleteQuestion = (questionId: string) => {
    console.log("handleDeleteQuestion function called with:", questionId);
    console.log("Current assessment key:", currentAssessment?.key);
    console.log("Selected section ID:", selectedSectionID);

    // Validate required data
    if (!currentAssessment?.key || !selectedSectionID) {
      console.error("Missing required data for deletion");
      showErrorToast("Assessment ID and Section ID are required");
      return;
    }

    // Set question to delete and open modal
    setQuestionToDelete(questionId);
    setIsDeleteQuestionModalOpen(true);
  };

  // Confirm question deletion
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete || !currentAssessment?.key || !selectedSectionID) {
      console.error("Missing required data for deletion");
      showErrorToast("Assessment ID and Section ID are required");
      return;
    }

    setDeleteQuestionLoading(true);
    console.log("Delete confirmed, proceeding with API call");

    try {
      console.log("Calling removeQuestionsFromSection API with:", {
        assessmentId: currentAssessment.key,
        sectionId: selectedSectionID,
        questionIds: [questionToDelete],
      });

      const response = await removeQuestionsFromSection(
        currentAssessment.key,
        selectedSectionID,
        [questionToDelete]
      );

      console.log("API response:", response);

      if (response.success) {
        showSuccessToast("Question removed successfully!");
        // Refresh the section questions
        console.log("Refreshing section questions...");
        await handleChangeSection(selectedSectionID);
        // Refresh the assessment data to update section question counts
        await getAssessmentData();
        // Close modal
        setIsDeleteQuestionModalOpen(false);
        setQuestionToDelete(null);
      } else {
        const errorMessage =
          response.data?.message ||
          response.data ||
          response.error ||
          "Unknown error";
        console.error("API returned error:", errorMessage);
        showErrorToast(`Failed to remove question: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error removing question:", error);
      showErrorToast("Failed to remove question. Please try again.");
    } finally {
      setDeleteQuestionLoading(false);
    }
  };

  // Cancel question deletion
  const cancelDeleteQuestion = () => {
    setIsDeleteQuestionModalOpen(false);
    setQuestionToDelete(null);
  };

  // Generate dynamic tabs based on question types
  const generateTabsFromQuestions = useCallback(() => {
    // If no section is selected, show a message
    if (!selectedSectionID) {
      return [
        {
          key: "1",
          label: "No Section Selected",
          children: (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-[#6B7280] mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No Section Selected
              </h3>
              <p
                className="text-sm max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                Please select a section from the sidebar to view its questions
                and manage the assessment content.
              </p>
            </div>
          ),
        },
      ];
    }

    // If section is selected but no questions data available
    if (
      !sectionQuestions?.section?.questions ||
      typeof sectionQuestions.section.questions !== "object"
    ) {
      return [
        {
          key: "1",
          label: "No Questions Available",
          children: (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-[#6B7280] mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No Questions Found
              </h3>
              <p
                className="text-sm max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                This section doesn't have any questions yet. Add questions from
                the question library to get started.
              </p>
            </div>
          ),
        },
      ];
    }

    // Get questions from the new API response structure
    const questionsObject = sectionQuestions.section.questions;

    // If questions object is empty or doesn't exist
    if (!questionsObject || Object.keys(questionsObject).length === 0) {
      return [
        {
          key: "1",
          label: "No Questions Available",
          children: (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-[#6B7280] mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No Questions Found
              </h3>
              <p
                className="text-sm max-w-md"
                style={{ color: "var(--text-secondary)" }}
              >
                This section doesn't have any questions yet. Add questions from
                the question library to get started.
              </p>
            </div>
          ),
        },
      ];
    }

    // Get question type codes from the questions object keys
    const questionTypeCodes = Object.keys(questionsObject);

    // Create tabs based on question type codes
    const tabs = questionTypeCodes.map(
      (questionTypeCode: string, index: number) => {
        const questionsOfType = questionsObject[questionTypeCode] || [];

        // Find the question type name from questionTypes data
        const questionTypesArray = getQuestionTypesArray();
        const questionTypeInfo = questionTypesArray.find(
          (type: any) => type.id === questionTypeCode
        );
        const questionTypeName = questionTypeInfo?.label || questionTypeCode;

        // Transform API data to match component expectations
        const transformedQuestions = questionsOfType.map((question: any) => ({
          title:
            question.question_text || question.title || "Untitled Question",
          tag: question.tags?.[0] || question.domain || "General",
          createdAt: question.created_at
            ? new Date(question.created_at).toLocaleDateString()
            : "Unknown",
          uses: question.uses || "0",
          passRate: question.pass_rate || "0%",
          duration: question.time_limit
            ? `${question.time_limit} min`
            : "No limit",
          description:
            question.description ||
            question.question_text ||
            "No description available",
          question_type: question.question_type,
          difficulty_level: question.difficulty_level,
          options: question.options || [],
          correct_answers: question.correct_answers || [],
          max_score: question.max_score || "1",
          domain: question.domain || "General",
          skill: question.skill || "General",
          // Keep original data for any other properties
          ...question,
        }));

        // Determine the appropriate component based on question type
        let children;
        if (
          questionTypeName.toLowerCase().includes("mcq") ||
          questionTypeName.toLowerCase().includes("multiple")
        ) {
          children = (
            <MCQQuestion
              MCQQuestions={transformedQuestions}
              onDeleteQuestion={handleDeleteQuestion}
            />
          );
        } else if (
          questionTypeName.toLowerCase().includes("coding") ||
          questionTypeName.toLowerCase().includes("programming")
        ) {
          children = (
            <CodingQuestion
              codingQuestions={transformedQuestions}
              onDeleteQuestion={handleDeleteQuestion}
            />
          );
        } else {
          // Generic component for other question types
          children = (
            <div className="p-4">
              <h3
                className="text-lg mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {questionTypeName} Questions
              </h3>
              <div className="space-y-4">
                {questionsOfType.map((question: any, qIndex: number) => {
                  console.log("Question object:", question);
                  console.log("Question ID:", question.question_id);
                  return (
                    <div
                      key={qIndex}
                      className="group !relative !w-full !rounded-[8px] !overflow-hidden !mt-3"
                    >
                      <Card
                        className="!rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 !m-[2px] hover:!border-[#7C3AED] hover:!shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                        style={{
                          position: "relative",
                          borderRadius: "14px",
                          border: "1px solid var(--border-primary)",
                          backgroundColor: "var(--bg-tertiary)",
                          boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.1)",
                          backdropFilter: "blur(25px)",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C3AED";
                          e.currentTarget.style.boxShadow =
                            "0px 0px 20px rgba(124, 58, 237, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--border-primary)";
                          e.currentTarget.style.boxShadow =
                            "0px 4px 4px 0px rgba(0, 0, 0, 0.1)";
                        }}
                      >
                        {/* Left border indicator */}
                        <div
                          style={{
                            position: "absolute",
                            left: "0",
                            top: "24px",
                            width: "6px",
                            height: "34px",
                            backgroundColor: "#7C3AED",
                            borderRadius: "0px 100px 100px 0px",
                          }}
                        />

                        <div style={{ padding: "20px" }}>
                          {/* Title */}
                          <div
                            style={{
                              fontFamily: "Helvetica_Neue-Medium, Helvetica",
                              fontWeight: "500",
                              color: "var(--text-primary)",
                              fontSize: "16px",
                              lineHeight: "1.4",
                              marginBottom: "16px",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                const text =
                                  question.question_text ||
                                  question.title ||
                                  `Question ${qIndex + 1}`;
                                // Decode HTML entities if present
                                const textArea =
                                  document.createElement("textarea");
                                textArea.innerHTML = text;
                                return textArea.value;
                              })(),
                            }}
                          />

                          {/* Header Row - Metadata */}
                          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                            {/* Left side: Domain + Concept + Difficulty + Score + Time */}
                            <div className="flex items-center gap-4 flex-wrap">
                              {/* Domain */}
                              {question.domain && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`${
                                      import.meta.env.BASE_URL
                                    }question-library/tag.svg`}
                                    className="w-4 h-4"
                                    alt="domain"
                                  />
                                  <span
                                    style={{
                                      color: "var(--text-secondary)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {question.domain}
                                  </span>
                                </div>
                              )}
                              {/* Concept */}
                              {question.concept && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`${
                                      import.meta.env.BASE_URL
                                    }question-library/light-bulb.svg`}
                                    className="w-4 h-4"
                                    alt="concept"
                                  />
                                  <span
                                    style={{
                                      color: "var(--text-secondary)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {Array.isArray(question.concept)
                                      ? question.concept[0]
                                      : question.concept}
                                  </span>
                                </div>
                              )}
                              {/* Difficulty */}
                              {question.difficulty_level && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`${
                                      import.meta.env.BASE_URL
                                    }question-library/escalator-down.svg`}
                                    className="w-4 h-4"
                                    alt="difficulty"
                                  />
                                  <span
                                    style={{
                                      color: "var(--text-secondary)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    L{question.difficulty_level}
                                  </span>
                                </div>
                              )}
                              {/* Score */}
                              {question.max_score && (
                                <div className="flex items-center gap-2">
                                  <span
                                    style={{
                                      color: "var(--text-secondary)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    Score: {question.max_score} points
                                  </span>
                                </div>
                              )}
                              {/* Time */}
                              {question.time_limit &&
                                question.time_limit !== "0" && (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={`${
                                        import.meta.env.BASE_URL
                                      }question-library/clock.svg`}
                                      className="w-4 h-4"
                                      alt="time"
                                    />
                                    <span
                                      style={{
                                        color: "var(--text-secondary)",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {question.time_limit} min
                                    </span>
                                  </div>
                                )}
                            </div>

                            {/* Right side: Action Buttons */}
                            <div className="flex items-center gap-3">
                              <span
                                className="px-3 py-1 text-white text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: "var(--accent-primary)",
                                }}
                              >
                                {questionTypeName}
                              </span>
                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  console.log(
                                    "Delete button clicked for question:",
                                    question.question_id
                                  );
                                  handleDeleteQuestion(question.question_id);
                                }}
                                className="cursor-pointer p-2 bg-[#FEE2E2] hover:bg-[#FECACA] rounded-full transition-colors"
                                title="Delete question"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{ color: "#DC2626" }}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Question Description */}
                          {question.description && (
                            <div className="mb-4">
                              <p
                                style={{
                                  fontFamily:
                                    "Helvetica_Neue-Regular, Helvetica",
                                  fontWeight: "400",
                                  color: "var(--text-secondary)",
                                  fontSize: "14px",
                                  lineHeight: "1.6",
                                }}
                              >
                                {question.description}
                              </p>
                            </div>
                          )}

                          {/* Hints */}
                          {question.hints?.length > 0 && (
                            <div className="mb-4">
                              <span
                                className="text-sm font-medium mb-2 block"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Hints:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {question.hints.map(
                                  (hint: string, hintIndex: number) => (
                                    <span
                                      key={hintIndex}
                                      className="inline-block px-2 py-1 text-xs rounded"
                                      style={{
                                        backgroundColor: "var(--bg-tertiary)",
                                        color: "var(--text-primary)",
                                        border:
                                          "1px solid var(--border-primary)",
                                      }}
                                    >
                                      {hint}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Question Options (if any) */}
                          {question.options?.length > 0 && (
                            <div className="mb-4">
                              <span
                                className="text-sm font-medium mb-2 block"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Options:
                              </span>
                              <div className="space-y-2">
                                {question.options.map(
                                  (option: any, optionIndex: number) => (
                                    <div
                                      key={optionIndex}
                                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                                        option.is_correct
                                          ? "!bg-[var(--bg-tertiary)] !border-[#10B981] !text-[#10B981]"
                                          : "!bg-[var(--bg-tertiary)] !border-[var(--border-primary)] !text-[var(--text-primary)]"
                                      }`}
                                    >
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                          option.is_correct
                                            ? "bg-[#10B981] text-white"
                                            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optionIndex)}
                                      </span>
                                      <span
                                        style={{
                                          color: option.is_correct
                                            ? "#10B981"
                                            : "var(--text-primary)",
                                        }}
                                      >
                                        {option.text}
                                      </span>
                                      {option.is_correct && (
                                        <span className="px-2 py-1 bg-[#10B981] text-white text-xs rounded ml-auto">
                                          Correct
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return {
          key: (index + 1).toString(),
          label: <>{`${questionTypeName} (${questionsOfType.length})`}</>,
          children: children,
        };
      }
    );

    return tabs;
  }, [
    sectionQuestions,
    selectedSectionID,
    getQuestionTypesArray,
    handleDeleteQuestion,
  ]);

  // Section Data State
  const [sectionData, setSectionData] = useState<{
    total_section: string;
    data: {
      sections: Array<{
        section_id: string;
        section_name: string;
        question_count: string;
        questions: any[];
        total_score: string;
        section_order: string;
        question_ids: string[];
      }>;
      [key: string]: any;
    };
  }>({
    total_section: "0",
    data: {
      sections: [],
    },
  });

  // Handle section reordering
  const handleSectionReorder = async (reorderedSections: any[]) => {
    if (!currentAssessment?.key) {
      showErrorToast("Assessment ID not found");
      return;
    }

    try {
      // Create the payload with section_id and new_order (1-based indexing)
      const sectionOrders = reorderedSections.map((section, index) => ({
        section_id: section.section_id,
        new_order: index + 1,
      }));

      console.log("Reordering sections with payload:", {
        assessmentId: currentAssessment.key,
        sectionOrders,
      });

      const response = await reorderSections(
        currentAssessment.key,
        sectionOrders
      );

      console.log("Reorder sections response:", response);

      if (response && response.success !== false) {
        // Refresh assessment data to get updated order
        await getAssessmentData();
        showSuccessToast("Sections reordered successfully");
      } else {
        // Check if response has error data
        let errorMessage = "Failed to reorder sections";
        if (response) {
          if (typeof response.data === "string") {
            errorMessage = response.data;
          } else if (response.data?.message) {
            errorMessage = response.data.message;
          } else if (response.data?.detail) {
            errorMessage = response.data.detail;
          } else if (response.error) {
            errorMessage = response.error;
          }
        }
        console.error("Reorder sections error:", errorMessage, response);
        showErrorToast(errorMessage);
      }
    } catch (error) {
      console.error("Error reordering sections:", error);
      showErrorToast("An error occurred while reordering sections");
    }
  };

  const getAssessmentData = useCallback(
    async (retryCount = 0) => {
      const assessmentResponse = await getAssessment(currentAssessment.key);
      if (assessmentResponse.success) {
        console.log("assessmentResponse", assessmentResponse.data);

        // Calculate actual section count from sections array as fallback
        const actualSectionCount =
          assessmentResponse.data.sections?.length || 0;
        const serverSectionCount = assessmentResponse.data.section_count || 0;

        // Use the higher of the two counts to ensure consistency
        const finalSectionCount = Math.max(
          actualSectionCount,
          serverSectionCount
        );

        setSectionData({
          total_section: String(finalSectionCount),
          data: assessmentResponse.data,
        });

        // Auto-select the first section only if no section is currently selected
        // This preserves the selected section when refreshing after adding questions
        if (
          assessmentResponse.data.sections &&
          assessmentResponse.data.sections.length > 0
        ) {
          const currentSelectedSection = selectedSectionID;
          const sectionExists = assessmentResponse.data.sections.some(
            (s: any) => s.section_id === currentSelectedSection
          );

          // Only auto-select first section if no section is selected or selected section doesn't exist
          if (!currentSelectedSection || !sectionExists) {
            // Sort sections by section_order to ensure we get the first one
            const sortedSections = [...assessmentResponse.data.sections].sort(
              (a, b) => (a.section_order || 0) - (b.section_order || 0)
            );
            const firstSection = sortedSections[0];
            if (firstSection?.section_id) {
              // Set the selected section ID directly
              setSelectedSectionID(firstSection.section_id);
              // Use setTimeout to ensure state is updated after setSectionData
              setTimeout(() => {
                // Fetch section questions
                if (currentAssessment?.key && firstSection.section_id) {
                  getSectionQuestions(
                    currentAssessment.key,
                    firstSection.section_id
                  )
                    .then((questionsResponse) => {
                      if (questionsResponse?.success) {
                        setSectionQuestions(questionsResponse.data);
                      }
                    })
                    .catch((error) => {
                      console.error("Error fetching section questions:", error);
                    })
                    .finally(() => {
                      setSectionQuestionsLoading(false);
                    });
                }
              }, 100);
            }
          } else {
            // If a section is already selected and still exists, refresh its questions
            if (currentSelectedSection && currentAssessment?.key) {
              getSectionQuestions(currentAssessment.key, currentSelectedSection)
                .then((questionsResponse) => {
                  if (questionsResponse?.success) {
                    setSectionQuestions(questionsResponse.data);
                  }
                })
                .catch((error) => {
                  console.error("Error fetching section questions:", error);
                })
                .finally(() => {
                  setSectionQuestionsLoading(false);
                });
            }
          }
        }

        // If there's a mismatch and we haven't retried too many times, retry once
        if (actualSectionCount !== serverSectionCount && retryCount < 1) {
          console.log("Section count mismatch detected, retrying...", {
            actualCount: actualSectionCount,
            serverCount: serverSectionCount,
          });
          setTimeout(() => getAssessmentData(retryCount + 1), 1000);
        }
      }
    },
    [currentAssessment, selectedSectionID]
  );

  const getQuestionTypesData = useCallback(async () => {
    setQuestionTypesLoading(true);
    try {
      const response = await getQuestionTypes();
      if (response.success) {
        console.log("Question types response:", response.data);
        setQuestionTypes(response.data || []);
      } else {
        console.error("Failed to fetch question types:", response.data);
        showToast({
          message: "Error",
          description: "Failed to fetch question types",
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching question types:", error);
      showToast({
        message: "Error",
        description:
          "An unexpected error occurred while fetching question types",
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setQuestionTypesLoading(false);
    }
  }, []);

  // Set sectionData from currentAssessment when it changes
  useEffect(() => {
    if (currentAssessment) {
      console.log("currentAssessment.sections", currentAssessment);
      getAssessmentData();
    }
  }, [currentAssessment, getAssessmentData]);

  const handleChangeSection = useCallback(
    async (section_id: any) => {
      console.log(section_id, "section_id");
      setSelectedSectionID(section_id);
      setSectionQuestionsLoading(true);

      // Fetch section questions from API
      if (currentAssessment?.key && section_id && section_id.length > 1) {
        try {
          const questionsResponse = await getSectionQuestions(
            currentAssessment.key,
            section_id
          );
          if (questionsResponse?.success) {
            setSectionQuestions(questionsResponse.data);

            // Questions data is now available in sectionQuestions.section.questions
            // The generateTabsFromQuestions function will handle the processing
          } else {
            console.error(
              "Failed to fetch section questions:",
              questionsResponse?.data
            );
            setSectionQuestions(null);
          }
        } catch (error) {
          console.error("Error fetching section questions:", error);
          setSectionQuestions(null);
        } finally {
          setSectionQuestionsLoading(false);
        }
      } else {
        setSectionQuestionsLoading(false);
      }
    },
    [currentAssessment?.key]
  );

  // Fetch question types on component mount
  useEffect(() => {
    getQuestionTypesData();
    handleChangeSection(selectedSectionID);
  }, [getQuestionTypesData, handleChangeSection, selectedSectionID]);

  // Disable parent scrolling when component mounts
  useEffect(() => {
    const contentElement = document.querySelector(".ant-layout-content");
    if (contentElement) {
      (contentElement as HTMLElement).style.overflow = "hidden";
    }

    return () => {
      if (contentElement) {
        (contentElement as HTMLElement).style.overflow = "auto";
      }
    };
  }, []);

  // Refetch questions when filters change
  useEffect(() => {
    if (isOpenLibrary) {
      console.log(
        "🔄 Filter changed, refetching questions. Filter:",
        questionFilters.questionTypeId
      );

      // Reset and refetch
      setMyLibraryQuestions([]);
      setHasMoreQuestions(false); // No pagination when filtering all
      setOtomeytLibraryQuestions([]);
      setHasMoreOtomeytQuestions(false); // No pagination when filtering all

      // Always refetch when filter changes (including when cleared to undefined)
      fetchMyLibraryQuestions();
      fetchOtomeytLibraryQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionFilters.questionTypeId, isOpenLibrary]);

  const handleEditSection = (section: any) => {
    console.log("handleEditSection called with:", section);

    // Store section data in ref for immediate access
    editingSectionRef.current = section;
    setEditingSection(section);
    setSectionName(section.section_name || "");
    setSectionInstruction(section.instruction || "");
    setIsEditMode(true);
    setIsAddSectionModalOpen(true);

    console.log("After setting ref:", editingSectionRef.current);
  };

  const handleDeleteSection = (section: any) => {
    console.log("handleDeleteSection called with:", JSON.stringify(section));

    // Validate required data
    if (!currentAssessment?.key || !section?.section_id) {
      console.error("Missing required data for section deletion");
      showErrorToast("Assessment ID and Section ID are required");
      return;
    }

    // Set section to delete and open modal
    setSectionToDelete(section);
    setIsDeleteSectionModalOpen(true);
  };

  // Confirm section deletion
  const confirmDeleteSection = async () => {
    if (!sectionToDelete || !currentAssessment?.key) {
      console.error("Missing required data for section deletion");
      showErrorToast("Assessment ID and Section ID are required");
      return;
    }

    setDeleteSectionLoading(true);
    console.log("Delete section confirmed, proceeding with API call");

    try {
      console.log("Calling deleteSection API with:", {
        assessmentId: currentAssessment.key,
        sectionId: sectionToDelete.section_id,
      });

      const response = await deleteSection(
        currentAssessment.key,
        sectionToDelete.section_id
      );

      console.log("API response:", response);

      if (response.success) {
        showSuccessToast("Section deleted successfully!");

        // Optimistic update: decrement section count immediately
        setSectionData((prevData) => ({
          ...prevData,
          total_section: String(
            Math.max(0, parseInt(prevData.total_section) - 1)
          ),
        }));

        // Refresh the assessment data to ensure consistency
        console.log("Refreshing assessment data...");
        await getAssessmentData();
        // Close modal
        setIsDeleteSectionModalOpen(false);
        setSectionToDelete(null);
      } else {
        const errorMessage =
          response.data?.message ||
          response.data ||
          response.error ||
          "Unknown error";
        console.error("API returned error:", errorMessage);
        showErrorToast(`Failed to delete section: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      showErrorToast("Failed to delete section. Please try again.");
    } finally {
      setDeleteSectionLoading(false);
    }
  };

  // Cancel section deletion
  const cancelDeleteSection = () => {
    setIsDeleteSectionModalOpen(false);
    setSectionToDelete(null);
  };

  const openAddSectionModal = () => {
    setIsEditMode(false);
    setEditingSection(null);
    setSectionName("");
    setSectionInstruction("");
    setIsAddSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsAddSectionModalOpen(false);
    setIsEditMode(false);
    setEditingSection(null);
    setSectionName("");
    setSectionInstruction("");
  };

  const handleSectionSubmit = async () => {
    if (!sectionName.trim() || !sectionInstruction.trim()) {
      showToast({
        message: "Validation Error",
        description: "Please fill in both section name and instruction",
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      if (isEditMode) {
        // Edit existing section
        console.log("Edit mode - Debug info:", {
          isEditMode,
          currentAssessment: currentAssessment?.key,
          editingSectionRef: editingSectionRef.current,
          editingSectionState: editingSection,
        });

        if (!currentAssessment?.key || !editingSectionRef.current?.section_id) {
          showToast({
            message: "Error",
            description: "No assessment or section selected for editing",
            position: "top-right",
            duration: 3000,
          });
          return;
        }

        const response = await updateSection(
          currentAssessment.key,
          editingSectionRef.current.section_id,
          {
            section_name: sectionName.trim(),
            description: sectionInstruction.trim(),
          }
        );

        if (response.success) {
          showToast({
            message: "Success",
            description: `Section "${sectionName}" updated successfully`,
            position: "top-right",
            duration: 3000,
          });

          // Fetch updated assessment data and update store
          getAssessmentData(); // fetch updated assessment data

          closeSectionModal();
        } else {
          showToast({
            message: "Error",
            description: response.data?.message || "Failed to update section",
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        console.log(currentAssessment, "currentAssessment");
        // Create new section
        if (!currentAssessment?.key) {
          showToast({
            message: "Error",
            description: "No assessment selected",
            position: "top-right",
            duration: 3000,
          });
          return;
        }

        const response = await createSection(currentAssessment.key, {
          section_name: sectionName.trim(),
          description: sectionInstruction.trim(),
        });

        if (response.success) {
          showToast({
            message: "Success",
            description: `Section "${sectionName}" created successfully`,
            position: "top-right",
            duration: 3000,
          });

          // Optimistic update: increment section count immediately
          setSectionData((prevData) => ({
            ...prevData,
            total_section: String(parseInt(prevData.total_section) + 1),
          }));

          // Fetch updated assessment data to ensure consistency
          getAssessmentData();

          closeSectionModal();
        } else {
          showToast({
            message: "Error",
            description: response.data?.message || "Failed to create section",
            position: "top-right",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error creating section:", error);
      showToast({
        message: "Error",
        description: "An unexpected error occurred",
        position: "top-right",
        duration: 3000,
      });
    }
  };

  return (
    <div className="h-full overflow-y-hidden overflow-x-visible flex flex-col bg-[var(--bg-primary)]">
      {/* Question Settings Header */}
      <div className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 mb-2">
        <QuestionAddHeader
          currentAssessment={currentAssessment}
          sectionData={sectionData}
          onAssessmentUpdate={getAssessmentData}
        />
      </div>

      <div className="flex-1 overflow-y-hidden overflow-x-visible min-h-0 relative">
        <Row
          align="top"
          justify="start"
          className="relative h-full min-h-0"
          style={{ overflowX: "visible", overflowY: "hidden" }}
        >
          <Drawer
            placement="right"
            closable={false}
            onClose={closeLibrary}
            open={isOpenLibrary}
            getContainer={false}
            mask={true}
            maskStyle={{
              backgroundColor: "var(--bg-primary)",
              opacity: 0.7,
              backdropFilter: "blur(4px)",
            }}
            className="[&_.ant-drawer-mask]:!bg-[var(--bg-primary)] [&_.ant-drawer-mask]:!opacity-70 !bg-transparent !shadow-none !p-0 !overflow-visible"
            width={"98%"}
            bodyStyle={{ padding: 0 }}
            style={{
              left: "25%", // Shift drawer to the right to cover section
            }}
          >
            <Row
              align="top"
              justify="center"
              className="h-full rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-primary)",
                marginLeft: "0", // Ensure content starts from the shifted position
              }}
            >
              <Col
                className={`transition-all duration-300 ${
                  isQuestionLibraryOpen
                    ? "!w-full sm:!w-[23%] md:!w-[36%] lg:!w-[30%] xl:!w-[25%]"
                    : "!w-19"
                }`}
              >
                <QuestionLibrarySideBar
                  selectedQuestionId={[]}
                  handleSelectionSummaryOk={handleSelectionSummaryOk}
                  openQuestionLibrary={openQuestionLibrary}
                  isQuestionLibraryOpen={isQuestionLibraryOpen}
                  questionTypes={questionTypes}
                  questionTypesLoading={questionTypesLoading}
                  selectedQuestions={selectedQuestions}
                  handleQuestionSelectionChange={handleQuestionSelectionChange}
                  handleSelectAllQuestions={handleSelectAllQuestions}
                  handleClearAllQuestions={handleClearAllQuestions}
                  handleSelectCategoryQuestions={handleSelectCategoryQuestions}
                  selectedCategories={[]}
                  selectedQuestionTypes={questionFilters.selectedQuestionTypes}
                  onCategorySelection={() => {}}
                  onQuestionTypeSelection={handleQuestionTypeSelection}
                  questionCounts={currentQuestionCounts}
                  onAddToSection={() => {
                    // Trigger the modal in the question list components via window function
                    if ((window as any).__triggerAddToSection) {
                      (window as any).__triggerAddToSection();
                    }
                  }}
                  shouldHaveFullHeight={false}
                />
              </Col>

              <Col className="flex-1 sm:w-[73%] md:!w-[60%] lg:flex-1 px-2 sm:px-4 md:px-6 lg:px-8 pt-2 pb-2 h-full rounded-2xl mb-3 overflow-y-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
                <QuestionList
                  myLibraryQuestions={myLibraryQuestions}
                  isLoadingQuestions={isLoadingQuestions}
                  hasMoreQuestions={hasMoreQuestions}
                  loadMoreQuestions={loadMoreQuestions}
                  questionTypes={questionTypes}
                  otomeytLibraryQuestions={otomeytLibraryQuestions}
                  isLoadingOtomeytQuestions={isLoadingOtomeytQuestions}
                  hasMoreOtomeytQuestions={hasMoreOtomeytQuestions}
                  loadMoreOtomeytQuestions={loadMoreOtomeytQuestions}
                  assessmentId={currentAssessment?.key}
                  sectionId={selectedSectionID}
                  sectionData={sectionData}
                  onAssessmentRefresh={getAssessmentData}
                  onRefreshLibrary={fetchMyLibraryQuestions}
                  onTabChange={(activeKey) => {
                    setActiveTab(activeKey);
                    console.log(
                      "🔄 Active tab updated to:",
                      activeKey === "1"
                        ? "Otomeyt"
                        : activeKey === "2"
                        ? "My Library"
                        : activeKey === "3"
                        ? "AI Library"
                        : "Favourite"
                    );
                    // Reset filtered counts when switching tabs
                    setCurrentFilteredCounts({});
                  }}
                  otomeytTotalCount={otomeytTotalCount}
                  onSectionSelect={handleChangeSection}
                  favoriteQuestions={favoriteQuestions}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                />
              </Col>
            </Row>
          </Drawer>

          <Col
            className={`transition-all duration-300 mb-6 ${
              isQuestionAddSectionOpen
                ? "!w-full sm:!w-[23%] md:!w-[36%] lg:!w-[30%] xl:!w-[25%]"
                : "!w-19"
            }`}
            style={{
              opacity: isOpenLibrary ? 0 : 1,
              pointerEvents: isOpenLibrary ? "none" : "auto",
              transition: "opacity 0.3s ease",
            }}
          >
            <QuestionAddSideBar
              sectionData={sectionData}
              openQuestionAddSection={openQuestionAddSection}
              isQuestionAddSectionOpen={isQuestionAddSectionOpen}
              handleChangeSection={handleChangeSection}
              selectedSectionID={selectedSectionID}
              handleEditSection={handleEditSection}
              handleDeleteSection={handleDeleteSection}
              openAddSectionModal={openAddSectionModal}
              sectionQuestions={sectionQuestions}
              sectionQuestionsLoading={sectionQuestionsLoading}
              onSectionReorder={handleSectionReorder}
            />
          </Col>

          <Col className="flex-1 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-7 h-full rounded-2xl mb-3 overflow-y-auto">
            {/* Question Types Loading Indicator */}
            {questionTypesLoading && (
              <div
                className="mb-4 p-4 rounded-lg border flex items-center justify-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-primary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7C3AED]"></div>
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Loading question types...
                  </span>
                </div>
              </div>
            )}

            <Tabs
              defaultActiveKey="1"
              items={generateTabsFromQuestions()}
              tabBarExtraContent={
                <div className="flex items-center gap-3 mr-2">
                  {/* Add Collaborators Button */}
                  {/* <Button
                  type="primary"
                  size="small"
                  className="!rounded-lg !font-semibold hover:!bg-[#4C1D95] !text-xs sm:!text-sm"
                  style={{
                    backgroundColor: "#5B21B6",
                    borderColor: "#5B21B6",
                    color: "#ffffff",
                  }}
                  onClick={() => setIsAddCollaboratorsModalOpen(true)}
                >
                  Add Collaborator(s)
                </Button> */}
                </div>
              }
              className={`
                            text-lg mb-6
                            [&_.ant-tabs-nav]:!bg-[var(--bg-primary)]
                            [&_.ant-tabs-tab-btn]:!text-[var(--text-secondary)]
                            [&_.ant-tabs-tab-btn]:!font-semibold
                            [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[var(--text-primary)]
                            [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!font-bold
                            [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!opacity-100
                            [&_.ant-tabs-ink-bar]:!bg-[#7C3AED]
                            [&_.ant-tabs-ink-bar]:h-1.5
                            [&_.ant-tabs-nav]:border-b-0
                            [&_.ant-tabs-content-holder]:border-0
                            [&_.ant-tabs-tabpane]:animate-[slideUpFadeIn_0.6s_ease-out_forwards]
                        `}
              style={{ backgroundColor: "var(--bg-primary)" }}
            />
          </Col>
        </Row>

        {/* Close Library Button - Outside Row to prevent clipping */}
        {isOpenLibrary && (
          <div
            style={{
              padding: "2px",
              borderRadius: "10px 10px 0 0",
              background:
                "conic-gradient(from 180deg at 50% 50%, #C401F7, #4700EA, #00A6E8, #C401F7)",
              display: "inline-block",
              transform: "rotate(-90deg)",
              position: "absolute",
              left: "-120px", // Adjust for drawer shift (25% drawer start - button width)
              top: "50%",
              zIndex: 1000,
              translate: "58% -50%",
              overflow: "visible",
            }}
          >
            <Button
              onClick={closeLibrary}
              type="default"
              style={{
                border: "none",
                borderRadius: "10px 10px 0 0",
                marginBottom: "-2px",
                backgroundColor: "#000",
                color: "#fff",
                padding: "20px 15px 20px",
                fontWeight: 500,
                fontSize: "1rem",
              }}
            >
              Close Library
            </Button>
          </div>
        )}

        {/* Open Library Button - Outside Row to prevent clipping */}
        {!isOpenLibrary && (
          <div
            style={{
              padding: "2px",
              borderRadius: "10px 10px 0 0",
              background:
                "conic-gradient(from 180deg at 50% 50%, #C401F7, #4700EA, #00A6E8, #C401F7)",
              display: "inline-block",
              transform: "rotate(-90deg)",
              position: "absolute",
              right: 43,
              top: "50%",
              zIndex: 100,
              translate: "58% -50%",
              overflow: "visible",
            }}
          >
            <Button
              onClick={openLibrary}
              type="default"
              style={{
                border: "none",
                borderRadius: "10px 10px 0 0",
                backgroundColor: "#000",
                color: "#fff",
                padding: "20px 24px 35px",
                fontWeight: 500,
                fontSize: "1rem",
                position: "relative",
                zIndex: 1,
                animation:
                  "openLibraryRadiate 2s ease-in-out infinite, openLibraryComeForth 1.8s ease-in-out infinite",
                transformStyle: "preserve-3d",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.animation = "none";
                e.currentTarget.style.transform =
                  "scale(1.15) translateZ(15px)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(0, 166, 232, 0.7), 0 0 60px rgba(0, 166, 232, 0.5), 0 0 90px rgba(0, 166, 232, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animation =
                  "openLibraryRadiate 2s ease-in-out infinite, openLibraryComeForth 1.8s ease-in-out infinite";
                e.currentTarget.style.transform = "scale(1) translateZ(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Open Library
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Section Modal */}
      <Modal
        title={isEditMode ? `Edit Section` : `Section`}
        open={isAddSectionModalOpen}
        onOk={handleSectionSubmit}
        onCancel={closeSectionModal}
        okText={isEditMode ? "Update Section" : "Add Section"}
        cancelText="Cancel"
        className="[&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-close]:!text-[var(--text-primary)] [&_.ant-btn-primary]:!bg-[var(--accent-primary)] [&_.ant-btn-primary]:!border-[var(--accent-primary)] [&_.ant-btn-default]:!text-[var(--text-primary)] [&_.ant-btn-default]:!border-[var(--border-primary)]"
        styles={{
          mask: {
            backdropFilter: "blur(10px)",
            background: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            border: "1px solid var(--border-primary)",
            borderRadius: "12px",
            background: "var(--bg-primary)",
          },
          header: {
            borderBottom: "1px solid var(--border-primary)",
            borderRadius: "12px 12px 0 0",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          },
          body: {
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            padding: "24px",
          },
          footer: {
            borderTop: "1px solid var(--border-primary)",
            borderRadius: "0 0 12px 12px",
            background: "var(--bg-primary)",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Name
            </label>
            <Input
              placeholder="Enter Name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="!h-10 !pl-5 !rounded-xl"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Instruction
            </label>
            <Input.TextArea
              placeholder="Enter Text"
              value={sectionInstruction}
              onChange={(e) => setSectionInstruction(e.target.value)}
              rows={4}
              className="!rounded-xl"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Question Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <span
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Delete Question
            </span>
          </div>
        }
        open={isDeleteQuestionModalOpen}
        onCancel={cancelDeleteQuestion}
        footer={[
          <Button
            key="cancel"
            onClick={cancelDeleteQuestion}
            className="!bg-transparent hover:!bg-gray-100"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border-primary)",
            }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteQuestionLoading}
            onClick={confirmDeleteQuestion}
            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
          >
            {deleteQuestionLoading ? "Deleting..." : "Delete Question"}
          </Button>,
        ]}
        className="[&_.ant-modal-content]:!bg-[var(--bg-primary)] [&_.ant-modal-content]:!border-[var(--border-primary)] [&_.ant-modal-header]:!bg-[var(--bg-primary)] [&_.ant-modal-header]:!border-b-[var(--border-primary)] [&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-footer]:!bg-[var(--bg-primary)] [&_.ant-modal-footer]:!border-t-[var(--border-primary)]"
        width={500}
      >
        <div className="py-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Are you sure you want to delete this question?
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                This action cannot be undone. The question will be permanently
                removed from the assessment section.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Section Confirmation Modal */}
      <DeleteSectionModal
        open={isDeleteSectionModalOpen}
        onCancel={cancelDeleteSection}
        onConfirm={confirmDeleteSection}
        sectionToDelete={sectionToDelete}
        loading={deleteSectionLoading}
      />

      {/* Add Collaborators Modal */}
      <Modal
        title={
          <span className="text-lg" style={{ color: "var(--text-primary)" }}>
            Add Collaborator(s)
          </span>
        }
        open={isAddCollaboratorsModalOpen}
        onCancel={() => {
          setIsAddCollaboratorsModalOpen(false);
          setCollaboratorEmail("");
        }}
        footer={null}
        className="[&_.ant-modal-title]:!text-[var(--text-primary)] [&_.ant-modal-close]:!text-[var(--text-primary)]"
        styles={{
          mask: {
            backdropFilter: "blur(10px)",
            background: "var(--bg-primary)",
            backgroundSize: "40px 40px",
            backgroundImage: `linear-gradient(to right, var(--border-primary) 2px, transparent 2px), linear-gradient(to bottom, var(--border-primary) 2px, transparent 2px)`,
          },
          content: {
            border: "1px solid var(--border-primary)",
            borderRadius: "12px",
            background: "var(--bg-primary)",
          },
          header: {
            borderBottom: "1px solid var(--border-primary)",
            borderRadius: "12px 12px 0 0",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          },
          body: {
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            padding: "24px",
          },
        }}
      >
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Email ID
            </label>
            <Input
              placeholder="Enter collaborator email"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              className="!h-10 !rounded-xl"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            className="!rounded-lg !font-semibold hover:!bg-[#4C1D95] w-full !h-10"
            style={{
              backgroundColor: "#5B21B6",
              borderColor: "#5B21B6",
              color: "#ffffff",
            }}
            onClick={() => {
              if (collaboratorEmail.trim()) {
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(collaboratorEmail.trim())) {
                  message.error("Please enter a valid email address");
                  return;
                }

                message.success("Collaborator added successfully");
                setIsAddCollaboratorsModalOpen(false);
                setCollaboratorEmail("");
              } else {
                message.error("Please enter an email address");
              }
            }}
          >
            Submit
          </Button>
        </div>
      </Modal>
    </div>
  );
}
