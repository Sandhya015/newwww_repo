/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Button, Col, Row } from "antd";
import { Link } from "react-router-dom";

// Toster
import { showToast } from "../../utils/toast";

// API
import { getQuestionTypes, getScopedQuestions } from "../../lib/api";

// Components
import QuestionLibraryDedicatedSideBar from "../../components/QuestionLibrary/QuestionLibrary/QuestionLibraryDedicatedSideBar";
import QuestionLibraryDedicatedList from "../../components/QuestionLibrary/QuestionLibrary/QuestionLibraryDedicatedList";
import QuestionLibraryDedicatedCreator from "../../components/QuestionLibrary/QuestionLibrary/QuestionLibraryDedicatedCreator";
import QuestionHeader from "../../components/QuestionLibrary/Core/QuestionHeader";

export default function QuestionLibrary() {
  // State for selected questions
  const [selectedQuestions, setSelectedQuestions] = useState<
    Array<{ id: string; category_id: string }>
  >([]);

  // State for library sidebar
  const [isQuestionLibraryOpen, setIsQuestionLibraryOpen] = useState(true);

  // State for question types (will be passed to dedicated components)
  const [questionTypes, setQuestionTypes] = useState<any>(null);
  const [questionTypesLoading, setQuestionTypesLoading] = useState(false);

  // State for all questions (to calculate counts)
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(
    {}
  );

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

  // Centralized filter state
  const [filters, setFilters] = useState({
    // From QuestionLibraryDedicatedList filters
    skill: undefined as string | undefined,
    domain: undefined as string | undefined,
    difficultyLevel: undefined as string | undefined,
    categoryId: undefined as string | undefined,
    questionTypeId: undefined as string | undefined,
    status: undefined as string | undefined,
    tags: undefined as string | undefined,
    concept: undefined as string | undefined,

    // From QuestionLibraryDedicatedSideBar
    selectedCategories: [] as string[],
    selectedQuestionTypes: [] as string[],
  });

  const handleSelectionSummaryOk = (index: number) => {
    showToast({
      message: `Successfully questions added`,
      description:
        "Now you  can rearrange and manage your questions in the section.",
      position: "top-right",
      duration: 3000,
    });
  };

  const openQuestionLibrary = () => {
    setIsQuestionLibraryOpen((prev) => !prev);
  };

  // Handle question selection changes
  const handleQuestionSelectionChange = (checkedKeys: string[]) => {
    if (
      questionTypes &&
      questionTypes.items &&
      questionTypes.items.length > 0
    ) {
      const questionTypeData = questionTypes.items[0]?.attributes?.data;
      if (questionTypeData) {
        const questionCategoryMap: Record<string, string> = {};

        // Create mapping of question IDs to category IDs
        questionTypeData.question_types.forEach((qt: any) => {
          questionCategoryMap[String(qt.id)] = String(qt.category_id || "");
        });

        const newSelectedQuestions = checkedKeys.map((questionId) => ({
          id: questionId,
          category_id: questionCategoryMap[questionId] || "",
        }));

        setSelectedQuestions(newSelectedQuestions);
      }
    }
  };

  // Handle select all questions
  const handleSelectAllQuestions = () => {
    if (
      questionTypes &&
      questionTypes.items &&
      questionTypes.items.length > 0
    ) {
      const questionTypeData = questionTypes.items[0]?.attributes?.data;
      if (questionTypeData) {
        const allQuestions = questionTypeData.question_types.map((qt: any) => ({
          id: String(qt.id),
          category_id: String(qt.category_id || ""),
        }));

        setSelectedQuestions(allQuestions);
      }
    }
  };

  // Handle clear all questions
  const handleClearAllQuestions = () => {
    setSelectedQuestions([]);
  };

  // Handle select category questions
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
          (qt: any) => String(qt.category_id) === categoryId
        );

        if (select) {
          // Add category questions to selected questions
          const newCategoryQuestions = categoryQuestions.map((qt: any) => ({
            id: String(qt.id),
            category_id: String(qt.category_id || ""),
          }));
          setSelectedQuestions((prev) => [...prev, ...newCategoryQuestions]);
        } else {
          // Remove category questions from selected questions
          const categoryQuestionIds = categoryQuestions.map((qt: any) =>
            String(qt.id)
          );
          setSelectedQuestions((prev) =>
            prev.filter((q) => !categoryQuestionIds.includes(q.id))
          );
        }
      }
    }
  };

  // Handle question created callback
  const handleQuestionCreated = () => {
    // This will be handled by the dedicated components
  };

  // Handle filter changes from QuestionLibraryDedicatedList
  const handleFilterChange = (
    filterType: string,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Handle category and question type selection from QuestionLibraryDedicatedSideBar
  const handleCategorySelection = (categoryIds: string[]) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: categoryIds,
    }));
  };

  const handleQuestionTypeSelection = (questionTypeIds: string[]) => {
    console.log("📋 Question types selected:", questionTypeIds);

    // If no types selected, clear the filter completely
    if (questionTypeIds.length === 0) {
      setFilters((prev) => ({
        ...prev,
        selectedQuestionTypes: [],
        questionTypeId: undefined,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        selectedQuestionTypes: questionTypeIds,
        // Convert array to comma-separated string for API
        questionTypeId: questionTypeIds.join(","),
      }));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      skill: undefined,
      domain: undefined,
      difficultyLevel: undefined,
      categoryId: undefined,
      questionTypeId: undefined,
      status: undefined,
      tags: undefined,
      concept: undefined,
      selectedCategories: [],
      selectedQuestionTypes: [],
    });
  };

  // Fetch question types on component mount
  useEffect(() => {
    getQuestionTypesData();
    fetchAllQuestionsForCounts();
  }, []);

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

  // Fetch all questions to calculate counts (without filters)
  const fetchAllQuestionsForCounts = async () => {
    try {
      const response = await getScopedQuestions("company", 1000); // Fetch many to get counts
      if (response && response.data) {
        // Sort questions by created_at descending (newest first)
        const sortedData = [...response.data].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

        setAllQuestions(sortedData);

        // Log all unique question type IDs to see what IDs are actually used
        const uniqueTypeIds = new Set(
          response.data.map((q: any) => q.question_type_id)
        );
        console.log(
          "🔍 All question type IDs in your library:",
          Array.from(uniqueTypeIds)
        );

        // Log essay questions specifically
        const essayQuestions = response.data.filter(
          (q: any) =>
            q.question_type?.toLowerCase().includes("essay") ||
            q.question_type?.toLowerCase().includes("subjective")
        );
        console.log("📝 Essay questions found:", essayQuestions.length);
        if (essayQuestions.length > 0) {
          console.log(
            "📝 Essay question type IDs:",
            essayQuestions.map((q: any) => ({
              id: q.question_type_id,
              type: q.question_type,
              text: q.question_text?.substring(0, 50),
            }))
          );
        }

        // Calculate counts by question type
        const counts: Record<string, number> = {};
        response.data.forEach((q: any) => {
          const qtId = q.question_type_id;
          if (qtId) {
            counts[qtId] = (counts[qtId] || 0) + 1;
          }
        });
        console.log("📊 Question counts by type:", counts);
        setQuestionCounts(counts);
      }
    } catch (error) {
      console.error("Failed to fetch questions for counts:", error);
    }
  };

  // Function to fetch question types
  const getQuestionTypesData = async () => {
    setQuestionTypesLoading(true);
    try {
      const response = await getQuestionTypes();
      if (response.success) {
        setQuestionTypes(response.data || []);
      } else {
        showToast({
          message: "Error",
          description: "Failed to fetch question types",
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch question types:", error);
      showToast({
        message: "Error",
        description: "Failed to fetch question types",
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setQuestionTypesLoading(false);
    }
  };

  console.log(filters, "filters");
  return (
    <div className="h-full overflow-hidden flex flex-col bg-[var(--bg-primary)]">
      {/* <QuestionHeader totalQuestions={0} /> */}

      <div className="flex-1 overflow-hidden min-h-0 px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
        <Row
          align="top"
          justify="start"
          className="relative h-full rounded-xl sm:rounded-2xl max-w-full overflow-x-hidden bg-[var(--bg-primary)] border border-[var(--border-primary)]"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Col
            className={`transition-all duration-300 h-full ${
              isQuestionLibraryOpen
                ? "!w-full sm:!w-[35%] md:!w-[32%] lg:!w-[28%] xl:!w-[25%]"
                : "!w-14 sm:!w-16 md:!w-19"
            }`}
          >
            <QuestionLibraryDedicatedSideBar
              selectedQuestionId={selectedQuestions.map((q) => q.id)}
              handleSelectionSummaryOk={handleSelectionSummaryOk}
              openQuestionLibrary={openQuestionLibrary}
              isQuestionLibraryOpen={isQuestionLibraryOpen}
              selectedQuestions={selectedQuestions}
              handleQuestionSelectionChange={handleQuestionSelectionChange}
              handleSelectAllQuestions={handleSelectAllQuestions}
              handleClearAllQuestions={handleClearAllQuestions}
              handleSelectCategoryQuestions={handleSelectCategoryQuestions}
              // Question types
              questionTypes={questionTypes}
              questionTypesLoading={questionTypesLoading}
              // Filter props
              selectedCategories={filters.selectedCategories}
              selectedQuestionTypes={filters.selectedQuestionTypes}
              onCategorySelection={handleCategorySelection}
              onQuestionTypeSelection={handleQuestionTypeSelection}
              // Question counts
              questionCounts={questionCounts}
            />
          </Col>

          <Col
            className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pt-2 pb-2 h-full rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-y-auto sm:!ml-2 md:!ml-2 lg:!ml-2 xl:!ml-2 sm:!rounded-[16px] bg-[var(--bg-secondary)]"
            style={{
              marginLeft: "4px",
              borderRadius: "12px",
            }}
          >
            {/* <div className="mb-4">
                        <QuestionLibraryDedicatedCreator 
                            onQuestionCreated={handleQuestionCreated}
                        />
                    </div> */}
            <QuestionLibraryDedicatedList
              questionTypes={questionTypes}
              // Filter props
              skill={filters.skill}
              domain={filters.domain}
              difficultyLevel={filters.difficultyLevel}
              categoryId={filters.categoryId}
              questionTypeId={filters.questionTypeId}
              status={filters.status}
              tags={filters.tags}
              concept={filters.concept}
              onFilterChange={handleFilterChange}
              clearAllFilters={clearAllFilters}
              favoriteQuestions={favoriteQuestions}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          </Col>

          {/* <Link
                    to="/question-add"
                    style={{
                        padding: "2px 2px 0 2px", // Border thickness
                        borderRadius: "10px 10px 0 0",
                        background: "conic-gradient(from 180deg at 50% 50%, #C401F7, #4700EA, #00A6E8, #C401F7)",
                        display: "inline-block",
                        transform: "rotate(-90deg)",
                        position: "absolute",
                        left: -200,
                        top: "50%",
                        zIndex: 10,
                        translate: "58% -50%",
                    }}
                >
                    <Button
                        type="default"
                        style={{
                            border: "none",
                            borderRadius: "10px 10px 0 0",
                            marginBottom: "-2px",
                            backgroundColor: "#000",
                            color: "#fff",
                            padding: "20px 24px 25px",
                            fontWeight: 500,
                            fontSize: "1.25rem",
                        }}
                    >
                        Close Library
                    </Button>
                </Link> */}
        </Row>
      </div>
    </div>
  );
}
